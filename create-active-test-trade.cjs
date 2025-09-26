const Database = require('better-sqlite3');
const path = require('path');

// เชื่อมต่อกับฐานข้อมูล
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  console.log('Creating a new active test trade...');
  
  // สร้างการเทรดใหม่ที่มีสถานะ active และมี endTime ในอนาคต (2 นาที)
  const now = new Date();
  const endTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 นาทีจากตอนนี้
  
  const insertTrade = db.prepare(`
    INSERT INTO trades (
      user_id, crypto_id, amount, direction, entry_price, 
      duration, status, created_at, end_time, profit_percentage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = insertTrade.run(
    1,                    // userId
    'bitcoin',           // cryptoId
    1000,                // amount (1000 บาท)
    'up',                // direction
    '99999.99',          // entryPrice
    120,                 // duration (2 นาที = 120 วินาที)
    'active',            // status
    now.toISOString(),   // createdAt
    endTime.toISOString(), // endTime
    30                   // profitPercentage
  );
  
  console.log(`✅ Created new active test trade with ID: ${result.lastInsertRowid}`);
  console.log(`📅 Created at: ${now.toISOString()}`);
  console.log(`⏰ Will end at: ${endTime.toISOString()}`);
  console.log(`⏱️  Duration: 2 minutes (120 seconds)`);
  console.log(`💰 Amount: ฿1,000`);
  console.log(`📈 Direction: UP`);
  console.log(`💵 Entry Price: $99,999.99`);
  
  // ตรวจสอบการเทรดที่เพิ่งสร้าง
  const checkTrade = db.prepare('SELECT * FROM trades WHERE id = ?');
  const newTrade = checkTrade.get(result.lastInsertRowid);
  
  console.log('\n📋 Trade details:');
  console.log(JSON.stringify(newTrade, null, 2));
  
} catch (error) {
  console.error('❌ Error creating test trade:', error);
} finally {
  db.close();
}