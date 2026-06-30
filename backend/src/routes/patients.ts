import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PatientController, patientIdentityUpload } from '../controllers/PatientController';

const router = Router();

router.use(authenticate);

// IMPORTANT: rutele statice trebuie declarate înainte de rutele cu parametri (/:id)

// Patient Lists & Census Service
router.get('/census/episodes', PatientController.listEpisodes);
router.get('/census/summary', PatientController.censusSummary);
router.put('/episodes/:episodeId', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'OPERATOR'), PatientController.updateEpisode);
router.post('/episodes/:episodeId/transfer', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'OPERATOR'), PatientController.transferEpisode);
router.get('/episodes/:episodeId/transfers', PatientController.listEpisodeTransfers);

// Scheduling Service
router.get('/scheduling/resources', PatientController.listResources);
router.post('/scheduling/resources', authorize('SUPER_ADMIN'), PatientController.createResource);
router.get('/scheduling/appointments', PatientController.listAppointments);
router.post('/scheduling/appointments', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'OPERATOR'), PatientController.createAppointment);

// Monitoring Service
router.get('/monitoring/observations', PatientController.listObservations);
router.post('/monitoring/observations', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'OPERATOR'), PatientController.addObservation);

// Patient Identity Service
router.get('/identity/lookup', PatientController.lookupIdentity);
router.get('/', PatientController.listPatients);
router.post('/', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'OPERATOR'), PatientController.createPatient);
router.get('/:id', PatientController.getPatient);
router.post('/:id/insurance', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'OPERATOR'), PatientController.addInsuranceStatus);
router.post('/:id/episodes', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'OPERATOR'), PatientController.createEpisode);
router.get('/:id/identity-documents', PatientController.listIdentityDocuments);
router.post(
  '/:id/identity-documents',
  authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'OPERATOR'),
  patientIdentityUpload.single('file'),
  PatientController.uploadIdentityDocument
);

export default router;


