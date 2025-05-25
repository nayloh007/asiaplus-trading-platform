import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// ใช้ DATABASE_URL จาก environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is not defined");
  process.exit(1);
}

// สร้าง Pool สำหรับเชื่อมต่อกับ PostgreSQL
export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // ต้องการเมื่อใช้กับ Replit
  }
});

// แสดงข้อความว่ากำลังใช้ PostgreSQL
console.log("Using PostgreSQL database for persistent storage...");

// สร้าง drizzle instance กับ schema
export const db = drizzle(pool, { schema });