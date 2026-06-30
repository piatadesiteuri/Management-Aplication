import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/database';

export const EventStockController = {
    // Obținere operațiuni de stoc pentru un eveniment
    getEventStockOperations: async (req: Request, res: Response) => {
        try {
            const { eventId } = req.params;
            console.log('📦 Getting stock operations for event:', eventId);

            const [operations] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    eso.*,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit,
                    p.unit_price as product_default_price,
                    pc.name as product_category_name,
                    s.name as supplier_name,
                    d.name as department_name,
                    u1.first_name as created_by_first_name,
                    u1.last_name as created_by_last_name,
                    u2.first_name as processed_by_first_name,
                    u2.last_name as processed_by_last_name,
                    COALESCE(SUM(i.quantity), 0) as current_stock
                FROM event_stock_operations eso
                LEFT JOIN products p ON eso.product_id = p.id
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                LEFT JOIN suppliers s ON eso.supplier_id = s.id
                LEFT JOIN departments d ON eso.department_id = d.id
                LEFT JOIN users u1 ON eso.created_by = u1.id
                LEFT JOIN users u2 ON eso.processed_by = u2.id
                LEFT JOIN inventory i ON p.id = i.product_id
                WHERE eso.event_id = ?
                GROUP BY eso.id, p.id, pc.id, s.id, d.id, u1.id, u2.id
                ORDER BY eso.created_at ASC
            `, [eventId]);

            const transformedOperations = (operations as any[]).map(op => ({
                id: op.id,
                eventId: op.event_id,
                productId: op.product_id,
                operationType: op.operation_type,
                quantity: op.quantity,
                unitCost: op.unit_cost,
                totalCost: op.total_cost,
                fromLocation: op.from_location,
                toLocation: op.to_location,
                supplierId: op.supplier_id,
                departmentId: op.department_id,
                status: op.status,
                notes: op.notes,
                createdBy: op.created_by,
                processedBy: op.processed_by,
                processedAt: op.processed_at,
                createdAt: op.created_at,
                updatedAt: op.updated_at,
                product: {
                    id: op.product_id,
                    name: op.product_name,
                    code: op.product_code,
                    unit: op.product_unit,
                    defaultPrice: op.product_default_price,
                    categoryName: op.product_category_name,
                    currentStock: op.current_stock
                },
                supplier: op.supplier_id ? {
                    id: op.supplier_id,
                    name: op.supplier_name
                } : null,
                department: op.department_id ? {
                    id: op.department_id,
                    name: op.department_name
                } : null,
                createdByUser: op.created_by ? {
                    id: op.created_by,
                    firstName: op.created_by_first_name,
                    lastName: op.created_by_last_name
                } : null,
                processedByUser: op.processed_by ? {
                    id: op.processed_by,
                    firstName: op.processed_by_first_name,
                    lastName: op.processed_by_last_name
                } : null
            }));

            res.json({
                success: true,
                data: transformedOperations,
                count: transformedOperations.length
            });
        } catch (error: any) {
            console.error('❌ Error fetching event stock operations:', error);
            res.status(500).json({ 
                success: false,
                message: 'Eroare la încărcarea operațiunilor de stoc' 
            });
        }
    },

    // Adăugare operațiune de stoc la eveniment
    addStockOperationToEvent: async (req: Request, res: Response) => {
        try {
            const { eventId } = req.params;
            const {
                productId,
                operationType,
                quantity,
                unitCost,
                fromLocation,
                toLocation,
                supplierId,
                departmentId,
                notes
            } = req.body;

            const userId = req.user?.id;

            console.log('➕ Adding stock operation to event:', {
                eventId,
                productId,
                operationType,
                quantity,
                userId
            });

            // Validări
            if (!productId || !operationType || !quantity || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Produsul, tipul operației și cantitatea sunt obligatorii'
                });
            }

            // Verificăm că evenimentul există și este de tip stoc
            const [events] = await pool.execute<RowDataPacket[]>(
                'SELECT id, type, status FROM calendar_events WHERE id = ?',
                [eventId]
            );

            if ((events as any[]).length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Evenimentul nu a fost găsit'
                });
            }

            const event = (events as any[])[0];
            const stockEventTypes = ['STOCK_RECEPTION', 'STOCK_DISTRIBUTION', 'STOCK_MOVEMENT', 'INVENTORY_AUDIT'];
            
            if (!stockEventTypes.includes(event.type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Acest tip de eveniment nu suportă operațiuni de stoc'
                });
            }

            // Verificăm că produsul există
            const [products] = await pool.execute<RowDataPacket[]>(
                'SELECT id, name, code, unit, unit_price FROM products WHERE id = ? AND is_active = TRUE',
                [productId]
            );

            if ((products as any[]).length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Produsul nu a fost găsit'
                });
            }

            const product = (products as any[])[0];

            // Pentru operațiuni de ieșire, verificăm stocul disponibil
            if (['DISTRIBUTION', 'MOVEMENT'].includes(operationType)) {
                const [inventory] = await pool.execute<RowDataPacket[]>(
                    'SELECT SUM(quantity) as total_stock FROM inventory WHERE product_id = ?',
                    [productId]
                );

                const availableStock = (inventory as any[])[0]?.total_stock || 0;
                if (quantity > availableStock) {
                    return res.status(400).json({
                        success: false,
                        message: `Cantitate insuficientă în stoc. Disponibil: ${availableStock} ${product.unit}`
                    });
                }
            }

            // Verificăm dacă operația pentru acest produs nu există deja în eveniment
            const [existing] = await pool.execute<RowDataPacket[]>(
                'SELECT id FROM event_stock_operations WHERE event_id = ? AND product_id = ? AND operation_type = ?',
                [eventId, productId, operationType]
            );

            if ((existing as any[]).length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Operația pentru acest produs există deja în eveniment'
                });
            }

            // Creăm operația de stoc
            const [result] = await pool.execute<ResultSetHeader>(`
                INSERT INTO event_stock_operations (
                    event_id, product_id, operation_type, quantity, unit_cost,
                    from_location, to_location, supplier_id, department_id, notes, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                eventId, productId, operationType, quantity, unitCost || product.unit_price || 0,
                fromLocation, toLocation, supplierId, departmentId, notes, userId
            ]);

            // Obținem operația creată cu toate detaliile
            const [newOperation] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    eso.*,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit,
                    p.unit_price as product_default_price,
                    pc.name as product_category_name,
                    COALESCE(SUM(i.quantity), 0) as current_stock
                FROM event_stock_operations eso
                LEFT JOIN products p ON eso.product_id = p.id
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                LEFT JOIN inventory i ON p.id = i.product_id
                WHERE eso.id = ?
                GROUP BY eso.id, p.id, pc.id
            `, [result.insertId]);

            const operation = (newOperation as any[])[0];
            const transformedOperation = {
                id: operation.id,
                eventId: operation.event_id,
                productId: operation.product_id,
                operationType: operation.operation_type,
                quantity: operation.quantity,
                unitCost: operation.unit_cost,
                totalCost: operation.total_cost,
                fromLocation: operation.from_location,
                toLocation: operation.to_location,
                supplierId: operation.supplier_id,
                departmentId: operation.department_id,
                status: operation.status,
                notes: operation.notes,
                createdBy: operation.created_by,
                createdAt: operation.created_at,
                product: {
                    id: operation.product_id,
                    name: operation.product_name,
                    code: operation.product_code,
                    unit: operation.product_unit,
                    defaultPrice: operation.product_default_price,
                    categoryName: operation.product_category_name,
                    currentStock: operation.current_stock
                }
            };

            res.status(201).json({
                success: true,
                message: 'Operația de stoc a fost adăugată cu succes',
                data: transformedOperation
            });
        } catch (error: any) {
            console.error('❌ Error adding stock operation:', error);
            res.status(500).json({ 
                success: false,
                message: 'Eroare la adăugarea operației de stoc' 
            });
        }
    },

    // Procesare operațiune de stoc (execuția efectivă a mișcării)
    processStockOperation: async (req: Request, res: Response) => {
        try {
            const { operationId } = req.params;
            const { notes } = req.body;
            const userId = req.user?.id;

            console.log('⚙️ Processing stock operation:', operationId);

            // Obținem operația
            const [operations] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    eso.*,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit,
                    ce.title as event_title
                FROM event_stock_operations eso
                LEFT JOIN products p ON eso.product_id = p.id
                LEFT JOIN calendar_events ce ON eso.event_id = ce.id
                WHERE eso.id = ?
            `, [operationId]);

            if ((operations as any[]).length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Operația de stoc nu a fost găsită'
                });
            }

            const operation = (operations as any[])[0];

            if (operation.status !== 'PLANNED') {
                return res.status(400).json({
                    success: false,
                    message: `Operația este deja în status: ${operation.status}`
                });
            }

            // Începem tranzacția
            await pool.execute('START TRANSACTION');

            try {
                // Obținem sau creăm inventarul pentru produs
                let [inventory] = await pool.execute<RowDataPacket[]>(
                    'SELECT * FROM inventory WHERE product_id = ? AND location = ? LIMIT 1',
                    [operation.product_id, operation.to_location || operation.from_location || 'Depozit Principal']
                );

                let inventoryId;
                let currentStock = 0;

                if ((inventory as any[]).length === 0) {
                    // Creăm intrare nouă în inventar
                    const [invResult] = await pool.execute<ResultSetHeader>(
                        'INSERT INTO inventory (product_id, quantity, location, unit_cost) VALUES (?, 0, ?, ?)',
                        [operation.product_id, operation.to_location || 'Depozit Principal', operation.unit_cost]
                    );
                    inventoryId = invResult.insertId;
                } else {
                    inventoryId = (inventory as any[])[0].id;
                    currentStock = (inventory as any[])[0].quantity;
                }

                // Calculăm noua cantitate în funcție de tipul operației
                let newQuantity = currentStock;
                let movementType = 'IN';
                let quantityChanged = operation.quantity;

                switch (operation.operation_type) {
                    case 'RECEPTION':
                        newQuantity = currentStock + operation.quantity;
                        movementType = 'IN';
                        break;
                    case 'DISTRIBUTION':
                    case 'MOVEMENT':
                        if (operation.quantity > currentStock) {
                            throw new Error(`Cantitate insuficientă în stoc. Disponibil: ${currentStock} ${operation.product_unit}`);
                        }
                        newQuantity = currentStock - operation.quantity;
                        movementType = 'OUT';
                        quantityChanged = -operation.quantity;
                        break;
                    case 'AUDIT':
                        // Pentru audit, cantitatea din operație este cantitatea finală dorită
                        quantityChanged = operation.quantity - currentStock;
                        newQuantity = operation.quantity;
                        movementType = quantityChanged >= 0 ? 'IN' : 'OUT';
                        break;
                }

                // Actualizăm inventarul
                await pool.execute(
                    'UPDATE inventory SET quantity = ?, unit_cost = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
                    [newQuantity, operation.unit_cost, inventoryId]
                );

                // Creăm mișcarea de stoc
                const referenceDoc = `EVENT-${operation.event_id}-OP-${operation.id}`;
                const [stockMovementResult] = await pool.execute<ResultSetHeader>(`
                    INSERT INTO stock_movements (
                        inventory_id, type, quantity, unit_cost, reference_document, 
                        reason, performed_by, supplier_id, department_id, notes, movement_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                `, [
                    inventoryId, movementType, Math.abs(quantityChanged), operation.unit_cost,
                    referenceDoc, `Event Stock Operation: ${operation.operation_type}`,
                    userId, operation.supplier_id, operation.department_id, notes
                ]);

                // Înregistrăm mișcarea în istoric
                await pool.execute(`
                    INSERT INTO event_stock_movements (
                        event_stock_operation_id, stock_movement_id, inventory_id,
                        movement_type, quantity_before, quantity_after, quantity_changed,
                        unit_cost, reference_document, performed_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    operation.id, stockMovementResult.insertId, inventoryId,
                    movementType, currentStock, newQuantity, quantityChanged,
                    operation.unit_cost, referenceDoc, userId
                ]);

                // Actualizăm statusul operației
                await pool.execute(`
                    UPDATE event_stock_operations 
                    SET status = 'COMPLETED', processed_by = ?, processed_at = NOW(), notes = CONCAT(COALESCE(notes, ''), ?, ?)
                    WHERE id = ?
                `, [userId, notes ? '\n--- Procesare ---\n' : '', notes || '', operation.id]);

                // Confirmăm tranzacția
                await pool.execute('COMMIT');

                res.json({
                    success: true,
                    message: `Operația de ${operation.operation_type.toLowerCase()} a fost procesată cu succes`,
                    data: {
                        operationId: operation.id,
                        productName: operation.product_name,
                        quantityProcessed: operation.quantity,
                        previousStock: currentStock,
                        newStock: newQuantity,
                        movementType,
                        totalCost: operation.total_cost
                    }
                });
            } catch (error) {
                await pool.execute('ROLLBACK');
                throw error;
            }
        } catch (error: any) {
            console.error('❌ Error processing stock operation:', error);
            res.status(500).json({ 
                success: false,
                message: error.message || 'Eroare la procesarea operației de stoc' 
            });
        }
    },

    // Eliminare operațiune de stoc
    removeStockOperation: async (req: Request, res: Response) => {
        try {
            const { operationId } = req.params;

            console.log('🗑️ Removing stock operation:', operationId);

            // Verificăm dacă operația poate fi ștearsă
            const [operations] = await pool.execute<RowDataPacket[]>(
                'SELECT id, status, operation_type FROM event_stock_operations WHERE id = ?',
                [operationId]
            );

            if ((operations as any[]).length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Operația de stoc nu a fost găsită'
                });
            }

            const operation = (operations as any[])[0];

            if (operation.status === 'COMPLETED') {
                return res.status(400).json({
                    success: false,
                    message: 'Nu se poate șterge o operație completată'
                });
            }

            // Ștergem operația
            await pool.execute('DELETE FROM event_stock_operations WHERE id = ?', [operationId]);

            res.json({
                success: true,
                message: 'Operația de stoc a fost eliminată cu succes'
            });
        } catch (error: any) {
            console.error('❌ Error removing stock operation:', error);
            res.status(500).json({ 
                success: false,
                message: 'Eroare la eliminarea operației de stoc' 
            });
        }
    },

    // Obținere template-uri pentru operațiuni de stoc
    getStockTemplates: async (req: Request, res: Response) => {
        try {
            const { eventType } = req.query;

            console.log('📋 Getting stock templates for event type:', eventType);

            let query = `
                SELECT 
                    est.*,
                    d.name as department_name,
                    u.first_name as created_by_first_name,
                    u.last_name as created_by_last_name,
                    COUNT(esti.id) as items_count
                FROM event_stock_templates est
                LEFT JOIN departments d ON est.department_id = d.id
                LEFT JOIN users u ON est.created_by = u.id
                LEFT JOIN event_stock_template_items esti ON est.id = esti.template_id AND esti.is_active = TRUE
                WHERE est.is_active = TRUE
            `;
            const params: any[] = [];

            if (eventType) {
                query += ' AND est.event_type = ?';
                params.push(eventType);
            }

            query += ' GROUP BY est.id ORDER BY est.name';

            const [templates] = await pool.execute<RowDataPacket[]>(query, params);

            const transformedTemplates = (templates as any[]).map(template => ({
                id: template.id,
                name: template.name,
                description: template.description,
                eventType: template.event_type,
                departmentId: template.department_id,
                departmentName: template.department_name,
                itemsCount: template.items_count,
                isActive: template.is_active,
                createdBy: template.created_by,
                createdByUser: template.created_by ? {
                    firstName: template.created_by_first_name,
                    lastName: template.created_by_last_name
                } : null,
                createdAt: template.created_at,
                updatedAt: template.updated_at
            }));

            res.json({
                success: true,
                data: transformedTemplates
            });
        } catch (error: any) {
            console.error('❌ Error fetching stock templates:', error);
            res.status(500).json({ 
                success: false,
                message: 'Eroare la încărcarea template-urilor' 
            });
        }
    },

    // Aplicare template la eveniment
    applyTemplateToEvent: async (req: Request, res: Response) => {
        try {
            const { eventId, templateId } = req.params;
            const userId = req.user?.id;

            console.log('📋 Applying template to event:', { eventId, templateId });

            // Verificăm că template-ul există
            const [templates] = await pool.execute<RowDataPacket[]>(
                'SELECT * FROM event_stock_templates WHERE id = ? AND is_active = TRUE',
                [templateId]
            );

            if ((templates as any[]).length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Template-ul nu a fost găsit'
                });
            }

            const template = (templates as any[])[0];

            // Obținem itemii din template
            const [templateItems] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    esti.*,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit
                FROM event_stock_template_items esti
                LEFT JOIN products p ON esti.product_id = p.id
                WHERE esti.template_id = ? AND esti.is_active = TRUE AND p.is_active = TRUE
                ORDER BY p.name
            `, [templateId]);

            if ((templateItems as any[]).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Template-ul nu conține produse active'
                });
            }

            let addedCount = 0;
            let skippedCount = 0;

            // Aplicăm fiecare item din template
            for (const item of templateItems as any[]) {
                try {
                    // Verificăm dacă operația pentru acest produs nu există deja
                    const [existing] = await pool.execute<RowDataPacket[]>(
                        'SELECT id FROM event_stock_operations WHERE event_id = ? AND product_id = ?',
                        [eventId, item.product_id]
                    );

                    if ((existing as any[]).length > 0) {
                        skippedCount++;
                        continue;
                    }

                    // Creăm operația de stoc
                    await pool.execute(`
                        INSERT INTO event_stock_operations (
                            event_id, product_id, operation_type, quantity, unit_cost,
                            from_location, to_location, notes, created_by
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        eventId, item.product_id, template.event_type.replace('STOCK_', ''),
                        item.default_quantity, item.default_unit_cost,
                        item.from_location, item.to_location,
                        `Adăugat din template: ${template.name}${item.notes ? '\n' + item.notes : ''}`,
                        userId
                    ]);

                    addedCount++;
                } catch (error) {
                    console.error('Error adding item from template:', error);
                    skippedCount++;
                }
            }

            res.json({
                success: true,
                message: `Template aplicat cu succes: ${addedCount} adăugate, ${skippedCount} omise`,
                data: {
                    templateName: template.name,
                    addedItems: addedCount,
                    skippedItems: skippedCount,
                    totalItems: (templateItems as any[]).length
                }
            });
        } catch (error: any) {
            console.error('❌ Error applying template:', error);
            res.status(500).json({ 
                success: false,
                message: 'Eroare la aplicarea template-ului' 
            });
        }
    },

    // Statistici pentru operațiunile de stoc
    getStockOperationStats: async (req: Request, res: Response) => {
        try {
            const { eventId } = req.params;

            console.log('📊 Getting stock operation stats for event:', eventId);

            // Statistici generale
            const [stats] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    COUNT(*) as total_operations,
                    SUM(CASE WHEN status = 'PLANNED' THEN 1 ELSE 0 END) as planned_operations,
                    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_operations,
                    SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_operations,
                    SUM(total_cost) as total_value,
                    COUNT(DISTINCT product_id) as unique_products,
                    COUNT(DISTINCT operation_type) as operation_types
                FROM event_stock_operations
                WHERE event_id = ?
            `, [eventId]);

            // Statistici pe tip de operație
            const [operationTypes] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    operation_type,
                    COUNT(*) as count,
                    SUM(quantity) as total_quantity,
                    SUM(total_cost) as total_cost,
                    AVG(unit_cost) as avg_unit_cost
                FROM event_stock_operations
                WHERE event_id = ?
                GROUP BY operation_type
                ORDER BY operation_type
            `, [eventId]);

            // Top produse
            const [topProducts] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    eso.product_id,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit,
                    SUM(eso.quantity) as total_quantity,
                    SUM(eso.total_cost) as total_cost,
                    COUNT(*) as operation_count
                FROM event_stock_operations eso
                LEFT JOIN products p ON eso.product_id = p.id
                WHERE eso.event_id = ?
                GROUP BY eso.product_id, p.name, p.code, p.unit
                ORDER BY total_cost DESC
                LIMIT 10
            `, [eventId]);

            res.json({
                success: true,
                data: {
                    general: (stats as any[])[0],
                    operationTypes: operationTypes,
                    topProducts: topProducts
                }
            });
        } catch (error: any) {
            console.error('❌ Error fetching stock operation stats:', error);
            res.status(500).json({ 
                success: false,
                message: 'Eroare la încărcarea statisticilor' 
            });
        }
    }
}; 