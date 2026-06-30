import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { WorkflowEngineController } from '../controllers/WorkflowEngineController';

const router = Router();

router.use(authenticate);

// definitions
router.get('/definitions', WorkflowEngineController.listDefinitions);
router.post('/definitions', authorize('SUPER_ADMIN'), WorkflowEngineController.createDefinition);
router.get('/definitions/:id', WorkflowEngineController.getDefinition);

// versions
router.get('/definitions/:id/versions', WorkflowEngineController.listVersions);
router.post('/definitions/:id/versions', authorize('SUPER_ADMIN'), WorkflowEngineController.createVersion);
router.get('/versions/:versionId', WorkflowEngineController.getVersionSchema);
router.post('/definitions/:id/versions/:versionId/activate', authorize('SUPER_ADMIN'), WorkflowEngineController.activateVersion);

// instances (execution/monitoring)
router.get('/instances', WorkflowEngineController.listInstances);
router.post('/instances', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'OPERATOR'), WorkflowEngineController.startInstance);
router.get('/instances/:id', WorkflowEngineController.getInstance);
router.post('/instances/:id/advance', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'OPERATOR'), WorkflowEngineController.advanceInstance);
router.post('/instances/:id/rollback', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'OPERATOR'), WorkflowEngineController.rollbackInstance);

// admin helpers
router.post('/admin/seed-defaults', authorize('SUPER_ADMIN'), WorkflowEngineController.seedDefaults);

export default router;


