import { Router } from 'express';
import { PharmacyController } from '../controllers/PharmacyController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Rute pentru Unități
router.get('/units', authenticate, PharmacyController.getUnits);
router.post('/units', authenticate, PharmacyController.createUnit);
router.put('/units/:id', authenticate, PharmacyController.updateUnit);
router.delete('/units/:id', authenticate, PharmacyController.deleteUnit);

// Rute pentru Gestiuni
router.get('/storages', authenticate, PharmacyController.getStorages);
router.post('/storages', authenticate, PharmacyController.createStorage);
router.put('/storages/:id', authenticate, PharmacyController.updateStorage);
router.delete('/storages/:id', authenticate, PharmacyController.deleteStorage);

// Rute pentru Articole
router.get('/articles', authenticate, PharmacyController.getArticles);
router.post('/articles', authenticate, PharmacyController.createArticle);
router.put('/articles/:id', authenticate, PharmacyController.updateArticle);
router.delete('/articles/:id', authenticate, PharmacyController.deleteArticle);

// Rute pentru Furnizori
router.get('/suppliers', authenticate, PharmacyController.getSuppliers);
router.post('/suppliers', authenticate, PharmacyController.createSupplier);
router.put('/suppliers/:id', authenticate, PharmacyController.updateSupplier);
router.delete('/suppliers/:id', authenticate, PharmacyController.deleteSupplier);

// Rute pentru date auxiliare
router.get('/article-types', authenticate, PharmacyController.getArticleTypes);
router.get('/manufacturers', authenticate, PharmacyController.getManufacturers);
router.post('/manufacturers', authenticate, PharmacyController.createManufacturer);
router.get('/units-of-measure', authenticate, PharmacyController.getUnitsOfMeasure);

// Rute pentru Note de Intrare
router.get('/entry-notes', authenticate, PharmacyController.getEntryNotes);
router.get('/entry-notes/next-number', authenticate, PharmacyController.getNextEntryNoteNumber);
router.get('/entry-notes/:id', authenticate, PharmacyController.getEntryNoteById);
router.post('/entry-notes', authenticate, PharmacyController.createEntryNote);
router.put('/entry-notes/:id', authenticate, PharmacyController.updateEntryNote);

// Rute pentru Condici
router.get('/registers', authenticate, PharmacyController.getRegisters);
router.get('/registers/next-number', authenticate, PharmacyController.getNextRegisterNumber);
router.get('/registers/:id', authenticate, PharmacyController.getRegisterById);
router.post('/registers', authenticate, PharmacyController.createRegister);
router.put('/registers/:id', authenticate, PharmacyController.updateRegister);

// Rute pentru Rețete
router.get('/prescriptions', authenticate, PharmacyController.getPrescriptions);
router.get('/prescriptions/next-number', authenticate, PharmacyController.getNextPrescriptionNumber);
router.get('/prescriptions/:id', authenticate, PharmacyController.getPrescriptionById);
router.post('/prescriptions', authenticate, PharmacyController.createPrescription);
router.put('/prescriptions/:id', authenticate, PharmacyController.updatePrescription);

// Rute pentru Stoc Curent
router.get('/current-stock', authenticate, PharmacyController.getCurrentStock);

// Rute pentru Mișcări Stoc
router.get('/stock-movements', authenticate, PharmacyController.getStockMovements);

// Rute pentru Note de Transfer
router.get('/transfer-notes', authenticate, PharmacyController.getTransferNotes);
router.get('/transfer-notes/next-number', authenticate, PharmacyController.getNextTransferNoteNumber);
router.get('/transfer-notes/:id', authenticate, PharmacyController.getTransferNoteById);
router.post('/transfer-notes', authenticate, PharmacyController.createTransferNote);

// Rute pentru Elaborări
router.get('/elaborations', authenticate, PharmacyController.getElaborations);
router.get('/elaborations/next-number', authenticate, PharmacyController.getNextElaborationNumber);
router.get('/elaborations/:id', authenticate, PharmacyController.getElaborationById);
router.post('/elaborations', authenticate, PharmacyController.createElaboration);
router.put('/elaborations/:id', authenticate, PharmacyController.updateElaboration);

// Rute pentru Inițializare Stoc
router.get('/stock-initializations', authenticate, PharmacyController.getStockInitializations);
router.get('/stock-initializations/next-number', authenticate, PharmacyController.getNextStockInitNumber);
router.get('/stock-initializations/:id', authenticate, PharmacyController.getStockInitializationById);
router.post('/stock-initializations', authenticate, PharmacyController.createStockInitialization);
router.post('/stock-initializations/:id/validate', authenticate, PharmacyController.validateStockInitialization);

// Rute pentru Export CJAS
router.get('/export-cjas', authenticate, PharmacyController.exportCJAS);

// Rute pentru Fișa Mărfii
router.get('/product-sheet', authenticate, PharmacyController.getProductSheet);

// Rute pentru date auxiliare (medici)
router.get('/doctors', authenticate, PharmacyController.getDoctors);

export default router;
