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

async function checkPerformance() {
  console.log('=== Chat Performance Monitoring ===\n');
  
  try {
    // Check message stats
    const messageStats = await pool.query(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(DISTINCT chat_id) as active_chats,
        COUNT(DISTINCT sender_id) as active_users,
        AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - timestamp))) as avg_age_seconds
      FROM messages 
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
    `);
    
    console.log('📊 Message Statistics (Last 24 hours):');
    console.log(`   Total Messages: ${messageStats.rows[0].total_messages}`);
    console.log(`   Active Chats: ${messageStats.rows[0].active_chats}`);
    console.log(`   Active Users: ${messageStats.rows[0].active_users}`);
    console.log(`   Average Message Age: ${Math.round(messageStats.rows[0].avg_age_seconds / 60)} minutes\n`);
    
    // Check read/delivery performance
    const statusStats = await pool.query(`
      SELECT 
        COUNT(CASE WHEN md.message_id IS NOT NULL THEN 1 END) as delivered_messages,
        COUNT(CASE WHEN mr.message_id IS NOT NULL THEN 1 END) as read_messages,
        COUNT(*) as total_recent_messages
      FROM messages m
      LEFT JOIN message_deliveries md ON m.id = md.message_id
      LEFT JOIN message_reads mr ON m.id = mr.message_id
      WHERE m.timestamp >= NOW() - INTERVAL '1 hour'
    `);
    
    const delivered = statusStats.rows[0].delivered_messages;
    const read = statusStats.rows[0].read_messages;
    const total = statusStats.rows[0].total_recent_messages;
    
    console.log('📈 Message Status Performance (Last hour):');
    console.log(`   Delivery Rate: ${total > 0 ? Math.round((delivered / total) * 100) : 0}%`);
    console.log(`   Read Rate: ${total > 0 ? Math.round((read / total) * 100) : 0}%`);
    console.log(`   Total Messages: ${total}\n`);
    
    // Check database performance
    const dbStats = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_rows,
        n_dead_tup as dead_rows
      FROM pg_stat_user_tables 
      WHERE tablename IN ('messages', 'chats', 'chat_members', 'message_reads', 'message_deliveries')
      ORDER BY tablename
    `);
    
    console.log('🗄️  Database Table Statistics:');
    dbStats.rows.forEach(row => {
      console.log(`   ${row.tablename}:`);
      console.log(`     Live Rows: ${row.live_rows}, Dead Rows: ${row.dead_rows}`);
      console.log(`     Operations: ${row.inserts} inserts, ${row.updates} updates, ${row.deletes} deletes`);
    });
    console.log();
    
    // Check index usage
    const indexStats = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE tablename IN ('messages', 'chats', 'chat_members', 'message_reads', 'message_deliveries')
      AND idx_tup_read > 0
      ORDER BY idx_tup_read DESC
      LIMIT 10
    `);
    
    console.log('📋 Top Index Usage:');
    indexStats.rows.forEach(row => {
      console.log(`   ${row.indexname}: ${row.idx_tup_read} reads, ${row.idx_tup_fetch} fetches`);
    });
    console.log();
    
    // Check slow queries (if pg_stat_statements is enabled)
    try {
      const slowQueries = await pool.query(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE query LIKE '%messages%' OR query LIKE '%chats%'
        ORDER BY mean_time DESC
        LIMIT 5
      `);
      
      if (slowQueries.rows.length > 0) {
        console.log('🐌 Slowest Queries:');
        slowQueries.rows.forEach((row, index) => {
          console.log(`   ${index + 1}. Mean time: ${Math.round(row.mean_time)}ms, Calls: ${row.calls}`);
          console.log(`      ${row.query.substring(0, 80)}...`);
        });
        console.log();
      }
    } catch (error) {
      console.log('📊 pg_stat_statements not available for query analysis\n');
    }
    
    // Connection pool stats
    console.log('🔗 Connection Pool Statistics:');
    console.log(`   Total Connections: ${pool.totalCount}`);
    console.log(`   Idle Connections: ${pool.idleCount}`);
    console.log(`   Waiting Clients: ${pool.waitingCount}\n`);
    
    // Recommendations
    console.log('💡 Performance Recommendations:');
    
    if (statusStats.rows[0].total_recent_messages > 1000) {
      console.log('   ⚠️  High message volume detected. Consider implementing message archiving.');
    }
    
    const deadRowsRatio = dbStats.rows.reduce((sum, row) => {
      const total = parseInt(row.live_rows) + parseInt(row.dead_rows);
      return sum + (total > 0 ? parseInt(row.dead_rows) / total : 0);
    }, 0) / dbStats.rows.length;
    
    if (deadRowsRatio > 0.1) {
      console.log('   ⚠️  High dead rows ratio. Consider running VACUUM ANALYZE.');
    }
    
    if (pool.waitingCount > 0) {
      console.log('   ⚠️  Clients waiting for connections. Consider increasing pool size.');
    }
    
    console.log('   ✅ Performance monitoring completed successfully!');
    
  } catch (error) {
    console.error('Error during performance monitoring:', error);
  } finally {
    await pool.end();
  }
}

// Run monitoring if called directly
if (require.main === module) {
  checkPerformance()
    .then(() => {
      console.log('\nMonitoring completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Monitoring failed:', error);
      process.exit(1);
    });
}

module.exports = { checkPerformance };