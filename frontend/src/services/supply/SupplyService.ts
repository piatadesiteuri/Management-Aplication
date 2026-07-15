import api from '../api';
import {
    Supplier,
    Product,
    ProductCategory,
    Inventory,
    StockMovement,
    CreateSupplierRequest,
    UpdateSupplierRequest,
    CreateProductRequest,
    UpdateProductRequest,
    PurchaseOrder,
    CreatePurchaseOrderRequest,
    UpdatePurchaseOrderRequest,
    SupplierProduct,
    CreateSupplierProductRequest,
    UpdateSupplierProductRequest,
    AvailableProduct,
    SupplierWithStats
} from '../../types/supply';

export class SupplyService {
    // Suppliers
    async getSuppliers(page: number = 1, limit: number = 10): Promise<{data: Supplier[], pagination: any}> {
        const response = await api.get(`/supply/suppliers?page=${page}&limit=${limit}`);
        return response.data;
    }

    async getSupplier(id: number): Promise<Supplier> {
        const response = await api.get(`/supply/suppliers/${id}`);
        return response.data;
    }

    async createSupplier(supplier: CreateSupplierRequest): Promise<Supplier> {
        const response = await api.post('/supply/suppliers', supplier);
        return response.data;
    }

    async updateSupplier(id: number, supplier: UpdateSupplierRequest): Promise<Supplier> {
        const response = await api.put(`/supply/suppliers/${id}`, supplier);
        return response.data;
    }

    async deleteSupplier(id: number): Promise<void> {
        await api.delete(`/supply/suppliers/${id}`);
    }

    // Products
    async getProducts(page: number = 1, limit: number = 10): Promise<{data: Product[], pagination: any}> {
        const response = await api.get(`/supply/products?page=${page}&limit=${limit}`);
        return response.data;
    }

    async getProduct(id: number): Promise<Product> {
        const response = await api.get(`/supply/products/${id}`);
        return response.data;
    }

    async createProduct(product: CreateProductRequest): Promise<Product> {
        const response = await api.post('/supply/products', product);
        return response.data;
    }

    async updateProduct(id: number, product: UpdateProductRequest): Promise<Product> {
        const response = await api.put(`/supply/products/${id}`, product);
        return response.data;
    }

    async deleteProduct(id: number): Promise<void> {
        await api.delete(`/supply/products/${id}`);
    }

    // Categories
    async getCategories(): Promise<ProductCategory[]> {
        const response = await api.get('/supply/product-categories');
        return response.data;
    }

    async getCategory(id: number): Promise<ProductCategory> {
        const response = await api.get(`/api/product-categories/${id}`);
        return response.data;
    }

    // Inventory
    async getInventory(page: number = 1, limit: number = 10): Promise<{data: Inventory[], pagination: any}> {
        const response = await api.get(`/supply/inventory?page=${page}&limit=${limit}`);
        return response.data;
    }

    async getProductInventory(productId: number): Promise<Inventory> {
        const response = await api.get(`/api/inventory/product/${productId}`);
        return response.data;
    }

    async adjustInventory(productId: number, quantity: number, notes?: string): Promise<void> {
        await api.post('/api/inventory/adjust', { productId, quantity, notes });
    }

    async getStockMovements(inventoryId: number): Promise<StockMovement[]> {
        const response = await api.get(`/supply/inventory/${inventoryId}/movements`);
        return response.data;
    }

    async createStockMovement(movement: any): Promise<StockMovement> {
        const { inventoryId, ...movementData } = movement;
        const response = await api.post(`/supply/inventory/${inventoryId}/movements`, movementData);
        return response.data;
    }

    // Stock Audit
    async getStockAuditLog(params: {
        page?: number;
        limit?: number;
        productId?: number;
        type?: string;
        dateFrom?: string;
        dateTo?: string;
    } = {}): Promise<{data: any[], pagination: any}> {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.productId) queryParams.append('productId', params.productId.toString());
        if (params.type) queryParams.append('type', params.type);
        if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
        if (params.dateTo) queryParams.append('dateTo', params.dateTo);

