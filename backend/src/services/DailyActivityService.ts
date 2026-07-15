import pool from '../config/database';

export interface DailyActivitySheet {
    id?: number;
    date: string;
    vehicle_id: number;
    driver_id: number;
    trip_sheet_number?: string;
    operating_time_hours: number;
    kilometers_interior: number;
    kilometers_exterior: number;
    kilometers_equivalent: number;
    start_day_fuel_liters: number;
    liquid_fuel_added: number;
    numeric_fuel: number;
    bcf_fuel: number;
    equivalent_liters: number;
    actual_consumption_liters: number;
    standard_consumption_urban: number;
    standard_consumption_extraurban: number;
    end_day_fuel_liters: number;
    price_per_liter: number;
    total_value_lei: number;
    status: 'DRAFT' | 'COMPLETED';
    notes?: string;
    created_by: number;
    updated_by?: number;
    created_at?: string;
    updated_at?: string;
    first_name?: string;
    last_name?: string;
    registration_number?: string;
    brand?: string;
    model?: string;
}

export class DailyActivityService {
    // Obține fișa activității pentru o dată specifică
    static async getDailyActivity(date: string): Promise<DailyActivitySheet[]> {
        try {
            const [rows] = await pool.execute(`
                SELECT das.*, d.first_name, d.last_name, v.registration_number, v.brand, v.model
                FROM daily_activity_sheet das
                JOIN drivers d ON das.driver_id = d.id
                JOIN vehicles v ON das.vehicle_id = v.id
                WHERE das.date = ?
                ORDER BY v.registration_number
            `, [date]);
            return rows as DailyActivitySheet[];
        } catch (error) {
            console.error('Error fetching daily activity:', error);
            throw error;
        }
    }

    // Obține datele din ziua anterioară pentru carryover
    static async getPreviousDayActivity(currentDate: string, vehicleId?: number): Promise<DailyActivitySheet[]> {
        try {
            const previousDate = new Date(currentDate);
            previousDate.setDate(previousDate.getDate() - 1);
            const previousDateStr = previousDate.toISOString().split('T')[0];

            let query = `
                SELECT das.*, d.first_name, d.last_name, v.registration_number, v.brand, v.model
                FROM daily_activity_sheet das
                JOIN drivers d ON das.driver_id = d.id
                JOIN vehicles v ON das.vehicle_id = v.id
                WHERE das.date = ? AND das.status IN ('DRAFT', 'COMPLETED')
            `;
            
            let params: any[] = [previousDateStr];
            
            if (vehicleId) {
                query += ` AND das.vehicle_id = ?`;
                params.push(vehicleId);
            }
            
            query += ` ORDER BY v.registration_number`;

            const [rows] = await pool.execute(query, params);
            return rows as DailyActivitySheet[];
        } catch (error) {
            console.error('Error fetching previous day activity:', error);
            throw error;
        }
    }

    // Calculează consumul efectiv bazat pe kilometri și consumul normat
    static calculateActualConsumption(
        kilometersInterior: number,
        kilometersExterior: number,
        standardConsumptionUrban: number,
        standardConsumptionExtraurban: number
    ): number {
        const urbanConsumption = (kilometersInterior / 100) * standardConsumptionUrban;
        const extraurbanConsumption = (kilometersExterior / 100) * standardConsumptionExtraurban;
        return urbanConsumption + extraurbanConsumption;
    }

    // Calculează restul final din rezervor
    static calculateEndDayFuel(
        startDayFuel: number,
        liquidFuelAdded: number,
        actualConsumption: number,
        equivalentLiters: number = 0
    ): number {
        return startDayFuel + liquidFuelAdded + equivalentLiters - actualConsumption;
    }

    // Calculează valoarea totală în lei
    static calculateTotalValue(
        liquidFuelAdded: number,
        pricePerLiter: number
    ): number {
        return liquidFuelAdded * pricePerLiter;
    }

