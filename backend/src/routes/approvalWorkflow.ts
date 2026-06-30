import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { ApprovalWorkflowController } from '../controllers/ApprovalWorkflowController';

const router = Router();

// Toate rutele necesită autentificare
router.use(authenticate);

// Obține workflow-ul pentru un eveniment
router.get('/events/:eventId/workflow', ApprovalWorkflowController.getEventWorkflow);

// Inițializează workflow-ul pentru un eveniment
router.post('/events/:eventId/workflow/initialize', ApprovalWorkflowController.initializeWorkflow);

// Procesează o acțiune de aprobare
router.post('/requests/:requestId/action', ApprovalWorkflowController.processApprovalAction);

// Obține cererile de aprobare pentru utilizatorul curent
router.get('/requests/my', ApprovalWorkflowController.getUserApprovalRequests);

// Escalează o cerere de aprobare
router.post('/requests/:requestId/escalate', ApprovalWorkflowController.escalateApprovalRequest);

// Anulează o cerere de aprobare
router.post('/requests/:requestId/cancel', ApprovalWorkflowController.cancelApprovalRequest);

// Obține statistici workflow (doar pentru administratori)
router.get('/statistics', authorize('SUPER_ADMIN'), ApprovalWorkflowController.getWorkflowStatistics);

// Obține configurația workflow-urilor
router.get('/configurations', ApprovalWorkflowController.getWorkflowConfigurations);

export default router; 