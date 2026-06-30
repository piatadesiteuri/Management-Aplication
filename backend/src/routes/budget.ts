import express from 'express';
import { authenticate, authorizePermission } from '../middleware/auth';
import { BudgetController } from '../controllers/BudgetController';

const router = express.Router();

router.use(authenticate);
router.use(authorizePermission('budget.view'));

// Indicators
router.get('/indicators', BudgetController.listIndicators);
router.post('/indicators/import', BudgetController.importIndicators);

// Annual budget
router.get('/annual', BudgetController.getAnnualBudget);
router.put('/annual/:year', BudgetController.upsertAnnualBudget);

// Execution
router.get('/execution', BudgetController.getExecution);
router.put('/execution/:date', BudgetController.upsertExecution);
router.post('/execution/:date/clone-prev', BudgetController.clonePreviousDay);

export default router;


