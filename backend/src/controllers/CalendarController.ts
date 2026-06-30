import { Request, Response } from 'express';
import pool from '../config/database';
import fs from 'fs';
import path from 'path';
import { ActivityLogService } from '../services/ActivityLogService';
import { TaskWorkflowService } from '../services/TaskWorkflowService';

export const CalendarController = {
    getEvents: async (req: Request, res: Response) => {
        try {
            console.log('👤 Request user:', req.user);
            if (!req.user) {
                return res.status(401).json({ message: 'Utilizator neautentificat' });
            }

            const { departmentId, userId, type, status, personal } = req.query;
            let query = `
                SELECT 
                    ce.*,
                    JSON_OBJECT(
                        'id', u.id,
                        'email', u.email,
                        'firstName', u.first_name,
                        'lastName', u.last_name
                    ) as user,
                    JSON_OBJECT(
                        'id', d.id,
                        'name', d.name,
                        'description', d.description
                    ) as department,
                    JSON_OBJECT(
                        'id', v.id,
                        'brand', v.brand,
                        'model', v.model,
                        'registration_number', v.registration_number,
                        'status', v.status
                    ) as vehicle,
                    (
                        SELECT COUNT(*) 
                        FROM event_assignments ea 
                        WHERE ea.event_id = ce.id
                    ) as assignments_count,
                    (
                        SELECT COUNT(*) 
                        FROM event_assignments ea 
                        WHERE ea.event_id = ce.id AND ea.user_id = ?
                    ) as is_assigned_to_current_user
                FROM calendar_events ce
                LEFT JOIN users u ON ce.user_id = u.id
                LEFT JOIN departments d ON ce.department_id = d.id
                LEFT JOIN vehicles v ON ce.vehicle_id = v.id
                WHERE 1=1
            `;
            const params: any[] = [req.user.id]; // Primul parametru pentru is_assigned_to_current_user

            // Logica de vizibilitate pentru evenimente
            if (!req.user.roles.includes('SUPER_ADMIN')) {
                // Pentru utilizatori normali, vedem:
                // 1. Evenimentele create de noi
                // 2. Toate evenimentele publice (is_private = 0 sau is_private = false)
                // 3. Evenimentele din departamentul nostru (dacă sunt DEPARTMENT_ADMIN/MANAGER)
                let visibilityConditions = ['(ce.user_id = ? OR ce.is_private = 0)'];
                params.push(req.user.id);
                
                // Dacă utilizatorul este DEPARTMENT_ADMIN sau MANAGER, adăugăm și evenimentele din departamentul său
                if (req.user.roles.includes('DEPARTMENT_ADMIN') || req.user.roles.includes('MANAGER')) {
                    // Obținem departamentele utilizatorului
                    const [userDepartments] = await pool.execute(
                        'SELECT department_id FROM department_users WHERE user_id = ?',
                        [req.user.id]
                    );
                    
                    if ((userDepartments as any[]).length > 0) {
                        const departmentIds = (userDepartments as any[]).map(d => d.department_id);
                        visibilityConditions.push(`ce.department_id IN (${departmentIds.map(() => '?').join(',')})`);
                        params.push(...departmentIds);
                    }
                }
                
                query += ` AND (${visibilityConditions.join(' OR ')})`;
            }

            // Filtre suplimentare (se aplică după logica de vizibilitate)
            if (departmentId) {
                query += ' AND ce.department_id = ?';
                params.push(departmentId);
            }

            if (userId) {
                query += ' AND ce.user_id = ?';
                params.push(userId);
            }

            if (type) {
                query += ' AND ce.type = ?';
                params.push(type);
            }

            if (status) {
                query += ' AND ce.status = ?';
                params.push(status);
            }

            // Filtru pentru evenimentele personale (la care utilizatorul este asignat)
            if (personal === 'true') {
                query += ' AND EXISTS (SELECT 1 FROM event_assignments ea WHERE ea.event_id = ce.id AND ea.user_id = ?)';
                params.push(req.user.id);
            }

            console.log('🔍 Executing query:', { query, params });
            const [events] = await pool.execute(query, params);
            console.log('📅 Found events:', events);
            res.json(events);
        } catch (error) {
            console.error('❌ Error fetching events:', error);
            res.status(500).json({ 
                message: 'Eroare la încărcarea evenimentelor',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    createEvent: async (req: Request, res: Response) => {
        try {
            const { 
                title, 
                description, 
                start, 
                end, 
                type, 
                status, 
                departmentId, 
                isPrivate,
                assignedUsers,
                vehicleId,
                location,
                stockProducts,
                transportData
            } = req.body;
            const userId = req.user?.id;

            console.log('📝 Backend createEvent received data:', {
                title,
                description,
                start,
                end,
                type,
                status,
                userId,
                departmentId,
                isPrivate,
                assignedUsersCount: assignedUsers?.length,
                vehicleId,
                location,
                stockProductsCount: stockProducts?.length,
                hasTransportData: !!transportData,
                transportDataKeys: transportData ? Object.keys(transportData) : [],
                orderItemsCount: transportData?.orderItems?.length
            });

            console.log('📝 Creating event with data:', {
                title,
                description,
                start,
                end,
                type,
                status,
                userId,
                departmentId,
                isPrivate,
                assignedUsers,
                vehicleId,
                location,
                stockProducts: stockProducts ? `${stockProducts.length} products` : 'none',
                transportData
            });

            // Convert ISO dates to MySQL datetime format, preserving local time
            const formatDate = (date: string) => {
                const d = new Date(date);
                // Folosim getFullYear, getMonth, etc. pentru a păstra timezone-ul local
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                const seconds = String(d.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            };

            const [result] = await pool.execute(
                `INSERT INTO calendar_events 
                (title, description, start_time, end_time, type, status, user_id, department_id, is_private, location, vehicle_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    title, 
                    description || null, 
                    formatDate(start), 
                    formatDate(end), 
                    type, 
                    status || 'PLANNED', 
                    userId, 
                    departmentId || null, 
                    isPrivate || false, 
                    location || null, 
                    vehicleId || null
                ]
            );

            const eventId = (result as any).insertId;

            // Gestionarea asignărilor de personal
            if (assignedUsers && Array.isArray(assignedUsers)) {
                try {
                    console.log('👥 Processing user assignments:', assignedUsers);
                    
                    if (assignedUsers.length > 0) {
                        // Verificăm că utilizatorii asignați există în baza de date
                        const [existingUsers] = await pool.execute(
                            `SELECT id FROM users WHERE id IN (${assignedUsers.map(() => '?').join(',')})`,
                            assignedUsers
                        );
                        
                        const validUserIds = (existingUsers as any[]).map(user => user.id);
                        console.log('✅ Valid user IDs found:', validUserIds);
                        
                        if (validUserIds.length > 0) {
                            const assignmentPromises = validUserIds.map((assignedUserId: number) => 
                                pool.execute(
                                    'INSERT INTO event_assignments (event_id, user_id, role, status) VALUES (?, ?, ?, ?)',
                                    [eventId, assignedUserId, 'PARTICIPANT', 'ACCEPTED']
                                )
                            );
                            await Promise.all(assignmentPromises);
                            console.log('✅ Successfully assigned users to event:', validUserIds);
                        }
                        
                        if (validUserIds.length !== assignedUsers.length) {
                            const invalidUserIds = assignedUsers.filter(id => !validUserIds.includes(id));
                            console.warn('⚠️ Some user IDs were invalid:', invalidUserIds);
                        }
                    } else {
                        console.log('ℹ️ No users to assign to this event');
                    }
                } catch (assignmentError) {
                    console.error('❌ Error assigning users to event:', assignmentError);
                    // Nu eșuăm crearea evenimentului dacă nu putem asigna utilizatori
                    // dar logăm eroarea pentru debugging
                }
            } else {
                console.log('ℹ️ No assignedUsers provided or invalid format');
            }

            // Gestionarea produselor pentru evenimente de stoc
            const stockEventTypes = ['STOCK_RECEPTION', 'STOCK_DISTRIBUTION', 'STOCK_MOVEMENT', 'INVENTORY_AUDIT'];
            if (stockEventTypes.includes(type) && stockProducts && Array.isArray(stockProducts)) {
                try {
                    console.log('📦 Processing stock products for stock event:', stockProducts);
                    
                    if (stockProducts.length > 0) {
                        const stockOperationPromises = stockProducts.map(async (product: any) => {
                            // Mapăm tipul evenimentului la tipul operației
                            const operationTypeMap: Record<string, string> = {
                                'STOCK_RECEPTION': 'RECEPTION',
                                'STOCK_DISTRIBUTION': 'DISTRIBUTION', 
                                'STOCK_MOVEMENT': 'MOVEMENT',
                                'INVENTORY_AUDIT': 'AUDIT'
                            };
                            
                            const operationType = operationTypeMap[type];
                            
                            return pool.execute(`
                                INSERT INTO event_stock_operations (
                                    event_id, product_id, operation_type, quantity, unit_cost,
                                    notes, created_by
                                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                            `, [
                                eventId, 
                                product.productId, 
                                operationType,
                                product.quantity,
                                product.unitCost || 0,
                                product.notes || `Adăugat din eveniment: ${title}`,
                                userId
                            ]);
                        });
                        
                        await Promise.all(stockOperationPromises);
                        console.log('✅ Successfully added stock operations to event:', stockProducts.length);
                    }
                } catch (stockError) {
                    console.error('❌ Error adding stock products to event:', stockError);
                    // Nu eșuăm crearea evenimentului dacă nu putem adăuga produsele
                    // dar logăm eroarea pentru debugging
                }
            } else if (stockEventTypes.includes(type)) {
                console.log('ℹ️ Stock event created without stock products - can be added later');
            }

            // Gestionarea produselor pentru evenimente operaționale normale (INSPECTION, MEETING, etc.)
            const operationalEventTypes = ['INSPECTION', 'MEETING', 'TRAINING', 'MAINTENANCE', 'TRAVEL'];
            console.log('🔍 Checking operational event materials:', {
                type,
                isOperationalType: operationalEventTypes.includes(type),
                hasStockProducts: !!stockProducts,
                stockProductsLength: stockProducts?.length,
                stockProductsType: Array.isArray(stockProducts) ? 'array' : typeof stockProducts
            });
            
            if (operationalEventTypes.includes(type) && stockProducts && Array.isArray(stockProducts)) {
                try {
                    console.log('📦 Processing materials for operational event:', {
                        eventId,
                        eventType: type,
                        productsCount: stockProducts.length,
                        products: stockProducts
                    });
                    
                    if (stockProducts.length > 0) {
                        console.log('🗃️ Attempting to insert materials into database...');
                        const materialPromises = stockProducts.map(async (product: any, index: number) => {
                            console.log(`📦 Processing material ${index + 1}:`, {
                                eventId,
                                productId: product.productId,
                                quantity: product.quantity,
                                unitCost: product.unitCost || 0,
                                userId
                            });
                            
                            try {
                                const result = await pool.execute(`
                                    INSERT INTO event_stock_operations (
                                        event_id, product_id, operation_type, quantity, unit_cost,
                                        notes, created_by, status
                                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                                `, [
                                    eventId, 
                                    product.productId, 
                                    'MOVEMENT', // Pentru evenimente operaționale, folosim MOVEMENT în loc de RESERVED
                                    product.quantity,
                                    product.unitCost || 0,
                                    product.notes || `Material pentru ${type}: ${title}`,
                                    userId,
                                    'PLANNED' // Status valid: PLANNED în loc de PENDING
                                ]);
                                console.log(`✅ Successfully inserted material ${index + 1}:`, result);
                                return result;
                            } catch (insertError) {
                                console.error(`❌ Failed to insert material ${index + 1}:`, insertError);
                                throw insertError;
                            }
                        });
                        
                        await Promise.all(materialPromises);
                        console.log('✅ Successfully added all materials to operational event:', stockProducts.length);
                        
                        // Verificăm că materialele au fost salvate
                        const [verifyMaterials] = await pool.execute(
                            'SELECT COUNT(*) as count FROM event_stock_operations WHERE event_id = ?',
                            [eventId]
                        );
                        console.log('🔍 Materials count in database after insert:', (verifyMaterials as any[])[0].count);
                    }
                } catch (materialError) {
                    console.error('❌ Error adding materials to operational event:', materialError);
                    console.error('❌ Full error details:', {
                        message: (materialError as any)?.message,
                        code: (materialError as any)?.code,
                        errno: (materialError as any)?.errno,
                        sqlState: (materialError as any)?.sqlState,
                        sqlMessage: (materialError as any)?.sqlMessage
                    });
                    // Nu eșuăm crearea evenimentului dacă nu putem adăuga materialele
                }
            }

            // Gestionarea datelor de transport pentru evenimente de transport
            const transportEventTypes = ['SUPPLY_ORDER', 'TRANSPORT_DELIVERY', 'TRANSPORT_PICKUP'];
            if (transportEventTypes.includes(type) && transportData) {
                try {
                    console.log('🚛 Processing transport data for transport event:', {
                        eventId,
                        eventType: type,
                        transportDataKeys: Object.keys(transportData),
                        orderItemsCount: transportData.orderItems?.length,
                        supplierName: transportData.supplierName,
                        totalValue: transportData.totalValue
                    });
                    
                    // Salvăm informațiile despre comandă în metadata
                    const metadata = {
                        transportType: type,
                        orderId: transportData.orderId,
                        supplierId: transportData.supplierId,
                        supplierName: transportData.supplierName,
                        supplierContact: transportData.supplierContact,
                        deliveryAddress: transportData.deliveryAddress,
                        totalValue: transportData.totalValue,
                        expectedDeliveryDate: transportData.expectedDeliveryDate,
                        deliveryStatus: transportData.deliveryStatus || 'PENDING',
                        deliveryNotes: transportData.deliveryNotes,
                        isOverdue: transportData.isOverdue || false
                    };
                    
                    console.log('📦 Saving transport metadata:', metadata);
                    
                    // Actualizăm evenimentul cu metadata-ul de transport
                    await pool.execute(
                        'UPDATE calendar_events SET metadata = ? WHERE id = ?',
                        [JSON.stringify(metadata), eventId]
                    );
                    
                    console.log('✅ Transport metadata saved to event:', eventId);
                    
                    // Salvăm fiecare item din comandă dacă există
                    if (transportData.orderItems && Array.isArray(transportData.orderItems) && transportData.orderItems.length > 0) {
                        console.log('📦 Processing transport order items:', transportData.orderItems.length);
                        
                        const orderPromises = transportData.orderItems.map(async (item: any, index: number) => {
                            console.log(`📦 Processing order item ${index + 1}:`, {
                                eventId,
                                productId: item.productId,
                                productName: item.productName,
                                supplierId: item.supplierId || transportData.supplierId,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                totalPrice: item.totalPrice,
                                expectedDeliveryDate: item.expectedDeliveryDate || transportData.expectedDeliveryDate
                            });
                            
                            return pool.execute(`
                                INSERT INTO event_transport_orders (
                                    event_id, product_id, product_name, supplier_id, supplier_name,
                                    quantity, unit_price, total_price, expected_delivery_date,
                                    status, notes, created_by
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `, [
                                eventId,
                                item.productId || null,
                                item.productName || 'Produs necunoscut',
                                item.supplierId || transportData.supplierId,
                                item.supplierName || transportData.supplierName,
                                item.quantity || 1,
                                item.unitPrice || 0,
                                item.totalPrice || 0,
                                item.expectedDeliveryDate || transportData.expectedDeliveryDate,
                                item.status || 'ORDERED',
                                item.notes || '',
                                userId
                            ]);
                        });
                        
                        await Promise.all(orderPromises);
                        console.log('✅ Successfully added transport order items to event:', transportData.orderItems.length);
                    } else {
                        console.log('ℹ️ No order items to process for transport event');
                    }
                } catch (transportError) {
                    console.error('❌ Error adding transport data to event:', transportError);
                    console.error('❌ Full transport error details:', {
                        message: (transportError as any)?.message,
                        code: (transportError as any)?.code,
                        errno: (transportError as any)?.errno,
                        sqlState: (transportError as any)?.sqlState,
                        sqlMessage: (transportError as any)?.sqlMessage
                    });
                    // Nu eșuăm crearea evenimentului dacă nu putem adăuga datele de transport
                    // dar logăm eroarea pentru debugging
                }
            } else if (transportEventTypes.includes(type)) {
                console.log('ℹ️ Transport event created without transport data - can be added later');
            }

            const [newEvent] = await pool.execute(
                'SELECT * FROM calendar_events WHERE id = ?',
                [eventId]
            );

            // Generare automată de task-uri pentru evenimente DSPD
            const dspdEventTypes = ['INSPECTION', 'MONITORING', 'WATER_QUALITY', 'AUDIT'];
            if (dspdEventTypes.includes(type) && assignedUsers && assignedUsers.length > 0) {
                try {
                    console.log('🎯 Generating tasks for DSPD event:', {
                        eventId,
                        eventType: type,
                        assignedUsersCount: assignedUsers.length,
                        firstAssignedUser: assignedUsers[0]
                    });

                    const workflowService = TaskWorkflowService.getInstance();
                    
                    // Generează task-uri pentru primul utilizator asignat
                    const taskIds = await workflowService.generateTasksForEvent(
                        eventId,
                        type,
                        assignedUsers[0], // Primul utilizator asignat va fi responsabil pentru task-uri
                        userId!
                    );

                    console.log('✅ Successfully generated tasks for DSPD event:', {
                        eventId,
                        taskIds,
                        taskCount: taskIds.length
                    });
                } catch (taskError) {
                    console.error('❌ Error generating tasks for DSPD event:', taskError);
                    // Nu eșuăm crearea evenimentului dacă nu putem genera task-urile
                    // dar logăm eroarea pentru debugging
                }
            } else if (dspdEventTypes.includes(type)) {
                console.log('ℹ️ DSPD event created without assigned users - tasks can be generated manually later');
            }

            // Log activitatea
            const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
            await ActivityLogService.logEventCreated(
                userId!, 
                eventId, 
                title, 
                type, 
                ipAddress
            );

            // Notificare pentru magazioner când se creează evenimente de transport
            console.log('🔍 Checking notification conditions:', { 
                type, 
                hasTransportData: !!transportData,
                transportDataKeys: transportData ? Object.keys(transportData) : [],
                transportDataValue: transportData
            });
            if (type === 'SUPPLY_ORDER' && transportData) {
                try {
                    console.log('🔔 Creating notification for warehouse keeper about transport event');
                    
                    // Găsim toți utilizatorii cu rolul WAREHOUSE_KEEPER
                    const [warehouseKeepers] = await pool.execute(`
                        SELECT u.id, u.email, u.first_name, u.last_name 
                        FROM users u 
                        JOIN user_roles ur ON u.id = ur.user_id 
                        JOIN roles r ON ur.role_id = r.id 
                        WHERE r.name = 'WAREHOUSE_KEEPER' AND u.is_active = 1
                    `);
                    
                    console.log('🔔 Warehouse keepers found:', (warehouseKeepers as any[]).length, warehouseKeepers);
                    
                    if ((warehouseKeepers as any[]).length > 0) {
                        const notificationPromises = (warehouseKeepers as any[]).map(async (keeper: any) => {
                            const message = `Eveniment nou de transport: ${title}. ${transportData.supplierName ? `Furnizor: ${transportData.supplierName}` : ''} ${transportData.orderItems?.length ? `(${transportData.orderItems.length} produse)` : ''}`;
                            
                            console.log('🔔 Creating notification for keeper:', keeper.id, keeper.email);
                            
                            // Salvăm notificarea în baza de date
                            const [notificationResult] = await pool.execute(`
                                INSERT INTO notifications (user_id, event_id, title, message, type, status) 
                                VALUES (?, ?, ?, ?, ?, ?)
                            `, [
                                keeper.id,
                                eventId,
                                'Eveniment Transport Nou',
                                message,
                                'TRANSPORT_EVENT',
                                'unread'
                            ]);
                            
                            const notificationId = (notificationResult as any).insertId;
                            console.log('✅ Notification created in DB:', notificationId);
                            
                            // Trimitem notificarea în timp real prin WebSocket
                            try {
                                const { sendNotification } = require('../app');
                                
                                const websocketNotification = {
                                    type: 'notification',
                                    id: notificationId,
                                    title: 'Eveniment Transport Nou',
                                    message: message,
                                    data: {
                                        eventId: eventId,
                                        eventTitle: title,
                                        supplierName: transportData.supplierName,
                                        totalValue: transportData.totalValue,
                                        orderItemsCount: transportData.orderItems?.length || 0,
                                        action: 'VIEW_EVENT'
                                    },
                                    timestamp: new Date().toISOString(),
                                    isRead: false
                                };
                                
                                sendNotification(keeper.id, websocketNotification);
                                console.log(`📡 WebSocket notification sent to warehouse keeper ${keeper.id} (${keeper.email})`);
                            } catch (wsError) {
                                console.error(`❌ Error sending WebSocket notification to keeper ${keeper.id}:`, wsError);
                            }
                            
                            return notificationResult;
                        });
                        
                        await Promise.all(notificationPromises);
                        console.log('✅ Notifications sent to warehouse keepers:', (warehouseKeepers as any[]).length);
                    } else {
                        console.log('ℹ️ No warehouse keepers found to notify');
                    }
                } catch (notificationError) {
                    console.error('❌ Error creating notifications for warehouse keepers:', notificationError);
                    // Nu eșuăm crearea evenimentului dacă nu putem trimite notificările
                }
            }

            console.log('✅ Event created successfully:', newEvent);
            res.status(201).json((newEvent as any[])[0]);
        } catch (error) {
            console.error('❌ Error creating event:', error);
            res.status(500).json({ 
                message: 'Eroare la crearea evenimentului',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    updateEvent: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { title, description, start, end, type, status, departmentId, isPrivate, location, vehicleId, assignedUsers, transportData } = req.body;
            const userId = req.user?.id;

            console.log('📝 Updating event with data:', {
                id,
                title,
                description,
                start,
                end,
                type,
                status,
                departmentId,
                isPrivate,
                location,
                vehicleId,
                assignedUsers,
                hasTransportData: !!transportData,
                transportDataKeys: transportData ? Object.keys(transportData) : []
            });

            // Verificăm dacă utilizatorul are dreptul să modifice evenimentul
            const [eventRows] = await pool.execute(
                'SELECT * FROM calendar_events WHERE id = ?',
                [id]
            );

            const event = (eventRows as any[])[0];
            if (!event) {
                return res.status(404).json({ message: 'Evenimentul nu a fost găsit' });
            }

            // Doar creatorul sau administratorii pot modifica evenimentul
            if (!(req.user?.roles.includes('SUPER_ADMIN') || req.user?.roles.includes('DEPARTMENT_ADMIN')) && 
                event.user_id !== userId) {
                return res.status(403).json({ message: 'Nu aveți permisiunea de a modifica acest eveniment' });
            }

            // Convert ISO dates to MySQL datetime format if provided, preserving local time
            const formatDate = (date: string) => {
                const d = new Date(date);
                // Folosim getFullYear, getMonth, etc. pentru a păstra timezone-ul local
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                const seconds = String(d.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            };

            await pool.execute(
                `UPDATE calendar_events 
                SET title = ?, description = ?, start_time = ?, end_time = ?, 
                    type = ?, status = ?, department_id = ?, is_private = ?, 
                    location = ?, vehicle_id = ?
                WHERE id = ?`,
                [
                    title, 
                    description || null, 
                    start ? formatDate(start) : event.start_time,
                    end ? formatDate(end) : event.end_time,
                    type, 
                    status, 
                    departmentId || null, 
                    isPrivate ? 1 : 0,
                    location || null,
                    vehicleId || null,
                    id
                ]
            );

            // Gestionarea asignărilor de personal pentru evenimente editate
            if (assignedUsers && Array.isArray(assignedUsers)) {
                try {
                    console.log('👥 Updating user assignments for event:', id, assignedUsers);
                    
                    // Șterge asignările existente
                    await pool.execute('DELETE FROM event_assignments WHERE event_id = ?', [id]);
                    console.log('🗑️ Deleted existing assignments for event:', id);
                    
                    if (assignedUsers.length > 0) {
                        // Verificăm că utilizatorii asignați există în baza de date
                        const [existingUsers] = await pool.execute(
                            `SELECT id FROM users WHERE id IN (${assignedUsers.map(() => '?').join(',')})`,
                            assignedUsers
                        );
                        
                        const validUserIds = (existingUsers as any[]).map(user => user.id);
                        console.log('✅ Valid user IDs found for update:', validUserIds);
                        
                        if (validUserIds.length > 0) {
                            const assignmentPromises = validUserIds.map((assignedUserId: number) => 
                                pool.execute(
                                    'INSERT INTO event_assignments (event_id, user_id, role, status) VALUES (?, ?, ?, ?)',
                                    [id, assignedUserId, 'PARTICIPANT', 'ACCEPTED']
                                )
                            );
                            await Promise.all(assignmentPromises);
                            console.log('✅ Successfully updated user assignments for event:', id, validUserIds);
                        }
                        
                        if (validUserIds.length !== assignedUsers.length) {
                            const invalidUserIds = assignedUsers.filter(uid => !validUserIds.includes(uid));
                            console.warn('⚠️ Some user IDs were invalid during update:', invalidUserIds);
                        }
                    } else {
                        console.log('ℹ️ No users to assign to this updated event');
                    }
                } catch (assignmentError) {
                    console.error('❌ Error updating user assignments:', assignmentError);
                    // Nu eșuăm actualizarea evenimentului dacă nu putem actualiza asignările
                }
            }

            // Gestionarea datelor de transport pentru evenimente de transport
            const transportEventTypes = ['SUPPLY_ORDER', 'TRANSPORT_DELIVERY', 'TRANSPORT_PICKUP'];
            if (transportEventTypes.includes(type) && transportData) {
                try {
                    console.log('🚛 Processing transport data update for transport event:', {
                        eventId: id,
                        eventType: type,
                        transportDataKeys: Object.keys(transportData),
                        orderItemsCount: transportData.orderItems?.length,
                        supplierName: transportData.supplierName,
                        totalValue: transportData.totalValue
                    });
                    
                    // Salvăm informațiile despre comandă în metadata
                    const metadata = {
                        transportType: type,
                        orderId: transportData.orderId,
                        supplierId: transportData.supplierId,
                        supplierName: transportData.supplierName,
                        supplierContact: transportData.supplierContact,
                        deliveryAddress: transportData.deliveryAddress,
                        totalValue: transportData.totalValue,
                        expectedDeliveryDate: transportData.expectedDeliveryDate,
                        deliveryStatus: transportData.deliveryStatus || 'PENDING',
                        deliveryNotes: transportData.deliveryNotes,
                        isOverdue: transportData.isOverdue || false
                    };
                    
                    console.log('📦 Updating transport metadata:', metadata);
                    
                    // Actualizăm evenimentul cu metadata-ul de transport
                    await pool.execute(
                        'UPDATE calendar_events SET metadata = ? WHERE id = ?',
                        [JSON.stringify(metadata), id]
                    );
                    
                    console.log('✅ Transport metadata updated for event:', id);
                    
                    // Obținem produsele existente pentru comparație
                    const [existingOrders] = await pool.execute(
                        'SELECT * FROM event_transport_orders WHERE event_id = ?',
                        [id]
                    );
                    const existingItems = existingOrders as any[];
                    console.log('📋 Existing order items:', existingItems.length);
                    
                    // Ștergem comenzile existente și le adăugăm din nou
                    await pool.execute('DELETE FROM event_transport_orders WHERE event_id = ?', [id]);
                    console.log('🗑️ Deleted existing transport orders for event:', id);
                    
                    // Salvăm fiecare item din comandă dacă există
                    if (transportData.orderItems && Array.isArray(transportData.orderItems) && transportData.orderItems.length > 0) {
                        console.log('📦 Processing transport order items update:', transportData.orderItems.length);
                        
                        const orderPromises = transportData.orderItems.map(async (item: any, index: number) => {
                            console.log(`📦 Processing order item ${index + 1}:`, {
                                eventId: id,
                                productId: item.productId,
                                productName: item.productName,
                                supplierId: item.supplierId || transportData.supplierId,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                totalPrice: item.totalPrice,
                                expectedDeliveryDate: item.expectedDeliveryDate || transportData.expectedDeliveryDate
                            });
                            
                            return pool.execute(`
                                INSERT INTO event_transport_orders (
                                    event_id, product_id, product_name, supplier_id, supplier_name,
                                    quantity, unit_price, total_price, expected_delivery_date,
                                    status, notes, created_by
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `, [
                                id,
                                item.productId || null,
                                item.productName || 'Produs necunoscut',
                                item.supplierId || transportData.supplierId,
                                item.supplierName || transportData.supplierName,
                                item.quantity || 1,
                                item.unitPrice || 0,
                                item.totalPrice || 0,
                                item.expectedDeliveryDate || transportData.expectedDeliveryDate,
                                item.status || 'ORDERED',
                                item.notes || '',
                                userId
                            ]);
                        });
                        
                        await Promise.all(orderPromises);
                        console.log('✅ Successfully updated transport order items for event:', transportData.orderItems.length);
                        
                        // Analizăm modificările de produse pentru activity log
                        const productChanges = {
                            added: [] as any[],
                            updated: [] as any[],
                            removed: [] as any[]
                        };
                        
                        // Produse noi (adăugate)
                        const newItems = transportData.orderItems || [];
                        for (const newItem of newItems) {
                            const existingItem = existingItems.find(existing => 
                                existing.product_id === newItem.productId && 
                                existing.product_name === newItem.productName
                            );
                            
                            if (!existingItem) {
                                // Produs nou adăugat
                                productChanges.added.push({
                                    productName: newItem.productName,
                                    quantity: newItem.quantity,
                                    unit: newItem.unit || 'buc'
                                });
                            } else {
                                // Verificăm dacă cantitatea s-a schimbat
                                if (existingItem.quantity !== newItem.quantity) {
                                    productChanges.updated.push({
                                        productName: newItem.productName,
                                        oldQuantity: existingItem.quantity,
                                        newQuantity: newItem.quantity,
                                        unit: newItem.unit || 'buc'
                                    });
                                }
                            }
                        }
                        
                        // Produse șterse
                        for (const existingItem of existingItems) {
                            const stillExists = newItems.find((newItem: any) => 
                                newItem.productId === existingItem.product_id && 
                                newItem.productName === existingItem.product_name
                            );
                            
                            if (!stillExists) {
                                productChanges.removed.push({
                                    productName: existingItem.product_name,
                                    quantity: existingItem.quantity,
                                    unit: 'buc'
                                });
                            }
                        }
                        
                        // Salvăm modificările de produse în transportData pentru activity log
                        if (productChanges.added.length > 0 || productChanges.updated.length > 0 || productChanges.removed.length > 0) {
                            console.log('📝 Product changes detected:', productChanges);
                            // Vom folosi aceste date în activity log mai jos
                            (transportData as any).productChanges = productChanges;
                        }
                    } else {
                        console.log('ℹ️ No order items to process for transport event update');
                    }
                } catch (transportError) {
                    console.error('❌ Error updating transport data for event:', transportError);
                    console.error('❌ Full transport update error details:', {
                        message: (transportError as any)?.message,
                        code: (transportError as any)?.code,
                        errno: (transportError as any)?.errno,
                        sqlState: (transportError as any)?.sqlState,
                        sqlMessage: (transportError as any)?.sqlMessage
                    });
                    // Nu eșuăm actualizarea evenimentului dacă nu putem actualiza datele de transport
                    // dar logăm eroarea pentru debugging
                }
            } else if (transportEventTypes.includes(type)) {
                console.log('ℹ️ Transport event updated without transport data - metadata preserved');
            }

            const [updatedEventRows] = await pool.execute(
                'SELECT * FROM calendar_events WHERE id = ?',
                [id]
            );

            // Log activitatea
            const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
            const changes: any = {
                title: title !== event.title ? { from: event.title, to: title } : undefined,
                description: description !== event.description ? { from: event.description, to: description } : undefined,
                type: type !== event.type ? { from: event.type, to: type } : undefined,
                status: status !== event.status ? { from: event.status, to: status } : undefined
            };
            
            // Adăugăm modificările de produse dacă există
            if (transportData && (transportData as any).productChanges) {
                const productChanges = (transportData as any).productChanges;
                if (productChanges.added.length > 0 || productChanges.updated.length > 0 || productChanges.removed.length > 0) {
                    changes.productChanges = productChanges;
                    console.log('📝 Adding product changes to activity log:', productChanges);
                }
            }
            
            await ActivityLogService.logEventUpdated(
                userId!, 
                parseInt(id), 
                title, 
                changes, 
                ipAddress
            );

            const updatedEvent = (updatedEventRows as any[])[0];
            
            // Dacă este un eveniment de transport, adăugăm transportData în răspuns
            if (transportEventTypes.includes(type) && transportData) {
                console.log('🚛 Adding transportData to response for transport event');
                updatedEvent.transportData = transportData;
            }

            // Notificare pentru magazioner când se actualizează evenimente de transport
            if (type === 'SUPPLY_ORDER' && transportData) {
                try {
                    console.log('🔔 Creating notification for warehouse keeper about transport event update');
                    
                    // Găsim toți utilizatorii cu rolul WAREHOUSE_KEEPER
                    const [warehouseKeepers] = await pool.execute(`
                        SELECT u.id, u.email, u.first_name, u.last_name 
                        FROM users u 
                        JOIN user_roles ur ON u.id = ur.user_id 
                        JOIN roles r ON ur.role_id = r.id 
                        WHERE r.name = 'WAREHOUSE_KEEPER' AND u.is_active = 1
                    `);
                    
                    if ((warehouseKeepers as any[]).length > 0) {
                        const notificationPromises = (warehouseKeepers as any[]).map(async (keeper: any) => {
                            const message = `Eveniment de transport actualizat: ${title}. ${transportData.supplierName ? `Furnizor: ${transportData.supplierName}` : ''} ${transportData.orderItems?.length ? `(${transportData.orderItems.length} produse)` : ''}`;
                            
                            // Salvăm notificarea în baza de date
                            const [notificationResult] = await pool.execute(`
                                INSERT INTO notifications (user_id, event_id, title, message, type, status) 
                                VALUES (?, ?, ?, ?, ?, ?)
                            `, [
                                keeper.id,
                                id,
                                'Eveniment Transport Actualizat',
                                message,
                                'TRANSPORT_EVENT_UPDATE',
                                'unread'
                            ]);
                            
                            const notificationId = (notificationResult as any).insertId;
                            console.log('✅ Update notification created in DB:', notificationId);
                            
                            // Trimitem notificarea în timp real prin WebSocket
                            try {
                                const { sendNotification } = require('../app');
                                
                                const websocketNotification = {
                                    type: 'notification',
                                    id: notificationId,
                                    title: 'Eveniment Transport Actualizat',
                                    message: message,
                                    data: {
                                        eventId: id,
                                        eventTitle: title,
                                        supplierName: transportData.supplierName,
                                        totalValue: transportData.totalValue,
                                        orderItemsCount: transportData.orderItems?.length || 0,
                                        action: 'VIEW_EVENT'
                                    },
                                    timestamp: new Date().toISOString(),
                                    isRead: false
                                };
                                
                                sendNotification(keeper.id, websocketNotification);
                                console.log(`📡 WebSocket update notification sent to warehouse keeper ${keeper.id} (${keeper.email})`);
                            } catch (wsError) {
                                console.error(`❌ Error sending WebSocket update notification to keeper ${keeper.id}:`, wsError);
                            }
                            
                            return notificationResult;
                        });
                        
                        await Promise.all(notificationPromises);
                        console.log('✅ Update notifications sent to warehouse keepers:', (warehouseKeepers as any[]).length);
                    } else {
                        console.log('ℹ️ No warehouse keepers found to notify about update');
                    }
                } catch (notificationError) {
                    console.error('❌ Error creating update notifications for warehouse keepers:', notificationError);
                    // Nu eșuăm actualizarea evenimentului dacă nu putem trimite notificările
                }
            }

            console.log('✅ Event updated successfully:', {
                id: updatedEvent.id,
                hasTransportData: !!updatedEvent.transportData,
                transportDataKeys: updatedEvent.transportData ? Object.keys(updatedEvent.transportData) : []
            });
            res.json(updatedEvent);
        } catch (error) {
            console.error('❌ Error updating event:', error);
            res.status(500).json({ 
                message: 'Eroare la actualizarea evenimentului',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    deleteEvent: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            // Verificăm dacă utilizatorul are dreptul să șteargă evenimentul
            const [event] = await pool.execute(
                'SELECT * FROM calendar_events WHERE id = ?',
                [id]
            );

            if (!event) {
                return res.status(404).json({ message: 'Evenimentul nu a fost găsit' });
            }

            // Doar creatorul sau administratorii pot șterge evenimentul
            if (!(req.user?.roles.includes('SUPER_ADMIN') || req.user?.roles.includes('DEPARTMENT_ADMIN')) && 
                (event as any).user_id !== userId) {
                return res.status(403).json({ message: 'Nu aveți permisiunea de a șterge acest eveniment' });
            }

            const eventData = (event as any[])[0];
            
            // Log activitatea înainte de ștergere
            const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
            await ActivityLogService.logEventDeleted(
                userId!, 
                parseInt(id), 
                eventData.title, 
                ipAddress
            );

            await pool.execute('DELETE FROM calendar_events WHERE id = ?', [id]);
            res.status(204).send();
        } catch (error) {
            console.error('Error deleting event:', error);
            res.status(500).json({ message: 'Eroare la ștergerea evenimentului' });
        }
    },

    getDepartmentEvents: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const [events] = await pool.execute(
                `SELECT 
                    ce.*,
                    JSON_OBJECT(
                        'id', u.id,
                        'email', u.email,
                        'firstName', u.first_name,
                        'lastName', u.last_name
                    ) as user,
                    JSON_OBJECT(
                        'id', d.id,
                        'name', d.name,
                        'description', d.description
                    ) as department,
                    JSON_OBJECT(
                        'id', v.id,
                        'brand', v.brand,
                        'model', v.model,
                        'registration_number', v.registration_number,
                        'status', v.status
                    ) as vehicle,
                    (
                        SELECT COUNT(*) 
                        FROM event_assignments ea 
                        WHERE ea.event_id = ce.id
                    ) as assignments_count
                FROM calendar_events ce
                LEFT JOIN users u ON ce.user_id = u.id
                LEFT JOIN departments d ON ce.department_id = d.id
                LEFT JOIN vehicles v ON ce.vehicle_id = v.id
                WHERE ce.department_id = ?`,
                [id]
            );
            res.json(events);
        } catch (error) {
            console.error('Error fetching department events:', error);
            res.status(500).json({ message: 'Eroare la încărcarea evenimentelor departamentului' });
        }
    },

    getUserEvents: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const [events] = await pool.execute(
                `SELECT 
                    ce.*,
                    JSON_OBJECT(
                        'id', u.id,
                        'email', u.email,
                        'firstName', u.first_name,
                        'lastName', u.last_name
                    ) as user
                FROM calendar_events ce
                LEFT JOIN users u ON ce.user_id = u.id
                WHERE ce.user_id = ? OR (ce.is_private = 0 AND ce.department_id IN (
                    SELECT department_id FROM department_users WHERE user_id = ?
                ))`,
                [id, id]
            );
            res.json(events);
        } catch (error) {
            console.error('Error fetching user events:', error);
            res.status(500).json({ message: 'Eroare la încărcarea evenimentelor utilizatorului' });
        }
    },

    // Metode pentru asignări
    getEventAssignments: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const [assignments] = await pool.execute(
                `SELECT 
                    ea.*,
                    JSON_OBJECT(
                        'id', u.id,
                        'email', u.email,
                        'firstName', u.first_name,
                        'lastName', u.last_name
                    ) as user
                FROM event_assignments ea
                LEFT JOIN users u ON ea.user_id = u.id
                WHERE ea.event_id = ?`,
                [id]
            );
            res.json(assignments);
        } catch (error) {
            console.error('Error fetching event assignments:', error);
            res.status(500).json({ message: 'Eroare la încărcarea asignărilor' });
        }
    },

    createEventAssignment: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { userId, role, notes } = req.body;

            const [result] = await pool.execute(
                'INSERT INTO event_assignments (event_id, user_id, role, notes) VALUES (?, ?, ?, ?)',
                [id, userId, role || 'PARTICIPANT', notes || null]
            );

            const assignmentId = (result as any).insertId;
            const [assignment] = await pool.execute(
                `SELECT 
                    ea.*,
                    JSON_OBJECT(
                        'id', u.id,
                        'email', u.email,
                        'firstName', u.first_name,
                        'lastName', u.last_name
                    ) as user
                FROM event_assignments ea
                LEFT JOIN users u ON ea.user_id = u.id
                WHERE ea.id = ?`,
                [assignmentId]
            );

            // Obține informațiile despre eveniment pentru notificare
            const [eventResult] = await pool.execute(
                'SELECT title, type FROM calendar_events WHERE id = ?',
                [id]
            );
            const event = (eventResult as any[])[0];

            // Inserare notificare în baza de date
            const notificationMessage = `Ai fost asignat la evenimentul "${event.title}" cu rolul ${role || 'PARTICIPANT'}`;
            await pool.execute(
                'INSERT INTO notifications (user_id, message, type, status) VALUES (?, ?, ?, ?)',
                [userId, notificationMessage, 'assignment', 'unread']
            );

            // Trimitere notificare prin WebSocket
            const { sendNotification } = require('../app');
            sendNotification(userId, {
                type: 'notification',
                message: notificationMessage,
                eventId: id,
                eventTitle: event.title
            });

            res.status(201).json((assignment as any[])[0]);
        } catch (error) {
            console.error('Error creating event assignment:', error);
            res.status(500).json({ message: 'Eroare la crearea asignării' });
        }
    },

    updateEventAssignment: async (req: Request, res: Response) => {
        try {
            const { id, assignmentId } = req.params;
            const { status, notes } = req.body;

            await pool.execute(
                'UPDATE event_assignments SET status = ?, notes = ?, response_date = NOW() WHERE id = ? AND event_id = ?',
                [status, notes || null, assignmentId, id]
            );

            const [assignment] = await pool.execute(
                `SELECT 
                    ea.*,
                    JSON_OBJECT(
                        'id', u.id,
                        'email', u.email,
                        'firstName', u.first_name,
                        'lastName', u.last_name
                    ) as user
                FROM event_assignments ea
                LEFT JOIN users u ON ea.user_id = u.id
                WHERE ea.id = ?`,
                [assignmentId]
            );

            res.json((assignment as any[])[0]);
        } catch (error) {
            console.error('Error updating event assignment:', error);
            res.status(500).json({ message: 'Eroare la actualizarea asignării' });
        }
    },

    deleteEventAssignment: async (req: Request, res: Response) => {
        try {
            const { id, assignmentId } = req.params;
            
            // Obține informațiile despre asignare înainte de ștergere
            const [assignmentResult] = await pool.execute(
                'SELECT user_id, role FROM event_assignments WHERE id = ? AND event_id = ?',
                [assignmentId, id]
            );
            const assignment = (assignmentResult as any[])[0];
            
            if (!assignment) {
                return res.status(404).json({ message: 'Asignarea nu a fost găsită' });
            }

            // Obține informațiile despre eveniment pentru notificare
            const [eventResult] = await pool.execute(
                'SELECT title, type FROM calendar_events WHERE id = ?',
                [id]
            );
            const event = (eventResult as any[])[0];

            // Șterge asignarea
            await pool.execute('DELETE FROM event_assignments WHERE id = ? AND event_id = ?', [assignmentId, id]);
            
            // Inserare notificare în baza de date
            const notificationMessage = `Ai fost dezasignat de la evenimentul "${event.title}"`;
            await pool.execute(
                'INSERT INTO notifications (user_id, message, type, status) VALUES (?, ?, ?, ?)',
                [assignment.user_id, notificationMessage, 'unassignment', 'unread']
            );

            // Trimitere notificare prin WebSocket
            const { sendNotification } = require('../app');
            sendNotification(assignment.user_id, {
                type: 'notification',
                message: notificationMessage,
                eventId: id,
                eventTitle: event.title
            });

            res.status(204).send();
        } catch (error) {
            console.error('Error deleting event assignment:', error);
            res.status(500).json({ message: 'Eroare la ștergerea asignării' });
        }
    },

    // Metode pentru documente
    getEventDocuments: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            console.log('📄 Getting documents for event:', id);
            
            const [documents] = await pool.execute(
                `SELECT 
                    ed.*,
                    JSON_OBJECT(
                        'id', u.id,
                        'email', u.email,
                        'firstName', u.first_name,
                        'lastName', u.last_name
                    ) as uploaded_by_user
                FROM event_documents ed
                LEFT JOIN users u ON ed.uploaded_by = u.id
                WHERE ed.event_id = ? AND ed.is_active = 1
                ORDER BY ed.created_at DESC`,
                [id]
            );
            
            console.log('✅ Found documents:', (documents as any[]).length);
            res.json(documents);
        } catch (error) {
            console.error('❌ Error fetching event documents:', error);
            res.status(500).json({ 
                message: 'Eroare la încărcarea documentelor',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    createEventDocument: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const file = req.file;
            const userId = req.user?.id;
            
            if (!file) {
                return res.status(400).json({ message: 'Fișierul este obligatoriu' });
            }

            console.log('📄 Creating document for event:', id, {
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype
            });
            
            const {
                documentType = 'ALTELE',
                title = file.originalname,
                description = null
            } = req.body;

            // Verific că evenimentul există
            const [events] = await pool.execute(
                'SELECT id FROM calendar_events WHERE id = ?',
                [id]
            );
            
            if ((events as any[]).length === 0) {
                // Șterg fișierul dacă evenimentul nu există
                fs.unlinkSync(file.path);
                return res.status(404).json({ message: 'Evenimentul nu a fost găsit' });
            }

            const [result] = await pool.execute(
                `INSERT INTO event_documents (
                    event_id, document_type, title, description, file_name, file_path,
                    file_size, mime_type, uploaded_by, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    id,
                    documentType,
                    title,
                    description || null,
                    file.originalname,
                    file.path,
                    file.size,
                    file.mimetype,
                    userId
                ]
            );

            const documentId = (result as any).insertId;

            // Obține informațiile despre eveniment pentru logging
            const [eventResult] = await pool.execute(
                'SELECT title FROM calendar_events WHERE id = ?',
                [id]
            );
            const event = (eventResult as any[])[0];

            // Log activitatea
            const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
            await ActivityLogService.createLog({
                user_id: userId!,
                action_type: 'EVENT_DOCUMENT_ADDED',
                entity_type: 'EVENT',
                entity_id: parseInt(id),
                description: `A încărcat documentul "${documentType}" pentru evenimentul "${event?.title}"`,
                details: {
                    event_id: parseInt(id),
                    event_title: event?.title,
                    document_type: documentType,
                    document_title: title,
                    file_name: file.originalname,
                    file_size: file.size
                },
                ip_address: ipAddress
            });

            // Returnez documentul nou creat
            const [newDocument] = await pool.execute(
                `SELECT 
                    ed.*,
                    JSON_OBJECT(
                        'id', u.id,
                        'email', u.email,
                        'firstName', u.first_name,
                        'lastName', u.last_name
                    ) as uploaded_by_user
                FROM event_documents ed
                LEFT JOIN users u ON ed.uploaded_by = u.id
                WHERE ed.id = ?`,
                [documentId]
            );

            console.log('✅ Successfully created event document:', documentId);
            res.status(201).json((newDocument as any[])[0]);
        } catch (error) {
            console.error('❌ Error creating event document:', error);
            res.status(500).json({ 
                message: 'Eroare la crearea documentului',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    viewEventDocument: async (req: Request, res: Response) => {
        try {
            const { documentId } = req.params;
            console.log('👁️ Viewing event document:', documentId);

            const [documents] = await pool.execute(
                'SELECT * FROM event_documents WHERE id = ? AND is_active = 1',
                [documentId]
            );

            if ((documents as any[]).length === 0) {
                return res.status(404).json({ message: 'Documentul nu a fost găsit' });
            }

            const document = (documents as any[])[0];
            const filePath = document.file_path;

            // Verific dacă fișierul există fizic
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ message: 'Fișierul nu a fost găsit pe server' });
            }

            // Detectez tipul de fișier
            const ext = path.extname(filePath).toLowerCase();
            let contentType = 'application/octet-stream';
            
            switch (ext) {
                case '.pdf':
                    contentType = 'application/pdf';
                    break;
                case '.jpg':
                case '.jpeg':
                    contentType = 'image/jpeg';
                    break;
                case '.png':
                    contentType = 'image/png';
                    break;
                case '.gif':
                    contentType = 'image/gif';
                    break;
                default:
                    contentType = 'application/octet-stream';
            }

            // Setez headerele pentru vizualizare inline
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', 'inline');
            res.setHeader('Cache-Control', 'no-cache');

            console.log('✅ Successfully serving event document for viewing');
            res.sendFile(path.resolve(filePath));
        } catch (error) {
            console.error('❌ Error viewing event document:', error);
            res.status(500).json({ 
                message: 'Eroare la vizualizarea documentului',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    // Conversie DOC/DOCX -> PDF cu LibreOffice headless și servire PDF
    viewEventDocumentPdf: async (req: Request, res: Response) => {
        try {
            const { documentId } = req.params as any;
            const [documents] = await pool.execute(
                'SELECT * FROM event_documents WHERE id = ? AND is_active = 1',
                [documentId]
            );

            if ((documents as any[]).length === 0) {
                return res.status(404).json({ message: 'Documentul nu a fost găsit' });
            }

            const document = (documents as any[])[0];
            const originalPath = document.file_path as string;
            if (!fs.existsSync(originalPath)) {
                return res.status(404).json({ message: 'Fișierul nu a fost găsit pe server' });
            }

            const ext = path.extname(originalPath).toLowerCase();
            // Dacă e deja PDF, îl servim direct
            if (ext === '.pdf') {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'inline');
                return res.sendFile(path.resolve(originalPath));
            }

            // Construim calea pentru cache PDF
            const cacheDir = path.join(__dirname, '../../uploads/documents/cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
            const cachedPdf = path.join(cacheDir, `${document.id}.pdf`);

            // Dacă există deja PDF în cache și este mai nou decât originalul, servim cache-ul
            try {
                const [origStat, pdfStat] = [fs.statSync(originalPath), fs.statSync(cachedPdf)];
                if (pdfStat.mtimeMs >= origStat.mtimeMs) {
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', 'inline');
                    return res.sendFile(path.resolve(cachedPdf));
                }
            } catch (_) {}

            // Conversie cu LibreOffice (soffice) headless
            const tmpOutDir = cacheDir;
            const { exec } = require('child_process');

            // Notă: funcționează pentru .doc, .docx, .rtf, .odt etc.
            const cmd = `soffice --headless --convert-to pdf --outdir ${tmpOutDir} ${JSON.stringify(originalPath)}`;
            await new Promise<void>((resolve, reject) => {
                exec(cmd, (error: any, stdout: any, stderr: any) => {
                    if (error) return reject(error);
                    resolve();
                });
            });

            // LibreOffice creează PDF cu același nume de bază; îl mutăm/renumim în cache-ul nostru standardizat
            const producedPdf = path.join(
                tmpOutDir,
                path.basename(originalPath, path.extname(originalPath)) + '.pdf'
            );

            if (!fs.existsSync(producedPdf)) {
                return res.status(500).json({ message: 'Conversia în PDF a eșuat' });
            }

            // Mută/înlocuiește în cache
            fs.renameSync(producedPdf, cachedPdf);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
            return res.sendFile(path.resolve(cachedPdf));
        } catch (error) {
            console.error('❌ Error converting/viewing Word as PDF:', error);
            return res.status(500).json({ message: 'Eroare la conversia/afișarea documentului' });
        }
    },

    downloadEventDocument: async (req: Request, res: Response) => {
        try {
            const { documentId } = req.params;
            console.log('⬇️ Downloading event document:', documentId);

            const [documents] = await pool.execute(
                'SELECT * FROM event_documents WHERE id = ? AND is_active = 1',
                [documentId]
            );

            if ((documents as any[]).length === 0) {
                return res.status(404).json({ message: 'Documentul nu a fost găsit' });
            }

            const document = (documents as any[])[0];
            const filePath = document.file_path;

            // Verific dacă fișierul există fizic
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ message: 'Fișierul nu a fost găsit pe server' });
            }

            // Detectez tipul de fișier
            const ext = path.extname(filePath).toLowerCase();
            let contentType = 'application/octet-stream';
            
            switch (ext) {
                case '.pdf':
                    contentType = 'application/pdf';
                    break;
                case '.jpg':
                case '.jpeg':
                    contentType = 'image/jpeg';
                    break;
                case '.png':
                    contentType = 'image/png';
                    break;
                case '.gif':
                    contentType = 'image/gif';
                    break;
                default:
                    contentType = 'application/octet-stream';
            }

            // Setez headerele pentru download
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
            res.setHeader('Cache-Control', 'no-cache');

            console.log('✅ Successfully serving event document for download');
            res.sendFile(path.resolve(filePath));
        } catch (error) {
            console.error('❌ Error downloading event document:', error);
            res.status(500).json({ 
                message: 'Eroare la descărcarea documentului',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    deleteEventDocument: async (req: Request, res: Response) => {
        try {
            const { documentId } = req.params;
            const userId = req.user?.id;

            console.log('🗑️ Deleting event document:', documentId);

            // Verific că documentul există și îmi aparține sau sunt admin
            const [documents] = await pool.execute(
                'SELECT * FROM event_documents WHERE id = ? AND is_active = 1',
                [documentId]
            );

            if ((documents as any[]).length === 0) {
                return res.status(404).json({ message: 'Documentul nu a fost găsit' });
            }

            const document = (documents as any[])[0];

            // Verific permisiunile (doar uploader-ul sau adminii pot șterge)
            if (!(req.user?.roles.includes('SUPER_ADMIN') || req.user?.roles.includes('DEPARTMENT_ADMIN')) && 
                document.uploaded_by !== userId) {
                return res.status(403).json({ message: 'Nu aveți permisiunea de a șterge acest document' });
            }

            // Șterg fișierul fizic
            if (fs.existsSync(document.file_path)) {
                fs.unlinkSync(document.file_path);
            }

            // Marchez documentul ca inactiv în baza de date
            await pool.execute(
                'UPDATE event_documents SET is_active = 0, updated_at = NOW() WHERE id = ?',
                [documentId]
            );

            console.log('✅ Successfully deleted event document:', documentId);
            res.status(204).send();
        } catch (error) {
            console.error('❌ Error deleting event document:', error);
            res.status(500).json({ 
                message: 'Eroare la ștergerea documentului',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    // Metode pentru categorii
    getEventCategories: async (req: Request, res: Response) => {
        try {
            const [categories] = await pool.execute(
                'SELECT * FROM event_categories WHERE is_active = 1 ORDER BY name'
            );
            res.json(categories);
        } catch (error) {
            console.error('Error fetching event categories:', error);
            res.status(500).json({ message: 'Eroare la încărcarea categoriilor' });
        }
    },

    // Metode pentru template-uri
    getEventTemplates: async (req: Request, res: Response) => {
        try {
            const { departmentId } = req.query;
            let query = 'SELECT * FROM event_templates WHERE is_active = 1';
            const params: any[] = [];

            if (departmentId) {
                query += ' AND (department_id = ? OR department_id IS NULL)';
                params.push(departmentId);
            }

            query += ' ORDER BY name';

            const [templates] = await pool.execute(query, params);
            res.json(templates);
        } catch (error) {
            console.error('Error fetching event templates:', error);
            res.status(500).json({ message: 'Eroare la încărcarea template-urilor' });
        }
    },

    // Metode pentru notificări
    getEventNotifications: async (req: Request, res: Response) => {
        try {
            const userId = req.user?.id;
            const [notifications] = await pool.execute(
                `SELECT 
                    en.*,
                    ce.title as event_title
                FROM event_notifications en
                LEFT JOIN calendar_events ce ON en.event_id = ce.id
                WHERE en.user_id = ? AND en.status != 'CANCELLED'
                ORDER BY en.send_time DESC
                LIMIT 50`,
                [userId]
            );
            res.json(notifications);
        } catch (error) {
            console.error('Error fetching event notifications:', error);
            res.status(500).json({ message: 'Eroare la încărcarea notificărilor' });
        }
    },

    markNotificationAsRead: async (req: Request, res: Response) => {
        try {
            const { notificationId } = req.params;
            const userId = req.user?.id;

            await pool.execute(
                'UPDATE event_notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
                [notificationId, userId]
            );

            res.status(204).send();
        } catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({ message: 'Eroare la marcarea notificării' });
        }
    },

    // Metode pentru verificarea disponibilității
    checkVehicleAvailability: async (req: Request, res: Response) => {
        try {
            const { startTime, endTime, excludeEventId } = req.query;
            
            console.log('🚗 Checking vehicle availability:', { startTime, endTime, excludeEventId });

            if (!startTime || !endTime) {
                return res.status(400).json({ message: 'Parametrii startTime și endTime sunt obligatorii' });
            }

            // Obținem toate vehiculele
            const [allVehicles] = await pool.execute(`
                SELECT 
                    v.id,
                    v.brand,
                    v.model,
                    v.registration_number,
                    v.status,
                    v.category,
                    v.fuel_type
                FROM vehicles v 
                WHERE v.status = 'AVAILABLE'
                ORDER BY v.brand, v.model
            `);

            // Verificăm care vehicule sunt ocupate în intervalul specificat
            let conflictQuery = `
                SELECT DISTINCT ce.vehicle_id
                FROM calendar_events ce
                WHERE ce.vehicle_id IS NOT NULL
                AND ((ce.start_time < ? AND ce.end_time > ?)
                OR (ce.start_time < ? AND ce.end_time > ?)
                OR (ce.start_time >= ? AND ce.end_time <= ?))
            `;
            const conflictParams = [endTime, startTime, endTime, startTime, startTime, endTime];

            // Excludem evenimentul curent dacă este în modul edit
            if (excludeEventId) {
                conflictQuery += ' AND ce.id != ?';
                conflictParams.push(excludeEventId);
            }

            const [occupiedVehicles] = await pool.execute(conflictQuery, conflictParams);
            const occupiedVehicleIds = (occupiedVehicles as any[]).map(v => v.vehicle_id);

            // Construim răspunsul cu informații despre disponibilitate
            const vehicleAvailability = (allVehicles as any[]).map(vehicle => ({
                ...vehicle,
                isAvailable: !occupiedVehicleIds.includes(vehicle.id),
                conflictReason: occupiedVehicleIds.includes(vehicle.id) 
                    ? 'Vehiculul este deja asignat unui alt eveniment în acest interval' 
                    : null
            }));

            console.log('✅ Vehicle availability checked:', {
                total: vehicleAvailability.length,
                available: vehicleAvailability.filter(v => v.isAvailable).length,
                occupied: vehicleAvailability.filter(v => !v.isAvailable).length
            });

            res.json(vehicleAvailability);
        } catch (error) {
            console.error('❌ Error checking vehicle availability:', error);
            res.status(500).json({ 
                message: 'Eroare la verificarea disponibilității vehiculelor',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    checkPersonnelAvailability: async (req: Request, res: Response) => {
        try {
            const { startTime, endTime, excludeEventId, departmentId } = req.query;
            
            console.log('👥 Checking personnel availability:', { startTime, endTime, excludeEventId, departmentId });

            if (!startTime || !endTime) {
                return res.status(400).json({ message: 'Parametrii startTime și endTime sunt obligatorii' });
            }

            // Query pentru utilizatori cu roluri și departamente
            let usersQuery = `
                SELECT 
                    u.id,
                    u.email,
                    u.first_name,
                    u.last_name,
                    GROUP_CONCAT(DISTINCT r.name ORDER BY r.name) as roles,
                    u.is_active,
                    COALESCE(GROUP_CONCAT(DISTINCT d.name ORDER BY d.name), 'Neasignat') as department_name,
                    MIN(d.id) as department_id
                FROM users u
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                LEFT JOIN department_users du ON u.id = du.user_id
                LEFT JOIN departments d ON du.department_id = d.id
                WHERE u.is_active = 1
            `;
            const usersParams: any[] = [];

            // Filtrăm pe departament dacă este specificat
            if (departmentId && departmentId !== 'all') {
                usersQuery += ' AND d.id = ?';
                usersParams.push(departmentId);
            }

            usersQuery += ' GROUP BY u.id, u.email, u.first_name, u.last_name, u.is_active ORDER BY u.first_name, u.last_name';

            const [allUsers] = await pool.execute(usersQuery, usersParams);

            // Verificăm care utilizatori sunt asignați în intervalul specificat
            let conflictQuery = `
                SELECT DISTINCT ea.user_id, ce.title, ce.start_time, ce.end_time
                FROM event_assignments ea
                JOIN calendar_events ce ON ea.event_id = ce.id
                WHERE ((ce.start_time < ? AND ce.end_time > ?)
                OR (ce.start_time < ? AND ce.end_time > ?)
                OR (ce.start_time >= ? AND ce.end_time <= ?))
            `;
            const conflictParams = [endTime, startTime, endTime, startTime, startTime, endTime];

            // Excludem evenimentul curent dacă este în modul edit
            if (excludeEventId) {
                conflictQuery += ' AND ce.id != ?';
                conflictParams.push(excludeEventId);
            }

            const [occupiedUsers] = await pool.execute(conflictQuery, conflictParams);
            const occupiedUserMap = new Map();
            (occupiedUsers as any[]).forEach(assignment => {
                occupiedUserMap.set(assignment.user_id, {
                    eventTitle: assignment.title,
                    startTime: assignment.start_time,
                    endTime: assignment.end_time
                });
            });

            // Construim răspunsul cu informații despre disponibilitate
            const personnelAvailability = (allUsers as any[]).map(user => {
                const conflict = occupiedUserMap.get(user.id);
                return {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    fullName: `${user.first_name} ${user.last_name}`,
                    roles: user.role ? [user.role] : ['USER'],
                    departmentName: user.department_name || 'Neasignat',
                    departmentId: user.department_id,
                    isAvailable: !conflict,
                    conflictReason: conflict 
                        ? `Asignat la: "${conflict.eventTitle}" (${new Date(conflict.startTime).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })} - ${new Date(conflict.endTime).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })})`
                        : null
                };
            });

            console.log('✅ Personnel availability checked:', {
                total: personnelAvailability.length,
                available: personnelAvailability.filter(p => p.isAvailable).length,
                occupied: personnelAvailability.filter(p => !p.isAvailable).length
            });

            res.json(personnelAvailability);
        } catch (error) {
            console.error('❌ Error checking personnel availability:', error);
            res.status(500).json({ 
                message: 'Eroare la verificarea disponibilității personalului',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    // Metodă pentru obținerea conflictelor pentru un interval dat
    getTimeSlotConflicts: async (req: Request, res: Response) => {
        try {
            const { startTime, endTime, excludeEventId } = req.query;
            
            console.log('⚠️ Checking time slot conflicts:', { startTime, endTime, excludeEventId });

            if (!startTime || !endTime) {
                return res.status(400).json({ message: 'Parametrii startTime și endTime sunt obligatorii' });
            }

            let conflictQuery = `
                SELECT 
                    ce.id,
                    ce.title,
                    ce.start_time,
                    ce.end_time,
                    ce.vehicle_id,
                    CONCAT(u.first_name, ' ', u.last_name) as created_by,
                    d.name as department_name,
                    v.registration_number as vehicle_registration,
                    (SELECT COUNT(*) FROM event_assignments ea WHERE ea.event_id = ce.id) as assigned_personnel_count
                FROM calendar_events ce
                LEFT JOIN users u ON ce.user_id = u.id
                LEFT JOIN departments d ON ce.department_id = d.id
                LEFT JOIN vehicles v ON ce.vehicle_id = v.id
                WHERE ((ce.start_time < ? AND ce.end_time > ?)
                OR (ce.start_time < ? AND ce.end_time > ?)
                OR (ce.start_time >= ? AND ce.end_time <= ?))
            `;
            const conflictParams = [endTime, startTime, endTime, startTime, startTime, endTime];

            // Excludem evenimentul curent dacă este în modul edit
            if (excludeEventId) {
                conflictQuery += ' AND ce.id != ?';
                conflictParams.push(excludeEventId);
            }

            conflictQuery += ' ORDER BY ce.start_time';

            const [conflicts] = await pool.execute(conflictQuery, conflictParams);

            console.log('✅ Time slot conflicts found:', (conflicts as any[]).length);

            res.json({
                hasConflicts: (conflicts as any[]).length > 0,
                conflicts: conflicts,
                conflictCount: (conflicts as any[]).length
            });
        } catch (error) {
            console.error('❌ Error checking time slot conflicts:', error);
            res.status(500).json({ 
                message: 'Eroare la verificarea conflictelor de programare',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    // Metode pentru gestionarea materialelor evenimentelor
    getEventMaterials: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            console.log('📦 Getting materials for event:', id);
            console.log('🔍 Calculating available stock by subtracting reserved quantities from other events');

            const [materials] = await pool.execute(`
                SELECT 
                    eso.*,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit,
                    p.unit_price as product_unit_price,
                    (SELECT COALESCE(SUM(i.quantity), 0) FROM inventory i WHERE i.product_id = p.id) - 
                    (SELECT COALESCE(SUM(eso2.quantity), 0) FROM event_stock_operations eso2 
                     WHERE eso2.product_id = p.id 
                     AND eso2.status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED')
                     AND eso2.event_id != ?) as product_current_stock,
                    pc.name as product_category_name,
                    CONCAT(creator.first_name, ' ', creator.last_name) as created_by_name
                FROM event_stock_operations eso
                LEFT JOIN products p ON eso.product_id = p.id
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                LEFT JOIN users creator ON eso.created_by = creator.id
                WHERE eso.event_id = ?
                ORDER BY eso.created_at DESC
            `, [id, id]);

            console.log('📦 Found materials:', (materials as any[]).length);
            
            // Log pentru debugging calculul stocului
            (materials as any[]).forEach((material, index) => {
              console.log(`📊 Material ${index + 1}: ${material.product_name}`);
              console.log(`   - Stoc total din inventory: ${material.product_current_stock + (material.quantity || 0)}`);
              console.log(`   - Cantitate rezervată pentru alte evenimente: ${material.quantity || 0}`);
              console.log(`   - Stoc disponibil pentru acest eveniment: ${material.product_current_stock}`);
            });
            
            res.json(materials);
        } catch (error) {
            console.error('❌ Error getting event materials:', error);
            res.status(500).json({ 
                message: 'Eroare la încărcarea materialelor evenimentului',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    addEventMaterial: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { productId, quantity, unitCost, notes, priority } = req.body;
            const userId = req.user?.id;

            console.log('📦 Adding material to event:', { eventId: id, productId, quantity, unitCost });

            const [result] = await pool.execute(`
                INSERT INTO event_stock_operations (
                    event_id, product_id, operation_type, quantity, unit_cost,
                    notes, created_by, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id,
                productId,
                'MOVEMENT', // Pentru materiale evenimente, folosim MOVEMENT în loc de RESERVED
                quantity,
                unitCost || 0,
                notes || null,
                userId,
                'PLANNED' // Status valid: PLANNED în loc de PENDING
            ]);

            const materialId = (result as any).insertId;

            // Returnăm materialul nou creat cu detaliile produsului
            const [newMaterial] = await pool.execute(`
                SELECT 
                    eso.*,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit,
                    p.unit_price as product_unit_price,
                    (SELECT COALESCE(SUM(i.quantity), 0) FROM inventory i WHERE i.product_id = p.id) - 
                    (SELECT COALESCE(SUM(eso2.quantity), 0) FROM event_stock_operations eso2 
                     WHERE eso2.product_id = p.id 
                     AND eso2.status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED')
                     AND eso2.event_id != ?) as product_current_stock,
                    pc.name as product_category_name
                FROM event_stock_operations eso
                LEFT JOIN products p ON eso.product_id = p.id
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                WHERE eso.id = ?
            `, [id, materialId]);

            console.log('✅ Material added successfully');
            res.status(201).json((newMaterial as any[])[0]);
        } catch (error) {
            console.error('❌ Error adding event material:', error);
            res.status(500).json({ 
                message: 'Eroare la adăugarea materialului',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    updateEventMaterial: async (req: Request, res: Response) => {
        try {
            const { id, materialId } = req.params;
            const { quantity, unitCost, notes, status } = req.body;

            console.log('📝 Updating event material:', { eventId: id, materialId, updates: req.body });

            await pool.execute(`
                UPDATE event_stock_operations 
                SET quantity = ?, unit_cost = ?, notes = ?, status = ?, updated_at = NOW()
                WHERE id = ? AND event_id = ?
            `, [quantity, unitCost, notes, status, materialId, id]);

            // Returnăm materialul actualizat
            const [updatedMaterial] = await pool.execute(`
                SELECT 
                    eso.*,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit,
                    p.unit_price as product_unit_price,
                    (SELECT COALESCE(SUM(i.quantity), 0) FROM inventory i WHERE i.product_id = p.id) - 
                    (SELECT COALESCE(SUM(eso2.quantity), 0) FROM event_stock_operations eso2 
                     WHERE eso2.product_id = p.id 
                     AND eso2.status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED')
                     AND eso2.event_id != ?) as product_current_stock,
                    pc.name as product_category_name
                FROM event_stock_operations eso
                LEFT JOIN products p ON eso.product_id = p.id
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                WHERE eso.id = ? AND eso.event_id = ?
            `, [id, materialId, id]);

            console.log('✅ Material updated successfully');
            res.json((updatedMaterial as any[])[0]);
        } catch (error) {
            console.error('❌ Error updating event material:', error);
            res.status(500).json({ 
                message: 'Eroare la actualizarea materialului',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    removeEventMaterial: async (req: Request, res: Response) => {
        try {
            const { id, materialId } = req.params;

            console.log('🗑️ Removing event material:', { eventId: id, materialId });

            await pool.execute(
                'DELETE FROM event_stock_operations WHERE id = ? AND event_id = ?',
                [materialId, id]
            );

            console.log('✅ Material removed successfully');
            res.status(204).send();
        } catch (error) {
            console.error('❌ Error removing event material:', error);
            res.status(500).json({ 
                message: 'Eroare la eliminarea materialului',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    // Metode pentru gestionarea comenzilor de transport
    getTransportOrders: async (req: Request, res: Response) => {
        try {
            const { page = 1, limit = 10, status, supplierId } = req.query;
            const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

            let query = `
                SELECT 
                    eto.*,
                    ce.title as event_title,
                    ce.start_time as event_start,
                    ce.end_time as event_end,
                    s.name as supplier_name,
                    s.email as supplier_email,
                    s.phone as supplier_phone,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit,
                    (
                        SELECT COUNT(*) 
                        FROM event_transport_orders eto2 
                        WHERE eto2.event_id = eto.event_id
                    ) as total_items_in_order
                FROM event_transport_orders eto
                LEFT JOIN calendar_events ce ON eto.event_id = ce.id
                LEFT JOIN suppliers s ON eto.supplier_id = s.id
                LEFT JOIN products p ON eto.product_id = p.id
                WHERE 1=1
            `;
            const params: any[] = [];

            if (status) {
                query += ' AND eto.status = ?';
                params.push(status);
            }

            if (supplierId) {
                query += ' AND eto.supplier_id = ?';
                params.push(supplierId);
            }

            query += ' ORDER BY eto.created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit as string), parseInt(offset.toString()));

            const [orders] = await pool.execute(query, params);

            // Obținem numărul total de comenzi pentru paginare
            let countQuery = `
                SELECT COUNT(*) as total
                FROM event_transport_orders eto
                WHERE 1=1
            `;
            const countParams: any[] = [];

            if (status) {
                countQuery += ' AND eto.status = ?';
                countParams.push(status);
            }

            if (supplierId) {
                countQuery += ' AND eto.supplier_id = ?';
                countParams.push(supplierId);
            }

            const [countResult] = await pool.execute(countQuery, countParams);
            const total = (countResult as any[])[0].total;

            console.log('✅ Transport orders fetched:', { total, page, limit });
            res.json({
                data: orders,
                pagination: {
                    page: parseInt(page as string),
                    limit: parseInt(limit as string),
                    total,
                    pages: Math.ceil(total / parseInt(limit as string))
                }
            });
        } catch (error) {
            console.error('❌ Error fetching transport orders:', error);
            res.status(500).json({ 
                message: 'Eroare la încărcarea comenzilor de transport',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    getTransportOrderHistory: async (req: Request, res: Response) => {
        try {
            const { supplierId } = req.query;

            let query = `
                SELECT 
                    eto.event_id,
                    ce.title as event_title,
                    s.name as supplier_name,
                    s.id as supplier_id,
                    SUM(eto.total_price) as total_value,
                    eto.status,
                    eto.expected_delivery_date,
                    eto.created_at,
                    COUNT(*) as items_count,
                    MAX(eto.updated_at) as last_updated
                FROM event_transport_orders eto
                LEFT JOIN calendar_events ce ON eto.event_id = ce.id
                LEFT JOIN suppliers s ON eto.supplier_id = s.id
                WHERE 1=1
            `;
            const params: any[] = [];

            if (supplierId) {
                query += ' AND eto.supplier_id = ?';
                params.push(supplierId);
            }

            query += ' GROUP BY eto.event_id, ce.title, s.name, s.id, eto.status, eto.expected_delivery_date, eto.created_at';
            query += ' ORDER BY eto.created_at DESC';

            const [history] = await pool.execute(query, params);

            console.log('✅ Transport order history fetched:', (history as any[]).length);
            res.json(history);
        } catch (error) {
            console.error('❌ Error fetching transport order history:', error);
            res.status(500).json({ 
                message: 'Eroare la încărcarea istoricului comenzilor',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    getTransportOrder: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const [order] = await pool.execute(`
                SELECT 
                    eto.*,
                    ce.title as event_title,
                    ce.start_time as event_start,
                    ce.end_time as event_end,
                    s.name as supplier_name,
                    s.email as supplier_email,
                    s.phone as supplier_phone,
                    s.address as supplier_address,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit,
                    p.unit_price as product_unit_price
                FROM event_transport_orders eto
                LEFT JOIN calendar_events ce ON eto.event_id = ce.id
                LEFT JOIN suppliers s ON eto.supplier_id = s.id
                LEFT JOIN products p ON eto.product_id = p.id
                WHERE eto.id = ?
            `, [id]);

            if (!order || (order as any[]).length === 0) {
                return res.status(404).json({ message: 'Comanda de transport nu a fost găsită' });
            }

            console.log('✅ Transport order fetched:', id);
            res.json((order as any[])[0]);
        } catch (error) {
            console.error('❌ Error fetching transport order:', error);
            res.status(500).json({ 
                message: 'Eroare la încărcarea comenzii de transport',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    updateTransportOrderStatus: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;
            const userId = req.user?.id;

            console.log('📝 Updating transport order status:', { id, status, notes });

            // Verificăm dacă comanda există
            const [existingOrder] = await pool.execute(
                'SELECT * FROM event_transport_orders WHERE id = ?',
                [id]
            );

            if (!existingOrder || (existingOrder as any[]).length === 0) {
                return res.status(404).json({ message: 'Comanda de transport nu a fost găsită' });
            }

            // Actualizăm statusul comenzii
            await pool.execute(
                'UPDATE event_transport_orders SET status = ?, notes = ?, updated_at = NOW(), processed_by = ? WHERE id = ?',
                [status, notes || null, userId, id]
            );

            // Dacă comanda este finalizată, actualizăm și stocul
            if (status === 'DELIVERED') {
                const order = (existingOrder as any[])[0];
                
                // Adăugăm produsele în inventar
                await pool.execute(`
                    INSERT INTO inventory (product_id, quantity, unit_price, notes, created_by)
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                    quantity = quantity + VALUES(quantity),
                    updated_at = NOW()
                `, [
                    order.product_id,
                    order.quantity,
                    order.unit_price,
                    `Adăugat din comanda de transport #${id}`,
                    userId
                ]);

                console.log('✅ Inventory updated for delivered order:', id);
            }

            // Returnăm comanda actualizată
            const [updatedOrder] = await pool.execute(`
                SELECT 
                    eto.*,
                    ce.title as event_title,
                    s.name as supplier_name,
                    p.name as product_name
                FROM event_transport_orders eto
                LEFT JOIN calendar_events ce ON eto.event_id = ce.id
                LEFT JOIN suppliers s ON eto.supplier_id = s.id
                LEFT JOIN products p ON eto.product_id = p.id
                WHERE eto.id = ?
            `, [id]);

            console.log('✅ Transport order status updated successfully');
            res.json((updatedOrder as any[])[0]);
        } catch (error) {
            console.error('❌ Error updating transport order status:', error);
            res.status(500).json({ 
                message: 'Eroare la actualizarea statusului comenzii',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    // Finalizează comanda de transport și actualizează stocul
    finalizeTransportOrder: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            console.log('🎯 Finalizing transport order:', id);

            if (!req.user) {
                return res.status(401).json({ message: 'Utilizator neautentificat' });
            }

            // Obține evenimentul și verifică dacă este de tip transport
            const [events] = await pool.execute<any[]>(
                'SELECT * FROM calendar_events WHERE id = ?',
                [id]
            );

            if (events.length === 0) {
                return res.status(404).json({ message: 'Eveniment negăsit' });
            }

            const event = events[0];

            if (event.type !== 'SUPPLY_ORDER') {
                return res.status(400).json({ message: 'Acest eveniment nu este o comandă de transport' });
            }

            // Parse metadata pentru a obține produsele
            let metadata;
            try {
                metadata = typeof event.metadata === 'string' ? JSON.parse(event.metadata) : event.metadata;
            } catch (error) {
                return res.status(400).json({ message: 'Metadata invalid' });
            }

            // Verifică dacă stocul a fost deja actualizat
            if (metadata?.stockUpdated === true) {
                return res.status(400).json({ 
                    message: 'Stocul a fost deja actualizat pentru această comandă',
                    stockUpdates: []
                });
            }

            // Obține produsele din event_transport_orders
            const [orderItems] = await pool.execute<any[]>(
                'SELECT * FROM event_transport_orders WHERE event_id = ?',
                [id]
            );

            if (orderItems.length === 0) {
                return res.status(400).json({ message: 'Nu există produse în comandă' });
            }

            console.log('📦 Processing order items:', orderItems.length);

            // Actualizează stocul pentru fiecare produs
            const stockUpdates = [];
            for (const item of orderItems) {
                try {
                    // Verifică dacă produsul există în inventory
                    const [inventoryRows] = await pool.execute<any[]>(
                        'SELECT * FROM inventory WHERE product_id = ?',
                        [item.product_id]
                    );

                    let newQuantity;
                    if (inventoryRows.length === 0) {
                        // Creează înregistrare nouă în inventory
                        await pool.execute(
                            `INSERT INTO inventory (product_id, quantity, unit_cost) 
                             VALUES (?, ?, ?)`,
                            [item.product_id, item.quantity, item.unit_price || 0]
                        );
                        newQuantity = item.quantity;
                        console.log(`✅ Created new inventory entry for product ${item.product_id}: ${newQuantity}`);
            } else {
                        // Actualizează cantitatea existentă
                        const currentInventory = inventoryRows[0];
                        newQuantity = Number(currentInventory.quantity) + Number(item.quantity);
                        
                        // Calculează cost unitar mediu ponderat
                        const currentValue = Number(currentInventory.quantity) * Number(currentInventory.unit_cost);
                        const addedValue = Number(item.quantity) * Number(item.unit_price || currentInventory.unit_cost);
                        const newUnitCost = newQuantity > 0 ? (currentValue + addedValue) / newQuantity : currentInventory.unit_cost;

                        await pool.execute(
                            `UPDATE inventory 
                             SET quantity = ?, 
                                 unit_cost = ? 
                             WHERE product_id = ?`,
                            [newQuantity, newUnitCost, item.product_id]
                        );
                        console.log(`✅ Updated inventory for product ${item.product_id}: ${currentInventory.quantity} → ${newQuantity}`);
                    }

                    // Obține inventory_id pentru a crea înregistrare în stock_movements
                    const [inventoryForMovement] = await pool.execute<any[]>(
                        'SELECT id FROM inventory WHERE product_id = ?',
                        [item.product_id]
                    );
                    
                    if (inventoryForMovement.length > 0) {
                        // Creează înregistrare în stock_movements pentru istoricul de audit
                        await pool.execute(
                            `INSERT INTO stock_movements 
                             (inventory_id, type, quantity, unit_cost, reference_document, reason, performed_by, movement_date, notes) 
                             VALUES (?, 'IN', ?, ?, ?, ?, ?, NOW(), ?)`,
                            [
                                inventoryForMovement[0].id,
                                item.quantity,
                                item.unit_price || 0,
                                `Eveniment #${id}`,
                                'Finalizare comandă transport',
                                req.user.id,
                                `Comandă finalizată: ${event.title}`
                            ]
                        );
                    }

                    stockUpdates.push({
                        product_id: item.product_id,
                        product_name: item.product_name,
                        quantity_added: item.quantity,
                        new_quantity: newQuantity
                    });
                } catch (error) {
                    console.error(`❌ Error updating stock for product ${item.product_id}:`, error);
                    throw error;
                }
            }

            // Actualizează statusul evenimentului la COMPLETED
            const updatedMetadata = {
                ...metadata,
                deliveryStatus: 'DELIVERED',
                completedAt: new Date().toISOString(),
                completedBy: req.user.id,
                stockUpdated: true
            };

            await pool.execute(
                'UPDATE calendar_events SET status = ?, metadata = ? WHERE id = ?',
                ['COMPLETED', JSON.stringify(updatedMetadata), id]
            );

            // Trimite notificare către magazioner
            try {
                const [warehouseKeepers] = await pool.execute<any[]>(`
                    SELECT u.id, u.email, u.first_name, u.last_name 
                    FROM users u 
                    JOIN user_roles ur ON u.id = ur.user_id 
                    JOIN roles r ON ur.role_id = r.id 
                    WHERE r.name = 'WAREHOUSE_KEEPER' AND u.is_active = 1
                `);

                if (warehouseKeepers.length > 0) {
                    const { sendNotification } = require('../app');
                    
                    for (const keeper of warehouseKeepers) {
                        const message = `Comandă finalizată: ${event.title}. Stocul a fost actualizat automat cu ${orderItems.length} produse.`;
                        
                        const [notificationResult] = await pool.execute(
                            `INSERT INTO notifications (user_id, event_id, title, message, type, status) 
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [keeper.id, id, 'Stoc Actualizat', message, 'STOCK_UPDATE', 'unread']
                        );

                        const notificationId = (notificationResult as any).insertId;
                        
                        sendNotification(keeper.id, {
                            type: 'notification',
                            id: notificationId,
                            title: 'Stoc Actualizat',
                            message: message,
                            data: {
                                eventId: id,
                                eventTitle: event.title,
                                stockUpdates: stockUpdates,
                                action: 'VIEW_STOCK'
                            },
                            timestamp: new Date().toISOString(),
                            isRead: false
                        });
                    }
                    console.log('✅ Stock update notifications sent to warehouse keepers');
                }
            } catch (notificationError) {
                console.error('❌ Error sending stock update notifications:', notificationError);
            }

            console.log('✅ Transport order finalized successfully:', {
                eventId: id,
                itemsProcessed: orderItems.length,
                stockUpdates: stockUpdates
            });

            res.json({
                success: true,
                message: 'Comanda a fost finalizată și stocul a fost actualizat cu succes',
                stockUpdates: stockUpdates
            });
        } catch (error) {
            console.error('❌ Error finalizing transport order:', error);
            res.status(500).json({ 
                message: 'Eroare la finalizarea comenzii',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    cancelTransportOrder: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const userId = req.user?.id;

            console.log('❌ Cancelling transport order:', { id, reason });

            // Verificăm dacă comanda există
            const [existingOrder] = await pool.execute(
                'SELECT * FROM event_transport_orders WHERE id = ?',
                [id]
            );

            if (!existingOrder || (existingOrder as any[]).length === 0) {
                return res.status(404).json({ message: 'Comanda de transport nu a fost găsită' });
            }

            // Actualizăm statusul comenzii la CANCELLED
            await pool.execute(
                'UPDATE event_transport_orders SET status = ?, notes = ?, updated_at = NOW(), processed_by = ? WHERE id = ?',
                ['CANCELLED', reason || 'Comandă anulată', userId, id]
            );

            // Returnăm comanda anulată
            const [cancelledOrder] = await pool.execute(`
                SELECT 
                    eto.*,
                    ce.title as event_title,
                    s.name as supplier_name,
                    p.name as product_name
                FROM event_transport_orders eto
                LEFT JOIN calendar_events ce ON eto.event_id = ce.id
                LEFT JOIN suppliers s ON eto.supplier_id = s.id
                LEFT JOIN products p ON eto.product_id = p.id
                WHERE eto.id = ?
            `, [id]);

            console.log('✅ Transport order cancelled successfully');
            res.json((cancelledOrder as any[])[0]);
        } catch (error) {
            console.error('❌ Error cancelling transport order:', error);
            res.status(500).json({ 
                message: 'Eroare la anularea comenzii',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    getTransportOrderItems: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const [items] = await pool.execute(`
                SELECT 
                    eto.*,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit,
                    p.unit_price as product_unit_price
                FROM event_transport_orders eto
                LEFT JOIN products p ON eto.product_id = p.id
                WHERE eto.event_id = ?
                ORDER BY eto.created_at ASC
            `, [id]);

            console.log('✅ Transport order items fetched:', (items as any[]).length);
            res.json(items);
        } catch (error) {
            console.error('❌ Error fetching transport order items:', error);
            res.status(500).json({ 
                message: 'Eroare la încărcarea elementelor comenzii',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    // Endpoint nou pentru a prelua produsele unui eveniment de transport
    getEventTransportItems: async (req: Request, res: Response) => {
        try {
            const eventId = req.params.eventId || req.params.id;

            console.log('📦 Fetching transport items for event:', eventId);

            const [items] = await pool.execute(`
                SELECT 
                    eto.id,
                    eto.product_id,
                    eto.product_name,
                    eto.supplier_id,
                    eto.supplier_name,
                    eto.quantity,
                    eto.unit_price,
                    eto.total_price,
                    eto.expected_delivery_date,
                    eto.status,
                    eto.notes,
                    p.code as product_code,
                    p.unit as product_unit,
                    p.unit_price as product_unit_price
                FROM event_transport_orders eto
                LEFT JOIN products p ON eto.product_id = p.id
                WHERE eto.event_id = ?
                ORDER BY eto.created_at ASC
            `, [eventId]);

            // Dacă nu există produse în event_transport_orders, verificăm metadata evenimentului
            if ((items as any[]).length === 0) {
                console.log('📦 No items in event_transport_orders, checking event metadata...');
                
                const [eventRows] = await pool.execute(
                    'SELECT metadata FROM calendar_events WHERE id = ?',
                    [eventId]
                );
                
                const event = (eventRows as any[])[0];
                
                if (event && event.metadata) {
                    let metadata;
                    try {
                        if (typeof event.metadata === 'string') {
                            metadata = JSON.parse(event.metadata);
                        } else {
                            metadata = event.metadata;
                        }
                    } catch (error) {
                        console.error('Error parsing metadata:', error);
                        metadata = {};
                    }
                    
                    // Dacă metadata conține informații despre produs, le returnăm
                    if (metadata.product_name && metadata.quantity) {
                        const metadataItems = [{
                            id: metadata.product_id || 1,
                            product_id: metadata.product_id,
                            product_name: metadata.product_name,
                            supplier_id: metadata.supplier_id,
                            supplier_name: metadata.supplier_name || 'N/A',
                            quantity: metadata.quantity,
                            unit_price: parseFloat(metadata.unit_price || '0'),
                            total_price: parseFloat(metadata.total_value || '0'),
                            product_unit: metadata.unit || 'buc',
                            status: 'ORDERED'
                        }];
                        
                        console.log('✅ Transport items fetched from metadata:', metadataItems.length);
                        return res.json(metadataItems);
                    }
                }
            }

            console.log('✅ Transport items fetched for event:', (items as any[]).length);
            res.json(items);
        } catch (error) {
            console.error('❌ Error fetching transport items for event:', error);
            res.status(500).json({ 
                message: 'Eroare la încărcarea produselor evenimentului de transport',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    },

    // Endpoint pentru actualizarea statusului evenimentului de transport
    updateTransportEventStatus: async (req: Request, res: Response) => {
        try {
            const { eventId } = req.params;
            const { status, comments } = req.body;
            const userId = req.user?.id;

            console.log('🔄 Updating transport event status:', { eventId, status, comments, userId });

            // Verificăm dacă evenimentul există și este de tip transport
            const [eventRows] = await pool.execute(
                'SELECT * FROM calendar_events WHERE id = ? AND type IN ("SUPPLY_ORDER", "TRANSPORT_DELIVERY", "TRANSPORT_PICKUP")',
                [eventId]
            );

            if (!eventRows || (eventRows as any[]).length === 0) {
                return res.status(404).json({ message: 'Evenimentul de transport nu a fost găsit' });
            }

            const event = (eventRows as any[])[0];

            // Verificăm dacă utilizatorul are dreptul să modifice evenimentul
            if (!(req.user?.roles.includes('SUPER_ADMIN') || req.user?.roles.includes('DEPARTMENT_ADMIN')) && 
                event.user_id !== userId) {
                return res.status(403).json({ message: 'Nu aveți permisiunea de a modifica acest eveniment' });
            }

            // Actualizăm statusul evenimentului
            await pool.execute(
                'UPDATE calendar_events SET status = ?, updated_at = NOW() WHERE id = ?',
                [status, eventId]
            );

            // Actualizăm metadata-ul evenimentului cu informațiile de status
            let metadata = {};
            if (event.metadata) {
                try {
                    metadata = typeof event.metadata === 'string' ? JSON.parse(event.metadata) : event.metadata;
                } catch (error) {
                    console.warn('⚠️ Error parsing existing metadata:', error);
                    metadata = {};
                }
            }

            // Adăugăm informațiile de status în metadata
            const updatedMetadata = {
                ...metadata,
                deliveryStatus: status,
                lastStatusUpdate: new Date().toISOString(),
                statusComments: comments || null,
                statusUpdatedBy: userId,
                statusUpdatedAt: new Date().toISOString()
            };

            // Salvăm metadata-ul actualizat
            await pool.execute(
                'UPDATE calendar_events SET metadata = ? WHERE id = ?',
                [JSON.stringify(updatedMetadata), eventId]
            );

            // Actualizăm și statusul comenzilor de transport asociate
            await pool.execute(
                'UPDATE event_transport_orders SET status = ?, updated_at = NOW(), processed_by = ? WHERE event_id = ?',
                [status, userId, eventId]
            );

            // Log activitatea pentru finalizarea transportului
            const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
            if (status === 'COMPLETED' || status === 'DELIVERED') {
                await ActivityLogService.createLog({
                    user_id: userId!,
                    action_type: 'TRANSPORT_COMPLETED',
                    entity_type: 'EVENT',
                    entity_id: parseInt(eventId),
                    description: `A finalizat evenimentul de transport "${event.title}"`,
                    details: {
                        event_id: parseInt(eventId),
                        event_title: event.title,
                        event_type: event.type,
                        transport_status: status,
                        comments: comments || null
                    },
                    ip_address: ipAddress
                });
            }

            // Returnăm evenimentul actualizat
            const [updatedEventRows] = await pool.execute(
                'SELECT * FROM calendar_events WHERE id = ?',
                [eventId]
            );

            const updatedEvent = (updatedEventRows as any[])[0];

            console.log('✅ Transport event status updated successfully:', {
                eventId,
                newStatus: status,
                hasComments: !!comments
            });

            res.json({
                success: true,
                message: 'Statusul evenimentului de transport a fost actualizat cu succes',
                event: updatedEvent,
                updatedMetadata: updatedMetadata
            });
        } catch (error) {
            console.error('❌ Error updating transport event status:', error);
            res.status(500).json({ 
                message: 'Eroare la actualizarea statusului evenimentului de transport',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
}; 