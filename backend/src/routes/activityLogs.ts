import express from 'express';
import { ActivityLogController } from '../controllers/ActivityLogController';
import { authenticate, authorize } from '../middleware/auth';
import pool from '../config/database';

const router = express.Router();

// Obține logurile de activitate cu filtrare și pagination
router.get('/', authenticate, ActivityLogController.getActivityLogs);

// Endpoint de test (restricționat)
router.get('/test', authenticate, authorize('SUPER_ADMIN'), (req, res) => {
  res.json({ message: 'Activity logs endpoint working' });
});

// Endpoint de test cu pool direct (restricționat)
router.get('/test-pool', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const pool = require('../config/database').default;
    const [result] = await pool.execute('SELECT COUNT(*) as total FROM activity_logs');
    res.json({ total: result[0].total, message: 'Pool working' });
  } catch (error) {
    console.error('Pool test error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Endpoint de test cu autentificare
router.get('/test-auth', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const [result] = await pool.execute('SELECT COUNT(*) as total FROM activity_logs');
    res.json({ total: (result as any[])[0].total, message: 'Auth working', user: req.user });
  } catch (error) {
    console.error('Auth test error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Obține statistici pentru loguri
router.get('/stats', authenticate, authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER'), ActivityLogController.getLogStats);

// Șterge logurile vechi
router.post('/cleanup', authenticate, authorize('SUPER_ADMIN'), ActivityLogController.cleanupOldLogs);

// Raport de acces la date cu caracter personal
router.get('/personal-data-access', authenticate, authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER'), ActivityLogController.getPersonalDataAccessReport);

export default router; 