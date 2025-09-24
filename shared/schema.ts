import { pgTable, serial, text, timestamp, boolean, integer, json } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// User model
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  fullName: text('full_name'),
  displayName: text('display_name'),
  phoneNumber: text('phone_number'),
  avatarUrl: text('avatar_url'),
  role: text('role').default('user').notNull(),
  balance: text('balance').default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Bank account model
export const bankAccounts = pgTable('bank_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  bankName: text('bank_name').notNull(),
  accountNumber: text('account_number').notNull(),
  accountName: text('account_name').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Trade model
export const trades = pgTable('trades', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  cryptoId: text('crypto_id').notNull(),
  entryPrice: text('entry_price').notNull(),
  amount: text('amount').notNull(),
  direction: text('direction').notNull(), // 'up' or 'down'
  duration: integer('duration').notNull(), // in seconds
  status: text('status').default('active').notNull(), // 'active', 'completed', 'cancelled'
  result: text('result'), // 'win' or 'lose'
  predeterminedResult: text('predetermined_result'), // 'win' or 'lose'
  profitPercentage: text('profit_percentage').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
  endTime: timestamp('end_time'),
});

// Transaction model
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // 'deposit' or 'withdraw'
  amount: text('amount').notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'approved', 'rejected', 'frozen'
  method: text('method'), // 'bank_transfer', 'promptpay', etc.
  bankName: text('bank_name'),
  bankAccount: text('bank_account'),
  paymentProof: text('payment_proof'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for insertion
export const insertUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional(),
  role: z.enum(['user', 'admin', 'agent']).default('user'),
  balance: z.string().default('0'),
});

// Login schema for authentication
export const loginSchema = z.object({
  username: z.string().min(1, { message: "กรุณากรอกชื่อผู้ใช้" }),
  password: z.string().min(1, { message: "กรุณากรอกรหัสผ่าน" }),
});

// Login data type
export type LoginData = z.infer<typeof loginSchema>;

export const insertBankAccountSchema = z.object({
  userId: z.number(),
  bankName: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
  isDefault: z.boolean().default(false),
});

export const insertTradeSchema = z.object({
  userId: z.number(),
  cryptoId: z.string(),
  entryPrice: z.string(),
  amount: z.string(),
  direction: z.enum(['up', 'down']),
  duration: z.number(),
  profitPercentage: z.string(),
  endTime: z.date().optional(),
});

export const insertTransactionSchema = z.object({
  userId: z.number(),
  type: z.enum(['deposit', 'withdraw']),
  amount: z.string(),
  method: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  paymentProof: z.string().optional(),
  note: z.string().optional(),
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = typeof users.$inferSelect;

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// Settings model
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: json('value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertSettingsSchema = z.object({
  key: z.string(),
  value: z.any(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingsSchema>;

// Additional type for cryptocurrency data
export type CryptoCurrency = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d?: number;
  price_change_percentage_30d?: number;
  sparkline_in_7d?: {
    price: number[];
  };
  total_volume: number;
  high_24h: number;
  low_24h: number;
};