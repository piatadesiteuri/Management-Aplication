import pool from '../config/database';

export interface PermissionDefinition {
  code: string;
  module_key: string;
  label: string;
  description: string;
}

const PERMISSION_CATALOG: PermissionDefinition[] = [
  { code: 'dashboard.view', module_key: 'dashboard', label: 'Dashboard', description: 'Poate accesa dashboard-urile aplicației' },
  { code: 'calendar.view', module_key: 'calendar', label: 'Calendar', description: 'Poate accesa calendarul și evenimentele' },
  { code: 'tasks.view', module_key: 'tasks', label: 'Task Management', description: 'Poate accesa taskurile și fluxurile de lucru' },
  { code: 'documents.view', module_key: 'documents', label: 'Documente', description: 'Poate accesa documentele din sistem' },
  { code: 'vehicles.view', module_key: 'vehicles', label: 'Parc Auto', description: 'Poate accesa modulul Parc Auto' },
  { code: 'supply.view', module_key: 'supply', label: 'Gestiune Stocuri', description: 'Poate accesa furnizori, produse și stoc' },
  { code: 'stock_audit.view', module_key: 'stock_audit', label: 'Audit Stoc', description: 'Poate accesa istoricul modificărilor de stoc' },
  { code: 'material_requests.view', module_key: 'material_requests', label: 'Cereri materiale', description: 'Poate accesa cererile de materiale' },
  { code: 'traceability.view', module_key: 'traceability', label: 'Trasabilitate', description: 'Poate accesa trasabilitatea operațiunilor' },
  { code: 'reports.view', module_key: 'reports', label: 'Rapoarte', description: 'Poate accesa rapoartele manuale și de utilizator' },
  { code: 'bi.view', module_key: 'business_intelligence', label: 'Business Intelligence', description: 'Poate accesa dashboard-urile executive' },
  { code: 'automated_reports.view', module_key: 'automated_reports', label: 'Rapoarte automate', description: 'Poate accesa și genera rapoarte automate' },
  { code: 'alerts.view', module_key: 'alerts', label: 'Alerte', description: 'Poate accesa centrul de alerte' },
  { code: 'activity_logs.view', module_key: 'activity_logs', label: 'Loguri activitate', description: 'Poate accesa logurile de activitate' },
  { code: 'personal_data_access.view', module_key: 'personal_data_access', label: 'Raport acces date personale', description: 'Poate accesa raportul GDPR de acces la date personale' },
  { code: 'patients.view', module_key: 'patients', label: 'Pacienți', description: 'Poate accesa modulul pacienți' },
  { code: 'patient_portal.view', module_key: 'patient_portal', label: 'Portal pacienți', description: 'Poate accesa portalul pacienților' },
  { code: 'lims.view', module_key: 'lims', label: 'Laborator', description: 'Poate accesa modulul LIMS' },
  { code: 'pharmacy.view', module_key: 'pharmacy', label: 'Farmacie', description: 'Poate accesa modulul de farmacie' },
  { code: 'budget.view', module_key: 'budget', label: 'Buget', description: 'Poate accesa modulul buget și execuție' },
  { code: 'interoperability.view', module_key: 'interoperability', label: 'Interoperabilitate', description: 'Poate accesa integrările externe' },
  { code: 'workflows.view', module_key: 'workflows', label: 'Motor fluxuri', description: 'Poate accesa motorul de workflow' },
  { code: 'users.manage', module_key: 'users', label: 'Administrare utilizatori', description: 'Poate crea, modifica și șterge utilizatori' },
  { code: 'roles.manage', module_key: 'roles', label: 'Administrare roluri', description: 'Poate administra roluri și permisiuni' },
  { code: 'system_settings.manage', module_key: 'system_settings', label: 'Setări sistem', description: 'Poate modifica setările aplicației' },
  { code: 'notifications.view', module_key: 'notifications', label: 'Notificări', description: 'Poate accesa centrul de notificări' },
  { code: 'profile.view', module_key: 'profile', label: 'Profil', description: 'Poate accesa și actualiza propriul profil' }
];

const ALL_PERMISSION_CODES = PERMISSION_CATALOG.map((permission) => permission.code);

const DEFAULT_ROLE_PERMISSION_MAP: Record<string, string[]> = {
  SUPER_ADMIN: ALL_PERMISSION_CODES,
  ADMIN: ALL_PERMISSION_CODES,
  DEPARTMENT_ADMIN: [
    'dashboard.view',
    'calendar.view',
    'tasks.view',
    'documents.view',
    'vehicles.view',
    'supply.view',
    'stock_audit.view',
    'material_requests.view',
    'traceability.view',
    'reports.view',
    'bi.view',
    'automated_reports.view',
    'alerts.view',
    'activity_logs.view',
    'personal_data_access.view',
    'patients.view',
    'patient_portal.view',
    'lims.view',
    'pharmacy.view',
    'interoperability.view',
    'workflows.view',
    'notifications.view',
    'profile.view',
    'users.manage',
    'system_settings.manage'
  ],
  MANAGER: [
    'dashboard.view',
    'calendar.view',
    'tasks.view',
    'documents.view',
    'vehicles.view',
    'material_requests.view',
    'traceability.view',
    'reports.view',
    'alerts.view',
    'activity_logs.view',
    'patients.view',
    'patient_portal.view',
    'notifications.view',
    'profile.view'
  ],
  INSPECTOR: [
    'dashboard.view',
    'calendar.view',
    'tasks.view',
    'documents.view',
    'reports.view',
    'traceability.view',
    'patient_portal.view',
    'notifications.view',
    'profile.view'
  ],
  OPERATOR: [
    'dashboard.view',
    'calendar.view',
    'tasks.view',
    'documents.view',
    'notifications.view',
    'profile.view'
  ],
  VIEWER: [
    'dashboard.view',
    'calendar.view',
    'notifications.view',
    'profile.view'
  ],
  WAREHOUSE_KEEPER: [
    'dashboard.view',
    'calendar.view',
    'tasks.view',
    'documents.view',
    'reports.view',
    'supply.view',
    'stock_audit.view',
    'material_requests.view',
    'lims.view',
    'notifications.view',
    'profile.view'
  ],
  BUDGET_OFFICER: [
    'dashboard.view',
    'calendar.view',
    'tasks.view',
    'documents.view',
    'reports.view',
    'budget.view',
    'notifications.view',
    'profile.view'
  ]
};

