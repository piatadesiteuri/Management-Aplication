// Test script pentru verificarea token-ului
const testToken = async () => {
  try {
    // Testează login-ul
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@dspdolj.ro',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginData.token) {
      // Testează material-requests cu token-ul nou
      const requestResponse = await fetch('http://localhost:3000/api/material-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`
        },
        body: JSON.stringify({
          product_id: 1,
          quantity_requested: 10,
          priority: 'LOW',
          reason: 'test',
          requester_id: 1
        })
      });
      
      const requestData = await requestResponse.json();
      console.log('Material request response:', requestData);
      console.log('Status:', requestResponse.status);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

testToken();
