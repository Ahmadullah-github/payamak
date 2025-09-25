const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function initializeDatabase() {
  console.log('Starting database initialization...');
  const client = await pool.connect();
  
  try {
    // Read and execute the schema file
    const sql = await fs.readFile(path.resolve(__dirname, '../database/payamk-db schema.sql'), 'utf8');
    await client.query(sql);
    console.log('Database schema initialized successfully.');
    
    // Run initial optimization
    await client.query('ANALYZE');
    console.log('Database statistics updated.');
    
    console.log('Database initialization completed!');
    
  } catch (err) {
    if (err.code === '42P07') {
      console.log('Database schema already exists. Skipping initialization.');
    } else {
      console.error('Error during database initialization:', err);
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
    console.log('Database connection closed.');
  }
}

initializeDatabase();
