import { UserRole, EventType, EventStatus } from '../types/calendar';

export interface DSPPermissions {
  // Permisiuni generale
  canCreateEvents: boolean;
  canEditOwnEvents: boolean;
  canEditAllEvents: boolean;
  canDeleteOwnEvents: boolean;
  canDeleteAllEvents: boolean;
  canViewPrivateEvents: boolean;
  
  // Permisiuni specifice DSP
  canManageInspections: boolean;
  canManageEpidemiologicalControl: boolean;
  canManageHealthEmergencies: boolean;
  canApproveEvents: boolean;
  canManageNotifications: boolean;
  canAccessReports: boolean;
  canManageDepartmentEvents: boolean;
  canAssignPersonnel: boolean;
  canManageDocuments: boolean;
  
  // Permisiuni pe tipuri de evenimente
  allowedEventTypes: EventType[];
  
  // Permisiuni pe statusuri
  canChangeEventStatus: boolean;
  allowedStatusTransitions: Record<EventStatus, EventStatus[]>;
  
  // Permisiuni pe departamente
  canViewAllDepartments: boolean;
  managedDepartmentIds: number[];
  
  // Permisiuni pe vehicule
  canAssignVehicles: boolean;
  canViewAllVehicles: boolean;
}

export class DSPPermissionService {
  private static instance: DSPPermissionService;
  
  public static getInstance(): DSPPermissionService {
    if (!DSPPermissionService.instance) {
      DSPPermissionService.instance = new DSPPermissionService();
    }
    return DSPPermissionService.instance;
  }

  /**
   * Obține permisiunile pentru un utilizator bazat pe rolul său
   */
  public getPermissionsForRole(role: UserRole, departmentId?: number): DSPPermissions {
    switch (role) {
      case 'SUPER_ADMIN':
        return this.getSuperAdminPermissions();
      
      case 'ADMIN': // Add support for ADMIN role
        return this.getSuperAdminPermissions(); // ADMIN has same permissions as SUPER_ADMIN
      
      case 'DEPARTMENT_ADMIN':
        return this.getDepartmentAdminPermissions(departmentId);
      
      case 'MANAGER':
        return this.getManagerPermissions(departmentId);
      
      case 'INSPECTOR':
        return this.getInspectorPermissions(departmentId);
      
      case 'OPERATOR':
        return this.getOperatorPermissions(departmentId);
      
      case 'VIEWER':
        return this.getViewerPermissions(departmentId);
      
      default:
        return this.getDefaultPermissions();
    }
  }

  /**
   * Verifică dacă utilizatorul poate efectua o acțiune specifică
   */
  public canPerformAction(
    userRole: UserRole,
    action: string,
    context?: {
      eventType?: EventType;
      eventStatus?: EventStatus;
      eventUserId?: number;
      currentUserId?: number;
      departmentId?: number;
    }
  ): boolean {
    const permissions = this.getPermissionsForRole(userRole, context?.departmentId);
    
    switch (action) {
      case 'CREATE_EVENT':
        return permissions.canCreateEvents && 
               (!context?.eventType || permissions.allowedEventTypes.includes(context.eventType));
      
      case 'EDIT_EVENT':
        if (context?.eventUserId === context?.currentUserId) {
          return permissions.canEditOwnEvents;
        }
        return permissions.canEditAllEvents;
      
      case 'DELETE_EVENT':
        if (context?.eventUserId === context?.currentUserId) {
          return permissions.canDeleteOwnEvents;
        }
        return permissions.canDeleteAllEvents;
      
      case 'VIEW_PRIVATE_EVENT':
        return permissions.canViewPrivateEvents;
      
      case 'MANAGE_INSPECTION':
        return permissions.canManageInspections;
      
      case 'MANAGE_EPIDEMIOLOGICAL_CONTROL':
        return permissions.canManageEpidemiologicalControl;
      
      case 'MANAGE_HEALTH_EMERGENCY':
        return permissions.canManageHealthEmergencies;
      
      case 'APPROVE_EVENT':
        return permissions.canApproveEvents;
      
      case 'MANAGE_NOTIFICATIONS':
        return permissions.canManageNotifications;
      
      case 'ASSIGN_PERSONNEL':
        return permissions.canAssignPersonnel;
      
      case 'MANAGE_DOCUMENTS':
        return permissions.canManageDocuments;
      
      case 'MANAGE_STOCK':
        return permissions.canManageDocuments; // Folosim aceeași logică ca pentru documente
      
      default:
        return false;
    }
  }

  /**
   * Obține tipurile de evenimente permise pentru un rol
   */
  public getAllowedEventTypes(userRole: UserRole): EventType[] {
    const permissions = this.getPermissionsForRole(userRole);
    return permissions.allowedEventTypes;
  }

