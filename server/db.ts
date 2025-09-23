import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import fs from "fs";
import * as schema from "@shared/schema";

// Integration: javascript_database
neonConfig.webSocketConstructor = ws;

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

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });