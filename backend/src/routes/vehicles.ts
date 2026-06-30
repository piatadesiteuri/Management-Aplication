import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { VehicleController } from '../controllers/VehicleController';
import { authenticate } from '../middleware/auth';
import fs from 'fs';

const router = Router();

// Temporary route for testing - restricted
router.get('/test/:vehicleId/documents/:documentId/view', authenticate, VehicleController.viewVehicleDocument);

// Configurez multer pentru upload-ul documentelor
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents/vehicles');
    
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

const upload = multer({
  storage,
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

// Apply authentication middleware to all routes
router.use(authenticate);

// Vehicle CRUD routes
router.get('/', VehicleController.getVehicles);
router.get('/:id', VehicleController.getVehicle);
router.post('/', VehicleController.createVehicle);
router.put('/:id', VehicleController.updateVehicle);
router.delete('/:id', VehicleController.deleteVehicle);

// Document routes
router.get('/:id/documents', VehicleController.getVehicleDocuments);
router.post('/:id/documents', upload.single('file'), VehicleController.createVehicleDocument);
router.get('/:vehicleId/documents/:documentId/view', VehicleController.viewVehicleDocument);
router.get('/:vehicleId/documents/:documentId/download', VehicleController.downloadVehicleDocument);
router.delete('/:vehicleId/documents/:documentId', VehicleController.deleteVehicleDocument);

// Vehicle History routes
router.get('/:id/history', VehicleController.getVehicleHistory);
router.post('/:id/maintenance', VehicleController.addMaintenanceRecord);
router.post('/:id/fuel', VehicleController.addFuelRecord);
router.post('/:id/usage', VehicleController.addUsageRecord);

export default router; 