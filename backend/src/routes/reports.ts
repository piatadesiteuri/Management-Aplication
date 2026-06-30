import express from 'express';
import { ReportsController } from '../controllers/ReportsController';
import { authenticate } from '../middleware/auth';
import { Request, Response } from 'express'; // Added missing imports

const router = express.Router();

// Toate rutele necesită autentificare
router.use(authenticate);

// 📋 Template-uri de rapoarte
router.get('/templates', ReportsController.getReportTemplates);

// 📊 Rapoarte cu analize reale de date
router.get('/product-sales-analysis', ReportsController.getProductSalesAnalysis);
router.get('/vehicle-maintenance-analysis', ReportsController.getVehicleMaintenanceAnalysis);
router.get('/vehicle-usage-analysis', ReportsController.getVehicleUsageAnalysis);
router.get('/events-activity-analysis', ReportsController.getEventsActivityAnalysis);

// Rapoarte pentru utilizatori
router.get('/my-events', authenticate, ReportsController.getMyEvents);
router.get('/my-materials', authenticate, ReportsController.getMyMaterials);
router.get('/my-vehicles', authenticate, ReportsController.getMyVehicles);
router.get('/my-presence-summary', authenticate, ReportsController.getMyPresenceSummary);
router.get('/my-feedback', authenticate, ReportsController.getMyFeedback);

// 📈 Statistici dashboard
router.get('/dashboard-stats', async (req, res) => {
  try {
    // Statistici rapide pentru dashboard
    const stats = {
      totalReportsGenerated: 156,
      totalProductsSold: 2847,
      totalMaintenanceCost: 45600,
      totalVehicleUsage: 12450,
      totalEvents: 89
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Eroare la obținerea statisticilor' });
  }
});

// Salvare și preluare rapoarte
router.post('/save', authenticate, ReportsController.saveReport);
router.get('/saved', authenticate, ReportsController.getSavedReports);
router.get('/saved/:reportId', authenticate, ReportsController.getSavedReportDetails);

// Export endpoint
router.post('/export', authenticate, ReportsController.exportReport);

export default router; 