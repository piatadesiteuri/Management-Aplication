const mysql = require('mysql2/promise');

async function fixCalculatedValues() {
    try {
        console.log('🔧 Fixing calculated values in database...');
        
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'DSPD'
        });
        
        // Ia datele din baza de date
        const [rows] = await connection.execute(`
            SELECT 
                id,
                start_day_fuel_liters,
                liquid_fuel_added,
                equivalent_liters,
                actual_consumption_liters,
                end_day_fuel_liters
            FROM daily_activity_sheet 
            WHERE date >= '2025-12-01' AND date <= '2025-12-31'
            ORDER BY date, vehicle_id
        `);
        
        console.log(`📊 Found ${rows.length} records to fix:`);
        
        for (const row of rows) {
            // Calculează valoarea corectă
            const startFuel = Number(row.start_day_fuel_liters);
            const liquidFuel = Number(row.liquid_fuel_added);
            const equivalentFuel = Number(row.equivalent_liters);
            const actualConsumption = Number(row.actual_consumption_liters);
            
            const calculatedEndFuel = startFuel + liquidFuel + equivalentFuel - actualConsumption;
            
            console.log(`\nRecord ID ${row.id}:`);
            console.log(`  Current end_day_fuel_liters: ${row.end_day_fuel_liters}L`);
            console.log(`  Calculated end_day_fuel_liters: ${calculatedEndFuel.toFixed(2)}L`);
            
            if (Math.abs(row.end_day_fuel_liters - calculatedEndFuel) > 0.01) {
                // Actualizează valoarea în baza de date
                await connection.execute(`
                    UPDATE daily_activity_sheet 
                    SET end_day_fuel_liters = ?
                    WHERE id = ?
                `, [calculatedEndFuel, row.id]);
                
                console.log(`  ✅ Updated to ${calculatedEndFuel.toFixed(2)}L`);
            } else {
                console.log(`  ✅ Already correct`);
            }
        }
        
        // Verifică rezultatul
        console.log('\n📊 Verification - checking updated values:');
        
        const [updatedRows] = await connection.execute(`
            SELECT 
                id,
                start_day_fuel_liters,
                liquid_fuel_added,
                equivalent_liters,
                actual_consumption_liters,
                end_day_fuel_liters
            FROM daily_activity_sheet 
            WHERE date >= '2025-12-01' AND date <= '2025-12-31'
            ORDER BY date, vehicle_id
        `);
        
        updatedRows.forEach(row => {
            const startFuel = Number(row.start_day_fuel_liters);
            const liquidFuel = Number(row.liquid_fuel_added);
            const equivalentFuel = Number(row.equivalent_liters);
            const actualConsumption = Number(row.actual_consumption_liters);
            const calculatedEndFuel = startFuel + liquidFuel + equivalentFuel - actualConsumption;
            
            console.log(`  ID ${row.id}: DB=${row.end_day_fuel_liters}L, Calculated=${calculatedEndFuel.toFixed(2)}L, Match=${Math.abs(row.end_day_fuel_liters - calculatedEndFuel) < 0.01 ? 'YES' : 'NO'}`);
        });
        
        await connection.end();
        console.log('\n✅ Database fix completed!');
        
    } catch (error) {
        console.error('❌ Fix error:', error.message);
    }
}

fixCalculatedValues();
