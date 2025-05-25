import fs from 'fs';
import path from 'path';
import session from 'express-session';
import MemoryStore from 'memorystore';
import { User, BankAccount, Trade, Transaction, InsertUser, InsertBankAccount, InsertTrade, InsertTransaction } from '@shared/schema';
import { IStorage } from './storage';

// กำหนดโฟลเดอร์สำหรับเก็บข้อมูล
const DATA_DIR = './data';
const USER_FILE = path.join(DATA_DIR, 'users.json');
const BANK_ACCOUNT_FILE = path.join(DATA_DIR, 'bank_accounts.json');
const TRADE_FILE = path.join(DATA_DIR, 'trades.json');
const TRANSACTION_FILE = path.join(DATA_DIR, 'transactions.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// ตรวจสอบว่ามีโฟลเดอร์ data หรือไม่ ถ้าไม่มีให้สร้าง
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ฟังก์ชันสำหรับอ่านข้อมูลจากไฟล์
function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data) as T;
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
  }
  return defaultValue;
}

// ฟังก์ชันสำหรับเขียนข้อมูลลงไฟล์
function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
  }
}

export class FileStorage implements IStorage {
  private users: User[] = [];
  private trades: Trade[] = [];
  private transactions: Transaction[] = [];
  private bankAccounts: BankAccount[] = [];
  private settings: { [key: string]: string } = {};
  
  private nextUserId = 1;
  private nextTradeId = 1;
  private nextTransactionId = 1;
  private nextBankAccountId = 1;
  sessionStore: session.Store;

  constructor() {
    // อ่านข้อมูลจากไฟล์
    this.users = readJsonFile<User[]>(USER_FILE, []);
    this.trades = readJsonFile<Trade[]>(TRADE_FILE, []);
    this.transactions = readJsonFile<Transaction[]>(TRANSACTION_FILE, []);
    this.bankAccounts = readJsonFile<BankAccount[]>(BANK_ACCOUNT_FILE, []);
    this.settings = readJsonFile<{ [key: string]: string }>(SETTINGS_FILE, {});

    // กำหนดค่า ID ถัดไปสำหรับแต่ละประเภทข้อมูล
    if (this.users.length > 0) {
      this.nextUserId = Math.max(...this.users.map(u => u.id)) + 1;
    }
    if (this.trades.length > 0) {
      this.nextTradeId = Math.max(...this.trades.map(t => t.id)) + 1;
    }
    if (this.transactions.length > 0) {
      this.nextTransactionId = Math.max(...this.transactions.map(t => t.id)) + 1;
    }
    if (this.bankAccounts.length > 0) {
      this.nextBankAccountId = Math.max(...this.bankAccounts.map(b => b.id)) + 1;
    }

    // สร้าง session store
    const MemoryStoreClass = MemoryStore(session);
    this.sessionStore = new MemoryStoreClass({
      checkPeriod: 86400000 // 24 ชั่วโมง
    });

    console.log('✅ Using file-based JSON storage for persistence - Data will be stored in ./data/ directory');
  }

  // บันทึกข้อมูลทั้งหมดลงไฟล์
  private saveData() {
    writeJsonFile(USER_FILE, this.users);
    writeJsonFile(TRADE_FILE, this.trades);
    writeJsonFile(TRANSACTION_FILE, this.transactions);
    writeJsonFile(BANK_ACCOUNT_FILE, this.bankAccounts);
    writeJsonFile(SETTINGS_FILE, this.settings);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.nextUserId++,
      ...user,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    this.saveData();
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }

