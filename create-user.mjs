// Use Node.js native crypto
import crypto from 'crypto';
// Use ESM for database connection
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure WebSocket for Neon Database
neonConfig.webSocketConstructor = ws;

// Hash password using crypto
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${hash}.${salt}`;
}

// Get database connection from environment
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createUser() {
  try {
    // First check if user already exists
    const checkQuery = 'SELECT * FROM users WHERE username = $1';
    const checkResult = await pool.query(checkQuery, ['user']);
    
    if (checkResult.rows.length > 0) {
      console.log('User already exists');
      return;
    }
    
    // Create regular user
    const userPassword = hashPassword('user123');
    
    const query = `
      INSERT INTO users (username, email, password, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = ['user', 'user@example.com', userPassword, 'ผู้ใช้งานทั่วไป', 'user'];
    const result = await pool.query(query, values);
    
    console.log('User created successfully:', result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await pool.end();
  }
}

createUser();