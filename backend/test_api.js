const axios = require('axios');

async function testApi() {
  try {
    // 1. Register test user
    const user = { username: `test${Date.now()}`, email: `test${Date.now()}@test.com`, password: 'password', fullName: 'Test User' };
    const regRes = await axios.post('http://localhost:5000/api/auth/register', user);
    console.log('Registered token:', regRes.data.token);

    // 2. Try to post
    const postRes = await axios.post('http://localhost:5000/api/posts', 
      { content: "Test post" }, 
      { headers: { Authorization: `Bearer ${regRes.data.token}` } }
    );
    console.log('Post success:', postRes.data);
  } catch (err) {
    console.error('API Error:', err.response?.data || err.message);
  }
}
testApi();
