import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import fs from "fs";
import * as schema from "@shared/schema";

// Check if we should use SQLite instead of PostgreSQL
const useSqlite = process.env.USE_SQLITE === 'true';

let db: any;
let pool: any = null;

if (useSqlite) {
  console.log('✅ Using SQLite database storage for persistence');
  const sqlite = new Database('database.sqlite');
  db = drizzleSqlite(sqlite, { schema });
  
  // Create tables if they don't exist
  try {
    console.log('🔧 Initializing SQLite database tables...');
    
    // Create users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        full_name TEXT,
        display_name TEXT,
        phone_number TEXT,
        avatar_url TEXT,
        role TEXT DEFAULT 'user' NOT NULL,
        balance TEXT DEFAULT '0' NOT NULL,
        created_at TEXT DEFAULT (datetime('now')) NOT NULL,
        updated_at TEXT DEFAULT (datetime('now')) NOT NULL
      )
    `);
    
    // Create trades table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        crypto_id TEXT NOT NULL,
        entry_price TEXT NOT NULL,
        amount TEXT NOT NULL,
        direction TEXT NOT NULL,
        duration INTEGER NOT NULL,
        status TEXT DEFAULT 'active' NOT NULL,
        result TEXT,
        predetermined_result TEXT,
        profit_percentage TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')) NOT NULL,
        closed_at TEXT,
        end_time TEXT
      )
    `);
    
    // Create bank_accounts table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        bank_name TEXT NOT NULL,
        account_number TEXT NOT NULL,
        account_name TEXT NOT NULL,
        is_default INTEGER DEFAULT 0 NOT NULL,
        created_at TEXT DEFAULT (datetime('now')) NOT NULL,
        updated_at TEXT DEFAULT (datetime('now')) NOT NULL
      )
    `);
    
    // Create transactions table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        amount TEXT NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        method TEXT,
        bank_name TEXT,
        bank_account TEXT,
        payment_proof TEXT,
        note TEXT,
        created_at TEXT DEFAULT (datetime('now')) NOT NULL,
        updated_at TEXT DEFAULT (datetime('now')) NOT NULL
      )
    `);
    
    // Create settings table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')) NOT NULL,
        updated_at TEXT DEFAULT (datetime('now')) NOT NULL
      )
    `);
    
    console.log('✅ SQLite database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing SQLite database tables:', error);
    throw error;
  }
} else {
  console.log('✅ Using PostgreSQL database storage for persistence');
  
  // Get database URL - check deployed location first, then fall back to env variable
  let databaseUrl = process.env.DATABASE_URL;

  // For deployed applications, check /tmp/replitdb first
  try {
    if (fs.existsSync('/tmp/replitdb')) {
      const deployedUrl = fs.readFileSync('/tmp/replitdb', 'utf8').trim();
      if (deployedUrl) {
        databaseUrl = deployedUrl;
        console.log('✅ Using deployed database URL from /tmp/replitdb');
      }
    }
  } catch (error) {
    console.log('ℹ️ Could not read /tmp/replitdb, using environment variable');
  }

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  pool = new Pool({ 
    connectionString: databaseUrl,
    connectionTimeoutMillis: 30000, // 30 seconds timeout
    idleTimeoutMillis: 60000, // 60 seconds idle timeout
    max: 10, // maximum number of connections
    min: 1, // minimum number of connections
  });
  db = drizzle(pool, { schema });
}

export { db, pool };