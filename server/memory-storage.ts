import { 
  type User, type InsertUser, 
  type Trade, type InsertTrade,
  type Transaction, type InsertTransaction,
  type BankAccount, type InsertBankAccount
} from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";

const MemoryStoreSession = MemoryStore(session);

// สร้างคลาสจัดเก็บข้อมูลในหน่วยความจำแบบง่ายๆ
export class MemoryStorage {
  private users: User[] = [];
  private trades: Trade[] = [];
  private transactions: Transaction[] = [];
  private bankAccounts: BankAccount[] = [];
  private settings: { [key: string]: string } = {
    // ข้อมูลตั้งต้นสำหรับบัญชีธนาคารและพร้อมเพย์
    bank_name: "ธนาคารกสิกรไทย",
    bank_account_number: "123-456-7890",
    bank_account_name: "บริษัท เอเซีย พลัส จำกัด",
    promptpay_number: "012-345-6789",
    promptpay_tax_id: "0123456789012",
    promptpay_name: "บริษัท เอเซีย พลัส จำกัด"
  };
  private nextUserId = 1;
  private nextTradeId = 1;
  private nextTransactionId = 1;
  private nextBankAccountId = 1;
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStoreSession({
      checkPeriod: 86400000 // วันละครั้ง
    });
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
    const now = new Date().toISOString();
    const newUser: User = {
      id: this.nextUserId++,
      ...user,
      fullName: user.fullName || null,
      displayName: null,
      phoneNumber: null,
      avatarUrl: null,
      createdAt: now,
      updatedAt: now
    };
    this.users.push(newUser);
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }

  async updateUserProfile(userId: number, profileData: Partial<User>): Promise<User | undefined> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) return undefined;
    
    const existingUser = this.users[userIndex];
    this.users[userIndex] = {
      ...existingUser,
      ...profileData,
      createdAt: typeof existingUser.createdAt === 'string' ? existingUser.createdAt : existingUser.createdAt.toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return this.users[userIndex];
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<User | undefined> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) return undefined;
    
    const existingUser = this.users[userIndex];
    this.users[userIndex] = {
      ...existingUser,
      password: newPassword,
      createdAt: typeof existingUser.createdAt === 'string' ? existingUser.createdAt : existingUser.createdAt.toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return this.users[userIndex];
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<User | undefined> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) return undefined;
    
    const existingUser = this.users[userIndex];
    this.users[userIndex] = {
      ...existingUser,
      ...userData,
      createdAt: typeof existingUser.createdAt === 'string' ? existingUser.createdAt : existingUser.createdAt.toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return this.users[userIndex];
  }

  // Balance operations
  async getUserBalance(userId: number): Promise<string> {
    const user = await this.getUser(userId);
    return user ? user.balance : "0";
  }

  async updateUserBalance(userId: number, newBalance: string): Promise<User | undefined> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) return undefined;
    
    const existingUser = this.users[userIndex];
    this.users[userIndex] = {
      ...existingUser,
      balance: newBalance,
      createdAt: typeof existingUser.createdAt === 'string' ? existingUser.createdAt : existingUser.createdAt.toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return this.users[userIndex];
  }

  // Bank account operations
  async createBankAccount(bankAccount: InsertBankAccount): Promise<BankAccount> {
    const now = new Date().toISOString();
    const newBankAccount: BankAccount = {
      id: this.nextBankAccountId++,
      ...bankAccount,
      createdAt: now,
      updatedAt: now
    };
    this.bankAccounts.push(newBankAccount);
    return newBankAccount;
  }

  async getBankAccountsByUser(userId: number): Promise<BankAccount[]> {
    return this.bankAccounts.filter(account => account.userId === userId);
  }

  async updateBankAccountDefault(id: number, isDefault: boolean): Promise<BankAccount | undefined> {
    // ถ้า isDefault เป็น true ให้ทำให้บัญชีอื่นๆของผู้ใช้คนเดียวกันเป็น false
    if (isDefault) {
      const account = this.bankAccounts.find(a => a.id === id);
      if (account) {
        const userAccounts = this.bankAccounts.filter(a => a.userId === account.userId);
        for (const a of userAccounts) {
          if (a.id !== id) {
            const index = this.bankAccounts.findIndex(ba => ba.id === a.id);
            if (index !== -1) {
              const existingAccount = this.bankAccounts[index];
              this.bankAccounts[index] = {
                ...existingAccount,
                isDefault: false,
                createdAt: typeof existingAccount.createdAt === 'string' ? existingAccount.createdAt : existingAccount.createdAt.toISOString(),
                updatedAt: new Date().toISOString()
              };
            }
          }
        }
      }
    }
    
    const accountIndex = this.bankAccounts.findIndex(a => a.id === id);
    if (accountIndex === -1) return undefined;
    
    const existingAccount = this.bankAccounts[accountIndex];
    this.bankAccounts[accountIndex] = {
      ...existingAccount,
      isDefault,
      createdAt: typeof existingAccount.createdAt === 'string' ? existingAccount.createdAt : existingAccount.createdAt.toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return this.bankAccounts[accountIndex];
  }

  async updateBankAccount(id: number, bankAccountData: Partial<BankAccount>): Promise<BankAccount | undefined> {
    const accountIndex = this.bankAccounts.findIndex(a => a.id === id);
    if (accountIndex === -1) return undefined;
    
    const existingAccount = this.bankAccounts[accountIndex];
    this.bankAccounts[accountIndex] = {
      ...existingAccount,
      ...bankAccountData,
      createdAt: typeof existingAccount.createdAt === 'string' ? existingAccount.createdAt : existingAccount.createdAt.toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return this.bankAccounts[accountIndex];
  }

  async deleteBankAccount(id: number): Promise<void> {
    const accountIndex = this.bankAccounts.findIndex(a => a.id === id);
    if (accountIndex !== -1) {
      this.bankAccounts.splice(accountIndex, 1);
    }
  }

  async getBankAccountById(id: number): Promise<BankAccount | undefined> {
    return this.bankAccounts.find(a => a.id === id);
  }

  // Trade operations
  async createTrade(trade: InsertTrade): Promise<Trade> {
    const now = new Date().toISOString();
    const newTrade: Trade = {
      id: this.nextTradeId++,
      ...trade,
      createdAt: now,
      status: "active",
      result: null,
      predeterminedResult: null,
      closedAt: null,
      endTime: trade.endTime || null
    };
    this.trades.push(newTrade);
    return newTrade;
  }

  async getTradesByUser(userId: number): Promise<Trade[]> {
    return this.trades.filter(trade => trade.userId === userId);
  }

  async getAllTrades(): Promise<Trade[]> {
    return [...this.trades];
  }

  async updateTradeStatus(id: number, status: string, result?: string): Promise<Trade | undefined> {
    const tradeIndex = this.trades.findIndex(t => t.id === id);
    if (tradeIndex === -1) return undefined;
    
    this.trades[tradeIndex] = {
      ...this.trades[tradeIndex],
      status,
      result: result || this.trades[tradeIndex].result
    };
    
    return this.trades[tradeIndex];
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const now = new Date().toISOString();
    const newTransaction: Transaction = {
      id: this.nextTransactionId++,
      ...transaction,
      status: "pending",
      method: transaction.method || null,
      bankName: transaction.bankName || null,
      bankAccount: transaction.bankAccount || null,
      paymentProof: transaction.paymentProof || null,
      note: transaction.note || null,
      createdAt: now,
      updatedAt: now
    };
    this.transactions.push(newTransaction);
    return newTransaction;
  }

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return this.transactions.filter(tx => tx.userId === userId);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return [...this.transactions];
  }

  async updateTransactionStatus(id: number, status: string, note?: string): Promise<Transaction | undefined> {
    const txIndex = this.transactions.findIndex(tx => tx.id === id);
    if (txIndex === -1) return undefined;
    
    const existingTransaction = this.transactions[txIndex];
    this.transactions[txIndex] = {
      ...existingTransaction,
      status,
      note: note || existingTransaction.note,
      createdAt: typeof existingTransaction.createdAt === 'string' ? existingTransaction.createdAt : existingTransaction.createdAt.toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return this.transactions[txIndex];
  }

  // Settings operations
  async getAllSettings(): Promise<Record<string, string>> {
    return { ...this.settings };
  }

  async getSetting(key: string): Promise<string | undefined> {
    return this.settings[key];
  }

  async setSetting(key: string, value: string): Promise<void> {
    this.settings[key] = value;
  }

  // Get all bank accounts (for admin)
  async getAllBankAccounts(): Promise<BankAccount[]> {
    return [...this.bankAccounts];
  }

  async getDepositAccounts(): Promise<{
    bank: { name: string; accountNumber: string; accountName: string; };
    promptpay: { number: string; taxId: string; name: string; };
  }> {
    return {
      bank: {
        name: this.settings.bank_name || "",
        accountNumber: this.settings.bank_account_number || "",
        accountName: this.settings.bank_account_name || "",
      },
      promptpay: {
        number: this.settings.promptpay_number || "",
        taxId: this.settings.promptpay_tax_id || "",
        name: this.settings.promptpay_name || "",
      }
    };
  }

  async saveDepositAccounts(data: {
    bank: { name: string; accountNumber: string; accountName: string; };
    promptpay: { number: string; taxId: string; name: string; };
  }): Promise<void> {
    this.settings.bank_name = data.bank.name;
    this.settings.bank_account_number = data.bank.accountNumber;
    this.settings.bank_account_name = data.bank.accountName;
    this.settings.promptpay_number = data.promptpay.number;
    this.settings.promptpay_tax_id = data.promptpay.taxId;
    this.settings.promptpay_name = data.promptpay.name;
  }
}

export const memoryStorage = new MemoryStorage();