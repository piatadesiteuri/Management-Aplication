import api from './api';

export interface MaterialRequestTraceability {
  request: {
    request_id: number;
    request_number: string;
    product_name: string;
    product_unit?: string;
    quantity_requested: number;
    quantity_approved: number;
    priority: string;
    status: string;
    reason: string;
    request_created_at: string;
    requester_first_name: string;
    requester_last_name: string;
    requester_email: string;
    approver_first_name?: string;
    approver_last_name?: string;
    approver_email?: string;
    approved_at?: string;
    rejector_first_name?: string;
    rejector_last_name?: string;
    rejector_email?: string;
    rejected_at?: string;
    rejection_reason?: string;
    transport_event_id?: number;
    transport_event_title?: string;
    transport_event_start?: string;
    transport_event_end?: string;
    transport_event_status?: string;
    audit_entries_count: number;
    last_audit_at?: string;
  };
  auditTrail: Array<{
    id: number;
    action_type: string;
    performed_by: number;
    performed_at: string;
    old_values?: any;
    new_values?: any;
    comments?: string;
    ip_address?: string;
    user_agent?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  }>;
}

export interface TransportEventTraceability {
  event: {
    event_id: number;
    title: string;
    start_time: string;
    end_time: string;
    event_type: string;
    event_status: string;
    event_created_at: string;
    creator_first_name: string;
    creator_last_name: string;
    creator_email: string;
    metadata?: any;
    material_request_id?: number;
    request_number?: string;
    product_name?: string;
    quantity_requested?: number;
    quantity_approved?: number;
    audit_entries_count: number;
    last_audit_at?: string;
  };
  auditTrail: Array<{
    id: number;
    action_type: string;
    performed_by: number;
    performed_at: string;
    old_values?: any;
    new_values?: any;
    comments?: string;
    ip_address?: string;
    user_agent?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  }>;
}

export interface TraceabilityStatistics {
  entity_type: string;
  total_entities: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  last_7_days: number;
  last_30_days: number;
}

export class TraceabilityService {
  /**
   * Obține trasabilitatea completă a unei cereri de materiale
   */
  static async getMaterialRequestTraceability(requestId: number): Promise<MaterialRequestTraceability> {
    try {
      const response = await api.get(`/traceability/material-requests/${requestId}`);
      console.log('📦 Material request traceability response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching material request traceability:', error);
      throw error;
    }
  }

  /**
   * Obține trasabilitatea completă a unui eveniment de transport
   */
  static async getTransportEventTraceability(eventId: number): Promise<TransportEventTraceability> {
    try {
      const response = await api.get(`/traceability/transport-events/${eventId}`);
      console.log('🚚 Transport event traceability response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching transport event traceability:', error);
      throw error;
    }
  }

  /**
   * Obține toate cererile cu trasabilitatea lor
   */
  static async getAllRequestsWithTraceability(filters: {
    status?: string;
    priority?: string;
    requester_id?: number;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: any[]; pagination: any }> {
    try {
      const response = await api.get('/traceability/material-requests', { params: filters });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching requests with traceability:', error);
      throw error;
    }
  }

  /**
   * Obține statistici de trasabilitate
   */
  static async getTraceabilityStatistics(): Promise<TraceabilityStatistics[]> {
    try {
      const response = await api.get('/traceability/statistics');
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching traceability statistics:', error);
      throw error;
    }
  }

  /**
   * Obține audit trail pentru o entitate specifică
   */
  static async getAuditTrail(entityType: string, entityId: number): Promise<any[]> {
    try {
      const response = await api.get(`/traceability/audit-trail/${entityType}/${entityId}`);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching audit trail:', error);
      throw error;
    }
  }
}
