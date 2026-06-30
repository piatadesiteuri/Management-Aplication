export class DSPPermissionService {
  private static instance: DSPPermissionService;

  private constructor() {}

  static getInstance(): DSPPermissionService {
    if (!DSPPermissionService.instance) {
      DSPPermissionService.instance = new DSPPermissionService();
    }
    return DSPPermissionService.instance;
  }

  canPerformAction(userRole: string, action: string, context?: any): boolean {
    // Basic permission logic - can be expanded later
    switch (userRole) {
      case 'SUPER_ADMIN':
        return true;
      case 'DEPARTMENT_ADMIN':
        return true;
      case 'MANAGER':
        return ['CREATE_EVENT', 'EDIT_EVENT', 'DELETE_EVENT', 'ASSIGN_PERSONNEL', 'MANAGE_DOCUMENTS', 'MANAGE_NOTIFICATIONS', 'VIEW_REPORTS'].includes(action);
      case 'INSPECTOR':
        return ['CREATE_EVENT', 'EDIT_EVENT', 'VIEW_REPORTS'].includes(action);
      case 'OPERATOR':
        return ['CREATE_EVENT', 'VIEW_REPORTS'].includes(action);
      case 'VIEWER':
        return ['VIEW_REPORTS'].includes(action);
      default:
        return false;
    }
  }
} 