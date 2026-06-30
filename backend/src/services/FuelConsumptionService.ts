import pool from '../config/database';

export interface Driver {
    id: number;
    first_name: string;
    last_name: string;
    cnp?: string;
    license_number?: string;
    phone?: string;
    email?: string;
    department_id?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface VehicleDriver {
    id: number;
    vehicle_id: number;
    driver_id: number;
    assigned_date: string;
    unassigned_date?: string;
    is_active: boolean;
    driver?: Driver;
    vehicle?: any;
}

export interface DailyFuelConsumption {
    id?: number;
    date: string;
    vehicle_id: number;
    driver_id: number;
    previous_day_remaining_liters: number;
    previous_day_remaining_lei: number;
    fuel_supplied_liters: number;
    fuel_supplied_lei: number;
    total_fuel_liters: number;
    total_fuel_lei: number;
    consumed_liters: number;
    consumed_lei: number;
    end_day_remaining_liters: number;
    end_day_remaining_lei: number;
    average_price_per_liter: number;
    status: 'DRAFT' | 'COMPLETED';
    notes?: string;
    created_by: number;
    updated_by?: number;
    created_at?: string;
    updated_at?: string;
}

export class FuelConsumptionService {
    // Obține toți șoferii activi
    static async getActiveDrivers(): Promise<Driver[]> {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM drivers WHERE is_active = TRUE ORDER BY last_name, first_name'
            );
            return rows as Driver[];
        } catch (error) {
            console.error('Error fetching active drivers:', error);
            throw error;
        }
    }

    // Obține toți șoferii
    static async getAllDrivers(): Promise<Driver[]> {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM drivers ORDER BY last_name, first_name'
            );
            return rows as Driver[];
        } catch (error) {
            console.error('Error fetching all drivers:', error);
            throw error;
        }
    }

    // Creează un șofer nou
    static async createDriver(driverData: Partial<Driver>): Promise<Driver> {
        try {
            const [result] = await pool.execute(
                `INSERT INTO drivers (first_name, last_name, cnp, license_number, phone, email, department_id, is_active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    driverData.first_name,
                    driverData.last_name,
                    driverData.cnp || null,
                    driverData.license_number || null,
                    driverData.phone || null,
                    driverData.email || null,
                    driverData.department_id || null,
                    driverData.is_active !== undefined ? driverData.is_active : true
                ]
            );

            const insertId = (result as any).insertId;
            const [newDriver] = await pool.execute(
                'SELECT * FROM drivers WHERE id = ?',
                [insertId]
            );

            return (newDriver as Driver[])[0];
        } catch (error) {
            console.error('Error creating driver:', error);
            throw error;
        }
    }

    // Actualizează un șofer
    static async updateDriver(id: number, driverData: Partial<Driver>): Promise<Driver> {
        try {
            const updateFields: string[] = [];
            const updateValues: any[] = [];

            Object.entries(driverData).forEach(([key, value]) => {
                if (value !== undefined && key !== 'id') {
                    updateFields.push(`${key} = ?`);
                    updateValues.push(value);
                }
            });

            if (updateFields.length === 0) {
                throw new Error('No fields to update');
            }

            updateValues.push(id);
            await pool.execute(
                `UPDATE drivers SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );

            const [updatedDriver] = await pool.execute(
                'SELECT * FROM drivers WHERE id = ?',
                [id]
            );

            return (updatedDriver as Driver[])[0];
        } catch (error) {
            console.error('Error updating driver:', error);
            throw error;
        }
    }

    // Obține asignările șoferilor la vehicule
    static async getVehicleDrivers(): Promise<VehicleDriver[]> {
        try {
            const [rows] = await pool.execute(`
                SELECT vd.*, d.first_name, d.last_name, d.phone, d.email,
                       v.registration_number, v.brand, v.model, v.year
                FROM vehicle_drivers vd
                JOIN drivers d ON vd.driver_id = d.id
                JOIN vehicles v ON vd.vehicle_id = v.id
                WHERE vd.is_active = TRUE
                ORDER BY v.registration_number, d.last_name
            `);
            return rows as VehicleDriver[];
        } catch (error) {
            console.error('Error fetching vehicle drivers:', error);
            throw error;
        }
    }

    // Asignează un șofer la un vehicul
    static async assignDriverToVehicle(vehicleId: number, driverId: number, assignedDate: string): Promise<VehicleDriver> {
        try {
            // Dezactivează asignarea existentă dacă există
            await pool.execute(
                'UPDATE vehicle_drivers SET is_active = FALSE, unassigned_date = ? WHERE vehicle_id = ? AND is_active = TRUE',
                [assignedDate, vehicleId]
            );

            // Creează noua asignare
            const [result] = await pool.execute(
                'INSERT INTO vehicle_drivers (vehicle_id, driver_id, assigned_date, is_active) VALUES (?, ?, ?, TRUE)',
                [vehicleId, driverId, assignedDate]
            );

            const insertId = (result as any).insertId;
            const [newAssignment] = await pool.execute(
                `SELECT vd.*, d.first_name, d.last_name, v.registration_number, v.brand, v.model
                 FROM vehicle_drivers vd
                 JOIN drivers d ON vd.driver_id = d.id
                 JOIN vehicles v ON vd.vehicle_id = v.id
                 WHERE vd.id = ?`,
                [insertId]
            );

            return (newAssignment as VehicleDriver[])[0];
        } catch (error) {
            console.error('Error assigning driver to vehicle:', error);
            throw error;
        }
    }

    // Obține consumul zilnic pentru o dată specifică
    static async getDailyFuelConsumption(date: string): Promise<DailyFuelConsumption[]> {
        try {
            const [rows] = await pool.execute(`
                SELECT dfc.*, d.first_name, d.last_name, v.registration_number, v.brand, v.model
                FROM daily_fuel_consumption dfc
                JOIN drivers d ON dfc.driver_id = d.id
                JOIN vehicles v ON dfc.vehicle_id = v.id
                WHERE dfc.date = ?
                ORDER BY v.registration_number
            `, [date]);
            return rows as DailyFuelConsumption[];
        } catch (error) {
            console.error('Error fetching daily fuel consumption:', error);
            throw error;
        }
    }

    // Obține datele din ziua anterioară pentru carryover
    static async getPreviousDayData(currentDate: string): Promise<DailyFuelConsumption[]> {
        try {
            const previousDate = new Date(currentDate);
            previousDate.setDate(previousDate.getDate() - 1);
            const previousDateStr = previousDate.toISOString().split('T')[0];

            const [rows] = await pool.execute(`
                SELECT dfc.*, d.first_name, d.last_name, v.registration_number, v.brand, v.model
                FROM daily_fuel_consumption dfc
                JOIN drivers d ON dfc.driver_id = d.id
                JOIN vehicles v ON dfc.vehicle_id = v.id
                WHERE dfc.date = ? AND dfc.status = 'COMPLETED'
                ORDER BY v.registration_number
            `, [previousDateStr]);
            return rows as DailyFuelConsumption[];
        } catch (error) {
            console.error('Error fetching previous day data:', error);
            throw error;
        }
    }

    // Salvează sau actualizează consumul zilnic
    static async saveDailyFuelConsumption(fuelData: DailyFuelConsumption): Promise<DailyFuelConsumption> {
        try {
            // Calculează valorile derivate
            const totalFuelLiters = fuelData.previous_day_remaining_liters + fuelData.fuel_supplied_liters;
            const totalFuelLei = fuelData.previous_day_remaining_lei + fuelData.fuel_supplied_lei;
            const endDayRemainingLiters = totalFuelLiters - fuelData.consumed_liters;
            const endDayRemainingLei = totalFuelLei - fuelData.consumed_lei;
            const averagePricePerLiter = totalFuelLei / totalFuelLiters || 0;

            if (fuelData.id) {
                // Actualizează înregistrarea existentă
                await pool.execute(`
                    UPDATE daily_fuel_consumption SET
                        driver_id = ?, previous_day_remaining_liters = ?, previous_day_remaining_lei = ?,
                        fuel_supplied_liters = ?, fuel_supplied_lei = ?,
                        total_fuel_liters = ?, total_fuel_lei = ?,
                        consumed_liters = ?, consumed_lei = ?,
                        end_day_remaining_liters = ?, end_day_remaining_lei = ?,
                        average_price_per_liter = ?, status = ?, notes = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [
                    fuelData.driver_id,
                    fuelData.previous_day_remaining_liters,
                    fuelData.previous_day_remaining_lei,
                    fuelData.fuel_supplied_liters,
                    fuelData.fuel_supplied_lei,
                    totalFuelLiters,
                    totalFuelLei,
                    fuelData.consumed_liters,
                    fuelData.consumed_lei,
                    endDayRemainingLiters,
                    endDayRemainingLei,
                    averagePricePerLiter,
                    fuelData.status,
                    fuelData.notes || null,
                    fuelData.updated_by,
                    fuelData.id
                ]);

                const [updated] = await pool.execute(
                    'SELECT * FROM daily_fuel_consumption WHERE id = ?',
                    [fuelData.id]
                );
                return (updated as DailyFuelConsumption[])[0];
            } else {
                // Creează înregistrare nouă
                const [result] = await pool.execute(`
                    INSERT INTO daily_fuel_consumption (
                        date, vehicle_id, driver_id, previous_day_remaining_liters, previous_day_remaining_lei,
                        fuel_supplied_liters, fuel_supplied_lei, total_fuel_liters, total_fuel_lei,
                        consumed_liters, consumed_lei, end_day_remaining_liters, end_day_remaining_lei,
                        average_price_per_liter, status, notes, created_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    fuelData.date,
                    fuelData.vehicle_id,
                    fuelData.driver_id,
                    fuelData.previous_day_remaining_liters,
                    fuelData.previous_day_remaining_lei,
                    fuelData.fuel_supplied_liters,
                    fuelData.fuel_supplied_lei,
                    totalFuelLiters,
                    totalFuelLei,
                    fuelData.consumed_liters,
                    fuelData.consumed_lei,
                    endDayRemainingLiters,
                    endDayRemainingLei,
                    averagePricePerLiter,
                    fuelData.status,
                    fuelData.notes || null,
                    fuelData.created_by
                ]);

                const insertId = (result as any).insertId;
                const [newRecord] = await pool.execute(
                    'SELECT * FROM daily_fuel_consumption WHERE id = ?',
                    [insertId]
                );
                return (newRecord as DailyFuelConsumption[])[0];
            }
        } catch (error) {
            console.error('Error saving daily fuel consumption:', error);
            throw error;
        }
    }

    // Finalizează consumul zilnic (marchează ca COMPLETED)
    static async finalizeDailyConsumption(date: string, userId: number): Promise<void> {
        try {
            await pool.execute(
                'UPDATE daily_fuel_consumption SET status = "COMPLETED", updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE date = ?',
                [userId, date]
            );
        } catch (error) {
            console.error('Error finalizing daily consumption:', error);
            throw error;
        }
    }

    // Obține consumul lunar pentru export
    static async getMonthlyFuelConsumption(year: string, month: string, fuelType: string): Promise<any[]> {
        try {
            console.log(`📊 Backend Service: Getting monthly data for ${fuelType} - ${month}/${year}`);
            
            // Calculează prima și ultima zi a lunii
            const firstDay = `${year}-${month.padStart(2, '0')}-01`;
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
            const lastDayFormatted = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
            
            // Mapează tipul de combustibil din frontend la tipul din baza de date
            const fuelTypeMapping: { [key: string]: string } = {
                'motorina': 'DIESEL',
                'benzina': 'PETROL'
            };
            
            const dbFuelType = fuelTypeMapping[fuelType] || 'DIESEL';
            
            console.log(`📊 Backend: Filtering by fuel type: ${fuelType} -> ${dbFuelType}`);
            
            // Preia toate datele zilnice pentru luna selectată, filtrate după tipul de combustibil
            // CORECTAT: Căutăm în daily_activity_sheet în loc de daily_fuel_consumption
            const [rows] = await pool.execute(`
                SELECT 
                    das.id,
                    das.date,
                    das.vehicle_id,
                    das.driver_id,
                    das.start_day_fuel_liters as previous_day_remaining_liters,
                    das.start_day_fuel_liters * ? as previous_day_remaining_lei,
                    das.liquid_fuel_added as fuel_supplied_liters,
                    das.liquid_fuel_added * ? as fuel_supplied_lei,
                    das.start_day_fuel_liters + das.liquid_fuel_added + das.equivalent_liters as total_fuel_liters,
                    (das.start_day_fuel_liters + das.liquid_fuel_added + das.equivalent_liters) * ? as total_fuel_lei,
                    das.actual_consumption_liters as consumed_liters,
                    das.actual_consumption_liters * ? as consumed_lei,
                    das.end_day_fuel_liters as end_day_remaining_liters,
                    das.end_day_fuel_liters * ? as end_day_remaining_lei,
                    das.price_per_liter as average_price_per_liter,
                    das.status,
                    das.notes,
                    das.created_by,
                    das.updated_by,
                    das.created_at,
                    das.updated_at,
                    d.first_name, 
                    d.last_name, 
                    v.registration_number, 
                    v.brand, 
                    v.model, 
                    v.fuel_type
                FROM daily_activity_sheet das
                JOIN drivers d ON das.driver_id = d.id
                JOIN vehicles v ON das.vehicle_id = v.id
                WHERE das.date >= ? AND das.date <= ? AND v.fuel_type = ?
                ORDER BY v.registration_number, das.date
            `, [dbFuelType === 'PETROL' ? 7.68 : 7.50, dbFuelType === 'PETROL' ? 7.68 : 7.50, dbFuelType === 'PETROL' ? 7.68 : 7.50, dbFuelType === 'PETROL' ? 7.68 : 7.50, dbFuelType === 'PETROL' ? 7.68 : 7.50, firstDay, lastDayFormatted, dbFuelType]);
            
            const allDailyData = rows as any[];
            
            console.log(`📊 Backend: Query returned ${allDailyData.length} records`);
            console.log(`📊 Backend: First record:`, allDailyData[0]);
            console.log(`📊 Backend: First record keys:`, Object.keys(allDailyData[0] || {}));
            console.log(`📊 Backend: All records:`, allDailyData.map(r => ({ date: r.date, vehicle: r.registration_number, fuel_type: r.fuel_type })));
            
            if (allDailyData.length === 0) {
                console.log('No data found for the selected month');
                return [];
            }
            
            // Agregă datele pe vehicule
            const vehicleMap = new Map();
            
            console.log(`📊 Backend: Starting aggregation for ${allDailyData.length} records`);
            console.log(`📊 Backend: Vehicle map before processing:`, vehicleMap.size);
            
            allDailyData.forEach((dailyData, index) => {
                console.log(`📊 Backend: Processing record ${index + 1}/${allDailyData.length}: ${dailyData.registration_number} - ${dailyData.date}`);
                const vehicleId = dailyData.vehicle_id;
                const key = `${vehicleId}_${dailyData.registration_number}`;
                
                if (index < 2) {
                    console.log(`📊 Backend: Processing record ${index}:`, {
                        vehicleId,
                        registrationNumber: dailyData.registration_number,
                        key
                    });
                }
                
                if (!vehicleMap.has(key)) {
                    vehicleMap.set(key, {
                        vehicle_id: vehicleId,
                        registration_number: dailyData.registration_number,
                        first_name: dailyData.first_name,
                        last_name: dailyData.last_name,
                        start_month_fuel_liters: 0,
                        start_month_fuel_lei: 0,
                        total_fuel_added_liters: 0,
                        total_fuel_added_lei: 0,
                        total_fuel_consumed_liters: 0,
                        total_fuel_consumed_lei: 0,
                        end_month_fuel_liters: 0,
                        end_month_fuel_lei: 0,
                        dates: []
                    });
                }
                
                const vehicle = vehicleMap.get(key);
                vehicle.dates.push(dailyData.date);
                
                // Adaugă carburantul alimentat (conversie explicită la numere)
                vehicle.total_fuel_added_liters += Number(dailyData.fuel_supplied_liters) || 0;
                vehicle.total_fuel_added_lei += Number(dailyData.fuel_supplied_lei) || 0;
                
                // Adaugă consumul (conversie explicită la numere)
                vehicle.total_fuel_consumed_liters += Number(dailyData.consumed_liters) || 0;
                vehicle.total_fuel_consumed_lei += Number(dailyData.consumed_lei) || 0;
            });
            
            // Calculează restul inițial și final pentru fiecare vehicul
            const monthlyData: any[] = [];
            
            console.log(`📊 Backend: Final vehicle map size: ${vehicleMap.size}`);
            
            for (const [key, vehicle] of vehicleMap) {
                console.log(`📊 Backend: Processing vehicle ${vehicle.registration_number} with ${vehicle.dates.length} dates`);
                // Sortează datele pentru a găsi prima și ultima zi
                const sortedDates = vehicle.dates.sort();
                const firstDate = sortedDates[0];
                const lastDate = sortedDates[sortedDates.length - 1];
                
                try {
                    // Găsește restul inițial (din prima zi)
                    const firstDayData = allDailyData.find(d => d.date === firstDate && d.vehicle_id === vehicle.vehicle_id);
                    if (firstDayData) {
                        vehicle.start_month_fuel_liters = Number(firstDayData.previous_day_remaining_liters) || 0;
                        vehicle.start_month_fuel_lei = Number(firstDayData.previous_day_remaining_lei) || 0;
                    }
                    
                    // Găsește restul final (din ultima zi)
                    const lastDayData = allDailyData.find(d => d.date === lastDate && d.vehicle_id === vehicle.vehicle_id);
                    if (lastDayData) {
                        vehicle.end_month_fuel_liters = Number(lastDayData.end_day_remaining_liters) || 0;
                        vehicle.end_month_fuel_lei = Number(lastDayData.end_day_remaining_lei) || 0;
                        console.log(`📊 Backend: Found end data for vehicle ${vehicle.registration_number}:`, {
                            lastDate,
                            endLiters: vehicle.end_month_fuel_liters,
                            endLei: vehicle.end_month_fuel_lei
                        });
                    } else {
                        console.log(`📊 Backend: No end data found for vehicle ${vehicle.registration_number}, lastDate: ${lastDate}`);
                    }
                } catch (error) {
                    console.log(`Error processing data for vehicle ${vehicle.registration_number}`);
                }
                
                monthlyData.push({
                    vehicle_id: vehicle.vehicle_id,
                    registration_number: vehicle.registration_number,
                    first_name: vehicle.first_name,
                    last_name: vehicle.last_name,
                    start_month_fuel_liters: vehicle.start_month_fuel_liters,
                    start_month_fuel_lei: vehicle.start_month_fuel_lei,
                    total_fuel_added_liters: vehicle.total_fuel_added_liters,
                    total_fuel_added_lei: vehicle.total_fuel_added_lei,
                    total_fuel_consumed_liters: vehicle.total_fuel_consumed_liters,
                    total_fuel_consumed_lei: vehicle.total_fuel_consumed_lei,
                    end_month_fuel_liters: vehicle.end_month_fuel_liters,
                    end_month_fuel_lei: vehicle.end_month_fuel_lei
                });
            }
            
            console.log(`✅ Backend: Found ${monthlyData.length} vehicles with data for ${month}/${year}`);
            console.log(`✅ Backend: Vehicle map size: ${vehicleMap.size}`);
            console.log(`✅ Backend: Sample monthly data:`, monthlyData[0]);
            return monthlyData;
            
        } catch (error) {
            console.error('Error getting monthly fuel consumption:', error);
            throw error;
        }
    }
}
