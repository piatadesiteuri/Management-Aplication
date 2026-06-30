import express from 'express';
import { DailyActivityController } from '../controllers/DailyActivityController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Middleware de autentificare pentru toate rutele
router.use(authenticate);

// Rute pentru fișa activității zilnice
// IMPORTANT: Rutele cu parametri specifici trebuie să fie înaintea celor generice!
router.delete('/:id', (req, res, next) => {
    console.log(`🗑️ DELETE route hit for ID: ${req.params.id}`);
    next();
}, DailyActivityController.deleteDailyActivity);
router.post('/daily-activity', DailyActivityController.saveDailyActivity);
router.put('/daily-activity/:id', DailyActivityController.updateDailyActivity);
router.get('/previous-day/:date', DailyActivityController.getPreviousDayActivity);
router.post('/finalize-daily', DailyActivityController.finalizeDailyActivity);
router.get('/monthly-report/:vehicleId/:year/:month', DailyActivityController.getMonthlyReport);
// IMPORTANT: GET /daily-activity/:date trebuie să fie la sfârșit pentru a nu interferea cu DELETE /daily-activity/:id
router.get('/daily-activity/:date', DailyActivityController.getDailyActivity);

export default router;
