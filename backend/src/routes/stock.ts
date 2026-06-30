import express from 'express';
import { authenticate } from '../middleware/auth';
import StockController from '../controllers/StockController';

const router = express.Router();

// Middleware de autentificare pentru toate rutele
router.use(authenticate);

// Rute pentru gestionarea stocului
router.get('/items', StockController.getStockItems);
router.get('/history/:productId', StockController.getStockHistory);
router.put('/update', StockController.updateStock);
router.get('/alerts', StockController.getStockAlerts);
router.get('/low-stock', StockController.getLowStockItems);
router.get('/statistics', StockController.getStockStatistics);

// Rute pentru notificări
router.get('/notifications', StockController.getNotifications);
router.put('/notifications/:notificationId', StockController.markNotificationAsRead);
router.put('/notifications/read-all', StockController.markAllNotificationsAsRead);
router.get('/notifications/unread-count', StockController.getUnreadNotificationsCount);

// Rute pentru confirmarea livrărilor
router.post('/confirm-delivery', StockController.confirmDelivery);

export default router;
