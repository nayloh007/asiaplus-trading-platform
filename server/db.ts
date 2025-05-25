import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// ใช้ mock pool แทนการเชื่อมต่อกับ PostgreSQL เนื่องจากมีปัญหาในการเชื่อมต่อ
// ระบบจะใช้ file-storage.ts แทนเพื่อเก็บข้อมูลถาวร
export const pool = {
  query: async () => ({ rows: [] }),
  connect: async () => ({}),
  end: async () => {},
} as unknown as Pool;

// สร้าง drizzle instance กับ schema
export const db = drizzle(pool, { schema });