import express from 'express';
import { AlertsController } from '../controllers/AlertsController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// ===== RUTE PENTRU REGULI DE ALERTE =====
const authorizeAlertsAdmin = authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER');

// Obține toate regulile de alerte
router.get('/rules', authenticate, authorizeAlertsAdmin, AlertsController.getAlertRules);

// Creează o nouă regulă de alertă
router.post('/rules', authenticate, authorizeAlertsAdmin, AlertsController.createAlertRule);

// Actualizează o regulă de alertă
router.put('/rules/:id', authenticate, authorizeAlertsAdmin, AlertsController.updateAlertRule);

// Șterge o regulă de alertă
router.delete('/rules/:id', authenticate, authorizeAlertsAdmin, AlertsController.deleteAlertRule);

// Testează o regulă specifică
router.get('/rules/:ruleId/test', authenticate, authorizeAlertsAdmin, AlertsController.testRule);

// ===== RUTE PENTRU ALERTE =====

// Obține toate alertele active
router.get('/active', authenticate, authorizeAlertsAdmin, AlertsController.getActiveAlerts);

// Obține toate alertele (active și rezolvate)
router.get('/all', authenticate, authorizeAlertsAdmin, AlertsController.getAllAlerts);

// Obține alertele pentru utilizatorul curent
router.get('/user', authenticate, AlertsController.getUserAlerts);



// Marchează o alertă ca fiind rezolvată
router.put('/:id/resolve', authenticate, AlertsController.resolveAlert);

// ===== RUTE PENTRU STATISTICI =====

// Obține statistici pentru alerte
router.get('/stats', authenticate, authorizeAlertsAdmin, AlertsController.getAlertStats);

// ===== RUTE PENTRU RULE ENGINE =====

// Pornește Rule Engine
router.post('/engine/start', authenticate, authorizeAlertsAdmin, AlertsController.startRuleEngine);

// Oprește Rule Engine
router.post('/engine/stop', authenticate, authorizeAlertsAdmin, AlertsController.stopRuleEngine);

// Declanșează manual evaluarea tuturor regulilor
router.post('/trigger-rules', authenticate, authorizeAlertsAdmin, AlertsController.triggerAllRules);

// Creează o alertă manuală pentru testare
router.post('/create-test', authenticate, authorizeAlertsAdmin, AlertsController.createTestAlert);
router.post('/test-scheduler', authenticate, authorizeAlertsAdmin, AlertsController.testScheduler);
router.get('/scheduled', authenticate, authorizeAlertsAdmin, AlertsController.getScheduledAlerts);

export default router; 