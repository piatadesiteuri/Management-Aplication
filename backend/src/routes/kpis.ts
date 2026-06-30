import express from 'express';
import { KPIController } from '../controllers/KPIController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Toate rutele necesită autentificare
router.use(authenticate);

// Obține toate KPI-urile DSPD
router.get('/', KPIController.getAllKPIs);

// Generează raport KPI complet
router.get('/report', KPIController.generateKPIReport);

// Obține KPI-uri pentru dashboard
router.get('/dashboard', KPIController.getDashboardKPIs);

// Obține KPI-uri pe departamente
router.get('/departments', KPIController.getDepartmentKPIs);

// Obține KPI-uri pe tipuri de evenimente
router.get('/event-types', KPIController.getEventTypeKPIs);

// Obține KPI-uri vehicule
router.get('/vehicles', KPIController.getVehicleKPIs);

export default router; 