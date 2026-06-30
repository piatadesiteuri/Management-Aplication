import express from 'express';
import { TraceabilityController } from '../controllers/TraceabilityController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Middleware de autentificare pentru toate rutele
router.use(authenticate);

// Rute pentru trasabilitatea cererilor de materiale
router.get('/material-requests/:requestId', 
  authorize('INSPECTOR', 'SUPER_ADMIN', 'DEPARTMENT_ADMIN'), 
  TraceabilityController.getMaterialRequestTraceability
);

// Rute pentru trasabilitatea evenimentelor de transport
router.get('/transport-events/:eventId', 
  authorize('INSPECTOR', 'SUPER_ADMIN', 'DEPARTMENT_ADMIN'), 
  TraceabilityController.getTransportEventTraceability
);

// Rute pentru toate cererile cu trasabilitate
router.get('/material-requests', 
  authorize('INSPECTOR', 'SUPER_ADMIN', 'DEPARTMENT_ADMIN'), 
  TraceabilityController.getAllRequestsWithTraceability
);

// Rute pentru statistici de trasabilitate
router.get('/statistics', 
  authorize('INSPECTOR', 'SUPER_ADMIN', 'DEPARTMENT_ADMIN'), 
  TraceabilityController.getTraceabilityStatistics
);

// Rute pentru audit trail
router.get('/audit-trail/:entityType/:entityId', 
  authorize('INSPECTOR', 'SUPER_ADMIN', 'DEPARTMENT_ADMIN'), 
  TraceabilityController.getAuditTrail
);

export default router;
