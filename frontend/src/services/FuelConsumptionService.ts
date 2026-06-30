import api from './api';

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
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
    registration_number?: string;
    brand?: string;
    model?: string;
    year?: number;
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
    first_name?: string;
    last_name?: string;
    registration_number?: string;
    brand?: string;
    model?: string;
}

export class FuelConsumptionService {
    // Obține toți șoferii activi
    static async getActiveDrivers(): Promise<Driver[]> {
        try {
            const response = await api.get('/fuel-consumption/drivers');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching active drivers:', error);
            throw error;
        }
    }

    // Obține toți șoferii
    static async getAllDrivers(): Promise<Driver[]> {
        try {
            const response = await api.get('/fuel-consumption/drivers/all');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching all drivers:', error);
            throw error;
        }
    }

    // Creează un șofer nou
    static async createDriver(driverData: Partial<Driver>): Promise<Driver> {
        try {
            const response = await api.post('/fuel-consumption/drivers', driverData);
            return response.data.data;
        } catch (error) {
            console.error('Error creating driver:', error);
            throw error;
        }
    }

    // Actualizează un șofer
    static async updateDriver(id: number, driverData: Partial<Driver>): Promise<Driver> {
        try {
            const response = await api.put(`/fuel-consumption/drivers/${id}`, driverData);
            return response.data.data;
        } catch (error) {
            console.error('Error updating driver:', error);
            throw error;
        }
    }

    // Obține asignările șoferilor la vehicule
    static async getVehicleDrivers(): Promise<VehicleDriver[]> {
        try {
            const response = await api.get('/fuel-consumption/vehicle-drivers');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching vehicle drivers:', error);
            throw error;
        }
    }

    // Asignează un șofer la un vehicul
    static async assignDriverToVehicle(vehicleId: number, driverId: number, assignedDate: string): Promise<VehicleDriver> {
        try {
            const response = await api.post(`/fuel-consumption/vehicle-drivers/${vehicleId}/${driverId}`, {
                assignedDate
            });
            return response.data.data;
        } catch (error) {
            console.error('Error assigning driver to vehicle:', error);
            throw error;
        }
    }

    // Obține consumul zilnic pentru o dată specifică
    static async getDailyFuelConsumption(date: string): Promise<DailyFuelConsumption[]> {
        try {
            const response = await api.get(`/fuel-consumption/daily-consumption/${date}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching daily fuel consumption:', error);
            throw error;
        }
    }

    // Obține datele din ziua anterioară pentru carryover
    static async getPreviousDayData(date: string): Promise<DailyFuelConsumption[]> {
        try {
            const response = await api.get(`/fuel-consumption/previous-day/${date}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching previous day data:', error);
            throw error;
        }
    }

    // Salvează consumul zilnic
    static async saveDailyFuelConsumption(fuelData: Partial<DailyFuelConsumption>): Promise<DailyFuelConsumption> {
        try {
            const response = await api.post('/fuel-consumption/daily-consumption', fuelData);
            return response.data.data;
        } catch (error) {
            console.error('Error saving daily fuel consumption:', error);
            throw error;
        }
    }

    // Finalizează consumul zilnic
    static async finalizeDailyConsumption(date: string): Promise<void> {
        try {
            await api.post('/fuel-consumption/finalize-daily', { date });
        } catch (error) {
            console.error('Error finalizing daily consumption:', error);
            throw error;
        }
    }

    // Obține consumul lunar pentru export - UN SINGUR REQUEST
    static async getMonthlyFuelConsumption(year: string, month: string, fuelType: string): Promise<any[]> {
        try {
            console.log(`📊 Fetching monthly data for ${fuelType} - ${month}/${year}`);
            
            // Face UN SINGUR REQUEST pentru endpoint-ul lunar
            // Numele request-ului va fi afișat ca: {luna}-{an}-{tip combustibil}
            const requestName = `${month}-${year}-${fuelType}`;
            console.log(`🔍 Making single request: ${requestName}`);
            
            try {
                const response = await api.get(`/fuel-consumption/monthly-consumption/${year}/${month}/${fuelType}`, {
                    // Adaugă un header personalizat pentru numele request-ului
                    headers: {
                        'X-Request-Name': requestName
                    }
                });
                
                console.log(`✅ Single request successful for ${requestName}`);
                console.log(`📊 Frontend received response.data:`, response.data);
                console.log(`📊 Frontend response.data type:`, typeof response.data);
                console.log(`📊 Frontend response.data.data:`, response.data?.data);
                return response.data?.data || [];
                
            } catch (error: any) {
                // Dacă endpoint-ul returnează 404, înseamnă că nu există încă
                if (error.response?.status === 404) {
                    console.log(`⚠️ Monthly endpoint not available for ${requestName}, returning empty data`);
                    return [];
                }
                
                // Pentru alte erori, aruncă eroarea
                console.error(`❌ Error in request ${requestName}:`, error);
                throw error;
            }
            
        } catch (error) {
            console.error('Error getting monthly fuel consumption:', error);
            throw error;
        }
    }
}
