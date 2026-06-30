import api from './api';

export interface EventSupply {
  id: number;
  eventId: number;
  productId: number;
  quantityNeeded: number;
  quantityAllocated: number;
  quantityUsed: number;
  unitCost: number;
  totalCost: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'ALLOCATED' | 'DELIVERED' | 'USED' | 'RETURNED';
  notes?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: number;
    name: string;
    code: string;
    unit: string;
    unitPrice: number;
    categoryName?: string;
    availableStock: number;
  };
  requestedBy?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  approvedBy?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  allocatedBy?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface SupplyTemplate {
  id: number;
  name: string;
  description?: string;
  eventType?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  itemsCount: number;
  createdBy?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface SupplyHistory {
  id: number;
  eventSupplyId: number;
  action: 'REQUESTED' | 'APPROVED' | 'ALLOCATED' | 'DELIVERED' | 'USED' | 'RETURNED' | 'CANCELLED';
  quantity: number;
  previousStatus?: string;
  newStatus?: string;
  notes?: string;
  performedAt: string;
  performedBy?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface CreateEventSupplyRequest {
  productId: number;
  quantityNeeded: number;
  unitCost?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  notes?: string;
  requestedBy: number;
}

export interface UpdateEventSupplyRequest {
  quantityNeeded?: number;
  quantityAllocated?: number;
  quantityUsed?: number;
  unitCost?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'PENDING' | 'APPROVED' | 'ALLOCATED' | 'DELIVERED' | 'USED' | 'RETURNED';
  notes?: string;
  approvedBy?: number;
  allocatedBy?: number;
}

export class EventSupplyService {
  // Obține toate materialele pentru un eveniment
  async getEventSupplies(eventId: number): Promise<EventSupply[]> {
    console.log('🔍 EventSupplyService.getEventSupplies called:', { eventId });
    const response = await api.get(`/event-supply/events/${eventId}/supplies`);
    console.log('✅ EventSupplyService.getEventSupplies response:', response.data);
    return response.data.data;
  }

  // Adaugă material la un eveniment
  async addSupplyToEvent(eventId: number, supplyData: CreateEventSupplyRequest): Promise<EventSupply> {
    console.log('➕ EventSupplyService.addSupplyToEvent called:', { eventId, supplyData });
    const response = await api.post(`/event-supply/events/${eventId}/supplies`, supplyData);
    console.log('✅ EventSupplyService.addSupplyToEvent response:', response.data);
    return response.data.data;
  }

  // Actualizează un supply pentru eveniment
  async updateEventSupply(eventId: number, supplyId: number, supplyData: UpdateEventSupplyRequest): Promise<void> {
    console.log('✏️ EventSupplyService.updateEventSupply called:', { eventId, supplyId, supplyData });
    const response = await api.put(`/event-supply/events/${eventId}/supplies/${supplyId}`, supplyData);
    console.log('✅ EventSupplyService.updateEventSupply response:', response.data);
  }

  // Șterge un supply de la eveniment
  async removeSupplyFromEvent(eventId: number, supplyId: number): Promise<void> {
    console.log('🗑️ EventSupplyService.removeSupplyFromEvent called:', { eventId, supplyId });
    const response = await api.delete(`/event-supply/events/${eventId}/supplies/${supplyId}`);
    console.log('✅ EventSupplyService.removeSupplyFromEvent response:', response.data);
  }

  // Obține template-urile de materiale
  async getSupplyTemplates(): Promise<SupplyTemplate[]> {
    console.log('📋 EventSupplyService.getSupplyTemplates called');
    const response = await api.get('/event-supply/supply-templates');
    console.log('✅ EventSupplyService.getSupplyTemplates response:', response.data);
    return response.data.data;
  }

  // Aplică un template la un eveniment
  async applyTemplateToEvent(eventId: number, templateId: number, requestedBy: number): Promise<{ templateName: string; totalItems: number; addedItems: number; skippedItems: number }> {
    console.log('🎯 EventSupplyService.applyTemplateToEvent called:', { eventId, templateId, requestedBy });
    const response = await api.post(`/event-supply/events/${eventId}/apply-template/${templateId}`, { requestedBy });
    console.log('✅ EventSupplyService.applyTemplateToEvent response:', response.data);
    return response.data.data;
  }

  // Obține istoricul pentru un supply
  async getSupplyHistory(supplyId: number): Promise<SupplyHistory[]> {
    console.log('📚 EventSupplyService.getSupplyHistory called:', { supplyId });
    const response = await api.get(`/event-supply/supplies/${supplyId}/history`);
    console.log('✅ EventSupplyService.getSupplyHistory response:', response.data);
    return response.data.data;
  }

  // Aprobare în masă pentru materiale
  async bulkApproveSupplies(eventId: number, supplyIds: number[], approvedBy: number): Promise<void> {
    console.log('✅ EventSupplyService.bulkApproveSupplies called:', { eventId, supplyIds, approvedBy });
    
    const promises = supplyIds.map(supplyId => 
      this.updateEventSupply(eventId, supplyId, {
        status: 'APPROVED',
        approvedBy
      })
    );
    
    await Promise.all(promises);
    console.log('✅ Bulk approval completed');
  }

  // Alocare în masă pentru materiale
  async bulkAllocateSupplies(eventId: number, supplies: { supplyId: number; quantityAllocated: number }[], allocatedBy: number): Promise<void> {
    console.log('📦 EventSupplyService.bulkAllocateSupplies called:', { eventId, supplies, allocatedBy });
    
    const promises = supplies.map(({ supplyId, quantityAllocated }) => 
      this.updateEventSupply(eventId, supplyId, {
        status: 'ALLOCATED',
        quantityAllocated,
        allocatedBy
      })
    );
    
    await Promise.all(promises);
    console.log('✅ Bulk allocation completed');
  }

  // Marcare ca utilizate în masă
  async bulkMarkAsUsed(eventId: number, supplies: { supplyId: number; quantityUsed: number }[]): Promise<void> {
    console.log('✔️ EventSupplyService.bulkMarkAsUsed called:', { eventId, supplies });
    
    const promises = supplies.map(({ supplyId, quantityUsed }) => 
      this.updateEventSupply(eventId, supplyId, {
        status: 'USED',
        quantityUsed
      })
    );
    
    await Promise.all(promises);
    console.log('✅ Bulk mark as used completed');
  }
} 