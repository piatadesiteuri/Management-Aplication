const axios = require('axios');

async function testPersonalEvents() {
    try {
        console.log('🔍 Testing personal events functionality...');

        // Test 1: Verificăm că endpoint-ul suportă filtrul personal
        console.log('\n1. Testing personal filter endpoint...');
        try {
            const eventsResponse = await axios.get('http://localhost:3000/api/calendar/events?personal=true', {
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            });
            console.log('✅ Personal filter endpoint accessible');
            console.log('📊 Personal events found:', eventsResponse.data?.length || 0);
        } catch (error) {
            console.log('❌ Personal filter test failed:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }

        // Test 2: Verificăm că evenimentele au proprietatea is_assigned_to_current_user
        console.log('\n2. Testing assigned events property...');
        try {
            const eventsResponse = await axios.get('http://localhost:3000/api/calendar/events', {
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            });
            
            if (eventsResponse.data && eventsResponse.data.length > 0) {
                const firstEvent = eventsResponse.data[0];
                console.log('✅ Events have assigned property:', {
                    hasProperty: 'is_assigned_to_current_user' in firstEvent,
                    value: firstEvent.is_assigned_to_current_user
                });
            } else {
                console.log('ℹ️ No events found to test assigned property');
            }
        } catch (error) {
            console.log('❌ Assigned property test failed:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }

        // Test 3: Verificăm că filtrul personal funcționează corect
        console.log('\n3. Testing personal filter logic...');
        try {
            const allEventsResponse = await axios.get('http://localhost:3000/api/calendar/events', {
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            });
            
            const personalEventsResponse = await axios.get('http://localhost:3000/api/calendar/events?personal=true', {
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            });
            
            const allEvents = allEventsResponse.data || [];
            const personalEvents = personalEventsResponse.data || [];
            
            const assignedEventsCount = allEvents.filter(e => e.is_assigned_to_current_user).length;
            
            console.log('✅ Personal filter logic test:', {
                totalEvents: allEvents.length,
                personalEvents: personalEvents.length,
                assignedEventsInAll: assignedEventsCount,
                filterWorking: personalEvents.length === assignedEventsCount
            });
        } catch (error) {
            console.log('❌ Personal filter logic test failed:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }

        console.log('\n✅ Personal events functionality test completed!');
        console.log('📝 Summary:');
        console.log('   - Personal filter endpoint should be accessible');
        console.log('   - Events should have is_assigned_to_current_user property');
        console.log('   - Personal filter should show only assigned events');
        console.log('   - Frontend should show glow effect for assigned events');

    } catch (error) {
        console.error('❌ General error:', error.message);
    }
}

testPersonalEvents(); 