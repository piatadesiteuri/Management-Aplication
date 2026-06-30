import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

// Listare notificări pentru userul curent
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const [rows] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Eroare la listarea notificărilor', error });
  }
});

// Marcare toate ca citite
router.post('/read', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await pool.execute(
      'UPDATE notifications SET status = "read" WHERE user_id = ?',
      [userId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Eroare la marcare ca citite', error });
  }
});

// Marcare notificare individuală ca citită
router.put('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const notificationId = req.params.id;
    await pool.execute(
      'UPDATE notifications SET status = "read" WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Eroare la marcare ca citită', error });
  }
});

// Ștergere notificare
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const notificationId = req.params.id;
    await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Eroare la ștergerea notificării', error });
  }
});

export default router; 