  async updateUserProfile(userId: number, profileData: Partial<User>): Promise<User | undefined> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) return undefined;

    const updatedUser = {
      ...this.users[userIndex],
      ...profileData,
      updatedAt: new Date()
    };
    this.users[userIndex] = updatedUser;
    this.saveData();
    return updatedUser;
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<User | undefined> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) return undefined;

    const updatedUser = {
      ...this.users[userIndex],
      password: newPassword,
      updatedAt: new Date()
    };
    this.users[userIndex] = updatedUser;
    this.saveData();
    return updatedUser;
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<User | undefined> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) return undefined;

    const updatedUser = {
      ...this.users[userIndex],
      ...userData,
      updatedAt: new Date()
    };
    this.users[userIndex] = updatedUser;
    this.saveData();
    return updatedUser;
  }

  // Balance operations
  async getUserBalance(userId: number): Promise<string> {
    const user = await this.getUser(userId);
    return user ? user.balance : "0";
  }

  async updateUserBalance(userId: number, newBalance: string): Promise<User | undefined> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) return undefined;

    const updatedUser = {
      ...this.users[userIndex],
      balance: newBalance,
      updatedAt: new Date()
    };
    this.users[userIndex] = updatedUser;
    this.saveData();
    return updatedUser;
  }

  // Bank account operations
  async createBankAccount(bankAccount: InsertBankAccount): Promise<BankAccount> {
    const newBankAccount: BankAccount = {
      id: this.nextBankAccountId++,
      ...bankAccount,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.bankAccounts.push(newBankAccount);
    this.saveData();
    return newBankAccount;
  }

  async getBankAccountsByUser(userId: number): Promise<BankAccount[]> {
    return this.bankAccounts.filter(account => account.userId === userId);
  }

  async updateBankAccountDefault(id: number, isDefault: boolean): Promise<BankAccount | undefined> {
    const accountIndex = this.bankAccounts.findIndex(account => account.id === id);
    if (accountIndex === -1) return undefined;

    // หากตั้งค่าเป็น default ให้ยกเลิก default ของบัญชีอื่นของผู้ใช้คนเดียวกัน
    if (isDefault) {
      const userId = this.bankAccounts[accountIndex].userId;
      this.bankAccounts.forEach((account, index) => {
        if (account.userId === userId && account.id !== id) {
          this.bankAccounts[index] = { ...account, isDefault: false };
        }
      });
    }

    const updatedAccount = {
      ...this.bankAccounts[accountIndex],
      isDefault,
      updatedAt: new Date()
    };
    this.bankAccounts[accountIndex] = updatedAccount;
    this.saveData();
    return updatedAccount;
  }

  async updateBankAccount(id: number, bankAccountData: Partial<BankAccount>): Promise<BankAccount | undefined> {
    const accountIndex = this.bankAccounts.findIndex(account => account.id === id);
    if (accountIndex === -1) return undefined;

    const updatedAccount = {
      ...this.bankAccounts[accountIndex],
      ...bankAccountData,
      updatedAt: new Date()
    };
    this.bankAccounts[accountIndex] = updatedAccount;
    this.saveData();
    return updatedAccount;
  }

  async deleteBankAccount(id: number): Promise<void> {
    const accountIndex = this.bankAccounts.findIndex(account => account.id === id);
    if (accountIndex !== -1) {
      this.bankAccounts.splice(accountIndex, 1);
      this.saveData();
    }
  }

  async getBankAccountById(id: number): Promise<BankAccount | undefined> {
    return this.bankAccounts.find(account => account.id === id);
  }

  // Trade operations
  async createTrade(trade: InsertTrade): Promise<Trade> {
    // ดึงยอดเงินของผู้ใช้
    const user = this.users.find(u => u.id === trade.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // ใช้จำนวนเงินที่ใส่โดยตรง ไม่ต้องคูณกับราคา BTC
    const tradeValue = parseFloat(trade.amount);
    const currentBalance = parseFloat(user.balance || "0");
    
    // ตรวจสอบว่ามีเงินเพียงพอหรือไม่
    if (currentBalance < tradeValue) {
      throw new Error("Insufficient balance");
    }
    
    // หักเงินออกจากบัญชีทันที
    const newBalance = (currentBalance - tradeValue).toString();
    user.balance = newBalance;
    
    console.log(`[TRADE] หักเงินในบัญชีผู้ใช้ ${user.username} จำนวน ${tradeValue} บาท ยอดคงเหลือ ${newBalance} บาท`);
    
    const newTrade: Trade = {
      id: this.nextTradeId++,
      ...trade,
      createdAt: new Date(),
      status: "active",
      result: null,
      predeterminedResult: null,
      endTime: null
    };
    
    this.trades.push(newTrade);
    this.saveData();
    return newTrade;
  }

  async getTradesByUser(userId: number): Promise<Trade[]> {
    return this.trades.filter(trade => trade.userId === userId);
  }

  async getAllTrades(): Promise<Trade[]> {
    return [...this.trades];
  }

  async updateTradeStatus(id: number, status: string, result?: string, predeterminedResult?: string): Promise<Trade | undefined> {
    const tradeIndex = this.trades.findIndex(trade => trade.id === id);
    if (tradeIndex === -1) return undefined;

    const originalTrade = this.trades[tradeIndex];
    const finalResult = (status === 'completed' && originalTrade.predeterminedResult) ? 
      originalTrade.predeterminedResult : result;

    const updatedTrade: Trade = {
      ...originalTrade,
      status,
      updatedAt: new Date(),
    };

    if (result) {
      updatedTrade.result = finalResult;
    }

    if (predeterminedResult) {
      updatedTrade.predeterminedResult = predeterminedResult;
    }

    if (status === 'completed') {
      updatedTrade.endTime = new Date();
      
      // ถ้าการเทรดสิ้นสุดและผลลัพธ์เป็นชนะ ให้เพิ่มเงินเข้าบัญชี
      if (finalResult === 'win') {
        // ค้นหาผู้ใช้
        const user = this.users.find(u => u.id === originalTrade.userId);
        if (user) {
          // คำนวณจำนวนเงินที่ลงทุน
          const investmentAmount = parseFloat(originalTrade.amount);
          
          // คำนวณผลกำไรตามเปอร์เซ็นต์
          const profitPercentage = parseFloat(originalTrade.profitPercentage) / 100;
          const profit = investmentAmount * profitPercentage;
          
          // คำนวณยอดเงินรวมที่จะได้คืน (เงินลงทุน + กำไร)
          const totalReturn = investmentAmount + profit;
          
          // เพิ่มเงินเข้าบัญชี
          const currentBalance = parseFloat(user.balance || "0");
          const newBalance = (currentBalance + totalReturn).toString();
          user.balance = newBalance;
          
          console.log(`[TRADE WIN] เพิ่มเงินในบัญชีผู้ใช้ ${user.username} เงินลงทุน ${investmentAmount} บาท + กำไร ${profit.toFixed(2)} บาท = ${totalReturn.toFixed(2)} บาท ยอดคงเหลือใหม่ ${newBalance} บาท`);
        }
      } else if (finalResult === 'lose') {
        // กรณีแพ้ไม่ต้องทำอะไร เพราะหักเงินไปแล้วตอนเริ่มเทรด
        console.log(`[TRADE LOSE] ผู้ใช้ ID ${originalTrade.userId} แพ้การเทรด จำนวนเงิน ${originalTrade.amount} บาท ไม่ได้รับเงินคืน`);
      }
    }

    this.trades[tradeIndex] = updatedTrade;
    this.saveData();
    return updatedTrade;
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const newTransaction: Transaction = {
      id: this.nextTransactionId++,
      ...transaction,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: transaction.status || 'pending',
    };
    this.transactions.push(newTransaction);
    this.saveData();
    return newTransaction;
  }

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return this.transactions.filter(transaction => transaction.userId === userId);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return [...this.transactions];
  }

  async updateTransactionStatus(id: number, status: string, note?: string): Promise<Transaction | undefined> {
    const transactionIndex = this.transactions.findIndex(transaction => transaction.id === id);
    if (transactionIndex === -1) return undefined;

    const originalTransaction = this.transactions[transactionIndex];
    
    const updatedTransaction: Transaction = {
      ...originalTransaction,
      status,
      updatedAt: new Date()
    };

    if (note) {
      updatedTransaction.note = note;
    }

    // ถ้าเป็นการอนุมัติการฝากเงิน ให้เพิ่มเงินเข้าบัญชี
    if (status === "approved" && originalTransaction.type === "deposit") {
      // ดึงข้อมูลผู้ใช้
      const user = this.users.find(user => user.id === originalTransaction.userId);
      if (user) {
        // คำนวณยอดเงินใหม่
        const currentBalance = user.balance || "0";
        const newBalance = (parseFloat(currentBalance) + parseFloat(originalTransaction.amount)).toString();
        
        // อัพเดทยอดเงิน
        user.balance = newBalance;
        console.log(`[DEPOSIT APPROVED] เพิ่มเงินในบัญชีผู้ใช้ ${user.username} จำนวน ${originalTransaction.amount} บาท ยอดคงเหลือ ${newBalance} บาท`);
      }
    }
    
    // ถ้าเป็นการปฏิเสธการถอนเงิน ให้คืนเงินกลับเข้าบัญชี
    if (status === "rejected" && originalTransaction.type === "withdraw") {
      // ดึงข้อมูลผู้ใช้
      const user = this.users.find(user => user.id === originalTransaction.userId);
      if (user) {
        // คำนวณยอดเงินเมื่อคืนเงินกลับเข้าบัญชี
        const currentBalance = user.balance || "0";
        const newBalance = (parseFloat(currentBalance) + parseFloat(originalTransaction.amount)).toString();
        
        // อัพเดทยอดเงิน
        user.balance = newBalance;
        console.log(`[WITHDRAW REJECTED] คืนเงินกลับเข้าบัญชีผู้ใช้ ${user.username} จำนวน ${originalTransaction.amount} บาท ยอดคงเหลือ ${newBalance} บาท`);
      }
    }

    this.transactions[transactionIndex] = updatedTransaction;
    this.saveData();
    return updatedTransaction;
  }

  // Settings operations
  async getSetting(key: string): Promise<string | null> {
    return this.settings[key] || null;
  }

  async getAllSettings(): Promise<{[key: string]: string}> {
    return { ...this.settings };
  }

  async saveSetting(key: string, value: string): Promise<void> {
    this.settings[key] = value;
    this.saveData();
  }

  async saveMultipleSettings(settings: {key: string, value: string}[]): Promise<void> {
    settings.forEach(({ key, value }) => {
      this.settings[key] = value;
    });
    this.saveData();
  }

  async getDepositAccounts(): Promise<{
    bankAccounts: { bank: string, account: string, name: string }[];
    promptpay: string | null;
  }> {
    const bankAccounts = this.settings.bankAccounts ? 
      JSON.parse(this.settings.bankAccounts) : [];
    const promptpay = this.settings.promptpay || null;
    
    return { bankAccounts, promptpay };
  }

  async saveDepositAccounts(data: {
    bankAccounts: { bank: string, account: string, name: string }[];
    promptpay: string | null;
  }): Promise<void> {
    this.settings.bankAccounts = JSON.stringify(data.bankAccounts);
    if (data.promptpay) {
      this.settings.promptpay = data.promptpay;
    }
    this.saveData();
  }
}

export const fileStorage = new FileStorage();