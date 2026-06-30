import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { PortalController, patientMedicalUpload } from '../controllers/PortalController';

const router = Router();

router.use(authenticate);

// Link (MVP demo)
router.post('/self-link', PortalController.selfLink);
router.post('/caregiver-link', PortalController.caregiverLink);

// Patient selector + dossier
router.get('/patients', PortalController.myPatients);
router.get('/patients/:patientId/dossier', PortalController.dossier);

// Scheduling (self-service)
router.get('/resources', PortalController.listResources);
router.get('/patients/:patientId/appointments', PortalController.listPatientAppointments);
router.post('/patients/:patientId/appointments', PortalController.createPatientAppointment);

// Documents (list for portal; upload for staff)
router.get('/patients/:patientId/documents', PortalController.listPatientDocuments);
router.post('/patients/:patientId/documents', patientMedicalUpload.single('file'), PortalController.uploadPatientDocument);

// Messaging
router.get('/patients/:patientId/messages', PortalController.listPatientThreads);
router.post('/patients/:patientId/messages', PortalController.createThreadAndMessage);
router.get('/threads/:threadId', PortalController.getThread);
router.post('/threads/:threadId/messages', PortalController.postToThread);
router.get('/staff/inbox', PortalController.staffInbox);

export default router;


