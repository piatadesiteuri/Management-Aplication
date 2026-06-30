import { Router } from 'express';
import { MaterialRequestController } from '../controllers/MaterialRequestController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Toate rutele necesită autentificare
router.use(authenticate);

// Creează cerere de materiale (magazioner)
router.post('/', 
  authorize('WAREHOUSE_KEEPER', 'SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'ADMIN'), 
  MaterialRequestController.createRequest
);

// Obține cererile (toți utilizatorii văd cererile lor, inspectorii văd toate)
router.get('/', MaterialRequestController.getRequests);

// Obține o cerere specifică după ID
router.get('/:id', MaterialRequestController.getRequestById);

// Aprobă cerere (adminii, inspectorii și magazionerii)
router.put('/:id/approve', 
  authorize('INSPECTOR', 'SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'ADMIN', 'WAREHOUSE_KEEPER'), 
  MaterialRequestController.approveRequest
);

// Respinge cerere (adminii, inspectorii și magazionerii)
router.put('/:id/reject', 
  authorize('INSPECTOR', 'SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'ADMIN', 'WAREHOUSE_KEEPER'), 
  MaterialRequestController.rejectRequest
);

export default router;
