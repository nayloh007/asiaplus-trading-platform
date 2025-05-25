import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { memoryStorage as storage } from "./memory-storage";
import { setupAuth } from "./auth";
import { getMarketData, getCryptoById } from "./crypto-api";
import { insertTradeSchema, insertBankAccountSchema, trades, bankAccounts, type User } from "@shared/schema";
import { ZodError } from "zod";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { registerSettingsRoutes } from "./settings";
import { db } from "./db";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

// Helper function for hashing passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Helper function for comparing passwords
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return Buffer.compare(hashedBuf, suppliedBuf) === 0;
}

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Crypto market data routes
  app.get("/api/crypto/market", async (req, res) => {
    try {
      const data = await getMarketData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  });

  app.get("/api/crypto/:id", async (req, res) => {
    try {
      const crypto = await getCryptoById(req.params.id);
      if (!crypto) {
        return res.status(404).json({ message: "Cryptocurrency not found" });
      }
      res.json(crypto);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cryptocurrency data" });
    }
  });

  // Trading routes
  app.post("/api/trades", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const tradeData = insertTradeSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const trade = await storage.createTrade(tradeData);
      res.status(201).json(trade);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to create trade" });
      }
    }
  });

  app.get("/api/trades", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const trades = await storage.getTradesByUser(req.user.id);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });
  
  // อัพเดทสถานะการเทรด
  app.patch("/api/trades/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const tradeId = parseInt(req.params.id);
      if (isNaN(tradeId)) {
        return res.status(400).json({ message: "Invalid trade ID" });
      }
      
      // ตรวจสอบว่าสถานะที่ส่งมาถูกต้อง
      let { status, result } = req.body;
      
      // ดึงข้อมูลการเทรดเพื่อตรวจสอบ predetermined result
      const [originalTrade] = await db.select().from(trades).where(eq(trades.id, tradeId));
      if (!originalTrade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      // ถ้ามีการกำหนดผลลัพธ์ล่วงหน้า ให้ใช้ผลลัพธ์นั้นแทนผลลัพธ์ที่ส่งมา
      if (originalTrade.predeterminedResult && status === "completed") {
        console.log(`ใช้ผลลัพธ์ที่กำหนดล่วงหน้า: ${originalTrade.predeterminedResult} แทนผลจริง: ${result}`);
        result = originalTrade.predeterminedResult;
      }
      
      if (!status || (status === "completed" && !result)) {
        return res.status(400).json({ message: "Invalid status or missing result" });
      }
      
      // อัพเดทสถานะในฐานข้อมูล
      const updatedTrade = await storage.updateTradeStatus(tradeId, status, result);
      
      if (!updatedTrade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      res.json(updatedTrade);
    } catch (error) {
      console.error("Error updating trade status:", error);
      res.status(500).json({ message: "Failed to update trade status" });
    }
  });
  
  // เพิ่ม endpoint สำหรับแอดมินกำหนดผลการเทรดล่วงหน้า
  app.patch("/api/admin/trades/:id/predetermined", isAdmin, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const tradeId = parseInt(req.params.id);
      if (isNaN(tradeId)) {
        return res.status(400).json({ message: "Invalid trade ID" });
      }
      
      // ตรวจสอบว่าค่าที่ส่งมาถูกต้อง
      const { predeterminedResult } = req.body;
      // ถ้า null คือลบการกำหนดผลลัพธ์ล่วงหน้า
      if (predeterminedResult !== null && !["win", "lose"].includes(predeterminedResult)) {
        return res.status(400).json({ message: "Invalid predetermined result. Must be 'win', 'lose', or null" });
      }
      
      // อัพเดทผลล่วงหน้าในฐานข้อมูล
      const updatedTrade = await storage.updateTradeStatus(
        tradeId, 
        "active", // ไม่เปลี่ยนสถานะ
        undefined, // ไม่เปลี่ยนผลลัพธ์
        predeterminedResult // กำหนดผลล่วงหน้า
      );
      
      if (!updatedTrade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      res.json(updatedTrade);
    } catch (error) {
      console.error("Error updating predetermined result:", error);
      res.status(500).json({ message: "Failed to update predetermined result" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const sanitizedUsers = users.map(user => ({
        ...user,
        password: undefined
      }));
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // ดึงบัญชีธนาคารของผู้ใช้งานสำหรับแอดมิน
  app.get("/api/admin/users/:userId/bank-accounts", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const bankAccounts = await storage.getBankAccountsByUser(userId);
      res.json(bankAccounts);
    } catch (error) {
      console.error("Error getting user bank accounts:", error);
      res.status(500).json({ message: "Failed to get bank accounts" });
    }
  });
  
  // แก้ไขบัญชีธนาคารของผู้ใช้งานสำหรับแอดมิน
  app.patch("/api/admin/bank-accounts/:id", isAdmin, async (req, res) => {
    try {
      const bankAccountId = parseInt(req.params.id);
      if (isNaN(bankAccountId)) {
        return res.status(400).json({ message: "Invalid bank account ID" });
      }
      
      // รับข้อมูลที่จะแก้ไข
      const { bankName, accountNumber, accountName, isDefault } = req.body;
      if (!bankName || !accountNumber || !accountName) {
        return res.status(400).json({ message: "Bank name, account number, and account name are required" });
      }
      
      // แก้ไขข้อมูลบัญชี
      const updatedBankAccount = await storage.updateBankAccount(bankAccountId, {
        bankName,
        accountNumber,
        accountName,
        isDefault: isDefault === true
      });
      
      res.json(updatedBankAccount);
    } catch (error) {
      console.error("Error updating bank account:", error);
      res.status(500).json({ message: "Failed to update bank account" });
    }
  });

  app.get("/api/admin/trades", isAdmin, async (req, res) => {
    try {
      const trades = await storage.getAllTrades();
      res.json(trades);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  // Wallet routes
  // Schema สำหรับตรวจสอบข้อมูลการฝากเงิน
  const depositSchema = z.object({
    amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
    method: z.string().min(1),
    paymentProofBase64: z.string().optional(),
  });

  // Schema สำหรับตรวจสอบข้อมูลการถอนเงิน
  const withdrawSchema = z.object({
    amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
    method: z.string().min(1),
    bankAccount: z.string().optional(),
    bankName: z.string().optional(),
  });

  // API endpoint สำหรับฝากเงิน
  app.post("/api/wallet/deposit", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const data = depositSchema.parse(req.body);
      
      // สร้างรายการธุรกรรมใหม่ (สถานะ pending ต้องรอแอดมินอนุมัติ)
      const transactionData = {
        userId: req.user.id,
        type: "deposit",
        amount: data.amount,
        method: data.method,
        paymentProof: data.paymentProofBase64,
        status: "pending", // default status
      };
      
      const transaction = await storage.createTransaction(transactionData);
      
      if (!transaction) {
        return res.status(500).json({ message: "Failed to create transaction" });
      }
      
      res.status(200).json({
        success: true,
        message: "Deposit request submitted successfully",
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          status: transaction.status
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Deposit error:", error);
        res.status(500).json({ message: "Failed to process deposit request" });
      }
    }
  });

  // API endpoint สำหรับถอนเงิน
  app.post("/api/wallet/withdraw", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const data = withdrawSchema.parse(req.body);
      
      // ดึงยอดเงินปัจจุบัน
      const currentBalance = await storage.getUserBalance(req.user.id);
      
      // ตรวจสอบว่ามีเงินเพียงพอหรือไม่
      if (parseFloat(currentBalance) < parseFloat(data.amount)) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // หักเงินออกจากบัญชีทันที
      const newBalance = (parseFloat(currentBalance) - parseFloat(data.amount)).toString();
      console.log("[WITHDRAW] Current balance: " + currentBalance + ", New balance: " + newBalance);
      const result = await storage.updateUserBalance(req.user.id, newBalance);
      console.log("[WITHDRAW] Result of balance update:", result?.balance);
      
      // สร้างรายการธุรกรรมใหม่ (สถานะ pending ต้องรอแอดมินอนุมัติ)
      const transactionData = {
        userId: req.user.id,
        type: "withdraw",
        amount: data.amount,
        method: data.method,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
        status: "pending", // default status
        note: "เงินถูกตัดจากบัญชีแล้ว รอการอนุมัติ"
      };
      
      const transaction = await storage.createTransaction(transactionData);
      
      if (!transaction) {
        // ถ้าสร้างธุรกรรมไม่สำเร็จ ให้คืนเงินกลับเข้าบัญชี
        await storage.updateUserBalance(req.user.id, currentBalance);
        return res.status(500).json({ message: "Failed to create transaction" });
      }
      
      res.status(200).json({
        success: true,
        message: "Withdrawal request submitted successfully",
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          status: transaction.status
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Withdraw error:", error);
        res.status(500).json({ message: "Failed to process withdrawal request" });
      }
    }
  });
  
  // API endpoint สำหรับดึงประวัติธุรกรรมของผู้ใช้
  app.get("/api/wallet/transactions", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const transactions = await storage.getTransactionsByUser(req.user.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  
  // API endpoint สำหรับแอดมินดึงรายการธุรกรรมทั้งหมด
  app.get("/api/admin/transactions", isAdmin, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching all transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  
  // API endpoint สำหรับแอดมินอัพเดทสถานะธุรกรรม
  app.patch("/api/admin/transactions/:id", isAdmin, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }
      
      const { status, note } = req.body;
      if (!status || !["approved", "rejected", "frozen"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const transaction = await storage.updateTransactionStatus(transactionId, status, note);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  // -------------- Bank Account API Routes --------------
  
  // ดึงบัญชีธนาคารของผู้ใช้
  app.get("/api/bank-accounts", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const bankAccounts = await storage.getBankAccountsByUser(req.user.id);
      res.json(bankAccounts);
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      res.status(500).json({ message: "Failed to fetch bank accounts" });
    }
  });
  
  // เพิ่มบัญชีธนาคารใหม่
  app.post("/api/bank-accounts", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // ตรวจสอบจำนวนบัญชีที่มีอยู่ (จำกัดไม่เกิน 2 บัญชี)
      const existingAccounts = await storage.getBankAccountsByUser(req.user.id);
      if (existingAccounts.length >= 2) {
        return res.status(400).json({ 
          message: "คุณสามารถเพิ่มบัญชีได้สูงสุด 2 บัญชีเท่านั้น กรุณาลบบัญชีเดิมก่อน" 
        });
      }
      
      const bankAccountData = insertBankAccountSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const bankAccount = await storage.createBankAccount(bankAccountData);
      res.status(201).json(bankAccount);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else if (error instanceof Error) {
        console.error("Error creating bank account:", error);
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create bank account" });
      }
    }
  });
  
  // ตั้งเป็นบัญชีหลัก
  app.patch("/api/bank-accounts/:id/default", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const bankAccountId = parseInt(req.params.id);
      if (isNaN(bankAccountId)) {
        return res.status(400).json({ message: "Invalid bank account ID" });
      }
      
      // ตรวจสอบว่าเป็นบัญชีของผู้ใช้หรือไม่
      const bankAccount = await storage.getBankAccountById(bankAccountId);
      if (!bankAccount || bankAccount.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this bank account" });
      }
      
      const updatedBankAccount = await storage.updateBankAccountDefault(bankAccountId, true);
      res.json(updatedBankAccount);
    } catch (error) {
      console.error("Error updating bank account:", error);
      res.status(500).json({ message: "Failed to update bank account" });
    }
  });
  
  // แก้ไขข้อมูลบัญชีธนาคาร
  app.patch("/api/bank-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const bankAccountId = parseInt(req.params.id);
      if (isNaN(bankAccountId)) {
        return res.status(400).json({ message: "Invalid bank account ID" });
      }
      
      // ตรวจสอบว่าเป็นบัญชีของผู้ใช้หรือไม่
      const bankAccount = await storage.getBankAccountById(bankAccountId);
      if (!bankAccount || bankAccount.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to modify this bank account" });
      }
      
      // รับข้อมูลที่จะแก้ไข
      const { bankName, accountNumber, accountName } = req.body;
      if (!bankName || !accountNumber || !accountName) {
        return res.status(400).json({ message: "Bank name, account number, and account name are required" });
      }
      
      // แก้ไขข้อมูลบัญชี
      const updatedBankAccount = await storage.updateBankAccount(bankAccountId, {
        bankName,
        accountNumber,
        accountName
      });
      
      res.json(updatedBankAccount);
    } catch (error) {
      console.error("Error updating bank account:", error);
      res.status(500).json({ message: "Failed to update bank account" });
    }
  });
  
  // ลบบัญชีธนาคาร
  app.delete("/api/bank-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const bankAccountId = parseInt(req.params.id);
      if (isNaN(bankAccountId)) {
        return res.status(400).json({ message: "Invalid bank account ID" });
      }
      
      // ตรวจสอบว่าเป็นบัญชีของผู้ใช้หรือไม่
      const bankAccount = await storage.getBankAccountById(bankAccountId);
      if (!bankAccount || bankAccount.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this bank account" });
      }
      
      await storage.deleteBankAccount(bankAccountId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting bank account:", error);
      res.status(500).json({ message: "Failed to delete bank account" });
    }
  });
  
  // ปรับปรุง API endpoint สำหรับถอนเงินให้รองรับการใช้บัญชีที่ผูกไว้
  app.post("/api/wallet/withdraw-with-saved-account", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const schema = z.object({
        amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
          message: "Amount must be a positive number",
        }),
        bankAccountId: z.number(),
      });
      
      const data = schema.parse(req.body);
      
      // ดึงข้อมูลบัญชีธนาคาร
      const bankAccount = await storage.getBankAccountById(data.bankAccountId);
      if (!bankAccount || bankAccount.userId !== req.user.id) {
        return res.status(400).json({ message: "Invalid bank account" });
      }
      
      // ดึงยอดเงินปัจจุบัน
      const currentBalance = await storage.getUserBalance(req.user.id);
      
      // ตรวจสอบว่ามีเงินเพียงพอหรือไม่
      if (parseFloat(currentBalance) < parseFloat(data.amount)) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // คำนวณค่าธรรมเนียม 3%
      const amount = parseFloat(data.amount);
      const fee = amount * 0.03;
      const finalAmount = amount - fee;
      
      // หักเงินออกจากบัญชีทันที
      const newBalance = (parseFloat(currentBalance) - parseFloat(data.amount)).toString();
      console.log("[WITHDRAW] Current balance: " + currentBalance + ", New balance: " + newBalance);
      const result = await storage.updateUserBalance(req.user.id, newBalance);
      console.log("[WITHDRAW] Result of balance update:", result?.balance);
      
      // สร้างรายการธุรกรรมใหม่ (สถานะ pending ต้องรอแอดมินอนุมัติ)
      const transactionData = {
        userId: req.user.id,
        type: "withdraw",
        amount: data.amount,  // จำนวนเงินที่ขอถอนก่อนหักค่าธรรมเนียม
        fee: fee.toFixed(2),  // ค่าธรรมเนียม 3%
        method: "bank",
        bankName: bankAccount.bankName,
        bankAccount: bankAccount.accountNumber,
        accountName: bankAccount.accountName,
        bankAccountId: bankAccount.id,
        status: "pending", // default status
        note: `เงินถูกตัดจากบัญชีแล้ว รอการอนุมัติ | ค่าธรรมเนียม 3%: ${fee.toFixed(2)} บาท ยอดสุทธิ: ${finalAmount.toFixed(2)} บาท`,
      };
      
      const transaction = await storage.createTransaction(transactionData);
      
      if (!transaction) {
        // ถ้าสร้างธุรกรรมไม่สำเร็จ ให้คืนเงินกลับเข้าบัญชี
        await storage.updateUserBalance(req.user.id, currentBalance);
        return res.status(500).json({ message: "Failed to create transaction" });
      }
      
      res.status(200).json({
        success: true,
        message: "Withdrawal request submitted successfully",
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          status: transaction.status,
          bankAccount: {
            bankName: bankAccount.bankName,
            accountNumber: bankAccount.accountNumber,
            accountName: bankAccount.accountName,
          }
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Withdraw error:", error);
        res.status(500).json({ message: "Failed to process withdrawal request" });
      }
    }
  });

  // -------------- Profile API Routes --------------
  
  // Schema สำหรับอัพเดทข้อมูลโปรไฟล์
  const updateProfileSchema = z.object({
    email: z.string().email().optional(),
    displayName: z.string().optional(),
    phoneNumber: z.string().optional(),
    avatarUrl: z.string().optional(),
  });
  
  // Schema สำหรับเปลี่ยนรหัสผ่าน
  const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
  });
  
  // API endpoint สำหรับอัพเดทข้อมูลโปรไฟล์
  app.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const data = updateProfileSchema.parse(req.body);
      
      // อัพเดทข้อมูลผู้ใช้
      const updatedUser = await storage.updateUserProfile(req.user.id, data);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // อัพเดทข้อมูลใน session
      req.login(updatedUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Session update failed" });
        }
        
        // ส่งข้อมูลผู้ใช้กลับไปโดยไม่เปิดเผยรหัสผ่าน
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Profile update error:", error);
        res.status(500).json({ message: "Failed to update profile" });
      }
    }
  });
  
  // API endpoint สำหรับเปลี่ยนรหัสผ่าน
  app.post("/api/user/change-password", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const data = changePasswordSchema.parse(req.body);
      
      // ดึงข้อมูลผู้ใช้
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // ตรวจสอบรหัสผ่านปัจจุบัน
      const passwordMatch = await comparePasswords(data.currentPassword, user.password);
      
      if (!passwordMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // แฮชรหัสผ่านใหม่
      const hashedPassword = await hashPassword(data.newPassword);
      
      // อัพเดทรหัสผ่าน
      const updatedUser = await storage.updateUserPassword(req.user.id, hashedPassword);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        console.error("Password change error:", error);
        res.status(500).json({ message: "Failed to change password" });
      }
    }
  });

  // API endpoint สำหรับแอดมินแก้ไขข้อมูลผู้ใช้
  // ดึงข้อมูลบัญชีธนาคารทั้งหมดสำหรับแอดมิน
  app.get("/api/admin/bank-accounts", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // ใช้วิธีดึงข้อมูลแบบง่ายๆ แทนการใช้ relation เพื่อหลีกเลี่ยงปัญหา
      const allBankAccounts = await db.select().from(bankAccounts);
      
      // ดึงข้อมูลผู้ใช้ทั้งหมด
      const users = await storage.getAllUsers();
      const usersMap = new Map(users.map(user => [user.id, user]));
      
      // รวมข้อมูลบัญชีธนาคารกับข้อมูลผู้ใช้
      const bankAccountsWithUsers = allBankAccounts.map(account => {
        const user = usersMap.get(account.userId);
        return {
          ...account,
          user: user ? {
            id: user.id,
            username: user.username,
            email: user.email
          } : null
        };
      });
      
      res.json(bankAccountsWithUsers);
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      res.status(500).json({ message: "Failed to fetch bank accounts" });
    }
  });
  
  // แอดมินแก้ไขบัญชีธนาคาร
  app.patch("/api/admin/bank-accounts/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const bankAccountId = parseInt(req.params.id);
      if (isNaN(bankAccountId)) {
        return res.status(400).json({ message: "Invalid bank account ID" });
      }
      
      // ตรวจสอบว่ามีบัญชีนี้อยู่หรือไม่
      const bankAccount = await storage.getBankAccountById(bankAccountId);
      if (!bankAccount) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      
      // ข้อมูลที่สามารถแก้ไขได้
      const { bankName, accountNumber, accountName } = req.body;
      
      // Validate the incoming data (basic validation)
      if (!bankName || !accountNumber || !accountName) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // ตรวจสอบว่าเลขที่บัญชีเป็นตัวเลขเท่านั้น
      if (!/^\d+$/.test(accountNumber)) {
        return res.status(400).json({ message: "Account number must contain only digits" });
      }
      
      // อัปเดตข้อมูลบัญชี
      await db.update(bankAccounts)
        .set({
          bankName,
          accountNumber,
          accountName,
          updatedAt: new Date()
        })
        .where(eq(bankAccounts.id, bankAccountId));
      
      // ดึงข้อมูลที่อัปเดตแล้ว
      const updatedBankAccount = await storage.getBankAccountById(bankAccountId);
      res.json(updatedBankAccount);
    } catch (error) {
      console.error("Error updating bank account:", error);
      res.status(500).json({ message: "Failed to update bank account" });
    }
  });
  
  app.patch("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // ดึงข้อมูลผู้ใช้
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // ข้อมูลที่อนุญาตให้อัพเดท
      const updateData: Partial<User> = {};
      
      if (req.body.email) updateData.email = req.body.email;
      if (req.body.fullName) updateData.fullName = req.body.fullName;
      if (req.body.role) updateData.role = req.body.role;
      if (req.body.balance) updateData.balance = req.body.balance;
      
      // อัพเดทรหัสผ่าน (ถ้ามี)
      if (req.body.password) {
        console.log("กำลังแฮชรหัสผ่านใหม่สำหรับผู้ใช้ ID:", userId);
        const hashedPassword = await hashPassword(req.body.password);
        console.log("รหัสผ่านที่แฮชแล้ว:", hashedPassword.substring(0, 20) + "...");
        updateData.password = hashedPassword;
      }
      
      // อัพเดทข้อมูลผู้ใช้
      if (Object.keys(updateData).length > 0) {
        const updatedUser = await storage.updateUser(userId, updateData);
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        res.json(updatedUser);
      } else {
        res.status(400).json({ message: "No data to update" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Register settings routes
  registerSettingsRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
