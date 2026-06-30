export type VehicleStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export type DocumentType = 'ITP' | 'RCA' | 'ROVIGNETA' | 'CASCO';

export interface VehicleDocument {
  id: number;
  type: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  filePath?: string;
}

export interface MaintenanceRecord {
  id: number;
  date: string;
  type: string;
  description: string;
  cost: number;
  mileage: number;
  performedBy: string;
}

export interface FuelRecord {
  id: number;
  date: string;
  quantity: number;
  cost: number;
  mileage: number;
  fuelType: string;
  location: string;
  driver: string;
}

export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  registration_number: string;
  year: number;
  status: VehicleStatus;
  category: string;
  fuel_type: string;
  tank_capacity: number;
  current_mileage: number;
  assigned_department_id?: number;
  observations?: string;
  created_at: string;
  updated_at: string;
  documents?: VehicleDocument[];
  maintenanceHistory?: MaintenanceRecord[];
  fuelHistory?: FuelRecord[];
  usageHistory?: VehicleUsageRecord[];
}

export interface VehicleReservation {
  id: number;
  vehicleId: number;
  eventId: number;
  userId: number;
  startDate: string;
  endDate: string;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approvedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleUsageRecord {
  id: number;
  vehicleId: number;
  userId: number;
  startDate: string;
  endDate: string;
  startMileage: number;
  endMileage: number;
  purpose: string;
  route: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFormData {
  brand: string;
  model: string;
  registrationNumber: string;
  year: number;
  status: VehicleStatus;
  category: string;
  fuelType: string;
  tankCapacity: number;
  currentMileage: number;
  assignedDepartmentId?: number;
  observations?: string;
} 