    // Salvează sau actualizează fișa activității
    static async saveDailyActivity(activityData: DailyActivitySheet): Promise<DailyActivitySheet> {
        try {
            // Corectează problema cu fusul orar pentru data
            let correctedDate = activityData.date;
            if (correctedDate) {
                // Dacă data este în format YYYY-MM-DD, adaugă câteva ore pentru a compensa fusul orar
                if (typeof correctedDate === 'string' && correctedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // Adaugă 6 ore pentru a compensa diferența de fus orar și a evita rollover-ul zilei
                    const dateObj = new Date(correctedDate + 'T06:00:00');
                    correctedDate = dateObj.toISOString().split('T')[0];
                    console.log('🔧 Corrected date with 6h offset:', activityData.date, '->', correctedDate);
                }
            }

            // Calculează valorile derivate
            const actualConsumption = this.calculateActualConsumption(
                activityData.kilometers_interior,
                activityData.kilometers_exterior,
                activityData.standard_consumption_urban,
                activityData.standard_consumption_extraurban
            );

            const endDayFuel = this.calculateEndDayFuel(
                activityData.start_day_fuel_liters,
                activityData.liquid_fuel_added,
                actualConsumption,
                activityData.equivalent_liters
            );

            const totalValue = this.calculateTotalValue(
                activityData.liquid_fuel_added,
                activityData.price_per_liter
            );

            if (activityData.id) {
                // Actualizează înregistrarea existentă
                await pool.execute(`
                    UPDATE daily_activity_sheet SET
                        date = ?, driver_id = ?, trip_sheet_number = ?, operating_time_hours = ?,
                        kilometers_interior = ?, kilometers_exterior = ?, kilometers_equivalent = ?,
                        start_day_fuel_liters = ?, liquid_fuel_added = ?, numeric_fuel = ?,
                        bcf_fuel = ?, equivalent_liters = ?, actual_consumption_liters = ?,
                        standard_consumption_urban = ?, standard_consumption_extraurban = ?,
                        end_day_fuel_liters = ?, price_per_liter = ?, total_value_lei = ?,
                        status = ?, notes = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [
                    activityData.date,
                    activityData.driver_id,
                    activityData.trip_sheet_number || null,
                    activityData.operating_time_hours,
                    activityData.kilometers_interior,
                    activityData.kilometers_exterior,
                    activityData.kilometers_equivalent,
                    activityData.start_day_fuel_liters,
                    activityData.liquid_fuel_added,
                    activityData.numeric_fuel,
                    activityData.bcf_fuel,
                    activityData.equivalent_liters,
                    actualConsumption,
                    activityData.standard_consumption_urban,
                    activityData.standard_consumption_extraurban,
                    endDayFuel,
                    activityData.price_per_liter,
                    totalValue,
                    activityData.status,
                    activityData.notes || null,
                    activityData.updated_by,
                    activityData.id
                ]);

                const [updated] = await pool.execute(
                    'SELECT * FROM daily_activity_sheet WHERE id = ?',
                    [activityData.id]
                );
                return (updated as DailyActivitySheet[])[0];
            } else {
                // Creează înregistrare nouă
                const [result] = await pool.execute(`
                    INSERT INTO daily_activity_sheet (
                        date, vehicle_id, driver_id, trip_sheet_number, operating_time_hours,
                        kilometers_interior, kilometers_exterior, kilometers_equivalent,
                        start_day_fuel_liters, liquid_fuel_added, numeric_fuel, bcf_fuel, equivalent_liters,
                        actual_consumption_liters, standard_consumption_urban, standard_consumption_extraurban,
                        end_day_fuel_liters, price_per_liter, total_value_lei, status, notes, created_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    correctedDate,
                    activityData.vehicle_id,
                    activityData.driver_id,
                    activityData.trip_sheet_number || null,
                    activityData.operating_time_hours,
                    activityData.kilometers_interior,
                    activityData.kilometers_exterior,
                    activityData.kilometers_equivalent,
                    activityData.start_day_fuel_liters,
                    activityData.liquid_fuel_added,
                    activityData.numeric_fuel,
                    activityData.bcf_fuel,
                    activityData.equivalent_liters,
                    actualConsumption,
                    activityData.standard_consumption_urban,
                    activityData.standard_consumption_extraurban,
                    endDayFuel,
                    activityData.price_per_liter,
                    totalValue,
                    activityData.status,
                    activityData.notes || null,
                    activityData.created_by
                ]);

                const insertId = (result as any).insertId;
                const [newRecord] = await pool.execute(
                    'SELECT * FROM daily_activity_sheet WHERE id = ?',
                    [insertId]
                );
                return (newRecord as DailyActivitySheet[])[0];
            }
        } catch (error) {
            console.error('Error saving daily activity:', error);
            throw error;
        }
    }

