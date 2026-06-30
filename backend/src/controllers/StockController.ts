import { Request, Response } from 'express';
import pool from '../config/database';

export class StockController {
  // Obține toate produsele din stoc
  async getStockItems(req: Request, res: Response) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          ps.id,
          ps.product_id,
          ps.supplier_id,
          p.name as product_name,
          s.name as supplier_name,
          ps.current_stock,
          ps.min_stock_level,
          ps.max_stock_level,
          ps.unit_price,
          ps.last_updated
        FROM product_stock ps
        JOIN products p ON ps.product_id = p.id
        JOIN suppliers s ON ps.supplier_id = s.id
        ORDER BY ps.last_updated DESC
      `);
      
      res.json(rows);
    } catch (error) {
      console.error('Error fetching stock items:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Obține istoricul stocului pentru un produs
  async getStockHistory(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { limit = 50 } = req.query;
      
      const [rows] = await pool.execute(`
        SELECT 
          sh.id,
          sh.product_id,
          sh.supplier_id,
          p.name as product_name,
          s.name as supplier_name,
          sh.change_type,
          sh.quantity_change,
          sh.previous_stock,
          sh.new_stock,
          sh.reason,
          sh.created_by,
          sh.created_at
        FROM stock_history sh
        JOIN products p ON sh.product_id = p.id
        JOIN suppliers s ON sh.supplier_id = s.id
        WHERE sh.product_id = ?
        ORDER BY sh.created_at DESC
        LIMIT ?
      `, [productId, parseInt(limit as string)]);
      
      res.json(rows);
    } catch (error) {
      console.error('Error fetching stock history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Actualizează stocul unui produs
  async updateStock(req: Request, res: Response) {
    try {
      const { product_id, supplier_id, new_stock, reason } = req.body;
      const userId = (req as any).user.id;
      
      // Obținem stocul curent
      const [currentStockRows] = await pool.execute(
        'SELECT current_stock FROM product_stock WHERE product_id = ? AND supplier_id = ?',
        [product_id, supplier_id]
      );
      
      if ((currentStockRows as any[]).length === 0) {
        return res.status(404).json({ error: 'Product stock not found' });
      }
      
      const currentStock = (currentStockRows as any[])[0].current_stock;
      const quantityChange = new_stock - currentStock;
      
      // Actualizăm stocul
      await pool.execute(
        'UPDATE product_stock SET current_stock = ?, last_updated = NOW() WHERE product_id = ? AND supplier_id = ?',
        [new_stock, product_id, supplier_id]
      );
      
      // Adăugăm în istoric
      await pool.execute(`
        INSERT INTO stock_history 
        (product_id, supplier_id, change_type, quantity_change, previous_stock, new_stock, reason, created_by)
        VALUES (?, ?, 'ADJUSTMENT', ?, ?, ?, ?, ?)
      `, [product_id, supplier_id, quantityChange, currentStock, new_stock, reason, userId]);
      
      res.json({ success: true, message: 'Stock updated successfully' });
    } catch (error) {
      console.error('Error updating stock:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Obține alertele de stoc
  async getStockAlerts(req: Request, res: Response) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          ps.id,
          ps.product_id,
          ps.supplier_id,
          p.name as product_name,
          s.name as supplier_name,
          ps.current_stock,
          ps.min_stock_level,
          CASE 
            WHEN ps.current_stock = 0 THEN 'OUT_OF_STOCK'
            WHEN ps.current_stock <= ps.min_stock_level THEN 'LOW_STOCK'
            ELSE 'NORMAL'
          END as alert_type,
          CASE 
            WHEN ps.current_stock = 0 THEN 'CRITICAL'
            WHEN ps.current_stock <= ps.min_stock_level THEN 'HIGH'
            ELSE 'LOW'
          END as severity
        FROM product_stock ps
        JOIN products p ON ps.product_id = p.id
        JOIN suppliers s ON ps.supplier_id = s.id
        WHERE ps.current_stock <= ps.min_stock_level
        ORDER BY ps.current_stock ASC
      `);
      
      res.json(rows);
    } catch (error) {
      console.error('Error fetching stock alerts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Obține notificările pentru utilizatorul curent
  async getNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      
      const [rows] = await pool.execute(`
        SELECT 
          n.id,
          n.user_id,
          n.title,
          n.message,
          n.data,
          n.is_read,
          n.type,
          n.status,
          n.created_at
        FROM notifications n
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
      `, [userId]);
      
      res.json(rows);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Marchează o notificare ca citită
  async markNotificationAsRead(req: Request, res: Response) {
    try {
      const { notificationId } = req.params;
      const userId = (req as any).user.id;
      
      await pool.execute(
        'UPDATE notifications SET status = "read", is_read = TRUE WHERE id = ? AND user_id = ?',
        [notificationId, userId]
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Marchează toate notificările ca citite
  async markAllNotificationsAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      
      await pool.execute(
        'UPDATE notifications SET status = "read", is_read = TRUE WHERE user_id = ? AND status = "unread"',
        [userId]
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Obține numărul de notificări necitite
  async getUnreadNotificationsCount(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND status = "unread"',
        [userId]
      );
      
      res.json({ count: (rows as any[])[0].count });
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Confirmă primirea unei livrări
  async confirmDelivery(req: Request, res: Response) {
    try {
      const { event_id, received_items } = req.body;
      const userId = (req as any).user.id;
      
      // Actualizăm statusul evenimentului
      await pool.execute(
        'UPDATE calendar_events SET metadata = JSON_SET(metadata, "$.deliveryStatus", "DELIVERED") WHERE id = ?',
        [event_id]
      );
      
      // Actualizăm stocul pentru fiecare produs
      for (const item of received_items) {
        const { productId, receivedQuantity } = item;
        
        // Obținem stocul curent
        const [currentStockRows] = await pool.execute(
          'SELECT current_stock FROM product_stock WHERE product_id = ?',
          [productId]
        );
        
        if ((currentStockRows as any[]).length > 0) {
          const currentStock = (currentStockRows as any[])[0].current_stock;
          const newStock = currentStock + receivedQuantity;
          
          // Actualizăm stocul
          await pool.execute(
            'UPDATE product_stock SET current_stock = ?, last_updated = NOW() WHERE product_id = ?',
            [newStock, productId]
          );
          
          // Adăugăm în istoric
          await pool.execute(`
            INSERT INTO stock_history 
            (product_id, supplier_id, change_type, quantity_change, previous_stock, new_stock, reason, created_by, event_id)
            VALUES (?, (SELECT supplier_id FROM event_transport_orders WHERE event_id = ? AND product_id = ? LIMIT 1), 'IN', ?, ?, ?, 'Livrare confirmată', ?, ?)
          `, [productId, event_id, productId, receivedQuantity, currentStock, newStock, userId, event_id]);
        }
      }
      
      // Creăm notificare pentru inspector
      await pool.execute(`
        INSERT INTO notifications (user_id, event_id, title, message, type, priority)
        VALUES (
          (SELECT user_id FROM calendar_events WHERE id = ?),
          ?,
          'Livrare confirmată',
          'Livrarea pentru evenimentul #? a fost confirmată de magazioner.',
          'DELIVERY_CONFIRMED',
          'MEDIUM'
        )
      `, [event_id, event_id, event_id]);
      
      res.json({ success: true, message: 'Delivery confirmed successfully' });
    } catch (error) {
      console.error('Error confirming delivery:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Obține produsele cu stoc scăzut
  async getLowStockItems(req: Request, res: Response) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          ps.id,
          ps.product_id,
          ps.supplier_id,
          p.name as product_name,
          s.name as supplier_name,
          ps.current_stock,
          ps.min_stock_level,
          ps.max_stock_level,
          ps.unit_price,
          ps.last_updated
        FROM product_stock ps
        JOIN products p ON ps.product_id = p.id
        JOIN suppliers s ON ps.supplier_id = s.id
        WHERE ps.current_stock <= ps.min_stock_level
        ORDER BY ps.current_stock ASC
      `);
      
      res.json(rows);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Obține statistici stoc
  async getStockStatistics(req: Request, res: Response) {
    try {
      const [totalProductsRows] = await pool.execute('SELECT COUNT(*) as count FROM product_stock');
      const [totalValueRows] = await pool.execute('SELECT SUM(current_stock * unit_price) as total FROM product_stock');
      const [lowStockRows] = await pool.execute('SELECT COUNT(*) as count FROM product_stock WHERE current_stock <= min_stock_level');
      const [outOfStockRows] = await pool.execute('SELECT COUNT(*) as count FROM product_stock WHERE current_stock = 0');
      const [recentMovementsRows] = await pool.execute('SELECT COUNT(*) as count FROM stock_history WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
      
      res.json({
        total_products: (totalProductsRows as any[])[0].count,
        total_value: (totalValueRows as any[])[0].total || 0,
        low_stock_count: (lowStockRows as any[])[0].count,
        out_of_stock_count: (outOfStockRows as any[])[0].count,
        recent_movements: (recentMovementsRows as any[])[0].count
      });
    } catch (error) {
      console.error('Error fetching stock statistics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new StockController();
