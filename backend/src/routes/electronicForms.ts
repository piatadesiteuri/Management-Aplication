import { Router } from 'express';
import { ElectronicFormsController, formUploadMiddleware } from '../controllers/ElectronicFormsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Toate rutele necesită autentificare
router.use(authenticate);

// Categorii
router.get('/categories', ElectronicFormsController.listCategories);

// Template-uri
router.get('/templates', ElectronicFormsController.listTemplates);
router.get('/templates/:id', ElectronicFormsController.getTemplate);
router.post('/templates', ElectronicFormsController.createTemplate);
router.put('/templates/:id', ElectronicFormsController.updateTemplate);

// Instanțe (Formulare completate)
router.get('/instances', ElectronicFormsController.listInstances);
router.get('/instances/:id', ElectronicFormsController.getInstance);
router.post('/instances', formUploadMiddleware, ElectronicFormsController.createInstance);
router.put('/instances/:id', formUploadMiddleware, ElectronicFormsController.updateInstance);
router.post('/instances/:id/submit', ElectronicFormsController.submitInstance);
router.post('/instances/:id/sign', ElectronicFormsController.signInstance);
router.post('/instances/:id/comments', ElectronicFormsController.addComment);

export default router;