    // Actualizează fișa activității
    static async updateDailyActivity(id: number, activityData: Partial<DailyActivitySheet>): Promise<DailyActivitySheet> {
        try {
            // Corectează problema cu fusul orar pentru data
            let correctedDate = activityData.date;
            if (correctedDate) {
                // Dacă data este în format YYYY-MM-DD, adaugă câteva ore pentru a compensa fusul orar
                if (typeof correctedDate === 'string' && correctedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    // Adaugă 6 ore pentru a compensa diferența de fus orar și a evita rollover-ul zilei
                    const dateObj = new Date(correctedDate + 'T06:00:00');
                    correctedDate = dateObj.toISOString().split('T')[0];
                    console.log('🔧 Corrected date with 6h offset:', activityData.date, '->', correctedDate);
                }
            }

            // Calculează valorile derivate
            const actualConsumption = this.calculateActualConsumption(
                activityData.kilometers_interior || 0,
                activityData.kilometers_exterior || 0,
                activityData.standard_consumption_urban || 8.40,
                activityData.standard_consumption_extraurban || 6.30
            );

            const endDayFuel = this.calculateEndDayFuel(
                activityData.start_day_fuel_liters || 0,
                activityData.liquid_fuel_added || 0,
                actualConsumption,
                activityData.equivalent_liters || 0
            );

            const totalValue = this.calculateTotalValue(
                activityData.liquid_fuel_added || 0,
                activityData.price_per_liter || 0
            );

            await pool.execute(`
                UPDATE daily_activity_sheet SET
                    date = COALESCE(?, date),
                    driver_id = COALESCE(?, driver_id),
                    trip_sheet_number = COALESCE(?, trip_sheet_number),
                    operating_time_hours = COALESCE(?, operating_time_hours),
                    kilometers_interior = COALESCE(?, kilometers_interior),
                    kilometers_exterior = COALESCE(?, kilometers_exterior),
                    kilometers_equivalent = COALESCE(?, kilometers_equivalent),
                    start_day_fuel_liters = COALESCE(?, start_day_fuel_liters),
                    liquid_fuel_added = COALESCE(?, liquid_fuel_added),
                    numeric_fuel = COALESCE(?, numeric_fuel),
                    bcf_fuel = COALESCE(?, bcf_fuel),
                    equivalent_liters = COALESCE(?, equivalent_liters),
                    actual_consumption_liters = ?,
                    standard_consumption_urban = COALESCE(?, standard_consumption_urban),
                    standard_consumption_extraurban = COALESCE(?, standard_consumption_extraurban),
                    end_day_fuel_liters = ?,
                    price_per_liter = COALESCE(?, price_per_liter),
                    total_value_lei = ?,
                    status = COALESCE(?, status),
                    notes = COALESCE(?, notes),
                    updated_by = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [
                correctedDate || null,
                activityData.driver_id || null,
                activityData.trip_sheet_number || null,
                activityData.operating_time_hours || null,
                activityData.kilometers_interior || null,
                activityData.kilometers_exterior || null,
                activityData.kilometers_equivalent || null,
                activityData.start_day_fuel_liters || null,
                activityData.liquid_fuel_added || null,
                activityData.numeric_fuel || null,
                activityData.bcf_fuel || null,
                activityData.equivalent_liters || null,
                actualConsumption,
                activityData.standard_consumption_urban || null,
                activityData.standard_consumption_extraurban || null,
                endDayFuel,
                activityData.price_per_liter || null,
                totalValue,
                activityData.status || null,
                activityData.notes || null,
                activityData.updated_by || null,
                id
            ]);

            const [updated] = await pool.execute(
                'SELECT * FROM daily_activity_sheet WHERE id = ?',
                [id]
            );
            return (updated as DailyActivitySheet[])[0];
        } catch (error) {
            console.error('Error updating daily activity:', error);
            throw error;
        }
    }

    // Finalizează toate înregistrările din luna selectată pentru un vehicul
    static async finalizeMonthlyActivity(
        year: number,
        month: string,
        vehicleId: number,
        userId: number
    ): Promise<void> {
        try {
            const paddedMonth = month.padStart(2, '0');
            const startDate = `${year}-${paddedMonth}-01`;
            const lastDay = new Date(year, parseInt(paddedMonth, 10), 0).getDate();
            const endDate = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;

            await pool.execute(
                `UPDATE daily_activity_sheet
                 SET status = 'COMPLETED', updated_by = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE vehicle_id = ? AND date >= ? AND date <= ?`,
                [userId, vehicleId, startDate, endDate]
            );
        } catch (error) {
            console.error('Error finalizing daily activity:', error);
            throw error;
        }
    }

    // Redeschide luna pentru editare (revine la DRAFT)
    static async reopenMonthlyActivity(
        year: number,
        month: string,
        vehicleId: number,
        userId: number
    ): Promise<void> {
        try {
            const paddedMonth = month.padStart(2, '0');
            const startDate = `${year}-${paddedMonth}-01`;
            const lastDay = new Date(year, parseInt(paddedMonth, 10), 0).getDate();
            const endDate = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;

            await pool.execute(
                `UPDATE daily_activity_sheet
                 SET status = 'DRAFT', updated_by = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE vehicle_id = ? AND date >= ? AND date <= ?`,
                [userId, vehicleId, startDate, endDate]
            );
        } catch (error) {
            console.error('Error reopening daily activity:', error);
            throw error;
        }
    }

    // @deprecated — păstrat pentru compatibilitate
    static async finalizeDailyActivity(date: string, userId: number): Promise<void> {
        try {
            await pool.execute(
                'UPDATE daily_activity_sheet SET status = "COMPLETED", updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE date = ?',
                [userId, date]
            );
        } catch (error) {
            console.error('Error finalizing daily activity:', error);
            throw error;
        }
    }

    // Obține raportul lunar pentru un vehicul
    static async getMonthlyReport(vehicleId: number, year: number, month: number): Promise<DailyActivitySheet[]> {
        try {
            const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

            const [rows] = await pool.execute(`
                SELECT das.*, d.first_name, d.last_name, v.registration_number, v.brand, v.model
                FROM daily_activity_sheet das
                JOIN drivers d ON das.driver_id = d.id
                JOIN vehicles v ON das.vehicle_id = v.id
                WHERE das.vehicle_id = ? AND das.date >= ? AND das.date <= ?
                ORDER BY das.date
            `, [vehicleId, startDate, endDate]);
            
            // Formatează datele corect pentru a evita problemele cu fusul orar
            const formattedRows = (rows as any[]).map(row => ({
                ...row,
                date: row.date instanceof Date 
                    ? `${row.date.getFullYear()}-${(row.date.getMonth() + 1).toString().padStart(2, '0')}-${row.date.getDate().toString().padStart(2, '0')}`
                    : row.date
            }));
            
            console.log('🔧 Formatted dates in getMonthlyReport:', formattedRows.map(r => ({ id: r.id, originalDate: (rows as any[]).find(orig => orig.id === r.id)?.date, formattedDate: r.date })));
            
            return formattedRows as DailyActivitySheet[];
        } catch (error) {
            console.error('Error fetching monthly report:', error);
            throw error;
        }
    }

    // Șterge o înregistrare din fișa activității zilnice
    static async deleteDailyActivity(id: number): Promise<void> {
        try {
            await pool.execute(
                'DELETE FROM daily_activity_sheet WHERE id = ?',
                [id]
            );
            console.log(`🗑️ Deleted daily activity with ID: ${id}`);
        } catch (error) {
            console.error('Error deleting daily activity:', error);
            throw error;
        }
    }
}