  /**
   * Verifică dacă utilizatorul poate schimba statusul unui eveniment
   */
  public canChangeStatus(
    userRole: UserRole,
    fromStatus: EventStatus,
    toStatus: EventStatus,
    context?: { eventUserId?: number; currentUserId?: number }
  ): boolean {
    const permissions = this.getPermissionsForRole(userRole);
    
    if (!permissions.canChangeEventStatus) {
      return false;
    }
    
    const allowedTransitions = permissions.allowedStatusTransitions[fromStatus] || [];
    return allowedTransitions.includes(toStatus);
  }

  // Implementări specifice pentru fiecare rol

  private getSuperAdminPermissions(): DSPPermissions {
    return {
      canCreateEvents: true,
      canEditOwnEvents: true,
      canEditAllEvents: true,
      canDeleteOwnEvents: true,
      canDeleteAllEvents: true,
      canViewPrivateEvents: true,
      canManageInspections: true,
      canManageEpidemiologicalControl: true,
      canManageHealthEmergencies: true,
      canApproveEvents: true,
      canManageNotifications: true,
      canAccessReports: true,
      canManageDepartmentEvents: true,
      canAssignPersonnel: true,
      canManageDocuments: true,
      allowedEventTypes: [
        'INSPECTION',
        'EPIDEMIOLOGICAL_CONTROL',
        'MEETING',
        'REPORTING',
        'HEALTH_EMERGENCY',
        'ADMINISTRATIVE',
        'TRAVEL',
        'TRAINING',
        'PUBLIC_HEALTH_ACTION',
        'OTHER'
      ],
      canChangeEventStatus: true,
      allowedStatusTransitions: {
        'DRAFT': ['PENDING', 'APPROVED', 'CANCELLED'],
        'PENDING': ['APPROVED', 'CANCELLED', 'DRAFT'],
        'APPROVED': ['IN_PROGRESS', 'CANCELLED', 'POSTPONED'],
        'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
        'IN_TRANSIT': ['DELIVERED', 'CANCELLED'],
        'DELIVERED': ['COMPLETED'],
        'COMPLETED': [],
        'CANCELLED': ['DRAFT', 'PENDING'],
        'POSTPONED': ['APPROVED', 'CANCELLED'],
        'URGENT': ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        'OVERDUE': ['IN_PROGRESS', 'COMPLETED', 'CANCELLED']
      },
      canViewAllDepartments: true,
      managedDepartmentIds: [],
      canAssignVehicles: true,
      canViewAllVehicles: true
    };
  }

  private getDepartmentAdminPermissions(departmentId?: number): DSPPermissions {
    return {
      canCreateEvents: true,
      canEditOwnEvents: true,
      canEditAllEvents: true,
      canDeleteOwnEvents: true,
      canDeleteAllEvents: true,
      canViewPrivateEvents: true,
      canManageInspections: true,
      canManageEpidemiologicalControl: true,
      canManageHealthEmergencies: true,
      canApproveEvents: true,
      canManageNotifications: true,
      canAccessReports: true,
      canManageDepartmentEvents: true,
      canAssignPersonnel: true,
      canManageDocuments: true,
      allowedEventTypes: [
        'INSPECTION',
        'EPIDEMIOLOGICAL_CONTROL',
        'MEETING',
        'REPORTING',
        'HEALTH_EMERGENCY',
        'ADMINISTRATIVE',
        'TRAVEL',
        'TRAINING',
        'PUBLIC_HEALTH_ACTION',
        'OTHER'
      ],
      canChangeEventStatus: true,
      allowedStatusTransitions: {
        'DRAFT': ['PENDING', 'APPROVED', 'CANCELLED'],
        'PENDING': ['APPROVED', 'CANCELLED'],
        'APPROVED': ['IN_PROGRESS', 'CANCELLED', 'POSTPONED'],
        'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
        'IN_TRANSIT': ['DELIVERED', 'CANCELLED'],
        'DELIVERED': ['COMPLETED'],
        'COMPLETED': [],
        'CANCELLED': ['DRAFT', 'PENDING'],
        'POSTPONED': ['APPROVED', 'CANCELLED'],
        'URGENT': ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        'OVERDUE': ['IN_PROGRESS', 'COMPLETED', 'CANCELLED']
      },
      canViewAllDepartments: false,
      managedDepartmentIds: departmentId ? [departmentId] : [],
      canAssignVehicles: true,
      canViewAllVehicles: false
    };
  }

