const Database = require('better-sqlite3');
const path = require('path');

// เชื่อมต่อกับฐานข้อมูล
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  // สร้าง trade ใหม่ที่จะหมดอายุใน 30 วินาที
  const now = new Date();
  const endTime = new Date(now.getTime() + 30 * 1000); // 30 วินาทีจากตอนนี้
  
  const result = db.prepare(`
    INSERT INTO trades (
      user_id, 
      crypto_id, 
      amount, 
      entry_price, 
      direction, 
      duration, 
      profit_percentage, 
      status, 
      created_at, 
      end_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1, // user_id
    1, // crypto_id (Bitcoin)
    100, // amount
    65000, // entry_price
    'up', // direction
    30, // duration (30 seconds)
    85, // profit_percentage
    'active', // status
    now.toISOString(),
    endTime.toISOString()
  );

  console.log('✅ สร้าง active trade ใหม่สำเร็จ!');
  console.log('Trade ID:', result.lastInsertRowid);
  console.log('Duration: 30 วินาที');
  console.log('Created at:', now.toISOString());
  console.log('End time:', endTime.toISOString());
  console.log('Status: active');
  
  // ตรวจสอบ trade ที่เพิ่งสร้าง
  const newTrade = db.prepare('SELECT * FROM trades WHERE id = ?').get(result.lastInsertRowid);
  console.log('\n📊 ข้อมูล trade ที่สร้าง:');
  console.log(newTrade);

} catch (error) {
  console.error('❌ เกิดข้อผิดพลาด:', error.message);
} finally {
  db.close();
}