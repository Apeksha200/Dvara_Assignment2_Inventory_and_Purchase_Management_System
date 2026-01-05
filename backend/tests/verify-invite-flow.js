// Native fetch is available in Node 18+
// Configure defaults
const BASE_URL = 'http://localhost:5000/api';

const runVerification = async () => {
  try {
    console.log('--- Starting Verification: User Invite Flow ---');

    // 1. Login as Admin
    console.log('1. Logging in as Admin...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@example.com',
            password: 'AdminSecure2024!'
        })
    });

    if (!loginRes.ok) {
        throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
    }

    const loginData = await loginRes.json();
    
    if (!loginData.token) {
      throw new Error('Login failed: No token received');
    }
    const token = loginData.token;
    console.log('✅ Admin logged in successfully.');

    // 2. Create User (No Password)
    console.log('2. Creating new user (Standard Flow - No Password)...');
    const newUser = {
      name: 'Test Invite User',
      email: `test_invite_${Date.now()}@example.com`,
      role: 'PROCUREMENT',
      isActive: true
      // Note: No password field
    };

    const createRes = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
    });

    const createData = await createRes.json();

    console.log('Response:', createData);

    if (createRes.ok) { // 200-299 status
      console.log('✅ User created successfully.');
      
      if (createData.inviteURL) {
        console.log('✅ Invite URL received:', createData.inviteURL);
      } else {
        console.log('⚠️ No invite URL in response. (Might be production mode or email sent?)');
      }
    } else {
        throw new Error(`Unexpected status code: ${createRes.status}`);
    }

    console.log('--- Verification Complete: SUCCESS ---');

  } catch (error) {
    console.error('--- Verification Failed ---');
    console.error(error.message);
    if (error.cause) console.error(error.cause);
    process.exit(1);
  }
};

runVerification();
