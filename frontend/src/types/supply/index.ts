export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
export type PurchaseOrderStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'SENT' | 'RECEIVED' | 'CANCELLED';
export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';
export type StockStatus = 'OK' | 'LOW' | 'EMPTY' | 'EXCESS';

export interface Supplier {
    id: number;
    name: string;
    code?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    county?: string;
    country?: string;
    tax_number?: string;
    registration_number?: string;
    status: SupplierStatus;
    payment_terms?: string;
    delivery_time?: number;
    rating?: number;
    total_orders?: number;
    total_value?: number;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProductCategory {
    id: number;
    name: string;
    description?: string;
    parentId?: number;
    createdAt: string;
    updatedAt: string;
}

export interface Product {
    id: number;
    code: string;
    name: string;
    description?: string;
    unit: string;
    unit_price?: number;
    min_stock?: number;
    max_stock?: number;
    reorder_point?: number;
    category_id?: number;
    category_name?: string;
    barcode?: string;
    manufacturer?: string;
    expiry_months?: number;
    storage_conditions?: string;
    current_stock?: number;
    stock_status?: StockStatus;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Inventory {
    id: number;
    quantity: number;
    location?: string;
    locationCount?: number;
    locationDetails?: {
        id: number;
        location: string;
        quantity: number;
        unitCost: number;
        batchNumber?: string;
        expiryDate?: string;
    }[];
    unitCost?: number;
    totalValue?: number;
    lastUpdated: string;
    product: Product;
}

export interface StockMovement {
    id: number;
    inventory_id: number;
    type: StockMovementType;
    quantity: number;
    unit_cost?: number;
    total_cost?: number;
    reference_document?: string;
    reason?: string;
    performed_by?: string;
    supplier?: {
        id: number;
        name: string;
    };
    department?: {
        id: number;
        name: string;
    };
    notes?: string;
    movement_date: string;
    created_at: string;
    inventory?: {
        id: number;
        previous_stock: number;
        current_stock: number;
        product: {
            name: string;
            code: string;
            unit: string;
            min_stock: number;
            max_stock: number;
            reorder_point: number;
        };
    };
}

export interface PurchaseOrder {
    id: number;
    orderNumber: string;
    status: PurchaseOrderStatus;
    totalAmount: number;
    notes?: string;
    supplier: {
        id: number;
        name: string;
        code?: string;
        contactPerson?: string;
        email?: string;
        phone?: string;
    };
    createdBy: {
        id: number;
        firstName: string;
        lastName: string;
    };
    approvedBy?: {
        id: number;
        firstName: string;
        lastName: string;
    };
    createdAt: string;
    updatedAt: string;
    items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
    id: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
    product: {
        id: number;
        name: string;
        code?: string;
        unit: string;
        description?: string;
        category?: string;
    };
}

// Request Types
export interface CreateSupplierRequest {
    name: string;
    code?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    county?: string;
    country?: string;
    taxNumber?: string;
    registrationNumber?: string;
    status?: SupplierStatus;
    paymentTerms?: string;
    deliveryTime?: number;
    notes?: string;
}

export interface UpdateSupplierRequest extends CreateSupplierRequest {}

export interface CreateProductRequest {
    code?: string;
    name: string;
    description?: string;
    unit: string;
    unitPrice?: number;
    minStock?: number;
    maxStock?: number;
    reorderPoint?: number;
    categoryId?: number;
    barcode?: string;
    manufacturer?: string;
    expiryMonths?: number;
    storageConditions?: string;
}

export interface UpdateProductRequest extends CreateProductRequest {}

export interface CreatePurchaseOrderRequest {
    supplierId: number;
    notes?: string;
    items: {
        productId: number;
        quantity: number;
        unitPrice: number;
        notes?: string;
    }[];
}

export interface UpdatePurchaseOrderRequest extends Omit<CreatePurchaseOrderRequest, 'supplierId'> {
    status?: PurchaseOrderStatus;
    approvedById?: number;
} 

// Supplier Product Relations
export interface SupplierProduct {
  id: number;
  supplierCode?: string;
  unitPrice: number;
  minOrderQuantity: number;
  deliveryTime: number;
  isPreferred: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product: {
    id: number;
    name: string;
    code: string;
    description?: string;
    unit: string;
    defaultPrice: number;
    categoryName?: string;
    currentStock: number;
  };
  supplier: {
    id: number;
    name: string;
  };
}

export interface CreateSupplierProductRequest {
  productId: number;
  supplierCode?: string;
  unitPrice: number;
  minOrderQuantity?: number;
  deliveryTime?: number;
  isPreferred?: boolean;
}

export interface UpdateSupplierProductRequest {
  supplierCode?: string;
  unitPrice?: number;
  minOrderQuantity?: number;
  deliveryTime?: number;
  isPreferred?: boolean;
}

export interface AvailableProduct {
  id: number;
  name: string;
  code: string;
  description?: string;
  unit: string;
  unitPrice: number;
  categoryName?: string;
  currentStock: number;
}

export interface SupplierStatistics {
  productsCount: number;
  preferredProductsCount: number;
  avgUnitPrice: number;
  minUnitPrice: number;
  maxUnitPrice: number;
  avgDeliveryTime: number;
}

export interface SupplierWithStats extends Supplier {
  statistics: SupplierStatistics;
} 