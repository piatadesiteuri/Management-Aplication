export type AppPermission =
  | 'dashboard.view'
  | 'calendar.view'
  | 'tasks.view'
  | 'documents.view'
  | 'vehicles.view'
  | 'supply.view'
  | 'stock_audit.view'
  | 'material_requests.view'
  | 'traceability.view'
  | 'reports.view'
  | 'bi.view'
  | 'automated_reports.view'
  | 'alerts.view'
  | 'activity_logs.view'
  | 'personal_data_access.view'
  | 'patients.view'
  | 'patient_portal.view'
  | 'lims.view'
  | 'pharmacy.view'
  | 'budget.view'
  | 'interoperability.view'
  | 'workflows.view'
  | 'users.manage'
  | 'roles.manage'
  | 'system_settings.manage'
  | 'notifications.view'
  | 'profile.view';

export interface PermissionCatalogItem {
  code: AppPermission | string;
  module_key: string;
  label: string;
  description: string;
}

export const ADMIN_ENTRY_ROLES = ['ADMIN', 'SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER'];

export const NAV_PERMISSION_LABELS: Record<string, string> = {
  'dashboard.view': 'Dashboard',
  'calendar.view': 'Calendar',
  'tasks.view': 'Note interne',
  'documents.view': 'Documente',
  'vehicles.view': 'Parc Auto',
  'supply.view': 'Gestiune Stocuri',
  'stock_audit.view': 'Audit Stoc',
  'material_requests.view': 'Cereri materiale',
  'traceability.view': 'Trasabilitate',
  'reports.view': 'Rapoarte',
  'bi.view': 'Business Intelligence',
  'automated_reports.view': 'Rapoarte automate',
  'alerts.view': 'Alerte',
  'activity_logs.view': 'Loguri activitate',
  'personal_data_access.view': 'Raport acces date personale',
  'patients.view': 'Pacienți',
  'patient_portal.view': 'Portal pacienți',
  'lims.view': 'Laborator',
  'pharmacy.view': 'Farmacie',
  'budget.view': 'Buget',
  'interoperability.view': 'Interoperabilitate',
  'workflows.view': 'Motor fluxuri',
  'users.manage': 'Administrare utilizatori',
  'roles.manage': 'Administrare roluri',
  'system_settings.manage': 'Setări sistem',
  'notifications.view': 'Notificări',
  'profile.view': 'Profil'
};
