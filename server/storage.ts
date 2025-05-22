import { 
  users, type User, type InsertUser, 
  trades, type Trade, type InsertTrade,
  transactions, type Transaction, type InsertTransaction,
  bankAccounts, type BankAccount, type InsertBankAccount
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, ne, count, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserProfile(userId: number, profileData: Partial<User>): Promise<User | undefined>;
  updateUserPassword(userId: number, newPassword: string): Promise<User | undefined>;
  updateUser(userId: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Balance operations
  getUserBalance(userId: number): Promise<string>;
  updateUserBalance(userId: number, newBalance: string): Promise<User | undefined>;
  
  // Bank account operations
  createBankAccount(bankAccount: InsertBankAccount): Promise<BankAccount>;
  getBankAccountsByUser(userId: number): Promise<BankAccount[]>;
  updateBankAccountDefault(id: number, isDefault: boolean): Promise<BankAccount | undefined>;
  updateBankAccount(id: number, bankAccountData: Partial<BankAccount>): Promise<BankAccount | undefined>;
  deleteBankAccount(id: number): Promise<void>;
  getBankAccountById(id: number): Promise<BankAccount | undefined>;
  
  // Trade operations
  createTrade(trade: InsertTrade): Promise<Trade>;
  getTradesByUser(userId: number): Promise<Trade[]>;
  getAllTrades(): Promise<Trade[]>;
  updateTradeStatus(id: number, status: string, result?: string): Promise<Trade | undefined>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  updateTransactionStatus(id: number, status: string, note?: string): Promise<Transaction | undefined>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      tableName: 'session',
      createTableIfMissing: true,
      pruneSessionInterval: 60
    });
  }
  
  async getUser(id: number): Promise<User | undefined> {
    // เลือกเฉพาะคอลัมน์ที่มีอยู่แล้วในฐานข้อมูล
    const [dbUser] = await db
      .select({
        id: users.id,
        username: users.username,
        password: users.password,
        email: users.email,
        role: users.role,
        balance: users.balance,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, id));
    
    return dbUser;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    // เลือกเฉพาะคอลัมน์ที่มีอยู่แล้วในฐานข้อมูล
    const [dbUser] = await db
      .select({
        id: users.id,
        username: users.username,
        password: users.password,
        email: users.email,
        role: users.role,
        balance: users.balance,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.username, username));
    
    return dbUser;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    // เลือกเฉพาะคอลัมน์ที่มีอยู่แล้วในฐานข้อมูล
    const [dbUser] = await db
      .select({
        id: users.id,
        username: users.username,
        password: users.password,
        email: users.email,
        role: users.role,
        balance: users.balance,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.email, email));
    
    return dbUser;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    // เลือกเฉพาะคอลัมน์ที่มีอยู่แล้วในฐานข้อมูล
    const dbUsers = await db
      .select({
        id: users.id,
        username: users.username,
        password: users.password,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        balance: users.balance,
        createdAt: users.createdAt
      })
      .from(users);
    
    // เพิ่มคอลัมน์ใหม่สำหรับทุกผู้ใช้
    return dbUsers.map(user => ({
      ...user,
      displayName: null,
      phoneNumber: null,
      avatarUrl: null
    }));
  }
  
  // ฟังก์ชันสำหรับดึงข้อมูลยอดเงินของผู้ใช้
  async getUserBalance(userId: number): Promise<string> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user.balance;
  }
  
  // ฟังก์ชันสำหรับอัพเดทยอดเงินของผู้ใช้
  async updateUserBalance(userId: number, newBalance: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  // === ฟังก์ชันเกี่ยวกับบัญชีธนาคาร ===
  
  // สร้างบัญชีธนาคารใหม่
  async createBankAccount(insertBankAccount: InsertBankAccount): Promise<BankAccount> {
    // ตรวจสอบว่าผู้ใช้มีบัญชีธนาคารไม่เกิน 2 บัญชี
    const accountCount = await db
      .select({ count: count() })
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, insertBankAccount.userId));
    
    if (accountCount[0].count >= 2) {
      throw new Error("ไม่สามารถเพิ่มบัญชีได้มากกว่า 2 บัญชี");
    }
    
    // ถ้าตั้งค่าเป็นบัญชีหลัก ให้ยกเลิกการเป็นบัญชีหลักของบัญชีอื่น
    if (insertBankAccount.isDefault) {
      await db
        .update(bankAccounts)
        .set({ isDefault: false })
        .where(eq(bankAccounts.userId, insertBankAccount.userId));
    }
    
    // ถ้าเป็นบัญชีแรก ให้ตั้งเป็นบัญชีหลักโดยอัตโนมัติ
    if (accountCount[0].count === 0) {
      insertBankAccount.isDefault = true;
    }
    
    const [bankAccount] = await db.insert(bankAccounts).values(insertBankAccount).returning();
    return bankAccount;
  }
  
  // ดึงข้อมูลบัญชีธนาคารของผู้ใช้
  async getBankAccountsByUser(userId: number): Promise<BankAccount[]> {
    return db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId));
  }
  
  // อัพเดทสถานะบัญชีหลัก
  async updateBankAccountDefault(id: number, isDefault: boolean): Promise<BankAccount | undefined> {
    // ดึงข้อมูลบัญชี
    const [bankAccount] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    if (!bankAccount) {
      throw new Error("ไม่พบบัญชีธนาคาร");
    }
    
    // ถ้าตั้งเป็นบัญชีหลัก ต้องยกเลิกการเป็นบัญชีหลักของบัญชีอื่น
    if (isDefault) {
      await db
        .update(bankAccounts)
        .set({ isDefault: false })
        .where(eq(bankAccounts.userId, bankAccount.userId));
    }
    
    // อัพเดทสถานะบัญชีหลัก
    const [updatedBankAccount] = await db
      .update(bankAccounts)
      .set({ isDefault, updatedAt: new Date() })
      .where(eq(bankAccounts.id, id))
      .returning();
    
    return updatedBankAccount;
  }
  
  // ลบบัญชีธนาคาร
  async deleteBankAccount(id: number): Promise<void> {
    // ดึงข้อมูลบัญชี
    const [bankAccount] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    if (!bankAccount) {
      throw new Error("ไม่พบบัญชีธนาคาร");
    }
    
    // ตรวจสอบว่าเป็นบัญชีหลักหรือไม่
    if (bankAccount.isDefault) {
      // หาบัญชีอื่นของผู้ใช้
      const otherAccounts = await db
        .select()
        .from(bankAccounts)
        .where(and(
          eq(bankAccounts.userId, bankAccount.userId),
          ne(bankAccounts.id, id)
        ));
      
      // ถ้ามีบัญชีอื่น ตั้งให้เป็นบัญชีหลักแทน
      if (otherAccounts.length > 0) {
        await this.updateBankAccountDefault(otherAccounts[0].id, true);
      }
    }
    
    // ลบบัญชี
    await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
  }
  
  // ดึงข้อมูลบัญชีธนาคารตาม ID
  async getBankAccountById(id: number): Promise<BankAccount | undefined> {
    const [bankAccount] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return bankAccount;
  }
  
  // แก้ไขข้อมูลบัญชีธนาคาร
  async updateBankAccount(id: number, bankAccountData: Partial<BankAccount>): Promise<BankAccount | undefined> {
    // ตรวจสอบว่ามีบัญชีนี้อยู่จริงหรือไม่
    const existingAccount = await this.getBankAccountById(id);
    if (!existingAccount) {
      throw new Error("ไม่พบบัญชีธนาคาร");
    }
    
    // อัพเดทข้อมูลบัญชี
    const [updatedBankAccount] = await db
      .update(bankAccounts)
      .set({ 
        ...bankAccountData,
        updatedAt: new Date() 
      })
      .where(eq(bankAccounts.id, id))
      .returning();
    
    return updatedBankAccount;
  }
  
  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    // ดึงยอดเงินของผู้ใช้
    const currentBalance = await this.getUserBalance(insertTrade.userId);
    
    // ใช้จำนวนเงินที่ใส่โดยตรง ไม่ต้องคูณกับราคา BTC
    const tradeValue = parseFloat(insertTrade.amount);
    
    // ตรวจสอบว่ามีเงินเพียงพอหรือไม่
    if (parseFloat(currentBalance) < tradeValue) {
      throw new Error("Insufficient balance");
    }
    
    // หักเงินจากบัญชี
    const newBalance = (parseFloat(currentBalance) - tradeValue).toString();
    await this.updateUserBalance(insertTrade.userId, newBalance);
    
    // บันทึกข้อมูลการเทรด
    const [trade] = await db.insert(trades).values(insertTrade).returning();
    return trade;
  }
  
  async getTradesByUser(userId: number): Promise<Trade[]> {
    return db.select().from(trades).where(eq(trades.userId, userId));
  }
  
  async getAllTrades(): Promise<Trade[]> {
    return db.select().from(trades);
  }
  
  async updateTradeStatus(id: number, status: string, result?: string, predeterminedResult?: string): Promise<Trade | undefined> {
    // ดึงข้อมูลการเทรดก่อนอัพเดท
    const [originalTrade] = await db.select().from(trades).where(eq(trades.id, id));
    if (!originalTrade) {
      throw new Error("Trade not found");
    }
    
    // ถ้ามีการกำหนดผลล่วงหน้า ให้อัพเดทผลการเทรดพร้อมกัน
    const updateData: Partial<typeof trades.$inferSelect> = { 
      status, 
      closedAt: new Date() 
    };
    
    if (result) {
      updateData.result = result;
    }
    
    if (predeterminedResult) {
      updateData.predeterminedResult = predeterminedResult;
    }
    
    // อัพเดทสถานะ
    const [trade] = await db
      .update(trades)
      .set(updateData)
      .where(eq(trades.id, id))
      .returning();
    
    // ถ้าเป็นการปิดการเทรดและชนะ ให้เพิ่มเงินเข้าบัญชี
    if (status === "completed" && result === "win") {
      // ดึงยอดเงินปัจจุบันของผู้ใช้
      const currentBalance = await this.getUserBalance(originalTrade.userId);
      
      // ใช้จำนวนเงินที่ลงทุนโดยตรง ไม่ต้องคูณกับราคา BTC
      const investmentValue = parseFloat(originalTrade.amount);
      
      // หาเปอร์เซ็นต์กำไรตามระยะเวลา (60S = 30%, 120S = 40%, 300S = 50%)
      let profitPercentage = 0;
      switch (originalTrade.duration) {
        case "60S": profitPercentage = 30; break;
        case "120S": profitPercentage = 40; break;
        case "300S": profitPercentage = 50; break;
        default: profitPercentage = 30;
      }
      
      // คำนวณกำไร
      const profit = investmentValue * (profitPercentage / 100);
      
      // คำนวณยอดเงินใหม่ = เงินปัจจุบัน + เงินลงทุน + กำไร
      const newBalance = (parseFloat(currentBalance) + investmentValue + profit).toString();
      
      // อัพเดทยอดเงิน
      await this.updateUserBalance(originalTrade.userId, newBalance);
    }
    
    return trade;
  }
  
  // ฟังก์ชันสำหรับสร้างธุรกรรมใหม่
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }
  
  // ฟังก์ชันสำหรับดึงรายการธุรกรรมของผู้ใช้
  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    // ดึงข้อมูลและเรียงลำดับด้วย JavaScript
    const userTransactions = await db.select()
      .from(transactions)
      .where(eq(transactions.userId, userId));
    
    // เรียงตาม createdAt จากล่าสุดไปเก่าสุด
    return userTransactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  
  // ฟังก์ชันสำหรับดึงรายการธุรกรรมทั้งหมด (สำหรับแอดมิน)
  async getAllTransactions(): Promise<Transaction[]> {
    // ดึงข้อมูลและเรียงลำดับด้วย JavaScript
    const allTransactions = await db.select().from(transactions);
    
    // เรียงตาม createdAt จากล่าสุดไปเก่าสุด
    return allTransactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  
  // ฟังก์ชันสำหรับอัพเดทสถานะธุรกรรม
  async updateTransactionStatus(id: number, status: string, note?: string): Promise<Transaction | undefined> {
    // ดึงข้อมูลธุรกรรมเดิม
    const [originalTransaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    if (!originalTransaction) {
      throw new Error("Transaction not found");
    }
    
    // อัพเดทสถานะ
    const [transaction] = await db
      .update(transactions)
      .set({ 
        status, 
        note: note || originalTransaction.note,
        updatedAt: new Date()
      })
      .where(eq(transactions.id, id))
      .returning();
    
    // ถ้าเป็นการอนุมัติการฝากเงิน ให้เพิ่มเงินเข้าบัญชี
    if (status === "approved" && originalTransaction.type === "deposit") {
      // ดึงยอดเงินปัจจุบันของผู้ใช้
      const currentBalance = await this.getUserBalance(originalTransaction.userId);
      
      // คำนวณยอดเงินใหม่
      const newBalance = (parseFloat(currentBalance) + parseFloat(originalTransaction.amount)).toString();
      
      // อัพเดทยอดเงิน
      await this.updateUserBalance(originalTransaction.userId, newBalance);
    }
    
    // ถ้าเป็นการปฏิเสธการถอนเงิน ให้คืนเงินกลับเข้าบัญชี
    if (status === "rejected" && originalTransaction.type === "withdraw") {
      // ดึงยอดเงินปัจจุบันของผู้ใช้
      const currentBalance = await this.getUserBalance(originalTransaction.userId);
      
      // คำนวณยอดเงินเมื่อคืนเงินกลับเข้าบัญชี
      const newBalance = (parseFloat(currentBalance) + parseFloat(originalTransaction.amount)).toString();
      
      // อัพเดทยอดเงิน
      await this.updateUserBalance(originalTransaction.userId, newBalance);
    }
    
    // สำหรับการอายัด (frozen) เงินยังคงถูกหักอยู่ในระบบ ไม่มีการคืนเงิน
    
    return transaction;
  }
  
  // ฟังก์ชันสำหรับอัพเดทข้อมูลโปรไฟล์ผู้ใช้
  async updateUserProfile(userId: number, profileData: Partial<User>): Promise<User | undefined> {
    // เตรียมข้อมูลสำหรับอัพเดท เฉพาะฟิลด์ที่มีอยู่แล้วในฐานข้อมูล
    const updateData: Record<string, any> = {};
    
    if (profileData.email) {
      updateData.email = profileData.email;
    }
    
    // อัพเดทข้อมูลในฐานข้อมูล
    const [dbUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        password: users.password,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        balance: users.balance,
        createdAt: users.createdAt
      });
    
    if (dbUser) {
      // สร้าง User object ที่มีคอลัมน์ใหม่ด้วย
      return {
        ...dbUser,
        displayName: profileData.displayName ?? null,
        phoneNumber: profileData.phoneNumber ?? null,
        avatarUrl: profileData.avatarUrl ?? null
      };
    }
    
    return undefined;
  }
  
  // ฟังก์ชันสำหรับอัพเดทรหัสผ่านผู้ใช้
  async updateUserPassword(userId: number, newPassword: string): Promise<User | undefined> {
    // อัพเดทรหัสผ่านในฐานข้อมูล
    const [dbUser] = await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        password: users.password,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        balance: users.balance,
        createdAt: users.createdAt
      });
    
    if (dbUser) {
      // สร้าง User object ที่มีคอลัมน์ใหม่ด้วย
      return {
        ...dbUser,
        displayName: null,
        phoneNumber: null,
        avatarUrl: null
      };
    }
    
    return undefined;
  }
  
  // ฟังก์ชันสำหรับอัพเดทข้อมูลผู้ใช้ (สำหรับแอดมิน)
  async updateUser(userId: number, userData: Partial<User>): Promise<User | undefined> {
    // กรองเฉพาะข้อมูลที่สามารถอัพเดทได้ในฐานข้อมูล
    const updateData: Record<string, any> = {};
    
    if (userData.email) updateData.email = userData.email;
    if (userData.fullName) updateData.fullName = userData.fullName;
    if (userData.role) updateData.role = userData.role;
    if (userData.balance) updateData.balance = userData.balance;
    if (userData.password) updateData.password = userData.password;
    
    // อัพเดทข้อมูลผู้ใช้
    const [dbUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        password: users.password,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        balance: users.balance,
        createdAt: users.createdAt
      });
    
    if (dbUser) {
      // สร้าง User object ที่มีคอลัมน์ใหม่ด้วย
      return {
        ...dbUser,
        displayName: null,
        phoneNumber: null,
        avatarUrl: null
      };
    }
    
    return undefined;
  }
}

export const storage = new DatabaseStorage();