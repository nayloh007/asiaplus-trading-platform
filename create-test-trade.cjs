const Database = require('better-sqlite3');

const db = new Database('database.sqlite');

try {
  // Create a test trade with proper endTime
  const now = new Date();
  const endTime = new Date(now.getTime() + 120 * 1000); // 2 minutes from now
  
  const insertStmt = db.prepare(`
    INSERT INTO trades (
      user_id, crypto_id, entry_price, amount, direction, 
      duration, status, profit_percentage, created_at, end_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(
    1, // user_id (assuming user 1 exists)
    'bitcoin',
    '95000.00',
    '100.00',
    'up',
    120, // 2 minutes
    'active',
    '85',
    now.toISOString(),
    endTime.toISOString()
  );

  console.log(`Created test trade with ID: ${result.lastInsertRowid}`);
  console.log(`Trade will end at: ${endTime.toISOString()}`);
  console.log(`Current time: ${now.toISOString()}`);

} catch (error) {
  console.error('Error creating test trade:', error);
} finally {
  db.close();
}