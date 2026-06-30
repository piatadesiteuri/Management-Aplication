import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { AnalysisRequestController } from '../controllers/AnalysisRequestController';
import { authenticate, authorize } from '../middleware/auth';
import pool from '../config/database';

const router = Router();

// Configurare multer pentru upload-ul PDF-urilor pentru rezultate
const limsResultsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/lims/results');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const limsResultsUpload = multer({
  storage: limsResultsStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Doar fișiere PDF sunt permise'));
    }
  }
});

// Rute pentru cereri de analize
router.get('/analysis-requests', authenticate, AnalysisRequestController.getAll);
router.get('/analysis-requests/:id', authenticate, AnalysisRequestController.getById);
router.post('/analysis-requests', authenticate, AnalysisRequestController.create);
router.put('/analysis-requests/:id/status', authenticate, AnalysisRequestController.updateStatus);
router.post('/analysis-requests/:id/reception', authenticate, AnalysisRequestController.reception);
router.post('/analysis-requests/:id/results', authenticate, limsResultsUpload.any(), AnalysisRequestController.enterResults);
router.post('/analysis-requests/:id/approve', authenticate, AnalysisRequestController.approve);
router.post('/analysis-requests/:id/invalidate', authenticate, AnalysisRequestController.invalidate);
router.get('/analysis-requests/:id/print', authenticate, AnalysisRequestController.print);

// Rute pentru laboratoare
router.get('/laboratories', authenticate, AnalysisRequestController.getLaboratories);
router.get('/laboratories/:laboratoryId/doctors', authenticate, AnalysisRequestController.getLaboratoryDoctors);

// Rute pentru teste
router.get('/test-categories', authenticate, AnalysisRequestController.getTestCategories);
router.get('/tests', authenticate, AnalysisRequestController.getTests);

// Rute pentru PDF-uri rezultate
router.get('/results/:testId/pdf', authenticate, async (req, res) => {
  try {
    const { testId } = req.params;
    const [tests]: any = await pool.execute(
      'SELECT result_pdf_path, result_pdf_filename FROM analysis_request_tests WHERE id = ?',
      [testId]
    );
    
    if (!tests || tests.length === 0 || !tests[0].result_pdf_path) {
      return res.status(404).json({ message: 'PDF-ul nu a fost găsit' });
    }
    
    const filePath = tests[0].result_pdf_path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fișierul nu există pe server' });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${tests[0].result_pdf_filename || 'result.pdf'}"`);
    res.sendFile(path.resolve(filePath));
  } catch (error: any) {
    console.error('Error serving PDF:', error);
    res.status(500).json({ message: 'Eroare la servirea PDF-ului' });
  }
});

export default router;
