// Test script pentru verificarea statusurilor transport
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Simulează un token de autentificare (în realitate ar trebui să fie obținut prin login)
const testToken = 'test_token';

async function testTransportStatusUpdate() {
    try {
        console.log('🧪 Testare actualizare status transport...');
        
        // Testează toate statusurile valide
        const validStatuses = ['ORDERED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
        
        for (const status of validStatuses) {
            console.log(`\n📝 Testare status: ${status}`);
            
            try {
                const response = await axios.put(
                    `${API_BASE}/calendar/events/44/transport-status`,
                    {
                        status: status,
                        comments: `Test status ${status}`
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${testToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                console.log(`✅ Status ${status} - SUCCESS`);
                console.log(`   Response:`, response.data);
                
            } catch (error) {
                console.log(`❌ Status ${status} - FAILED`);
                console.log(`   Error:`, error.response?.data || error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Testează și statusurile invalide
async function testInvalidStatuses() {
    console.log('\n🚫 Testare statusuri invalide...');
    
    const invalidStatuses = ['PENDING', 'DELAYED', 'INVALID_STATUS'];
    
    for (const status of invalidStatuses) {
        console.log(`\n📝 Testare status invalid: ${status}`);
        
        try {
            const response = await axios.put(
                `${API_BASE}/calendar/events/44/transport-status`,
                {
                    status: status,
                    comments: `Test status invalid ${status}`
                },
                {
                    headers: {
                        'Authorization': `Bearer ${testToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log(`⚠️ Status ${status} - UNEXPECTED SUCCESS`);
            console.log(`   Response:`, response.data);
            
        } catch (error) {
            console.log(`✅ Status ${status} - CORRECTLY REJECTED`);
            console.log(`   Error:`, error.response?.data?.message || error.message);
        }
    }
}

// Rulează testele
async function runTests() {
    console.log('🚀 Începere testare statusuri transport...\n');
    
    await testTransportStatusUpdate();
    await testInvalidStatuses();
    
    console.log('\n✅ Testare completă!');
}

runTests().catch(console.error); 