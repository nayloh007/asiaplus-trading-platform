import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// ใช้การเชื่อมต่อฐานข้อมูลในเมมโมรี่สำหรับการพัฒนา
console.log("Using in-memory storage for development...");

// สร้าง Pool จำลองเพื่อให้ drizzle ทำงานได้
export const pool = {
  query: async () => ({ rows: [] }),
  connect: async () => ({}),
  end: async () => {},
} as unknown as Pool;

// สร้าง drizzle instance กับ schema
export const db = drizzle(pool, { schema });