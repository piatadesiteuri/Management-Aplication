import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { CalendarController } from '../controllers/CalendarController';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Rute pentru view/download documente - fără autentificare pentru a funcționa din browser
router.get('/documents/:documentId/view', CalendarController.viewEventDocument);
// Conversie Word -> PDF și servire PDF (vizualizare paginată ca la PDF)
router.get('/documents/:documentId/view-pdf', CalendarController.viewEventDocumentPdf);
router.get('/documents/:documentId/download', CalendarController.downloadEventDocument);

// Rute de test pentru asignări - restricționate
router.get('/test/events/:id/assignments', authenticate, authorize('SUPER_ADMIN'), CalendarController.getEventAssignments);
router.post('/test/events/:id/assignments', authenticate, authorize('SUPER_ADMIN'), CalendarController.createEventAssignment);
router.delete('/test/events/:id/assignments/:assignmentId', authenticate, authorize('SUPER_ADMIN'), CalendarController.deleteEventAssignment);

// Rute protejate (necesită autentificare)
router.use(authenticate);

// Rute pentru evenimente
router.get('/events', CalendarController.getEvents);
router.post('/events', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'INSPECTOR'), CalendarController.createEvent);
router.put('/events/:id', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'INSPECTOR'), CalendarController.updateEvent);
router.delete('/events/:id', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER'), CalendarController.deleteEvent);

// Rute pentru evenimente pe departamente
router.get('/departments/:id/events', CalendarController.getDepartmentEvents);

// Rute pentru evenimente pe utilizatori
router.get('/users/:id/events', CalendarController.getUserEvents);

// Rute pentru asignări
router.get('/events/:id/assignments', CalendarController.getEventAssignments);
router.post('/events/:id/assignments', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER'), CalendarController.createEventAssignment);
router.put('/events/:id/assignments/:assignmentId', CalendarController.updateEventAssignment);
router.delete('/events/:id/assignments/:assignmentId', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER'), CalendarController.deleteEventAssignment);

// Configurare multer pentru upload-ul documentelor evenimentelor
const eventDocumentsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents/events');
    
    // Creez directorul dacă nu există
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generez un nume unic pentru fișier
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const eventDocumentsUpload = multer({
  storage: eventDocumentsStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/gif',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint', // .ppt
      'text/plain', // .txt
      'application/rtf', // .rtf
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tip fișier neacceptat. Acceptăm doar PDF, JPG, PNG, GIF, Word (.doc/.docx), Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx), TXT sau RTF.'));
    }
  }
});

// Rute pentru documente
router.get('/events/:id/documents', CalendarController.getEventDocuments);
router.post('/events/:id/documents', eventDocumentsUpload.single('file'), authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'INSPECTOR'), CalendarController.createEventDocument);
router.delete('/documents/:documentId', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER'), CalendarController.deleteEventDocument);

// Rute pentru categorii
router.get('/categories', CalendarController.getEventCategories);

// Rute pentru template-uri
router.get('/templates', CalendarController.getEventTemplates);

// Rute pentru notificări
router.get('/notifications', CalendarController.getEventNotifications);
router.put('/notifications/:notificationId/read', CalendarController.markNotificationAsRead);

// Rute pentru verificarea disponibilității
router.get('/availability/vehicles', CalendarController.checkVehicleAvailability);
router.get('/availability/personnel', CalendarController.checkPersonnelAvailability);
router.get('/availability/conflicts', CalendarController.getTimeSlotConflicts);

// Rute pentru materialele evenimentelor
router.get('/events/:id/materials', CalendarController.getEventMaterials);
router.post('/events/:id/materials', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'INSPECTOR'), CalendarController.addEventMaterial);
router.put('/events/:id/materials/:materialId', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'INSPECTOR'), CalendarController.updateEventMaterial);
router.delete('/events/:id/materials/:materialId', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER'), CalendarController.removeEventMaterial);

// Rute pentru comenzile de transport
router.get('/transport-orders', CalendarController.getTransportOrders);
router.get('/transport-orders/history', CalendarController.getTransportOrderHistory);
router.get('/transport-orders/:id', CalendarController.getTransportOrder);
router.put('/transport-orders/:id/status', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER'), CalendarController.updateTransportOrderStatus);
router.post('/transport-orders/:id/finalize', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'INSPECTOR', 'WAREHOUSE_KEEPER'), CalendarController.finalizeTransportOrder);
router.put('/transport-orders/:id/cancel', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER'), CalendarController.cancelTransportOrder);
// Rută alternativă pentru finalizare prin event ID
router.post('/events/:id/finalize', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'INSPECTOR', 'WAREHOUSE_KEEPER'), CalendarController.finalizeTransportOrder);
router.get('/transport-orders/:id/items', CalendarController.getTransportOrderItems);
router.get('/transport-orders/:id/nir', CalendarController.getTransportOrderNIR);
router.get('/events/:id/nir', CalendarController.getTransportOrderNIR);
router.get('/events/:eventId/transport-items', CalendarController.getEventTransportItems);
router.put('/events/:eventId/transport-status', authorize('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'INSPECTOR', 'WAREHOUSE_KEEPER'), CalendarController.updateTransportEventStatus);

export default router; 