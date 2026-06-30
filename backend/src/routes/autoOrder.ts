import { Router } from 'express';
import { AutoOrderController } from '../controllers/AutoOrderController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Auto Order Workflow Routes
router.get('/analyze-events', AutoOrderController.analyzeUpcomingEvents);
router.post('/generate-order', AutoOrderController.generateAutoOrder);
router.get('/stats', AutoOrderController.getAutoOrderStats);

export default router; 