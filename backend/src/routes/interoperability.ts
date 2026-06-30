import { Router } from 'express';
import { InteroperabilityController } from '../controllers/InteroperabilityController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Toate rutele necesită autentificare
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER'));

// Integrări externe
router.get('/integrations', InteroperabilityController.listIntegrations);
router.get('/integrations/:id', InteroperabilityController.getIntegration);
router.put('/integrations/:id', InteroperabilityController.updateIntegration);
router.post('/integrations/:id/test', InteroperabilityController.testConnection);

// Rapoarte externe
router.get('/reports', InteroperabilityController.listReports);
router.post('/reports', InteroperabilityController.createReport);
router.post('/reports/:id/send', InteroperabilityController.sendReport);

// Log-uri
router.get('/logs', InteroperabilityController.listLogs);

// Configurare raportare automată
router.get('/auto-report-configs', InteroperabilityController.listAutoReportConfigs);
router.post('/auto-report-configs', InteroperabilityController.createAutoReportConfig);

export default router;

