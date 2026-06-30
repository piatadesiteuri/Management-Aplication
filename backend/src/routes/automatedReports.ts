import express from 'express';
import { AutomatedReportsController } from '../controllers/AutomatedReportsController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Toate rutele necesită autentificare
router.use(authenticate);

// Rapoarte automate
router.get('/types', AutomatedReportsController.getReportTypes);
router.get('/schedules', AutomatedReportsController.getUserSchedules);
router.post('/schedules', AutomatedReportsController.createSchedule);
router.put('/schedules/:id', AutomatedReportsController.updateSchedule);
router.delete('/schedules/:id', AutomatedReportsController.deleteSchedule);
router.post('/schedules/:id/execute', AutomatedReportsController.executeScheduledReport);

// Generare rapoarte
router.post('/generate', AutomatedReportsController.generateReport);
router.get('/reports', AutomatedReportsController.getUserReports);
router.get('/reports/:reportId', AutomatedReportsController.getReportDetails);
router.get('/reports/:reportId/export', AutomatedReportsController.exportReport);
router.delete('/reports/:reportId', AutomatedReportsController.deleteReport);

// Cron Jobs Management (doar pentru admini)
router.get('/cron/status', authorize('SUPER_ADMIN'), AutomatedReportsController.getCronJobsStatus);
router.post('/cron/test/:scheduleId', authorize('SUPER_ADMIN'), AutomatedReportsController.testCronJob);
router.post('/cron/stop', authorize('SUPER_ADMIN'), AutomatedReportsController.stopAllCronJobs);
router.post('/cron/restart', authorize('SUPER_ADMIN'), AutomatedReportsController.restartCronJobs);

export default router; 