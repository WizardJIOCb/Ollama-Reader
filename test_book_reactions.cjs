const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function testBookReactions() {
  try {
    // Check if bookId column exists in reactions table
    const columnCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'reactions' AND column_name = 'book_id'
    `);
    
    console.log('Column check:', columnCheck.rows);
    
    // Get all book reactions
    const bookReactions = await pool.query(`
      SELECT * FROM reactions WHERE book_id IS NOT NULL
    `);
    
    console.log('Book reactions count:', bookReactions.rows.length);
    console.log('Book reactions:', JSON.stringify(bookReactions.rows, null, 2));
    
    // Get reactions for specific book
    const specificBook = await pool.query(`
      SELECT * FROM reactions WHERE book_id = $1
    `, ['86e8d03e-c6d0-42c5-baf5-bcd3378e8cf7']);
    
    console.log('Reactions for book 86e8d03e-c6d0-42c5-baf5-bcd3378e8cf7:', specificBook.rows);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

testBookReactions();
