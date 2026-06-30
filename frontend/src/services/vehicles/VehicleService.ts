import api from '../api';
import type {
  Vehicle,
  VehicleDocument,
  MaintenanceRecord,
  FuelRecord,
  VehicleReservation,
  VehicleUsageRecord,
} from '../../types/vehicles';

export class VehicleService {
  // Vehicule
  async getVehicles(params?: { departmentId?: number; status?: string }) {
    try {
      console.log('🚗 Fetching vehicles with params:', params);
      const response = await api.get('/vehicles', { params });
      console.log('✅ Vehicles fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching vehicles:', {
        error,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      throw error;
    }
  }

  async getVehicleById(id: number) {
    try {
      console.log(`🚗 Fetching vehicle with ID: ${id}`);
      const response = await api.get(`/vehicles/${id}`);
      console.log('✅ Vehicle fetched successfully:', response.data);
    return response.data;
    } catch (error: any) {
      console.error(`❌ Error fetching vehicle ${id}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  async createVehicle(vehicleData: Partial<Vehicle>) {
    try {
      console.log('🚗 Creating new vehicle:', vehicleData);
      const response = await api.post('/vehicles', vehicleData);
      console.log('✅ Vehicle created successfully:', response.data);
    return response.data;
    } catch (error: any) {
      console.error('❌ Error creating vehicle:', {
        error,
        status: error.response?.status,
        data: error.response?.data,
        vehicleData
      });
      throw error;
    }
  }

  async updateVehicle(id: number, vehicleData: Partial<Vehicle>) {
    try {
      console.log(`🚗 Updating vehicle ${id}:`, vehicleData);
      const response = await api.put(`/vehicles/${id}`, vehicleData);
      console.log('✅ Vehicle updated successfully:', response.data);
    return response.data;
    } catch (error: any) {
      console.error(`❌ Error updating vehicle ${id}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data,
        vehicleData
      });
      throw error;
    }
  }

  async deleteVehicle(id: number) {
    try {
      console.log(`🚗 Deleting vehicle ${id}`);
      const response = await api.delete(`/vehicles/${id}`);
      console.log('✅ Vehicle deleted successfully:', response.data);
    return response.data;
    } catch (error: any) {
      console.error(`❌ Error deleting vehicle ${id}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  // Documente
  async getVehicleDocuments(vehicleId: number) {
    try {
      console.log(`📄 Fetching documents for vehicle ${vehicleId}`);
      const response = await api.get(`/vehicles/${vehicleId}/documents`);
      console.log('✅ Documents fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error fetching documents for vehicle ${vehicleId}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  async createVehicleDocument(vehicleId: number, documentData: {
    documentType: string;
    documentNumber: string;
    issueDate: string;
    expiryDate: string;
    issuingAuthority: string;
    observations?: string;
    file: File;
  }) {
    try {
      console.log(`📄 Creating document for vehicle ${vehicleId}:`, documentData);
      
      const formData = new FormData();
      formData.append('file', documentData.file);
      formData.append('documentType', documentData.documentType);
      formData.append('documentNumber', documentData.documentNumber);
      formData.append('issueDate', documentData.issueDate);
      formData.append('expiryDate', documentData.expiryDate);
      formData.append('issuingAuthority', documentData.issuingAuthority);
      if (documentData.observations) {
        formData.append('observations', documentData.observations);
      }

      const response = await api.post(`/vehicles/${vehicleId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Document created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error creating document for vehicle ${vehicleId}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  async downloadVehicleDocument(vehicleId: number, documentId: number): Promise<Blob> {
    try {
      console.log(`📥 Downloading document ${documentId} for vehicle ${vehicleId}`);
      const response = await api.get(`/vehicles/${vehicleId}/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      console.log('✅ Document downloaded successfully');
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error downloading document ${documentId} for vehicle ${vehicleId}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  async viewVehicleDocument(vehicleId: number, documentId: number): Promise<Blob> {
    try {
      console.log(`👁️ [DEBUG] Getting document ${documentId} for vehicle ${vehicleId} for viewing`);

      const url = `/vehicles/${vehicleId}/documents/${documentId}/view`;
      console.log(`👁️ [DEBUG] Request URL: ${url}`);
      console.log(`👁️ [DEBUG] API base URL: ${api.defaults.baseURL}`);
      
      const response = await api.get(url, {
        responseType: 'blob',
      });
      
      console.log(`✅ [DEBUG] Document fetched successfully for viewing`);
      console.log(`✅ [DEBUG] Response status: ${response.status}`);
      console.log(`✅ [DEBUG] Response headers:`, response.headers);
      console.log(`✅ [DEBUG] Response data type:`, typeof response.data);
      console.log(`✅ [DEBUG] Response data size:`, response.data?.size);
      
      return response.data;
    } catch (error: any) {
      console.error(`❌ [DEBUG] Error getting document ${documentId} for vehicle ${vehicleId} for viewing:`, {
        error,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  async deleteVehicleDocument(vehicleId: number, documentId: number) {
    try {
      console.log(`📄 Deleting document ${documentId} from vehicle ${vehicleId}`);
      const response = await api.delete(`/vehicles/${vehicleId}/documents/${documentId}`);
      console.log('✅ Document deleted successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error deleting document ${documentId} from vehicle ${vehicleId}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  // Documente - metode deprecate (păstrez pentru compatibilitate)
  async addVehicleDocument(vehicleId: number, document: Partial<VehicleDocument>) {
    console.warn('⚠️ addVehicleDocument is deprecated, use createVehicleDocument instead');
    return this.createVehicleDocument(vehicleId, document as any);
  }

  async updateVehicleDocument(
    vehicleId: number,
    documentId: number,
    document: Partial<VehicleDocument>
  ) {
    console.warn('⚠️ updateVehicleDocument is not implemented yet');
    throw new Error('Update document functionality not implemented');
  }

  // Istoric vehicul
  async getVehicleHistory(vehicleId: number) {
    try {
      console.log(`📊 Fetching history for vehicle ${vehicleId}`);
      const response = await api.get(`/vehicles/${vehicleId}/history`);
      console.log('✅ Vehicle history fetched successfully:', response.data);
    return response.data;
    } catch (error: any) {
      console.error(`❌ Error fetching history for vehicle ${vehicleId}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  // Mentenanță
  async addMaintenanceRecord(vehicleId: number, record: Partial<MaintenanceRecord>) {
    try {
      console.log(`🔧 Adding maintenance record to vehicle ${vehicleId}:`, record);
      const response = await api.post(`/vehicles/${vehicleId}/maintenance`, record);
      console.log('✅ Maintenance record added successfully:', response.data);
    return response.data;
    } catch (error: any) {
      console.error(`❌ Error adding maintenance record to vehicle ${vehicleId}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data,
        record
      });
      throw error;
    }
  }

  async updateMaintenanceRecord(
    vehicleId: number,
    recordId: number,
    record: Partial<MaintenanceRecord>
  ) {
    try {
      console.log(`🔧 Updating maintenance record ${recordId} for vehicle ${vehicleId}:`, record);
      const response = await api.put(
        `/vehicles/${vehicleId}/maintenance/${recordId}`,
        record
      );
      console.log('✅ Maintenance record updated successfully:', response.data);
    return response.data;
    } catch (error: any) {
      console.error(`❌ Error updating maintenance record ${recordId} for vehicle ${vehicleId}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data,
        record
      });
      throw error;
    }
  }

  async deleteMaintenanceRecord(vehicleId: number, recordId: number) {
    try {
      console.log(`🔧 Deleting maintenance record ${recordId} from vehicle ${vehicleId}`);
      const response = await api.delete(`/vehicles/${vehicleId}/maintenance/${recordId}`);
      console.log('✅ Maintenance record deleted successfully:', response.data);
    return response.data;
    } catch (error: any) {
      console.error(`❌ Error deleting maintenance record ${recordId} from vehicle ${vehicleId}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  // Combustibil
  async addFuelRecord(vehicleId: number, record: Partial<FuelRecord>) {
    try {
      console.log(`⛽ Adding fuel record to vehicle ${vehicleId}:`, record);
      const response = await api.post(`/vehicles/${vehicleId}/fuel`, record);
      console.log('✅ Fuel record added successfully:', response.data);
    return response.data;
    } catch (error: any) {
      console.error(`❌ Error adding fuel record to vehicle ${vehicleId}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data,
        record
      });
      throw error;
    }
  }

  async updateFuelRecord(vehicleId: number, recordId: number, record: Partial<FuelRecord>) {
    try {
      console.log(`⛽ Updating fuel record ${recordId} for vehicle ${vehicleId}:`, record);
      const response = await api.put(
        `/vehicles/${vehicleId}/fuel/${recordId}`,
        record
      );
      console.log('✅ Fuel record updated successfully:', response.data);
    return response.data;
    } catch (error: any) {
      console.error(`❌ Error updating fuel record ${recordId} for vehicle ${vehicleId}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data,
        record
      });
      throw error;
    }
  }

  async deleteFuelRecord(vehicleId: number, recordId: number) {
    try {
      console.log(`⛽ Deleting fuel record ${recordId} from vehicle ${vehicleId}`);
      const response = await api.delete(`/vehicles/${vehicleId}/fuel/${recordId}`);
      console.log('✅ Fuel record deleted successfully:', response.data);
    return response.data;
    } catch (error: any) {
      console.error(`❌ Error deleting fuel record ${recordId} from vehicle ${vehicleId}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  // Rezervări
  async getVehicleReservations(params?: {
    vehicleId?: number;
    userId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      console.log('📅 Fetching vehicle reservations with params:', params);
      const response = await api.get('/vehicle-reservations', { params });
      console.log('✅ Vehicle reservations fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching vehicle reservations:', {
        error,
        status: error.response?.status,
        data: error.response?.data,
        params
      });
      throw error;
    }
  }

  async createReservation(reservation: Partial<VehicleReservation>) {
    try {
      console.log('📅 Creating vehicle reservation:', reservation);
      const response = await api.post('/vehicle-reservations', reservation);
      console.log('✅ Vehicle reservation created successfully:', response.data);
    return response.data;
    } catch (error: any) {
      console.error('❌ Error creating vehicle reservation:', {
        error,
        status: error.response?.status,
        data: error.response?.data,
        reservation
      });
      throw error;
    }
  }

  async updateReservation(id: number, reservation: Partial<VehicleReservation>) {
    try {
      console.log(`📅 Updating vehicle reservation ${id}:`, reservation);
      const response = await api.put(`/vehicle-reservations/${id}`, reservation);
      console.log('✅ Vehicle reservation updated successfully:', response.data);
    return response.data;
    } catch (error: any) {
      console.error(`❌ Error updating vehicle reservation ${id}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data,
        reservation
      });
      throw error;
    }
  }

  async deleteReservation(id: number) {
    try {
      console.log(`📅 Deleting vehicle reservation ${id}`);
      const response = await api.delete(`/vehicle-reservations/${id}`);
      console.log('✅ Vehicle reservation deleted successfully:', response.data);
    return response.data;
    } catch (error: any) {
      console.error(`❌ Error deleting vehicle reservation ${id}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  // Utilizare
  async getVehicleUsage(params?: {
    vehicleId?: number;
    userId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      console.log('📊 Fetching vehicle usage with params:', params);
      const response = await api.get('/vehicle-usage', { params });
      console.log('✅ Vehicle usage fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching vehicle usage:', {
        error,
        status: error.response?.status,
        data: error.response?.data,
        params
      });
      throw error;
    }
  }

  async addUsageRecord(vehicleId: number, record: Partial<VehicleUsageRecord>) {
    try {
      console.log(`📊 Adding vehicle usage record to vehicle ${vehicleId}:`, record);
      const response = await api.post(`/vehicles/${vehicleId}/usage`, record);
      console.log('✅ Vehicle usage record added successfully:', response.data);
    return response.data;
    } catch (error: any) {
      console.error(`❌ Error adding vehicle usage record to vehicle ${vehicleId}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data,
        record
      });
      throw error;
    }
  }

  async updateUsageRecord(id: number, record: Partial<VehicleUsageRecord>) {
    try {
      console.log(`📊 Updating vehicle usage record ${id}:`, record);
      const response = await api.put(`/vehicle-usage/${id}`, record);
      console.log('✅ Vehicle usage record updated successfully:', response.data);
    return response.data;
    } catch (error: any) {
      console.error(`❌ Error updating vehicle usage record ${id}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data,
        record
      });
      throw error;
    }
  }

  async deleteUsageRecord(id: number) {
    try {
      console.log(`📊 Deleting vehicle usage record ${id}`);
      const response = await api.delete(`/vehicle-usage/${id}`);
      console.log('✅ Vehicle usage record deleted successfully:', response.data);
    return response.data;
    } catch (error: any) {
      console.error(`❌ Error deleting vehicle usage record ${id}:`, {
        error,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  // Alerte
  async getVehicleAlerts(params?: { vehicleId?: number; type?: string }) {
    try {
      console.log('🚨 Fetching vehicle alerts with params:', params);
      const response = await api.get('/vehicle-alerts', { params });
      console.log('✅ Vehicle alerts fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching vehicle alerts:', {
        error,
        status: error.response?.status,
        data: error.response?.data,
        params
      });
      throw error;
    }
  }
} 