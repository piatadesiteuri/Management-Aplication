import { Router } from 'express';
import { EventStockController } from '../controllers/EventStockController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Operațiuni de stoc pentru evenimente
router.get('/events/:eventId/operations', EventStockController.getEventStockOperations);
router.post('/events/:eventId/operations', EventStockController.addStockOperationToEvent);
router.put('/operations/:operationId/process', EventStockController.processStockOperation);
router.delete('/operations/:operationId', EventStockController.removeStockOperation);

// Template-uri pentru operațiuni de stoc
router.get('/templates', EventStockController.getStockTemplates);
router.post('/events/:eventId/templates/:templateId/apply', EventStockController.applyTemplateToEvent);

// Statistici
router.get('/events/:eventId/stats', EventStockController.getStockOperationStats);

export default router; 