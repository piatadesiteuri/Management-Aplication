import express from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Toate rutele necesită autentificare
router.use(authenticate);

// Obține statisticile pentru dashboard
router.get('/stats', DashboardController.getDashboardStats);

export default router;

