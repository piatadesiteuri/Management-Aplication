const axios = require('axios');

async function testUsersEndpoint() {
    try {
        console.log('🔍 Testing users endpoint...');

        // Test 1: Verificăm că endpoint-ul răspunde
        console.log('\n1. Testing /api/auth/users endpoint...');
        try {
            const response = await axios.get('http://localhost:3000/api/auth/users', {
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            });
            console.log('✅ Users endpoint accessible');
            console.log('📊 Users found:', response.data?.length || 0);
            
            if (response.data && response.data.length > 0) {
                console.log('👥 Sample user data:', {
                    id: response.data[0].id,
                    email: response.data[0].email,
                    firstName: response.data[0].firstName,
                    lastName: response.data[0].lastName,
                    roles: response.data[0].roles
                });
            }
        } catch (error) {
            console.log('❌ Users endpoint test failed:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }

        // Test 2: Verificăm că utilizatorii au structura corectă
        console.log('\n2. Testing user data structure...');
        try {
            const response = await axios.get('http://localhost:3000/api/auth/users', {
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            });
            
            if (response.data && response.data.length > 0) {
                const user = response.data[0];
                const requiredFields = ['id', 'email', 'firstName', 'lastName', 'isActive', 'roles'];
                const hasAllFields = requiredFields.every(field => field in user);
                
                console.log('✅ User data structure test:', {
                    hasAllRequiredFields: hasAllFields,
                    fields: requiredFields,
                    actualFields: Object.keys(user)
                });
            } else {
                console.log('ℹ️ No users found to test structure');
            }
        } catch (error) {
            console.log('❌ User structure test failed:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }

        // Test 3: Verificăm că utilizatorii sunt din baza de date reală
        console.log('\n3. Testing database connection...');
        try {
            const response = await axios.get('http://localhost:3000/api/auth/users', {
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            });
            
            if (response.data && response.data.length > 0) {
                console.log('✅ Database connection test:', {
                    usersCount: response.data.length,
                    sampleEmails: response.data.slice(0, 3).map(u => u.email),
                    isRealData: !response.data.some(u => u.email.includes('mock') || u.email.includes('test'))
                });
            } else {
                console.log('ℹ️ No users found in database');
            }
        } catch (error) {
            console.log('❌ Database connection test failed:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }

        console.log('\n✅ Users endpoint test completed!');
        console.log('📝 Summary:');
        console.log('   - Users endpoint should be accessible');
        console.log('   - Users should have correct structure (id, email, firstName, lastName, roles)');
        console.log('   - Users should come from real database, not mock data');

    } catch (error) {
        console.error('❌ General error:', error.message);
    }
}

testUsersEndpoint(); 