const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function migrateToChats() {
  console.log('Starting migration to chat-based messaging system...');
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if we have any old messages with receiver_id (if your old schema had this)
    const oldMessagesCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'receiver_id'
    `);
    
    if (oldMessagesCheck.rows.length > 0) {
      console.log('Found old direct messaging schema. Migrating...');
      
      // Get all unique user pairs from old messages
      const userPairs = await client.query(`
        SELECT DISTINCT 
          LEAST(sender_id, receiver_id) as user1,
          GREATEST(sender_id, receiver_id) as user2
        FROM messages 
        WHERE receiver_id IS NOT NULL
      `);
      
      console.log(`Found ${userPairs.rows.length} unique user pairs to migrate`);
      
      // Create private chats for each pair
      for (const pair of userPairs.rows) {
        // Create private chat
        const chatResult = await client.query(`
          INSERT INTO chats (type, created_by, created_at)
          VALUES ('private', $1, CURRENT_TIMESTAMP)
          RETURNING id
        `, [pair.user1]);
        
        const chatId = chatResult.rows[0].id;
        
        // Add both users as members
        await client.query(`
          INSERT INTO chat_members (chat_id, user_id, role)
          VALUES ($1, $2, 'member'), ($1, $3, 'member')
        `, [chatId, pair.user1, pair.user2]);
        
        // Update old messages to use the new chat_id
        await client.query(`
          UPDATE messages 
          SET chat_id = $1
          WHERE (sender_id = $2 AND receiver_id = $3) 
             OR (sender_id = $3 AND receiver_id = $2)
        `, [chatId, pair.user1, pair.user2]);
        
        console.log(`Created private chat ${chatId} for users ${pair.user1} and ${pair.user2}`);
      }
      
      // Update chat last_activity and message_count
      await client.query(`
        UPDATE chats 
        SET last_activity = (
          SELECT MAX(timestamp) FROM messages WHERE chat_id = chats.id
        ),
        message_count = (
          SELECT COUNT(*) FROM messages WHERE chat_id = chats.id
        ),
        last_message_id = (
          SELECT id FROM messages 
          WHERE chat_id = chats.id 
          ORDER BY timestamp DESC 
          LIMIT 1
        )
      `);
      
      console.log('Updated chat statistics');
      
      // Drop the old receiver_id column if you want
      // await client.query('ALTER TABLE messages DROP COLUMN receiver_id');
      // console.log('Dropped old receiver_id column');
    } else {
      console.log('No old direct messaging schema found. Migration not needed.');
    }
    
    // Refresh the materialized view
    await client.query('REFRESH MATERIALIZED VIEW chat_list_view');
    console.log('Refreshed chat list materialized view');
    
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToChats()
    .then(() => {
      console.log('Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToChats };