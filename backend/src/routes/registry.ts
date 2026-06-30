import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { RegistryController } from '../controllers/RegistryController';

const router = Router();

router.use(authenticate);

// registers
router.get('/registers', RegistryController.listRegisters);
router.post('/registers', authorize('SUPER_ADMIN'), RegistryController.createRegister);

// entries
router.get('/entries', RegistryController.listEntries);
router.post('/registers/:registerId/entries', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'OPERATOR'), RegistryController.createEntry);
router.put('/entries/:entryId/assign', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'OPERATOR'), RegistryController.assignEntry);

// works (Registrul Unic = LUCRĂRI)
router.get('/works', RegistryController.listWorks);
router.get('/works/:workId', RegistryController.getWork);
router.post('/works', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'OPERATOR'), RegistryController.createWork);
router.put('/works/:workId/assign', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'OPERATOR'), RegistryController.assignWork);
router.post('/works/:workId/transfer', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'OPERATOR'), RegistryController.transferWork);
router.get('/works/:workId/entries', RegistryController.listWorkEntries);
router.post('/works/:workId/entries', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'OPERATOR'), RegistryController.createWorkEntry);

// year rollover (automatizare închidere de an) - demonstrabil prin UI + audit
router.post('/admin/rollover', authorize('SUPER_ADMIN'), RegistryController.rolloverYear);

// bootstrap/demo (pentru dovadă funcțională în propunere tehnică)
router.post('/admin/bootstrap-year', authorize('SUPER_ADMIN'), RegistryController.bootstrapYear);
router.post('/admin/seed-demo', authorize('SUPER_ADMIN'), RegistryController.seedDemo);

export default router;


