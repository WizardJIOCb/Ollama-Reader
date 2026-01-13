const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { eq } = require('drizzle-orm');

const pool = new Pool({
  connectionString: 'postgresql://booksuser:bookspassword@localhost:5432/booksdb'
});

const db = drizzle(pool);

async function checkNewsReactions() {
  try {
    console.log('Fetching all news with reaction counts...\n');
    
    const result = await pool.query(`
      SELECT 
        id, 
        title, 
        reaction_count as "reactionCount",
        view_count as "viewCount",
        comment_count as "commentCount"
      FROM news 
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('News items found:', result.rows.length);
    console.log('\n=== News with Reaction Counts ===\n');
    
    result.rows.forEach((news, index) => {
      console.log(`${index + 1}. ${news.title}`);
      console.log(`   ID: ${news.id}`);
      console.log(`   Reactions: ${news.reactionCount || 0}`);
      console.log(`   Views: ${news.viewCount || 0}`);
      console.log(`   Comments: ${news.commentCount || 0}`);
      console.log('');
    });
    
    // Now check actual reactions in the reactions table
    console.log('\n=== Checking actual reactions in database ===\n');
    
    const reactionsResult = await pool.query(`
      SELECT 
        news_id,
        COUNT(*) as actual_count
      FROM reactions
      WHERE news_id IS NOT NULL
      GROUP BY news_id
    `);
    
    console.log('News items with reactions:', reactionsResult.rows.length);
    reactionsResult.rows.forEach((item) => {
      const newsItem = result.rows.find(n => n.id === item.news_id);
      console.log(`News: ${newsItem?.title || item.news_id}`);
      console.log(`   Stored count: ${newsItem?.reactionCount || 0}`);
      console.log(`   Actual count: ${item.actual_count}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkNewsReactions();
