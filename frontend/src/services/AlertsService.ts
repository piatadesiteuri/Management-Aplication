import api from './api';

export interface AlertRule {
  id: number;
  name: string;
  description: string;
  type: 'EVENT' | 'VEHICLE' | 'SUPPLIER' | 'USER';
  condition_sql: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  is_active: boolean;
  notification_channels: string[];
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: number;
  rule_id: number;
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'RESOLVED';
  entity_type: 'EVENT' | 'VEHICLE' | 'SUPPLIER' | 'USER';
  entity_id: number;
  user_id?: number;
  department_id?: number;
  created_at: string;
  resolved_at?: string;
  resolved_by?: number;
}

export interface AlertStats {
  total: number;
  active: number;
  severityStats: Array<{ severity: string; count: number }>;
  typeStats: Array<{ entity_type: string; count: number }>;
  recentAlerts: Array<{ date: string; count: number }>;
}

export const AlertsService = {
  // ===== GESTIONARE REGULI =====

  /**
   * Obține toate regulile de alerte
   */
  getAlertRules: async (): Promise<AlertRule[]> => {
    const response = await api.get('/alerts/rules');
    return response.data;
  },

  /**
   * Creează o nouă regulă de alertă
   */
  createAlertRule: async (rule: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>): Promise<{ message: string; ruleId: number }> => {
    const response = await api.post('/alerts/rules', rule);
    return response.data;
  },

  /**
   * Actualizează o regulă de alertă
   */
  updateAlertRule: async (id: number, rule: Partial<AlertRule>): Promise<{ message: string }> => {
    const response = await api.put(`/alerts/rules/${id}`, rule);
    return response.data;
  },

  /**
   * Șterge o regulă de alertă
   */
  deleteAlertRule: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/alerts/rules/${id}`);
    return response.data;
  },

  /**
   * Testează o regulă specifică
   */
  testRule: async (ruleId: number): Promise<{ rule: AlertRule; entitiesFound: number; entities: any[] }> => {
    const response = await api.get(`/alerts/rules/${ruleId}/test`);
    return response.data;
  },

  // ===== GESTIONARE ALERTE =====

  /**
   * Obține toate alertele (active și rezolvate)
   */
  getActiveAlerts: async (): Promise<Alert[]> => {
    const response = await api.get('/alerts/active');
    return response.data;
  },

  /**
   * Obține toate alertele (active și rezolvate)
   */
  getAllAlerts: async (): Promise<Alert[]> => {
    const response = await api.get('/alerts/all');
    return response.data;
  },

  /**
   * Obține alertele pentru utilizatorul curent
   */
  getUserAlerts: async (): Promise<Alert[]> => {
    const response = await api.get('/alerts/user');
    return response.data;
  },



  /**
   * Marchează o alertă ca fiind rezolvată
   */
  resolveAlert: async (id: number): Promise<{ message: string }> => {
    const response = await api.put(`/alerts/${id}/resolve`);
    return response.data;
  },

  // ===== STATISTICI =====

  /**
   * Obține statistici pentru alerte
   */
  getAlertStats: async (): Promise<AlertStats> => {
    const response = await api.get('/alerts/stats');
    return response.data;
  },

  // ===== RULE ENGINE =====

  /**
   * Pornește Rule Engine
   */
  startRuleEngine: async (): Promise<{ message: string }> => {
    const response = await api.post('/alerts/engine/start');
    return response.data;
  },

  /**
   * Oprește Rule Engine
   */
  stopRuleEngine: async (): Promise<{ message: string }> => {
    const response = await api.post('/alerts/engine/stop');
    return response.data;
  }
}; 