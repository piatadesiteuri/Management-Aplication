import { Router } from 'express';
import { SupplyController } from '../controllers/SupplyController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Suppliers
router.get('/suppliers', SupplyController.getSuppliers);
router.get('/suppliers/:id', SupplyController.getSupplier);
router.post('/suppliers', SupplyController.createSupplier);
router.put('/suppliers/:id', SupplyController.updateSupplier);
router.delete('/suppliers/:id', SupplyController.deleteSupplier);

// Products
router.get('/products', SupplyController.getProducts);
router.get('/products/:id', SupplyController.getProduct);
router.post('/products', SupplyController.createProduct);
router.put('/products/:id', SupplyController.updateProduct);
router.delete('/products/:id', SupplyController.deleteProduct);

// Categories
router.get('/product-categories', SupplyController.getCategories);
router.get('/categories', SupplyController.getProductCategories);

// Inventory
router.get('/inventory', SupplyController.getInventory);
router.get('/inventory/:inventoryId/movements', SupplyController.getStockMovements);
router.post('/inventory/:inventoryId/test', SupplyController.testStockMovement);
router.post('/inventory/:inventoryId/movements', SupplyController.createStockMovement);

// Stock Audit
router.get('/stock-audit', SupplyController.getStockAuditLog);

// Purchase Orders
router.get('/purchase-orders', SupplyController.getPurchaseOrders);

// Supplier Products - Gestionarea relațiilor furnizor-produs
router.get('/suppliers/:supplierId/products', SupplyController.getSupplierProducts);
router.post('/suppliers/:supplierId/products', SupplyController.addProductToSupplier);
router.put('/suppliers/:supplierId/products/:relationId', SupplyController.updateSupplierProduct);
router.delete('/suppliers/:supplierId/products/:relationId', SupplyController.removeProductFromSupplier);
router.get('/suppliers/:supplierId/available-products', SupplyController.getAvailableProductsForSupplier);
router.get('/suppliers/:supplierId/stats', SupplyController.getSupplierWithProductStats);

export default router; 