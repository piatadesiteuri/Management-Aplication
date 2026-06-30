import { Request, Response } from 'express';
import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { sendNotification } from '../app';
import { TraceabilityService } from '../services/TraceabilityService';

export const MaterialRequestController = {
  // Creează o cerere de materiale
  createRequest: async (req: Request, res: Response) => {
    try {
      const { product_id, quantity_requested, priority, reason, requester_id } = req.body;
      
      console.log('📋 Creating material request:', {
        product_id,
        quantity_requested,
        priority,
        reason,
        requester_id
      });
      
      // Validează datele
      if (!product_id || !quantity_requested || !requester_id) {
        return res.status(400).json({
          success: false,
          message: 'Datele obligatorii lipsesc'
        });
      }
      
      // Creează cererea
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO material_requests 
         (product_id, requester_id, quantity_requested, priority, reason, status)
         VALUES (?, ?, ?, ?, ?, 'PENDING')`,
        [product_id, requester_id, quantity_requested, priority, reason]
      );
      
      const requestId = result.insertId;
      
      // Obține detaliile cererii create
      const [requestDetails] = await pool.execute<RowDataPacket[]>(
        `SELECT mr.*, p.name as product_name, s.name as supplier_name, u.first_name, u.last_name
         FROM material_requests mr
         LEFT JOIN products p ON mr.product_id = p.id
         LEFT JOIN suppliers s ON mr.supplier_id = s.id
         LEFT JOIN users u ON mr.requester_id = u.id
         WHERE mr.id = ?`,
        [requestId]
      );
      
      // Trimite notificare inspectorilor
      await sendNotificationToInspectors(requestDetails[0]);
      
      // Creează audit entry pentru crearea cererii
      await TraceabilityService.auditMaterialRequest({
        request_id: requestId,
        action_type: 'CREATED',
        performed_by: requester_id,
        new_values: {
          product_id,
          quantity_requested,
          priority,
          reason,
          status: 'PENDING'
        },
        comments: 'Cerere de materiale creată',
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      res.status(201).json({
        success: true,
        message: 'Cererea a fost creată cu succes',
        data: requestDetails[0]
      });
      
    } catch (error) {
      console.error('❌ Error creating material request:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la crearea cererii',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  // Obține cererile pentru un utilizator
  getRequests: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.roles[0]; // Take first role
      
      let query = `
        SELECT mr.*, p.name as product_name, p.unit as product_unit, s.name as supplier_name,
               u.first_name as requester_first_name, u.last_name as requester_last_name,
               se.event_id as transport_event_id
        FROM material_requests mr
        LEFT JOIN products p ON mr.product_id = p.id
        LEFT JOIN suppliers s ON mr.supplier_id = s.id
        LEFT JOIN users u ON mr.requester_id = u.id
        LEFT JOIN supply_events se ON mr.id = se.request_id
      `;
      
      const params: any[] = [];
      
      // Filtrează cererile în funcție de rol
      if (userRole === 'INSPECTOR' || userRole === 'SUPER_ADMIN') {
        // Inspectorii văd toate cererile
        query += ' ORDER BY mr.created_at DESC';
      } else {
        // Alții văd doar cererile lor
        query += ' WHERE mr.requester_id = ? ORDER BY mr.created_at DESC';
        params.push(userId);
      }
      
      const [requests] = await pool.execute<RowDataPacket[]>(query, params);
      
      res.json({
        success: true,
        data: requests
      });
      
    } catch (error) {
      console.error('❌ Error fetching requests:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la obținerea cererilor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  // Aprobă o cerere
  approveRequest: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { quantity_approved, comments, transport_date, supplier_id, create_transport_event } = req.body;
      const approverId = req.user!.id;
      
      // Actualizează cererea
      await pool.execute(
        `UPDATE material_requests 
         SET status = 'APPROVED', approved_by = ?, approved_at = NOW(), quantity_approved = ?
         WHERE id = ?`,
        [approverId, quantity_approved || req.body.quantity_requested, id]
      );
      
      // Obține detaliile cererii
      const [requestDetails] = await pool.execute<RowDataPacket[]>(
        `SELECT mr.*, p.name as product_name, s.name as supplier_name, u.first_name, u.last_name
         FROM material_requests mr
         LEFT JOIN products p ON mr.product_id = p.id
         LEFT JOIN suppliers s ON mr.supplier_id = s.id
         LEFT JOIN users u ON mr.requester_id = u.id
         WHERE mr.id = ?`,
        [id]
      );
      
      let transportEventId = null;
      
      // Creează evenimentul de transport dacă este solicitat
      if (create_transport_event && transport_date && supplier_id) {
        try {
          console.log('🚚 Creating transport event for approved material request...');
          
          // Obținem prețul produsului și detaliile furnizorului
          const [productPrice] = await pool.execute<RowDataPacket[]>(
            `SELECT unit_price FROM products WHERE id = ?`,
            [requestDetails[0].product_id]
          );
          
          const [supplierDetails] = await pool.execute<RowDataPacket[]>(
            `SELECT name, contact_person, phone, email, address, city, country 
             FROM suppliers WHERE id = ? AND is_active = TRUE`,
            [supplier_id]
          );
          
          const unitPrice = productPrice[0]?.unit_price || 0;
          const quantity = quantity_approved || requestDetails[0].quantity_requested;
          const totalValue = (unitPrice * quantity).toFixed(2);
          const supplier = supplierDetails[0] || {};
          
          // Creează evenimentul în calendar
          const [transportResult] = await pool.execute<ResultSetHeader>(
            `INSERT INTO calendar_events 
             (title, description, start_time, end_time, type, user_id, status, priority, approval_status, metadata)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              `Livrare ${requestDetails[0].product_name}`,
              `Eveniment de transport creat automat din cererea de materiale MR-${requestDetails[0].request_number}. ${comments || ''}`,
              transport_date,
              transport_date,
              'TRANSPORT_DELIVERY',
              approverId,
              'active',
              'MEDIUM',
              'APPROVED',
              JSON.stringify({
                // Detalii cerere de materiale
                material_request_id: requestDetails[0].id,
                request_number: requestDetails[0].request_number,
                requester_name: `${requestDetails[0].first_name} ${requestDetails[0].last_name}`,
                reason: requestDetails[0].reason,
                priority: requestDetails[0].priority,
                approved_by: approverId,
                approved_at: new Date().toISOString(),
                
                // Detalii produs
                product_id: requestDetails[0].product_id,
                product_name: requestDetails[0].product_name,
                quantity: quantity,
                unit: requestDetails[0].product_unit || 'buc',
                unit_price: unitPrice,
                total_value: totalValue,
                
                // Detalii furnizor (obținute din supplier_id)
                supplier_id: supplier_id,
                supplier_name: supplier.name || 'N/A',
                supplier_contact: supplier.contact_person || 'N/A',
                supplier_phone: supplier.phone || 'N/A',
                supplier_email: supplier.email || 'N/A',
                supplier_address: `${supplier.address || ''}, ${supplier.city || ''}, ${supplier.country || ''}`.replace(/^, |, $/g, ''),
                
                // Detalii transport
                transport_date: transport_date,
                transport_type: 'SUPPLY_DELIVERY',
                transport_status: 'PLANNED',
                
                // Detalii locație (depozit de livrare)
                delivery_location: {
                  name: 'Depozit Principal DSP Dolj',
                  address: 'Str. Tabaci nr. 7, Craiova, Dolj',
                  contact_person: 'Magazioner Test',
                  phone: '0251-310067',
                  coordinates: '44.3192, 23.7949'
                },
                
                // Detalii pentru completarea automată a formularului de transport
                transport_form_data: {
                  // Date furnizor
                  supplier_name: supplier.name || 'N/A',
                  supplier_contact: supplier.contact_person || 'N/A',
                  supplier_phone: supplier.phone || 'N/A',
                  supplier_email: supplier.email || 'N/A',
                  supplier_address: `${supplier.address || ''}, ${supplier.city || ''}, ${supplier.country || ''}`.replace(/^, |, $/g, ''),
                  
                  // Date produs
                  product_name: requestDetails[0].product_name,
                  product_quantity: quantity,
                  product_unit: requestDetails[0].product_unit || 'buc',
                  product_price: unitPrice,
                  product_total: totalValue,
                  
                  // Date transport
                  transport_date: transport_date,
                  delivery_address: 'Str. Tabaci nr. 7, Craiova, Dolj',
                  contact_person: 'Magazioner Test',
                  contact_phone: '0251-310067',
                  
                  // Date comandă
                  order_number: `CMD-${requestDetails[0].request_number}`,
                  order_date: new Date().toISOString().split('T')[0],
                  delivery_term: transport_date,
                  payment_terms: '30 zile',
                  
                  // Comentarii
                  comments: comments || '',
                  notes: `Eveniment de transport creat automat din cererea de materiale MR-${requestDetails[0].request_number}`
                }
              })
            ]
          );
          
          transportEventId = transportResult.insertId;
          
          // Creează legătura în supply_events
          await pool.execute(
            `INSERT INTO supply_events 
             (request_id, event_id, created_by)
             VALUES (?, ?, ?)`,
            [
              requestDetails[0].id,
              transportEventId,
              approverId
            ]
          );
          
          console.log(`✅ Transport event created with ID: ${transportEventId}`);
          
        } catch (transportError) {
          console.error('❌ Error creating transport event:', transportError);
          // Nu oprește procesul de aprobare dacă crearea evenimentului eșuează
        }
      }
      
      // Trimite notificare solicitantului
      await sendNotificationToRequester(requestDetails[0], 'APPROVED');
      
      // Creează audit entry pentru aprobarea cererii
      await TraceabilityService.auditMaterialRequest({
        request_id: parseInt(id),
        action_type: 'APPROVED',
        performed_by: approverId,
        old_values: {
          status: 'PENDING',
          quantity_approved: 0
        },
        new_values: {
          status: 'APPROVED',
          quantity_approved: quantity_approved || requestDetails[0].quantity_requested,
          approved_by: approverId,
          approved_at: new Date().toISOString()
        },
        comments: comments || 'Cerere aprobată',
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      // Dacă s-a creat eveniment de transport, creează audit entry pentru acesta
      if (create_transport_event && transportEventId) {
        await TraceabilityService.auditTransportEvent({
          event_id: transportEventId,
          action_type: 'CREATED',
          performed_by: approverId,
          new_values: {
            title: `Livrare ${requestDetails[0].product_name}`,
            type: 'TRANSPORT_DELIVERY',
            status: 'active',
            transport_date,
            supplier_id
          },
          comments: 'Eveniment de transport creat din cererea de materiale',
          ip_address: req.ip,
          user_agent: req.get('User-Agent')
        });
      }
      
      res.json({
        success: true,
        message: create_transport_event ? 'Cererea a fost aprobată și evenimentul de transport a fost creat' : 'Cererea a fost aprobată',
        data: {
          ...requestDetails[0],
          transport_event_id: transportEventId
        }
      });
      
    } catch (error) {
      console.error('❌ Error approving request:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la aprobarea cererii',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  // Respinge o cerere
  rejectRequest: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;
      const rejectorId = req.user!.id;
      
      // Actualizează cererea
      await pool.execute(
        `UPDATE material_requests 
         SET status = 'REJECTED', rejected_by = ?, rejected_at = NOW(), rejection_reason = ?
         WHERE id = ?`,
        [rejectorId, rejection_reason, id]
      );
      
      // Obține detaliile cererii
      const [requestDetails] = await pool.execute<RowDataPacket[]>(
        `SELECT mr.*, p.name as product_name, s.name as supplier_name, u.first_name, u.last_name
         FROM material_requests mr
         LEFT JOIN products p ON mr.product_id = p.id
         LEFT JOIN suppliers s ON mr.supplier_id = s.id
         LEFT JOIN users u ON mr.requester_id = u.id
         WHERE mr.id = ?`,
        [id]
      );
      
      // Trimite notificare solicitantului
      await sendNotificationToRequester(requestDetails[0], 'REJECTED');
      
      // Creează audit entry pentru respingerea cererii
      await TraceabilityService.auditMaterialRequest({
        request_id: parseInt(id),
        action_type: 'REJECTED',
        performed_by: rejectorId,
        old_values: {
          status: 'PENDING'
        },
        new_values: {
          status: 'REJECTED',
          rejected_by: rejectorId,
          rejected_at: new Date().toISOString(),
          rejection_reason
        },
        comments: `Cerere respinsă: ${rejection_reason}`,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      res.json({
        success: true,
        message: 'Cererea a fost respinsă',
        data: requestDetails[0]
      });
      
    } catch (error) {
      console.error('❌ Error rejecting request:', error);
      res.status(500).json({
        success: false,
        message: 'Eroare la respingerea cererii',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Obține o cerere specifică după ID
  getRequestById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const userRoles = (req as any).user.roles;

      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
          mr.id,
          mr.request_number,
          mr.product_id,
          p.name AS product_name,
          p.unit AS product_unit,
          mr.quantity_requested,
          mr.priority,
          mr.reason,
          mr.status,
          mr.requester_id,
          u.first_name AS requester_first_name,
          u.last_name AS requester_last_name,
          u.email AS requester_email,
          mr.created_at,
          mr.approved_at,
          mr.approved_by,
          approver.first_name AS approver_first_name,
          approver.last_name AS approver_last_name,
          mr.rejected_at,
          mr.rejected_by,
          rejector.first_name AS rejector_first_name,
          rejector.last_name AS rejector_last_name
        FROM material_requests mr
        JOIN products p ON mr.product_id = p.id
        JOIN users u ON mr.requester_id = u.id
        LEFT JOIN users approver ON mr.approved_by = approver.id
        LEFT JOIN users rejector ON mr.rejected_by = rejector.id
        WHERE mr.id = ?`,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Cererea de materiale nu a fost găsită.' 
        });
      }

      const request = rows[0];
      
      // Verifică dacă utilizatorul are dreptul să vadă această cerere
      const isInspector = userRoles.includes('INSPECTOR') || userRoles.includes('SUPER_ADMIN') || userRoles.includes('DEPARTMENT_ADMIN');
      const isRequester = request.requester_id === userId;
      
      if (!isInspector && !isRequester) {
        return res.status(403).json({ 
          success: false, 
          message: 'Nu aveți dreptul să vizualizați această cerere.' 
        });
      }

      res.status(200).json({ 
        success: true, 
        data: request 
      });
    } catch (error) {
      console.error('❌ Error fetching material request by ID:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Eroare la preluarea cererii de materiale.', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

// Funcție helper pentru trimiterea notificărilor inspectorilor
async function sendNotificationToInspectors(request: any) {
  try {
    // Obține toți inspectorii
    const [inspectors] = await pool.execute<RowDataPacket[]>(
      `SELECT id, first_name, last_name, email FROM users 
       WHERE role IN ('INSPECTOR', 'SUPER_ADMIN', 'DEPARTMENT_ADMIN')`
    );
    
    // Trimite notificare fiecărui inspector prin WebSocket și salvează în DB
    for (const inspector of inspectors) {
      const message = `📋 Nouă cerere de materiale: ${request.product_name} - Cantitate: ${request.quantity_requested} ${request.product_unit || 'buc'} - Solicitant: ${request.first_name} ${request.last_name}`;
      
      // Salvează în baza de date cu request_id
      await pool.execute(
        `INSERT INTO notifications (user_id, type, message, status, request_id, created_at)
         VALUES (?, 'MATERIAL_REQUEST', ?, 'unread', ?, NOW())`,
        [inspector.id, message, request.id]
      );
      
      // Trimite prin WebSocket
      sendNotification(inspector.id, {
        type: 'MATERIAL_REQUEST',
        message: message,
        request_id: request.id,
        product_name: request.product_name,
        quantity_requested: request.quantity_requested,
        product_unit: request.product_unit || 'buc',
        requester_name: `${request.first_name} ${request.last_name}`,
        priority: request.priority,
        reason: request.reason
      });
    }
    
    console.log(`📨 Notificări trimise la ${inspectors.length} inspectori (WebSocket + DB)`);
  } catch (error) {
    console.error('❌ Error sending notifications to inspectors:', error);
  }
}

// Funcție helper pentru trimiterea notificărilor solicitantului
async function sendNotificationToRequester(request: any, status: string) {
  try {
    const message = status === 'APPROVED' 
      ? `✅ Cererea ta pentru ${request.product_name} a fost aprobată!`
      : `❌ Cererea ta pentru ${request.product_name} a fost respinsă.`;
    
    // Salvează în baza de date
    await pool.execute(
      `INSERT INTO notifications (user_id, type, message, status, created_at)
       VALUES (?, 'MATERIAL_REQUEST_UPDATE', ?, 'unread', NOW())`,
      [request.requester_id, message]
    );
    
    // Trimite prin WebSocket
    sendNotification(request.requester_id, {
      type: 'MATERIAL_REQUEST_UPDATE',
      message: message,
      request_id: request.id,
      product_name: request.product_name,
      status: status
    });
    
    console.log(`📨 Notificare trimisă solicitantului: ${request.first_name} ${request.last_name} (WebSocket + DB)`);
  } catch (error) {
    console.error('❌ Error sending notification to requester:', error);
  }
}


