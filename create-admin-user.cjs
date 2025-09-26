const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database('database.sqlite');

async function createAdminUser() {
  try {
    // ปิด foreign key constraints ชั่วคราว
    db.pragma('foreign_keys = OFF');
    
    // ลบผู้ใช้ admin เก่าถ้ามี
    db.prepare('DELETE FROM users WHERE username = ?').run('admin');
    
    // เข้ารหัสรหัสผ่าน
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin@bigone', salt);
    
    // สร้างผู้ใช้ admin ใหม่
    const result = db.prepare(`
      INSERT INTO users (username, email, password, role, balance, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run('admin', 'admin@example.com', hashedPassword, 'admin', '1000000');
    
    console.log('Admin user created successfully with ID:', result.lastInsertRowid);
    
    // ตรวจสอบผู้ใช้ที่สร้างขึ้น
    const user = db.prepare('SELECT id, username, email, role FROM users WHERE username = ?').get('admin');
    console.log('Created user:', user);
    
    // เปิด foreign key constraints กลับ
    db.pragma('foreign_keys = ON');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    db.close();
  }
}

createAdminUser();