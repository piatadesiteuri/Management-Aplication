import express from 'express';
import { FuelConsumptionController } from '../controllers/FuelConsumptionController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Middleware de autentificare pentru toate rutele
router.use(authenticate);

// Rute pentru șoferi
router.get('/drivers', FuelConsumptionController.getActiveDrivers);
router.get('/drivers/all', FuelConsumptionController.getAllDrivers);
router.post('/drivers', FuelConsumptionController.createDriver);
router.put('/drivers/:id', FuelConsumptionController.updateDriver);

// Rute pentru asignarea șoferilor la vehicule
router.get('/vehicle-drivers', FuelConsumptionController.getVehicleDrivers);
router.post('/vehicle-drivers/:vehicleId/:driverId', FuelConsumptionController.assignDriverToVehicle);

// Rute pentru consumul zilnic de motorină
router.get('/daily-consumption/:date', FuelConsumptionController.getDailyFuelConsumption);
router.get('/previous-day/:date', FuelConsumptionController.getPreviousDayData);
router.post('/daily-consumption', FuelConsumptionController.saveDailyFuelConsumption);
router.post('/finalize-daily', FuelConsumptionController.finalizeDailyConsumption);

// Rute pentru consumul lunar
router.get('/monthly-consumption/:year/:month/:fuelType', FuelConsumptionController.getMonthlyFuelConsumption);

export default router;
