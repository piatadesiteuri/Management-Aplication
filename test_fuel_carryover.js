const axios = require('axios');

// Test script pentru a verifica funcționalitatea de carryover a combustibilului
async function testFuelCarryover() {
    try {
        console.log('🧪 Testing fuel carryover functionality...');
        
        // URL-ul backend-ului
        const baseURL = 'http://localhost:3000/api';
        
        // Simulează autentificarea (ar trebui să ai un token valid)
        const token = 'your-auth-token-here'; // Înlocuiește cu un token real
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        // Test 1: Verifică dacă endpoint-ul previous-day funcționează cu vehicleId
        console.log('\n1. Testing previous-day endpoint with vehicleId...');
        
        try {
            const response = await axios.get(
                `${baseURL}/daily-activity/previous-day/2025-12-07?vehicleId=1`,
                { headers }
            );
            
            console.log('✅ Previous-day endpoint response:', response.data);
            
            if (response.data.success && response.data.data) {
                console.log('✅ Found previous day data:', response.data.data);
                
                // Verifică dacă există date pentru vehiculul 1
                const vehicleData = response.data.data.find(item => item.vehicle_id === 1);
                if (vehicleData) {
                    console.log('✅ Vehicle 1 data found:', {
                        date: vehicleData.date,
                        end_day_fuel_liters: vehicleData.end_day_fuel_liters,
                        status: vehicleData.status
                    });
                } else {
                    console.log('⚠️ No data found for vehicle 1');
                }
            }
        } catch (error) {
            console.log('❌ Error testing previous-day endpoint:', error.response?.data || error.message);
        }
        
        // Test 2: Verifică endpoint-ul fără vehicleId
        console.log('\n2. Testing previous-day endpoint without vehicleId...');
        
        try {
            const response = await axios.get(
                `${baseURL}/daily-activity/previous-day/2025-12-07`,
                { headers }
            );
            
            console.log('✅ Previous-day endpoint (all vehicles) response:', response.data);
        } catch (error) {
            console.log('❌ Error testing previous-day endpoint (all vehicles):', error.response?.data || error.message);
        }
        
        // Test 3: Verifică datele din baza de date pentru a vedea ce date există
        console.log('\n3. Checking available data in database...');
        
        try {
            const response = await axios.get(
                `${baseURL}/daily-activity/daily-activity/2025-12-06`,
                { headers }
            );
            
            console.log('✅ Data for 2025-12-06:', response.data);
            
            if (response.data.success && response.data.data) {
                console.log('Available vehicles for 2025-12-06:');
                response.data.data.forEach(item => {
                    console.log(`  - Vehicle ${item.vehicle_id}: end_day_fuel_liters=${item.end_day_fuel_liters}, status=${item.status}`);
                });
            }
        } catch (error) {
            console.log('❌ Error checking database data:', error.response?.data || error.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Rulează testul
testFuelCarryover();
