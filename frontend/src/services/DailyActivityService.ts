import api from './api';

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
            const response = await api.get(`/daily-activity/daily-activity/${date}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching daily activity:', error);
            throw error;
        }
    }

    // Obține datele din ziua anterioară pentru carryover
    static async getPreviousDayActivity(date: string, vehicleId?: number): Promise<DailyActivitySheet[]> {
        try {
            const url = vehicleId ? `/daily-activity/previous-day/${date}?vehicleId=${vehicleId}` : `/daily-activity/previous-day/${date}`;
            const response = await api.get(url);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching previous day activity:', error);
            throw error;
        }
    }

    // Obține toate datele din luna selectată pentru un vehicul
    static async getMonthlyActivity(year: number, month: string, vehicleId: number): Promise<DailyActivitySheet[]> {
        try {
            const response = await api.get(`/daily-activity/monthly-report/${vehicleId}/${year}/${month}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching monthly activity:', error);
            throw error;
        }
    }

    // Salvează fișa activității (POST pentru nou, PUT pentru actualizare)
    static async saveDailyActivity(activityData: Partial<DailyActivitySheet>): Promise<DailyActivitySheet> {
        try {
            console.log('🔍 DailyActivityService.saveDailyActivity called with:', {
                id: activityData.id,
                hasId: !!activityData.id,
                trip_sheet_number: activityData.trip_sheet_number,
                date: activityData.date,
                vehicle_id: activityData.vehicle_id,
                driver_id: activityData.driver_id
            });

            console.log('🔍 DailyActivityService.saveDailyActivity called with:', {
                id: activityData.id,
                date: activityData.date,
                vehicle_id: activityData.vehicle_id,
                driver_id: activityData.driver_id,
                hasId: !!activityData.id
            });

            if (activityData.id) {
                // Actualizare - PUT
                console.log(`🔍 Using PUT for ID: ${activityData.id}`);
                const response = await api.put(`/daily-activity/daily-activity/${activityData.id}`, activityData);
                console.log('✅ PUT response received:', response.status);
                return response.data.data;
            } else {
                // Creare nouă - POST
                console.log('🔍 Using POST for new record');
                const response = await api.post('/daily-activity/daily-activity', activityData);
                console.log('✅ POST response received:', response.status);
                return response.data.data;
            }
        } catch (error: any) {
            console.error('❌ Error saving daily activity:', error);
            console.error('❌ Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url,
                method: error.config?.method
            });
            throw error;
        }
    }

    // Finalizează luna pentru vehiculul selectat
    static async finalizeDailyActivity(year: number, month: string, vehicleId: number): Promise<void> {
        try {
            await api.post('/daily-activity/finalize-daily', { year, month, vehicleId });
        } catch (error) {
            console.error('Error finalizing daily activity:', error);
            throw error;
        }
    }

    // Redeschide luna pentru editare
    static async reopenDailyActivity(year: number, month: string, vehicleId: number): Promise<void> {
        try {
            await api.post('/daily-activity/reopen-daily', { year, month, vehicleId });
        } catch (error) {
            console.error('Error reopening daily activity:', error);
            throw error;
        }
    }

    // Obține raportul lunar
    static async getMonthlyReport(vehicleId: number, year: number, month: number): Promise<DailyActivitySheet[]> {
        try {
            const response = await api.get(`/daily-activity/monthly-report/${vehicleId}/${year}/${month}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching monthly report:', error);
            throw error;
        }
    }

    // Șterge o înregistrare din fișa activității zilnice
    static async deleteDailyActivity(id: number): Promise<void> {
        try {
            console.log(`🗑️ Deleting daily activity with ID: ${id}`);
            await api.delete(`/daily-activity/${id}`);
        } catch (error) {
            console.error('Error deleting daily activity:', error);
            throw error;
        }
    }
}
