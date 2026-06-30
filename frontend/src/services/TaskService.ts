import api from './api';

export interface Task {
  id: number;
  title: string;
  description?: string;
  assigned_to: number;
  assigned_by: number;
  department_id?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  due_date?: string;
  estimated_hours?: number;
  actual_hours: number;
  dependencies?: number[];
  attachments?: string[];
  tags?: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
  // Joined fields
  assigned_to_user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  assigned_by_user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  department?: {
    id: number;
    name: string;
  };
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface TaskHistory {
  id: number;
  task_id: number;
  user_id: number;
  action: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  due_today: number;
  due_this_week: number;
  by_priority: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  by_department: Array<{
    department_id: number;
    department_name: string;
    count: number;
  }>;
}

export interface TaskFilters {
  assigned_to?: number;
  assigned_by?: number;
  department_id?: number;
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TaskResponse {
  tasks: Task[];
  total: number;
}

class TaskService {
  // Obține toate task-urile cu filtrare
  async getTasks(filters: TaskFilters = {}): Promise<TaskResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/tasks?${params.toString()}`);
    return response.data;
  }

  // Obține un task după ID
  async getTaskById(id: number): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  }

  // Creează un task nou
  async createTask(taskData: Partial<Task>): Promise<Task> {
    const response = await api.post('/tasks', taskData);
    return response.data;
  }

  // Actualizează un task
  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    const response = await api.put(`/tasks/${id}`, updates);
    return response.data;
  }

  // Șterge un task
  async deleteTask(id: number): Promise<void> {
    await api.delete(`/tasks/${id}`);
  }

  // Obține comentariile unui task
  async getTaskComments(taskId: number): Promise<TaskComment[]> {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data;
  }

  // Adaugă un comentariu la task
  async addTaskComment(taskId: number, comment: string): Promise<TaskComment> {
    const response = await api.post(`/tasks/${taskId}/comments`, { comment });
    return response.data;
  }

  // Obține istoricul unui task
  async getTaskHistory(taskId: number): Promise<TaskHistory[]> {
    const response = await api.get(`/tasks/${taskId}/history`);
    return response.data;
  }

  // Obține statisticile task-urilor
  async getTaskStats(userId?: number): Promise<TaskStats> {
    const params = userId ? `?user_id=${userId}` : '';
    const response = await api.get(`/tasks/stats${params}`);
    return response.data;
  }

  // Marchează un task ca completat
  async completeTask(id: number, actualHours?: number): Promise<Task> {
    console.log('✅ TaskService.completeTask called with id:', id, 'actualHours:', actualHours);
    try {
      const response = await api.post(`/tasks/${id}/complete`, { actual_hours: actualHours });
      console.log('✅ TaskService.completeTask success:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ TaskService.completeTask error:', error);
      throw error;
    }
  }

  // Marchează un task ca în progres
  async startTask(id: number): Promise<Task> {
    console.log('🚀 TaskService.startTask called with id:', id);
    console.log('🔑 Current token:', localStorage.getItem('jwt_token') ? 'EXISTS' : 'MISSING');
    
    try {
      console.log('📡 Making request to:', `/api/tasks/${id}/start`);
      const response = await api.post(`/tasks/${id}/start`);
      console.log('✅ TaskService.startTask success:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ TaskService.startTask error:', error);
      console.error('❌ Error response:', (error as any).response?.data);
      console.error('❌ Error status:', (error as any).response?.status);
      throw error;
    }
  }

  // Anulează un task
  async cancelTask(id: number, reason?: string): Promise<Task> {
    console.log('❌ TaskService.cancelTask called with id:', id, 'reason:', reason);
    try {
      const response = await api.post(`/tasks/${id}/cancel`, { reason });
      console.log('✅ TaskService.cancelTask success:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ TaskService.cancelTask error:', error);
      throw error;
    }
  }

  // Obține task-urile pentru utilizatorul curent
  async getMyTasks(filters: TaskFilters = {}): Promise<TaskResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/tasks/my-tasks?${params.toString()}`);
    return response.data;
  }

  // Obține task-urile create de utilizatorul curent
  async getTasksCreatedByMe(filters: TaskFilters = {}): Promise<TaskResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/tasks/created-by-me?${params.toString()}`);
    return response.data;
  }



  // Utilități pentru formatare
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'CRITICAL': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'yellow';
      case 'LOW': return 'green';
      default: return 'gray';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'yellow';
      case 'IN_PROGRESS': return 'blue';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'CRITICAL': return 'Critic';
      case 'HIGH': return 'Ridicat';
      case 'MEDIUM': return 'Mediu';
      case 'LOW': return 'Scăzut';
      default: return priority;
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'În așteptare';
      case 'IN_PROGRESS': return 'În progres';
      case 'COMPLETED': return 'Completat';
      case 'CANCELLED': return 'Anulat';
      default: return status;
    }
  }

  formatDueDate(dueDate: string): string {
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Întârziat cu ${Math.abs(diffDays)} zile`;
    } else if (diffDays === 0) {
      return 'Astăzi';
    } else if (diffDays === 1) {
      return 'Mâine';
    } else if (diffDays <= 7) {
      return `În ${diffDays} zile`;
    } else {
      return date.toLocaleDateString('ro-RO');
    }
  }

  isOverdue(task: Task): boolean {
    if (!task.due_date || task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      return false;
    }
    return new Date(task.due_date) < new Date();
  }

  isDueToday(task: Task): boolean {
    if (!task.due_date) return false;
    const today = new Date();
    const dueDate = new Date(task.due_date);
    return dueDate.toDateString() === today.toDateString();
  }
}

export default new TaskService(); 