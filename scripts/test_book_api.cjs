const fetch = require('node-fetch');

async function testBookAPI() {
  try {
    // First, login to get a token
    const loginResponse = await fetch('http://localhost:5001/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin', // You may need to adjust these credentials
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.token) {
      console.error('Failed to login');
      return;
    }

    const token = loginData.token;

    // Now fetch the book with authentication
    const bookResponse = await fetch('http://localhost:5001/api/books/86e8d03e-c6d0-42c5-baf5-bcd3378e8cf7', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const bookData = await bookResponse.json();
    console.log('\n=== BOOK DATA ===');
    console.log('Has reactions field:', 'reactions' in bookData);
    console.log('Reactions:', bookData.reactions);
    console.log('\nFull book object:');
    console.log(JSON.stringify(bookData, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testBookAPI();
