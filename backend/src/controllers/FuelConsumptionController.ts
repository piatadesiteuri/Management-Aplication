import { Request, Response } from 'express';
import { FuelConsumptionService } from '../services/FuelConsumptionService';

export const FuelConsumptionController = {
    // Obține toți șoferii activi
    getActiveDrivers: async (req: Request, res: Response) => {
        try {
            const drivers = await FuelConsumptionService.getActiveDrivers();
            res.json({
                success: true,
                data: drivers
            });
        } catch (error) {
            console.error('Error fetching active drivers:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching drivers',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // Obține toți șoferii
    getAllDrivers: async (req: Request, res: Response) => {
        try {
            const drivers = await FuelConsumptionService.getAllDrivers();
            res.json({
                success: true,
                data: drivers
            });
        } catch (error) {
            console.error('Error fetching all drivers:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching drivers',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // Creează un șofer nou
    createDriver: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const driverData = req.body;

            const newDriver = await FuelConsumptionService.createDriver(driverData);
            
            res.status(201).json({
                success: true,
                data: newDriver,
                message: 'Driver created successfully'
            });
        } catch (error) {
            console.error('Error creating driver:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating driver',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // Actualizează un șofer
    updateDriver: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const driverData = req.body;

            const updatedDriver = await FuelConsumptionService.updateDriver(parseInt(id), driverData);
            
            res.json({
                success: true,
                data: updatedDriver,
                message: 'Driver updated successfully'
            });
        } catch (error) {
            console.error('Error updating driver:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating driver',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // Obține asignările șoferilor la vehicule
    getVehicleDrivers: async (req: Request, res: Response) => {
        try {
            const vehicleDrivers = await FuelConsumptionService.getVehicleDrivers();
            res.json({
                success: true,
                data: vehicleDrivers
            });
        } catch (error) {
            console.error('Error fetching vehicle drivers:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching vehicle drivers',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // Asignează un șofer la un vehicul
    assignDriverToVehicle: async (req: Request, res: Response) => {
        try {
            const { vehicleId, driverId } = req.params;
            const { assignedDate } = req.body;

            const assignment = await FuelConsumptionService.assignDriverToVehicle(
                parseInt(vehicleId),
                parseInt(driverId),
                assignedDate
            );
            
            res.json({
                success: true,
                data: assignment,
                message: 'Driver assigned to vehicle successfully'
            });
        } catch (error) {
            console.error('Error assigning driver to vehicle:', error);
            res.status(500).json({
                success: false,
                message: 'Error assigning driver to vehicle',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // Obține consumul zilnic pentru o dată specifică
    getDailyFuelConsumption: async (req: Request, res: Response) => {
        try {
            const { date } = req.params;
            const fuelConsumption = await FuelConsumptionService.getDailyFuelConsumption(date);
            
            res.json({
                success: true,
                data: fuelConsumption
            });
        } catch (error) {
            console.error('Error fetching daily fuel consumption:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching daily fuel consumption',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // Obține datele din ziua anterioară pentru carryover
    getPreviousDayData: async (req: Request, res: Response) => {
        try {
            const { date } = req.params;
            const previousDayData = await FuelConsumptionService.getPreviousDayData(date);
            
            res.json({
                success: true,
                data: previousDayData
            });
        } catch (error) {
            console.error('Error fetching previous day data:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching previous day data',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // Salvează consumul zilnic
    saveDailyFuelConsumption: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const fuelData = {
                ...req.body,
                created_by: userId,
                updated_by: userId
            };

            const savedData = await FuelConsumptionService.saveDailyFuelConsumption(fuelData);
            
            res.json({
                success: true,
                data: savedData,
                message: 'Daily fuel consumption saved successfully'
            });
        } catch (error) {
            console.error('Error saving daily fuel consumption:', error);
            res.status(500).json({
                success: false,
                message: 'Error saving daily fuel consumption',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // Finalizează consumul zilnic
    finalizeDailyConsumption: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { date } = req.body;

            await FuelConsumptionService.finalizeDailyConsumption(date, userId);
            
            res.json({
                success: true,
                message: 'Daily consumption finalized successfully'
            });
        } catch (error) {
            console.error('Error finalizing daily consumption:', error);
            res.status(500).json({
                success: false,
                message: 'Error finalizing daily consumption',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // Obține consumul lunar pentru export
    getMonthlyFuelConsumption: async (req: Request, res: Response) => {
        try {
            const { year, month, fuelType } = req.params;
            console.log(`📊 Backend Controller: Getting monthly consumption for ${fuelType} - ${month}/${year}`);
            
            const monthlyData = await FuelConsumptionService.getMonthlyFuelConsumption(year, month, fuelType);
            
            console.log(`📊 Backend Controller: Returning ${monthlyData.length} vehicles`);
            
            res.json({
                success: true,
                data: monthlyData
            });
        } catch (error) {
            console.error('Error fetching monthly fuel consumption:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching monthly fuel consumption',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
