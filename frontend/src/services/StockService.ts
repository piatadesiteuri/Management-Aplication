import api from './api';

export interface StockItem {
  id: number;
  product_id: number;
  supplier_id: number;
  product_name: string;
  supplier_name: string;
  current_stock: number;
  min_stock_level: number;
  max_stock_level: number;
  unit_price: number;
  unit: string;
  last_updated: string;
}

export interface StockHistoryItem {
  id: number;
  product_id: number;
  supplier_id: number;
  product_name: string;
  supplier_name: string;
  change_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'LOSS' | 'EXPIRED';
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  created_by: number;
  created_at: string;
}

export interface StockAlert {
  id: number;
  product_id: number;
  product_name: string;
  supplier_name: string;
  current_stock: number;
  min_stock_level: number;
  alert_type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  type: string;
  status: 'unread' | 'read';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  created_at: string;
}

export class StockService {
  // Obține toate produsele din stoc
  async getStockItems(): Promise<StockItem[]> {
    try {
      const response = await api.get('/stock/items');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching stock items:', error);
      // Fallback la API-ul existent pentru produse
      try {
        const response = await api.get('/supply/products');
        return response.data.data.map((product: any) => ({
          id: product.id,
          productId: product.id,
          supplierId: 1, // Default supplier
          productName: product.name,
          productCode: product.code,
          supplierName: 'Furnizor Default',
          currentStock: product.current_stock || 0,
          minStockLevel: product.min_stock || 0,
          maxStockLevel: product.max_stock || 1000,
          unitPrice: product.unit_price || 0,
          unit: product.unit || 'buc',
          lastUpdated: product.updated_at,
          stockStatus: product.stock_status || 'OK'
        }));
      } catch (fallbackError) {
        console.error('❌ Fallback API also failed:', fallbackError);
        throw error;
      }
    }
  }

  // Obține istoricul stocului pentru un produs
  async getStockHistory(productId: number, limit: number = 50): Promise<StockHistoryItem[]> {
    try {
      const response = await api.get(`/stock/history/${productId}?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching stock history:', error);
      throw error;
    }
  }

  // Obține alertele de stoc
  static async getStockAlerts(): Promise<StockAlert[]> {
    try {
      const response = await api.get('/stock/alerts');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching stock alerts:', error);
      return [];
    }
  }

  // Obține notificările
  static async getNotifications(): Promise<NotificationItem[]> {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      return [];
    }
  }

  // Obține statisticile stocului
  static async getStockStatistics(): Promise<any> {
    try {
      const response = await api.get('/stock/statistics');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching stock statistics:', error);
      return {
        total_products: 0,
        total_value: 0,
        low_stock_count: 0,
        out_of_stock_count: 0
      };
    }
  }

  // Actualizează stocul
  static async updateStock(productId: number, supplierId: number, newStock: number, reason: string): Promise<void> {
    try {
      await api.post('/stock/update', {
        product_id: productId,
        supplier_id: supplierId,
        new_stock: newStock,
        reason: reason
      });
    } catch (error) {
      console.error('❌ Error updating stock:', error);
      throw error;
    }
  }

  // Marchează notificarea ca citită
  static async markNotificationAsRead(notificationId: number): Promise<void> {
    try {
      await api.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  // Actualizează stocul unui produs
  async updateStock(productId: number, supplierId: number, newStock: number, reason: string): Promise<void> {
    try {
      await api.put(`/stock/update`, {
        product_id: productId,
        supplier_id: supplierId,
        new_stock: newStock,
        reason: reason
      });
    } catch (error) {
      console.error('❌ Error updating stock:', error);
      throw error;
    }
  }

  // Obține alertele de stoc
  async getStockAlerts(): Promise<StockAlert[]> {
    try {
      const response = await api.get('/stock/alerts');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching stock alerts:', error);
      throw error;
    }
  }

  // Obține notificările pentru utilizatorul curent
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      throw error;
    }
  }

  // Marchează o notificare ca citită
  async markNotificationAsRead(notificationId: number): Promise<void> {
    try {
      await api.put(`/notifications/${notificationId}`, { status: 'read' });
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  // Marchează toate notificările ca citite
  async markAllNotificationsAsRead(): Promise<void> {
    try {
      await api.put('/notifications/read-all');
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Obține numărul de notificări necitite
  async getUnreadNotificationsCount(): Promise<number> {
    try {
      const response = await api.get('/notifications');
      const notifications = response.data;
      return notifications.filter((n: NotificationItem) => n.status === 'unread').length;
    } catch (error) {
      console.error('❌ Error fetching unread notifications count:', error);
      return 0;
    }
  }

  // Confirmă primirea unei livrări
  async confirmDelivery(eventId: number, receivedItems: { productId: number; receivedQuantity: number }[]): Promise<void> {
    try {
      await api.post(`/stock/confirm-delivery`, {
        event_id: eventId,
        received_items: receivedItems
      });
    } catch (error) {
      console.error('❌ Error confirming delivery:', error);
      throw error;
    }
  }

  // Obține produsele cu stoc scăzut
  async getLowStockItems(): Promise<StockItem[]> {
    try {
      const response = await api.get('/stock/low-stock');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching low stock items:', error);
      throw error;
    }
  }

  // Obține statistici stoc
  async getStockStatistics(): Promise<{
    total_products: number;
    total_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
    recent_movements: number;
  }> {
    try {
      const response = await api.get('/stock/statistics');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching stock statistics:', error);
      throw error;
    }
  }

  // Obține o cerere de materiale specifică după ID
  static async getMaterialRequestById(id: number): Promise<any> {
    try {
      const response = await api.get(`/material-requests/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching material request by ID:', error);
      throw error;
    }
  }
}

export default new StockService();