function normalizeRoleName(roleName: string): string {
  if (roleName === 'ADMIN') {
    return 'SUPER_ADMIN';
  }
  return roleName;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function isMissingPermissionsTableError(error: any): boolean {
  return error?.code === 'ER_NO_SUCH_TABLE' || error?.errno === 1146;
}

export class PermissionService {
  static getCatalog(): PermissionDefinition[] {
    return [...PERMISSION_CATALOG];
  }

  static getDefaultPermissionsForRoles(roleNames: string[]): string[] {
    if (roleNames.some((role) => ['SUPER_ADMIN', 'ADMIN'].includes(role))) {
      return [...ALL_PERMISSION_CODES];
    }

    return unique(
      roleNames.flatMap((role) => DEFAULT_ROLE_PERMISSION_MAP[normalizeRoleName(role)] || [])
    );
  }

  static async getCatalogFromDb(): Promise<PermissionDefinition[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT code, module_key, label, description FROM permissions ORDER BY module_key, label'
      );

      const mapped = (rows as any[]).map((row) => ({
        code: String(row.code),
        module_key: String(row.module_key),
        label: String(row.label),
        description: String(row.description || '')
      }));

      return mapped.length ? mapped : this.getCatalog();
    } catch (error) {
      if (isMissingPermissionsTableError(error)) {
        return this.getCatalog();
      }
      throw error;
    }
  }

  static async getRolePermissions(roleId: number): Promise<string[]> {
    try {
      const [rows] = await pool.execute(
        `SELECT p.code
         FROM role_permissions rp
         INNER JOIN permissions p ON p.id = rp.permission_id
         WHERE rp.role_id = ?
         ORDER BY p.code`,
        [roleId]
      );

      const codes = (rows as any[]).map((row) => String(row.code));
      if (codes.length > 0) {
        return unique(codes);
      }

      const [roleRows] = await pool.execute('SELECT name FROM roles WHERE id = ?', [roleId]);
      const roleName = (roleRows as any[])[0]?.name;
      return roleName ? this.getDefaultPermissionsForRoles([String(roleName)]) : [];
    } catch (error) {
      if (isMissingPermissionsTableError(error)) {
        const [roleRows] = await pool.execute('SELECT name FROM roles WHERE id = ?', [roleId]);
        const roleName = (roleRows as any[])[0]?.name;
        return roleName ? this.getDefaultPermissionsForRoles([String(roleName)]) : [];
      }
      throw error;
    }
  }

  static async getEffectivePermissionsForUser(userId: number): Promise<string[]> {
    const [roleRows] = await pool.execute(
      `SELECT r.name
       FROM user_roles ur
       INNER JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = ?`,
      [userId]
    );

    const roleNames = (roleRows as any[]).map((row) => String(row.name));

    try {
      const [rows] = await pool.execute(
        `SELECT DISTINCT p.code
         FROM user_roles ur
         INNER JOIN roles r ON r.id = ur.role_id
         INNER JOIN role_permissions rp ON rp.role_id = r.id
         INNER JOIN permissions p ON p.id = rp.permission_id
         WHERE ur.user_id = ?
         ORDER BY p.code`,
        [userId]
      );

      const codes = (rows as any[]).map((row) => String(row.code));
      if (codes.length > 0) {
        return unique(codes);
      }
    } catch (error) {
      if (!isMissingPermissionsTableError(error)) {
        throw error;
      }
    }

    return this.getDefaultPermissionsForRoles(roleNames);
  }

  static async setRolePermissions(roleId: number, permissionCodes: string[]): Promise<void> {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const nextCodes = unique(permissionCodes);
      const catalog = await this.getCatalogFromDb();
      const validCodes = new Set(catalog.map((permission) => permission.code));
      const invalidCodes = nextCodes.filter((code) => !validCodes.has(code));

      if (invalidCodes.length > 0) {
        throw new Error(`Coduri de permisiuni invalide: ${invalidCodes.join(', ')}`);
      }

      const [permissionRows] = await conn.execute(
        `SELECT id, code
         FROM permissions
         WHERE code IN (${nextCodes.map(() => '?').join(', ') || "''"})`,
        nextCodes
      );

      await conn.execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);

      for (const row of permissionRows as any[]) {
        await conn.execute(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [roleId, row.id]
        );
      }

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}