  private getManagerPermissions(departmentId?: number): DSPPermissions {
    return {
      canCreateEvents: true,
      canEditOwnEvents: true,
      canEditAllEvents: false,
      canDeleteOwnEvents: true,
      canDeleteAllEvents: false,
      canViewPrivateEvents: false,
      canManageInspections: true,
      canManageEpidemiologicalControl: true,
      canManageHealthEmergencies: false,
      canApproveEvents: false,
      canManageNotifications: true,
      canAccessReports: true,
      canManageDepartmentEvents: false,
      canAssignPersonnel: true,
      canManageDocuments: true,
      allowedEventTypes: [
        'INSPECTION',
        'EPIDEMIOLOGICAL_CONTROL',
        'MEETING',
        'REPORTING',
        'ADMINISTRATIVE',
        'TRAVEL',
        'TRAINING',
        'OTHER'
      ],
      canChangeEventStatus: true,
      allowedStatusTransitions: {
        'DRAFT': ['PENDING'],
        'PENDING': [],
        'APPROVED': ['IN_PROGRESS'],
        'IN_PROGRESS': ['COMPLETED'],
        'IN_TRANSIT': ['DELIVERED'],
        'DELIVERED': ['COMPLETED'],
        'COMPLETED': [],
        'CANCELLED': [],
        'POSTPONED': [],
        'URGENT': ['IN_PROGRESS', 'COMPLETED'],
        'OVERDUE': []
      },
      canViewAllDepartments: false,
      managedDepartmentIds: departmentId ? [departmentId] : [],
      canAssignVehicles: true,
      canViewAllVehicles: false
    };
  }

  private getInspectorPermissions(departmentId?: number): DSPPermissions {
    return {
      canCreateEvents: true,
      canEditOwnEvents: true,
      canEditAllEvents: false,
      canDeleteOwnEvents: false,
      canDeleteAllEvents: false,
      canViewPrivateEvents: false,
      canManageInspections: true,
      canManageEpidemiologicalControl: false,
      canManageHealthEmergencies: false,
      canApproveEvents: false,
      canManageNotifications: false,
      canAccessReports: false,
      canManageDepartmentEvents: false,
      canAssignPersonnel: false,
      canManageDocuments: true,
      allowedEventTypes: [
        'INSPECTION',
        'TRAVEL',
        'REPORTING',
        'OTHER'
      ],
      canChangeEventStatus: true,
      allowedStatusTransitions: {
        'DRAFT': ['PENDING'],
        'PENDING': [],
        'APPROVED': ['IN_PROGRESS'],
        'IN_PROGRESS': ['COMPLETED'],
        'IN_TRANSIT': ['DELIVERED'],
        'DELIVERED': ['COMPLETED'],
        'COMPLETED': [],
        'CANCELLED': [],
        'POSTPONED': [],
        'URGENT': [],
        'OVERDUE': []
      },
      canViewAllDepartments: false,
      managedDepartmentIds: [],
      canAssignVehicles: false,
      canViewAllVehicles: false
    };
  }

  private getOperatorPermissions(departmentId?: number): DSPPermissions {
    return {
      canCreateEvents: true,
      canEditOwnEvents: false,
      canEditAllEvents: false,
      canDeleteOwnEvents: false,
      canDeleteAllEvents: false,
      canViewPrivateEvents: false,
      canManageInspections: false,
      canManageEpidemiologicalControl: false,
      canManageHealthEmergencies: false,
      canApproveEvents: false,
      canManageNotifications: false,
      canAccessReports: false,
      canManageDepartmentEvents: false,
      canAssignPersonnel: false,
      canManageDocuments: false,
      allowedEventTypes: [
        'ADMINISTRATIVE',
        'OTHER'
      ],
      canChangeEventStatus: false,
      allowedStatusTransitions: {
        'DRAFT': [],
        'PENDING': [],
        'APPROVED': [],
        'IN_PROGRESS': [],
        'IN_TRANSIT': [],
        'DELIVERED': [],
        'COMPLETED': [],
        'CANCELLED': [],
        'POSTPONED': [],
        'URGENT': [],
        'OVERDUE': []
      },
      canViewAllDepartments: false,
      managedDepartmentIds: [],
      canAssignVehicles: false,
      canViewAllVehicles: false
    };
  }

  private getViewerPermissions(departmentId?: number): DSPPermissions {
    return {
      canCreateEvents: false,
      canEditOwnEvents: false,
      canEditAllEvents: false,
      canDeleteOwnEvents: false,
      canDeleteAllEvents: false,
      canViewPrivateEvents: false,
      canManageInspections: false,
      canManageEpidemiologicalControl: false,
      canManageHealthEmergencies: false,
      canApproveEvents: false,
      canManageNotifications: false,
      canAccessReports: false,
      canManageDepartmentEvents: false,
      canAssignPersonnel: false,
      canManageDocuments: false,
      allowedEventTypes: [],
      canChangeEventStatus: false,
      allowedStatusTransitions: {
        'DRAFT': [],
        'PENDING': [],
        'APPROVED': [],
        'IN_PROGRESS': [],
        'IN_TRANSIT': [],
        'DELIVERED': [],
        'COMPLETED': [],
        'CANCELLED': [],
        'POSTPONED': [],
        'URGENT': [],
        'OVERDUE': []
      },
      canViewAllDepartments: false,
      managedDepartmentIds: [],
      canAssignVehicles: false,
      canViewAllVehicles: false
    };
  }

  private getDefaultPermissions(): DSPPermissions {
    return this.getViewerPermissions();
  }
} 