        const response = await api.get(`/supply/stock-audit?${queryParams.toString()}`);
        return response.data;
    }

    // Purchase Orders
    async getPurchaseOrders(): Promise<PurchaseOrder[]> {
        const response = await api.get('/api/purchase-orders');
        return response.data;
    }

    async getPurchaseOrder(id: number): Promise<PurchaseOrder> {
        const response = await api.get(`/api/purchase-orders/${id}`);
        return response.data;
    }

    async createPurchaseOrder(order: CreatePurchaseOrderRequest): Promise<PurchaseOrder> {
        const response = await api.post('/api/purchase-orders', order);
        return response.data;
    }

    async updatePurchaseOrder(id: number, order: UpdatePurchaseOrderRequest): Promise<PurchaseOrder> {
        const response = await api.put(`/api/purchase-orders/${id}`, order);
        return response.data;
    }

    async deletePurchaseOrder(id: number): Promise<void> {
        await api.delete(`/api/purchase-orders/${id}`);
    }

    async approvePurchaseOrder(id: number): Promise<PurchaseOrder> {
        const response = await api.post(`/api/purchase-orders/${id}/approve`);
        return response.data;
    }

    async receivePurchaseOrder(id: number, items: { productId: number; receivedQuantity: number }[]): Promise<PurchaseOrder> {
        const response = await api.post(`/api/purchase-orders/${id}/receive`, { items });
        return response.data;
    }

    // Reports
    async getLowStockReport(): Promise<Product[]> {
        const response = await api.get('/api/reports/low-stock');
        return response.data;
    }

    async getInventoryValueReport(): Promise<{ product: Product; value: number }[]> {
        const response = await api.get('/api/reports/inventory-value');
        return response.data;
    }

    async getMovementsReport(startDate: string, endDate: string): Promise<StockMovement[]> {
        const response = await api.get(`/api/reports/movements?startDate=${startDate}&endDate=${endDate}`);
        return response.data;
    }

    // Supplier Products - Gestionarea relațiilor furnizor-produs
    async getSupplierProducts(supplierId: number): Promise<SupplierProduct[]> {
        const response = await api.get(`/supply/suppliers/${supplierId}/products`);
        return response.data.data;
    }

    async addProductToSupplier(supplierId: number, productData: CreateSupplierProductRequest): Promise<SupplierProduct> {
        console.log('➕ SupplyService.addProductToSupplier called:', { supplierId, productData });
        const response = await api.post(`/supply/suppliers/${supplierId}/products`, productData);
        console.log('✅ SupplyService.addProductToSupplier response:', response.data);
        return response.data.data;
    }

    async updateSupplierProduct(supplierId: number, relationId: number, productData: UpdateSupplierProductRequest): Promise<SupplierProduct> {
        console.log('✏️ SupplyService.updateSupplierProduct called:', { supplierId, relationId, productData });
        const response = await api.put(`/supply/suppliers/${supplierId}/products/${relationId}`, productData);
        console.log('✅ SupplyService.updateSupplierProduct response:', response.data);
        return response.data.data;
    }

    async removeProductFromSupplier(supplierId: number, relationId: number): Promise<void> {
        console.log('🗑️ SupplyService.removeProductFromSupplier called:', { supplierId, relationId });
        const response = await api.delete(`/supply/suppliers/${supplierId}/products/${relationId}`);
        console.log('✅ SupplyService.removeProductFromSupplier response:', response.data);
    }

    async getAvailableProductsForSupplier(supplierId: number): Promise<AvailableProduct[]> {
        console.log('🔍 SupplyService.getAvailableProductsForSupplier called:', { supplierId });
        const response = await api.get(`/supply/suppliers/${supplierId}/available-products`);
        console.log('✅ SupplyService.getAvailableProductsForSupplier response:', response.data);
        return response.data.data;
    }

    async getSupplierWithStats(supplierId: number): Promise<SupplierWithStats> {
        console.log('📊 SupplyService.getSupplierWithStats called:', { supplierId });
        const response = await api.get(`/supply/suppliers/${supplierId}/stats`);
        console.log('✅ SupplyService.getSupplierWithStats response:', response.data);
        return response.data.data;
    }

    // Transport Orders - Gestionarea comenzilor de transport și aprovizionare
    async getTransportOrders(page: number = 1, limit: number = 10): Promise<{data: any[], pagination: any}> {
        console.log('🔍 SupplyService.getTransportOrders called:', { page, limit });
        const response = await api.get(`/calendar/transport-orders?page=${page}&limit=${limit}`);
        console.log('✅ SupplyService.getTransportOrders response:', response.data);
        return response.data;
    }

    async getTransportOrder(orderId: number): Promise<any> {
        console.log('🔍 SupplyService.getTransportOrder called:', { orderId });
        const response = await api.get(`/calendar/transport-orders/${orderId}`);
        console.log('✅ SupplyService.getTransportOrder response:', response.data);
        return response.data;
    }

    async getTransportOrderHistory(supplierId?: number): Promise<any[]> {
        console.log('🔍 SupplyService.getTransportOrderHistory called:', { supplierId });
        const params = supplierId ? { supplierId } : {};
        const response = await api.get('/calendar/transport-orders/history', { params });
        console.log('✅ SupplyService.getTransportOrderHistory response:', response.data);
        return response.data;
    }

    async createTransportOrder(orderData: any): Promise<any> {
        console.log('➕ SupplyService.createTransportOrder called:', orderData);
        const response = await api.post('/calendar/transport-orders', orderData);
        console.log('✅ SupplyService.createTransportOrder response:', response.data);
        return response.data;
    }

    async updateTransportOrderStatus(orderId: number, status: string, notes?: string): Promise<any> {
        console.log('✏️ SupplyService.updateTransportOrderStatus called:', { orderId, status, notes });
        const response = await api.put(`/calendar/transport-orders/${orderId}/status`, { status, notes });
        console.log('✅ SupplyService.updateTransportOrderStatus response:', response.data);
        return response.data;
    }

    async finalizeTransportOrder(
        eventId: number,
        receivedItems: { orderItemId?: number; productId?: number; receivedQuantity: number; receivedUnitPrice?: number }[],
        nir?: {
            invoiceNumber?: string;
            invoiceDate?: string;
            deliveryNoteNumber?: string;
            vehicleNumber?: string;
            delegateName?: string;
            tvaRate?: number;
            commissionMembers?: string[];
            receivedByName?: string;
            notes?: string;
        }
    ): Promise<any> {
        console.log('✅ SupplyService.finalizeTransportOrder called:', { eventId, receivedItems, nir });
        const response = await api.post(`/calendar/transport-orders/${eventId}/finalize`, { receivedItems, nir });
        console.log('✅ SupplyService.finalizeTransportOrder response:', response.data);
        return response.data;
    }

    async getTransportOrderNIR(eventId: number): Promise<any> {
        console.log('🔍 SupplyService.getTransportOrderNIR called:', { eventId });
        const response = await api.get(`/calendar/transport-orders/${eventId}/nir`);
        console.log('✅ SupplyService.getTransportOrderNIR response:', response.data);
        return response.data;
    }

    async cancelTransportOrder(orderId: number, reason?: string): Promise<any> {
        console.log('❌ SupplyService.cancelTransportOrder called:', { orderId, reason });
        const response = await api.put(`/calendar/transport-orders/${orderId}/cancel`, { reason });
        console.log('✅ SupplyService.cancelTransportOrder response:', response.data);
        return response.data;
    }

    async getTransportOrderItems(orderId: number): Promise<any[]> {
        console.log('🔍 SupplyService.getTransportOrderItems called:', { orderId });
        const response = await api.get(`/calendar/transport-orders/${orderId}/items`);
        console.log('✅ SupplyService.getTransportOrderItems response:', response.data);
        return response.data;
    }
} 