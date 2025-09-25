// Database utility functions for optimized chat operations

const refreshChatListView = async (pool) => {
  try {
    await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY chat_list_view');
    console.log('Chat list view refreshed successfully');
  } catch (error) {
    console.error('Error refreshing chat list view:', error);
    // Fallback to non-concurrent refresh
    try {
      await pool.query('REFRESH MATERIALIZED VIEW chat_list_view');
      console.log('Chat list view refreshed successfully (non-concurrent)');
    } catch (fallbackError) {
      console.error('Failed to refresh chat list view:', fallbackError);
    }
  }
};

const getUnreadCountForUser = async (pool, userId, chatId) => {
  try {
    const result = await pool.query(
      'SELECT get_unread_count($1, $2) as unread_count',
      [userId, chatId]
    );
    return result.rows[0].unread_count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

const getOnlineUsersInChat = async (pool, chatId) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.full_name, u.is_online, u.socket_id
      FROM users u
      JOIN chat_members cm ON u.id = cm.user_id
      WHERE cm.chat_id = $1 AND u.is_online = true
    `, [chatId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting online users in chat:', error);
    return [];
  }
};

const createPrivateChat = async (pool, user1Id, user2Id) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if chat already exists
    const existingChat = await client.query(`
      SELECT c.id FROM chats c
      JOIN chat_members cm1 ON c.id = cm1.chat_id
      JOIN chat_members cm2 ON c.id = cm2.chat_id
      WHERE c.type = 'private' 
      AND cm1.user_id = $1 
      AND cm2.user_id = $2
    `, [user1Id, user2Id]);
    
    if (existingChat.rows.length > 0) {
      await client.query('COMMIT');
      return existingChat.rows[0].id;
    }
    
    // Create new private chat
    const chatResult = await client.query(`
      INSERT INTO chats (type, created_by)
      VALUES ('private', $1)
      RETURNING id
    `, [user1Id]);
    
    const chatId = chatResult.rows[0].id;
    
    // Add both users as members
    await client.query(`
      INSERT INTO chat_members (chat_id, user_id, role)
      VALUES ($1, $2, 'member'), ($1, $3, 'member')
    `, [chatId, user1Id, user2Id]);
    
    await client.query('COMMIT');
    return chatId;
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateChatActivity = async (pool, chatId, messageId) => {
  try {
    await pool.query(`
      UPDATE chats 
      SET last_message_id = $1, last_activity = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [messageId, chatId]);
  } catch (error) {
    console.error('Error updating chat activity:', error);
  }
};

const getChatMembers = async (pool, chatId) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.full_name, u.is_online, cm.role
      FROM users u
      JOIN chat_members cm ON u.id = cm.user_id
      WHERE cm.chat_id = $1
    `, [chatId]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting chat members:', error);
    return [];
  }
};

const optimizeDatabase = async (pool) => {
  try {
    console.log('Running database optimization...');
    
    // Update table statistics
    await pool.query('ANALYZE messages');
    await pool.query('ANALYZE chats');
    await pool.query('ANALYZE chat_members');
    await pool.query('ANALYZE message_reads');
    await pool.query('ANALYZE message_deliveries');
    await pool.query('ANALYZE users');
    
    // Refresh materialized view
    await refreshChatListView(pool);
    
    console.log('Database optimization completed');
  } catch (error) {
    console.error('Error during database optimization:', error);
  }
};

module.exports = {
  refreshChatListView,
  getUnreadCountForUser,
  getOnlineUsersInChat,
  createPrivateChat,
  updateChatActivity,
  getChatMembers,
  optimizeDatabase
};