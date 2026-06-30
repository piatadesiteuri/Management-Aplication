import api from './api';

export interface StockOperation {
  id: number;
  eventId: number;
  productId: number;
  operationType: 'RECEPTION' | 'DISTRIBUTION' | 'MOVEMENT' | 'AUDIT';
  quantity: number;
  unitCost: number;
  totalCost: number;
  fromLocation?: string;
  toLocation?: string;
  supplierId?: number;
  departmentId?: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdBy: number;
  processedBy?: number;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: number;
    name: string;
    code: string;
    unit: string;
    defaultPrice: number;
    categoryName?: string;
    currentStock: number;
  };
  supplier?: {
    id: number;
    name: string;
  };
  department?: {
    id: number;
    name: string;
  };
  createdByUser?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  processedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface StockTemplate {
  id: number;
  name: string;
  description?: string;
  eventType: 'STOCK_RECEPTION' | 'STOCK_DISTRIBUTION' | 'STOCK_MOVEMENT' | 'INVENTORY_AUDIT';
  departmentId?: number;
  departmentName?: string;
  itemsCount: number;
  isActive: boolean;
  createdBy: number;
  createdByUser?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockOperationRequest {
  productId: number;
  operationType: 'RECEPTION' | 'DISTRIBUTION' | 'MOVEMENT' | 'AUDIT';
  quantity: number;
  unitCost?: number;
  fromLocation?: string;
  toLocation?: string;
  supplierId?: number;
  departmentId?: number;
  notes?: string;
}

export interface StockOperationStats {
  general: {
    total_operations: number;
    planned_operations: number;
    completed_operations: number;
    cancelled_operations: number;
    total_value: number;
    unique_products: number;
    operation_types: number;
  };
  operationTypes: Array<{
    operation_type: string;
    count: number;
    total_quantity: number;
    total_cost: number;
    avg_unit_cost: number;
  }>;
  topProducts: Array<{
    product_id: number;
    product_name: string;
    product_code: string;
    product_unit: string;
    total_quantity: number;
    total_cost: number;
    operation_count: number;
  }>;
}

export class EventStockService {
  // Obținerea operațiunilor de stoc pentru un eveniment
  async getEventStockOperations(eventId: number): Promise<StockOperation[]> {
    try {
      console.log('📦 EventStockService.getEventStockOperations called:', { eventId });
      const response = await api.get(`/event-stock/events/${eventId}/operations`);
      console.log('✅ EventStockService.getEventStockOperations response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching event stock operations:', error);
      throw error;
    }
  }

  // Adăugarea unei operațiuni de stoc la eveniment
  async addStockOperationToEvent(eventId: number, operationData: CreateStockOperationRequest): Promise<StockOperation> {
    try {
      console.log('➕ EventStockService.addStockOperationToEvent called:', { eventId, operationData });
      const response = await api.post(`/event-stock/events/${eventId}/operations`, operationData);
      console.log('✅ EventStockService.addStockOperationToEvent response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error adding stock operation:', error);
      throw error;
    }
  }

  // Procesarea unei operațiuni de stoc (execuția efectivă)
  async processStockOperation(operationId: number, notes?: string): Promise<any> {
    try {
      console.log('⚙️ EventStockService.processStockOperation called:', { operationId, notes });
      const response = await api.put(`/event-stock/operations/${operationId}/process`, { notes });
      console.log('✅ EventStockService.processStockOperation response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error processing stock operation:', error);
      throw error;
    }
  }

  // Eliminarea unei operațiuni de stoc
  async removeStockOperation(operationId: number): Promise<void> {
    try {
      console.log('🗑️ EventStockService.removeStockOperation called:', { operationId });
      const response = await api.delete(`/event-stock/operations/${operationId}`);
      console.log('✅ EventStockService.removeStockOperation response:', response.data);
    } catch (error) {
      console.error('❌ Error removing stock operation:', error);
      throw error;
    }
  }

  // Obținerea template-urilor pentru operațiuni de stoc
  async getStockTemplates(eventType?: string): Promise<StockTemplate[]> {
    try {
      console.log('📋 EventStockService.getStockTemplates called:', { eventType });
      const params = eventType ? { eventType } : {};
      const response = await api.get('/event-stock/templates', { params });
      console.log('✅ EventStockService.getStockTemplates response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching stock templates:', error);
      throw error;
    }
  }

  // Aplicarea unui template la eveniment
  async applyTemplateToEvent(eventId: number, templateId: number): Promise<any> {
    try {
      console.log('📋 EventStockService.applyTemplateToEvent called:', { eventId, templateId });
      const response = await api.post(`/event-stock/events/${eventId}/templates/${templateId}/apply`);
      console.log('✅ EventStockService.applyTemplateToEvent response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error applying template:', error);
      throw error;
    }
  }

  // Obținerea statisticilor pentru operațiunile de stoc
  async getStockOperationStats(eventId: number): Promise<StockOperationStats> {
    try {
      console.log('📊 EventStockService.getStockOperationStats called:', { eventId });
      const response = await api.get(`/event-stock/events/${eventId}/stats`);
      console.log('✅ EventStockService.getStockOperationStats response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching stock operation stats:', error);
      throw error;
    }
  }

  // Metode utilitare pentru conversii și validări
  getOperationTypeLabel(operationType: string): string {
    const labels = {
      'RECEPTION': 'Primire Marfă',
      'DISTRIBUTION': 'Distribuire Marfă', 
      'MOVEMENT': 'Mutare Marfă',
      'AUDIT': 'Inventariere'
    };
    return labels[operationType as keyof typeof labels] || operationType;
  }

  getOperationTypeColor(operationType: string): string {
    const colors = {
      'RECEPTION': 'green',
      'DISTRIBUTION': 'blue',
      'MOVEMENT': 'orange', 
      'AUDIT': 'purple'
    };
    return colors[operationType as keyof typeof colors] || 'gray';
  }

  getStatusLabel(status: string): string {
    const labels = {
      'PLANNED': 'Planificat',
      'IN_PROGRESS': 'În Progres',
      'COMPLETED': 'Completat',
      'CANCELLED': 'Anulat'
    };
    return labels[status as keyof typeof labels] || status;
  }

  getStatusColor(status: string): string {
    const colors = {
      'PLANNED': 'yellow',
      'IN_PROGRESS': 'blue',
      'COMPLETED': 'green',
      'CANCELLED': 'red'
    };
    return colors[status as keyof typeof colors] || 'gray';
  }

  // Validări pentru operațiuni de stoc
  validateStockOperation(operation: CreateStockOperationRequest): string[] {
    const errors: string[] = [];

    if (!operation.productId) {
      errors.push('Produsul este obligatoriu');
    }

    if (!operation.operationType) {
      errors.push('Tipul operației este obligatoriu');
    }

    if (!operation.quantity || operation.quantity <= 0) {
      errors.push('Cantitatea trebuie să fie pozitivă');
    }

    if (operation.unitCost && operation.unitCost < 0) {
      errors.push('Costul unitar nu poate fi negativ');
    }

    return errors;
  }

  // Calculează impactul unei operațiuni asupra stocului
  calculateStockImpact(operation: CreateStockOperationRequest, currentStock: number): {
    newStock: number;
    impact: 'increase' | 'decrease' | 'neutral';
    warning?: string;
  } {
    let newStock = currentStock;
    let impact: 'increase' | 'decrease' | 'neutral' = 'neutral';
    let warning: string | undefined;

    switch (operation.operationType) {
      case 'RECEPTION':
        newStock = currentStock + operation.quantity;
        impact = 'increase';
        break;
      case 'DISTRIBUTION':
      case 'MOVEMENT':
        newStock = currentStock - operation.quantity;
        impact = 'decrease';
        if (operation.quantity > currentStock) {
          warning = `Cantitate insuficientă în stoc. Disponibil: ${currentStock}`;
        }
        break;
      case 'AUDIT':
        newStock = operation.quantity;
        impact = operation.quantity > currentStock ? 'increase' : 
                 operation.quantity < currentStock ? 'decrease' : 'neutral';
        break;
    }

    return { newStock, impact, warning };
  }
} 