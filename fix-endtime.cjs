const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { eq } = require('drizzle-orm');
const path = require('path');

// Define the trades table schema
const { sqliteTable, integer, text, real } = require('drizzle-orm/sqlite-core');

const trades = sqliteTable('trades', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('userId').notNull(),
  cryptoId: text('cryptoId').notNull(),
  entryPrice: text('entryPrice').notNull(),
  amount: text('amount').notNull(),
  direction: text('direction').notNull(),
  duration: integer('duration').notNull(),
  profitPercentage: text('profitPercentage').notNull(),
  createdAt: text('createdAt').notNull(),
  endTime: text('endTime'),
  status: text('status').notNull().default('active'),
  result: text('result'),
  predeterminedResult: text('predeterminedResult'),
  closedAt: text('closedAt'),
  updatedAt: text('updatedAt')
});

async function fixEndTimeForActiveTrades() {
  try {
    // Connect to SQLite database
    const dbPath = path.join(__dirname, 'database.sqlite');
    const sqlite = new Database(dbPath);

    console.log('Connecting to database...');
    
    // Get all active trades that don't have endTime set
    const activeTrades = sqlite.prepare(`
      SELECT id, created_at, duration 
      FROM trades 
      WHERE status = 'active' AND (end_time IS NULL OR end_time = '')
    `).all();
    
    console.log(`Found ${activeTrades.length} active trades without endTime`);
    
    // Update each trade with calculated endTime
    const updateStmt = sqlite.prepare(`
      UPDATE trades 
      SET end_time = ? 
      WHERE id = ?
    `);
    
    let updatedCount = 0;
    for (const trade of activeTrades) {
      try {
        // Calculate endTime: createdAt + duration (in seconds)
        const createdAt = new Date(trade.created_at);
        const endTime = new Date(createdAt.getTime() + (trade.duration * 1000));
        
        updateStmt.run(endTime.toISOString(), trade.id);
        updatedCount++;
        
        console.log(`Updated trade ${trade.id}: endTime = ${endTime.toISOString()}`);
      } catch (error) {
        console.error(`Error updating trade ${trade.id}:`, error);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} trades`);
    
    sqlite.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Database error:', error);
  }
}

// Run the fix
fixEndTimeForActiveTrades();