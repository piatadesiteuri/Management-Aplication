const axios = require('axios');

async function testCalendarVisibility() {
    try {
        console.log('🔍 Testing calendar visibility for all users...');

        // Test 1: Verificăm că evenimentele sunt vizibile pentru utilizatori normali
        console.log('\n1. Testing events visibility for regular users...');
        try {
            const eventsResponse = await axios.get('http://localhost:3000/api/calendar/events', {
                headers: {
                    'Authorization': 'Bearer test-token' // Simulăm un token valid
                }
            });
            console.log('✅ Events endpoint accessible for regular users');
            console.log('📊 Events found:', eventsResponse.data?.length || 0);
        } catch (error) {
            console.log('❌ Events visibility test failed:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }

        // Test 2: Verificăm că evenimentele sunt vizibile pentru DEPARTMENT_ADMIN
        console.log('\n2. Testing events visibility for DEPARTMENT_ADMIN...');
        try {
            const eventsResponse = await axios.get('http://localhost:3000/api/calendar/events', {
                headers: {
                    'Authorization': 'Bearer dept-admin-token' // Simulăm un token de DEPARTMENT_ADMIN
                }
            });
            console.log('✅ Events endpoint accessible for DEPARTMENT_ADMIN');
            console.log('📊 Events found:', eventsResponse.data?.length || 0);
        } catch (error) {
            console.log('❌ DEPARTMENT_ADMIN visibility test failed:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }

        // Test 3: Verificăm că evenimentele sunt vizibile pentru MANAGER
        console.log('\n3. Testing events visibility for MANAGER...');
        try {
            const eventsResponse = await axios.get('http://localhost:3000/api/calendar/events', {
                headers: {
                    'Authorization': 'Bearer manager-token' // Simulăm un token de MANAGER
                }
            });
            console.log('✅ Events endpoint accessible for MANAGER');
            console.log('📊 Events found:', eventsResponse.data?.length || 0);
        } catch (error) {
            console.log('❌ MANAGER visibility test failed:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }

        // Test 4: Verificăm că evenimentele sunt vizibile pentru SUPER_ADMIN
        console.log('\n4. Testing events visibility for SUPER_ADMIN...');
        try {
            const eventsResponse = await axios.get('http://localhost:3000/api/calendar/events', {
                headers: {
                    'Authorization': 'Bearer super-admin-token' // Simulăm un token de SUPER_ADMIN
                }
            });
            console.log('✅ Events endpoint accessible for SUPER_ADMIN');
            console.log('📊 Events found:', eventsResponse.data?.length || 0);
        } catch (error) {
            console.log('❌ SUPER_ADMIN visibility test failed:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }

        console.log('\n✅ Calendar visibility test completed!');
        console.log('📝 Summary: All user types should now be able to see events created by others');

    } catch (error) {
        console.error('❌ General error:', error.message);
    }
}

testCalendarVisibility(); 