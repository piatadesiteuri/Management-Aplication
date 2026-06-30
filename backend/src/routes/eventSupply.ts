import { Router } from 'express';
import { EventSupplyController } from '../controllers/EventSupplyController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Event Supplies - Gestionarea materialelor pentru evenimente
router.get('/events/:eventId/supplies', EventSupplyController.getEventSupplies);
router.post('/events/:eventId/supplies', EventSupplyController.addSupplyToEvent);
router.put('/events/:eventId/supplies/:supplyId', EventSupplyController.updateEventSupply);
router.delete('/events/:eventId/supplies/:supplyId', EventSupplyController.removeSupplyFromEvent);

// Supply Templates - Template-uri pentru materiale
router.get('/supply-templates', EventSupplyController.getSupplyTemplates);
router.post('/events/:eventId/apply-template/:templateId', EventSupplyController.applyTemplateToEvent);

// Supply History - Istoricul materialelor
router.get('/supplies/:supplyId/history', EventSupplyController.getSupplyHistory);

export default router; 