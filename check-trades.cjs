const Database = require('better-sqlite3');

const db = new Database('database.sqlite');

try {
  // Check all trades in the database
  const allTrades = db.prepare(`
    SELECT id, user_id, crypto_id, status, created_at, duration, end_time
    FROM trades 
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  console.log(`Total trades found: ${allTrades.length}`);
  console.log('\nTrade details:');
  
  allTrades.forEach(trade => {
    console.log(`Trade ${trade.id}:`);
    console.log(`  Status: ${trade.status}`);
    console.log(`  Created: ${trade.created_at}`);
    console.log(`  Duration: ${trade.duration} seconds`);
    console.log(`  EndTime: ${trade.end_time || 'NULL'}`);
    console.log('---');
  });

  // Check specifically for active trades
  const activeTrades = db.prepare(`
    SELECT COUNT(*) as count
    FROM trades 
    WHERE status = 'active'
  `).get();

  console.log(`\nActive trades count: ${activeTrades.count}`);

} catch (error) {
  console.error('Database error:', error);
} finally {
  db.close();
}