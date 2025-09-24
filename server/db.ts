import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import ws from "ws";
import fs from "fs";
import * as schema from "@shared/schema";

// Integration: javascript_database
neonConfig.webSocketConstructor = ws;

// Check if we should use SQLite instead of PostgreSQL
const useSqlite = process.env.USE_SQLITE === 'true';

let db: any;
let pool: any = null;

if (useSqlite) {
  console.log('✅ Using SQLite database storage for persistence');
  const sqlite = new Database('database.sqlite');
  db = drizzleSqlite(sqlite, { schema });
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
  db = drizzle({ client: pool, schema });
}

export { db, pool };