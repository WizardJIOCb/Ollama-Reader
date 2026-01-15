const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'my_secret_key_for_jwt_tokens';

// Generate a valid token for the user who created the reactions
const userId = '605db90f-4691-4281-991e-b2e248e33915';
const token = jwt.sign({ userId, username: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

console.log('Generated token:', token);

async function testBookAPI() {
  try {
    console.log('\n=== Testing book API with valid token ===\n');
    
    // Fetch the book with authentication
    const bookResponse = await fetch('http://localhost:5001/api/books/86e8d03e-c6d0-42c5-baf5-bcd3378e8cf7', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', bookResponse.status);
    console.log('Response headers:', bookResponse.headers.raw());

    if (!bookResponse.ok) {
      const errorText = await bookResponse.text();
      console.error('Error response:', errorText);
      return;
    }

    const bookData = await bookResponse.json();
    
    console.log('\n=== BOOK DATA ===');
    console.log('Book ID:', bookData.id);
    console.log('Book title:', bookData.title);
    console.log('Has reactions field:', 'reactions' in bookData);
    console.log('Reactions value:', bookData.reactions);
    console.log('Reactions type:', typeof bookData.reactions);
    console.log('Reactions is array:', Array.isArray(bookData.reactions));
    
    if (bookData.reactions) {
      console.log('Number of reactions:', bookData.reactions.length);
      console.log('Reaction details:', JSON.stringify(bookData.reactions, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testBookAPI();
