const mysql = require('mysql2/promise');

async function checkDatabaseValues() {
    try {
        console.log('🔍 Verificând valorile din baza de date...');
        
        // Conectare la baza de date
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', // Adaugă parola dacă este necesară
            database: 'edms' // Numele bazei de date
        });
        
        // Verifică datele din daily_activity_sheet pentru decembrie 2025
        const [rows] = await connection.execute(`
            SELECT 
                id,
                date,
                vehicle_id,
                driver_id,
                start_day_fuel_liters,
                liquid_fuel_added,
                equivalent_liters,
                actual_consumption_liters,
                end_day_fuel_liters,
                status
            FROM daily_activity_sheet 
            WHERE date >= '2025-12-01' AND date <= '2025-12-31'
            ORDER BY date, vehicle_id
        `);
        
        console.log(`📊 Găsite ${rows.length} înregistrări pentru decembrie 2025:`);
        
        rows.forEach((row, index) => {
            console.log(`\n${index + 1}. ID: ${row.id}, Data: ${row.date}, Vehicle: ${row.vehicle_id}`);
            console.log(`   Rest început: ${row.start_day_fuel_liters}L`);
            console.log(`   Alimentat lichid: ${row.liquid_fuel_added}L`);
            console.log(`   Alimentat echivalent: ${row.equivalent_liters}L`);
            console.log(`   Consum efectiv: ${row.actual_consumption_liters}L`);
            console.log(`   Rest final (în DB): ${row.end_day_fuel_liters}L`);
            console.log(`   Status: ${row.status}`);
            
            // Calculează restul final manual
            const calculatedEnd = row.start_day_fuel_liters + row.liquid_fuel_added + row.equivalent_liters - row.actual_consumption_liters;
            console.log(`   Rest final (calculat): ${calculatedEnd.toFixed(2)}L`);
            console.log(`   Calculul este corect: ${Math.abs(row.end_day_fuel_liters - calculatedEnd) < 0.01 ? 'DA' : 'NU'}`);
        });
        
        // Verifică dacă există vehicule și șoferi
        const [vehicles] = await connection.execute('SELECT id, registration_number FROM vehicles LIMIT 5');
        const [drivers] = await connection.execute('SELECT id, first_name, last_name FROM drivers LIMIT 5');
        
        console.log('\n🚗 Vehicule disponibile:');
        vehicles.forEach(v => console.log(`   ${v.id}: ${v.registration_number}`));
        
        console.log('\n👤 Șoferi disponibili:');
        drivers.forEach(d => console.log(`   ${d.id}: ${d.first_name} ${d.last_name}`));
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Eroare la verificarea bazei de date:', error.message);
    }
}

checkDatabaseValues();
