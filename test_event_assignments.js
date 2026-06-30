const axios = require('axios');

async function testEventAssignments() {
    try {
        console.log('🔍 Testing event assignments functionality...');

        // Test 1: Verificăm că endpoint-ul de utilizatori funcționează
        console.log('\n1. Testing users endpoint...');
        try {
            const usersResponse = await axios.get('http://localhost:3000/api/auth/users', {
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            });
            console.log('✅ Users endpoint working');
            console.log('📊 Users found:', usersResponse.data?.length || 0);
            
            if (usersResponse.data && usersResponse.data.length > 0) {
                console.log('👥 Sample user:', {
                    id: usersResponse.data[0].id,
                    email: usersResponse.data[0].email,
                    firstName: usersResponse.data[0].firstName,
                    lastName: usersResponse.data[0].lastName,
                    roles: usersResponse.data[0].roles
                });
            }
        } catch (error) {
            console.log('❌ Users endpoint failed:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }

        // Test 2: Verificăm că endpoint-ul de evenimente funcționează
        console.log('\n2. Testing events endpoint...');
        try {
            const eventsResponse = await axios.get('http://localhost:3000/api/calendar/events', {
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            });
            console.log('✅ Events endpoint working');
            console.log('📅 Events found:', eventsResponse.data?.length || 0);
            
            if (eventsResponse.data && eventsResponse.data.length > 0) {
                console.log('📅 Sample event:', {
                    id: eventsResponse.data[0].id,
                    title: eventsResponse.data[0].title,
                    type: eventsResponse.data[0].type,
                    isAssignedToCurrentUser: eventsResponse.data[0].is_assigned_to_current_user
                });
            }
        } catch (error) {
            console.log('❌ Events endpoint failed:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }

        // Test 3: Verificăm că endpoint-ul de asignări funcționează (pentru primul eveniment)
        console.log('\n3. Testing assignments endpoint...');
        try {
            const eventsResponse = await axios.get('http://localhost:3000/api/calendar/events', {
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            });
            
            if (eventsResponse.data && eventsResponse.data.length > 0) {
                const firstEventId = eventsResponse.data[0].id;
                const assignmentsResponse = await axios.get(`http://localhost:3000/api/calendar/events/${firstEventId}/assignments`, {
                    headers: {
                        'Authorization': 'Bearer test-token'
                    }
                });
                
                console.log('✅ Assignments endpoint working');
                console.log('📋 Assignments found:', assignmentsResponse.data?.length || 0);
                
                if (assignmentsResponse.data && assignmentsResponse.data.length > 0) {
                    console.log('📋 Sample assignment:', {
                        id: assignmentsResponse.data[0].id,
                        userId: assignmentsResponse.data[0].user_id,
                        user: assignmentsResponse.data[0].user,
                        role: assignmentsResponse.data[0].role,
                        status: assignmentsResponse.data[0].status
                    });
                }
            } else {
                console.log('ℹ️ No events found to test assignments');
            }
        } catch (error) {
            console.log('❌ Assignments endpoint failed:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }

        // Test 4: Verificăm că filtrul personal funcționează
        console.log('\n4. Testing personal filter...');
        try {
            const personalEventsResponse = await axios.get('http://localhost:3000/api/calendar/events?personal=true', {
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            });
            
            console.log('✅ Personal filter working');
            console.log('👤 Personal events found:', personalEventsResponse.data?.length || 0);
            
            if (personalEventsResponse.data && personalEventsResponse.data.length > 0) {
                console.log('👤 Sample personal event:', {
                    id: personalEventsResponse.data[0].id,
                    title: personalEventsResponse.data[0].title,
                    isAssignedToCurrentUser: personalEventsResponse.data[0].is_assigned_to_current_user
                });
            }
        } catch (error) {
            console.log('❌ Personal filter failed:', {
                status: error.response?.status,
                message: error.response?.data?.message || error.message
            });
        }

        console.log('\n✅ Event assignments functionality test completed!');
        console.log('📝 Summary:');
        console.log('   - Users should be loaded from real database');
        console.log('   - Events should show assignment status');
        console.log('   - Assignments should link to real users');
        console.log('   - Personal filter should work correctly');
        console.log('   - Frontend should display real user data, not mock data');

    } catch (error) {
        console.error('❌ General error:', error.message);
    }
}

testEventAssignments(); 