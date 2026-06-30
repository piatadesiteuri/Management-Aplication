import api from './api';

export interface Department {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export class DepartmentService {
  async getDepartments(): Promise<Department[]> {
    const response = await api.get('/departments');
    return response.data;
  }

  async getDepartment(id: number): Promise<Department> {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  }

  async getUserDepartments(userId: number): Promise<Department[]> {
    const response = await api.get(`/departments/user/${userId}`);
    return response.data;
  }

  async createDepartment(department: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department> {
    const response = await api.post('/departments', department);
    return response.data;
  }

  async updateDepartment(id: number, department: Partial<Department>): Promise<Department> {
    const response = await api.put(`/departments/${id}`, department);
    return response.data;
  }

  async deleteDepartment(id: number): Promise<void> {
    await api.delete(`/departments/${id}`);
  }
}

export default new DepartmentService(); 