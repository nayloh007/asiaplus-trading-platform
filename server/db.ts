import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// แก้ไขการเชื่อมต่อเพื่อใช้ PostgreSQL ทั่วไปแทน Neon
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 10, // จำนวนการเชื่อมต่อสูงสุดในพูล
  idleTimeoutMillis: 30000 // เวลาสูงสุดที่คอนเน็คชั่นจะไม่ถูกใช้งานก่อนถูกปิด
});

// ลองเชื่อมต่อเพื่อตรวจสอบ
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = drizzle(pool, { schema });