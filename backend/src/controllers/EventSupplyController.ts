import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/database';

export const EventSupplyController = {
    // Obține toate materialele pentru un eveniment
    getEventSupplies: async (req: Request, res: Response) => {
        try {
            const { eventId } = req.params;
            console.log('📦 Getting supplies for event:', eventId);

            const [supplies] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    es.*,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit,
                    p.unit_price as product_unit_price,
                    pc.name as category_name,
                    COALESCE(SUM(i.quantity), 0) as available_stock,
                    ur.first_name as requested_by_first_name,
                    ur.last_name as requested_by_last_name,
                    ua.first_name as approved_by_first_name,
                    ua.last_name as approved_by_last_name,
                    ual.first_name as allocated_by_first_name,
                    ual.last_name as allocated_by_last_name
                FROM event_supplies es
                JOIN products p ON es.product_id = p.id
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                LEFT JOIN inventory i ON p.id = i.product_id
                LEFT JOIN users ur ON es.requested_by = ur.id
                LEFT JOIN users ua ON es.approved_by = ua.id
                LEFT JOIN users ual ON es.allocated_by = ual.id
                WHERE es.event_id = ?
                GROUP BY es.id, p.id, pc.id, ur.id, ua.id, ual.id
                ORDER BY es.priority DESC, p.name
            `, [eventId]);

            const transformedSupplies = supplies.map(supply => ({
                id: supply.id,
                eventId: supply.event_id,
                productId: supply.product_id,
                quantityNeeded: supply.quantity_needed,
                quantityAllocated: supply.quantity_allocated,
                quantityUsed: supply.quantity_used,
                unitCost: supply.unit_cost,
                totalCost: supply.total_cost,
                priority: supply.priority,
                status: supply.status,
                notes: supply.notes,
                deliveredAt: supply.delivered_at,
                createdAt: supply.created_at,
                updatedAt: supply.updated_at,
                product: {
                    id: supply.product_id,
                    name: supply.product_name,
                    code: supply.product_code,
                    unit: supply.product_unit,
                    unitPrice: supply.product_unit_price,
                    categoryName: supply.category_name,
                    availableStock: supply.available_stock
                },
                requestedBy: supply.requested_by ? {
                    id: supply.requested_by,
                    firstName: supply.requested_by_first_name,
                    lastName: supply.requested_by_last_name
                } : null,
                approvedBy: supply.approved_by ? {
                    id: supply.approved_by,
                    firstName: supply.approved_by_first_name,
                    lastName: supply.approved_by_last_name
                } : null,
                allocatedBy: supply.allocated_by ? {
                    id: supply.allocated_by,
                    firstName: supply.allocated_by_first_name,
                    lastName: supply.allocated_by_last_name
                } : null
            }));

            res.json({
                success: true,
                data: transformedSupplies,
                count: transformedSupplies.length
            });
        } catch (error: any) {
            console.error('❌ Error fetching event supplies:', error);
            res.status(500).json({ 
                success: false,
                message: 'Eroare la încărcarea materialelor pentru eveniment' 
            });
        }
    },

    // Adaugă material la un eveniment
    addSupplyToEvent: async (req: Request, res: Response) => {
        try {
            const { eventId } = req.params;
            const {
                productId,
                quantityNeeded,
                unitCost,
                priority = 'MEDIUM',
                notes,
                requestedBy
            } = req.body;

            console.log('➕ Adding supply to event:', { eventId, productId, quantityNeeded });

            // Verifică dacă produsul există și obține detaliile
            const [productCheck] = await pool.execute<RowDataPacket[]>(
                'SELECT id, name, code, unit, unit_price FROM products WHERE id = ? AND is_active = TRUE',
                [productId]
            );

            if (productCheck.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Produsul nu a fost găsit'
                });
            }

            // Verifică dacă evenimentul există
            const [eventCheck] = await pool.execute<RowDataPacket[]>(
                'SELECT id, title FROM calendar_events WHERE id = ?',
                [eventId]
            );

            if (eventCheck.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Evenimentul nu a fost găsit'
                });
            }

            // Verifică dacă produsul nu este deja adăugat la acest eveniment
            const [existingSupply] = await pool.execute<RowDataPacket[]>(
                'SELECT id FROM event_supplies WHERE event_id = ? AND product_id = ?',
                [eventId, productId]
            );

            if (existingSupply.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Produsul "${productCheck[0].name}" este deja adăugat la acest eveniment`
                });
            }

            const product = productCheck[0];
            const finalUnitCost = unitCost || product.unit_price || 0;

            // Inserează noul supply
            const [result] = await pool.execute<ResultSetHeader>(
                `INSERT INTO event_supplies (
                    event_id, product_id, quantity_needed, unit_cost, priority, notes, requested_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [eventId, productId, quantityNeeded, finalUnitCost, priority, notes, requestedBy]
            );

            // Înregistrează în istoric
            await pool.execute<ResultSetHeader>(
                `INSERT INTO event_supply_history (
                    event_supply_id, action, quantity, new_status, performed_by, notes
                ) VALUES (?, 'REQUESTED', ?, 'PENDING', ?, ?)`,
                [result.insertId, quantityNeeded, requestedBy, `Material solicitat pentru eveniment`]
            );

            // Obține supply-ul creat cu toate detaliile
            const [newSupply] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    es.*,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit,
                    COALESCE(SUM(i.quantity), 0) as available_stock
                FROM event_supplies es
                JOIN products p ON es.product_id = p.id
                LEFT JOIN inventory i ON p.id = i.product_id
                WHERE es.id = ?
                GROUP BY es.id, p.id
            `, [result.insertId]);

            res.status(201).json({
                success: true,
                message: `Materialul "${product.name}" a fost adăugat cu succes la eveniment`,
                data: {
                    id: newSupply[0].id,
                    eventId: newSupply[0].event_id,
                    productId: newSupply[0].product_id,
                    quantityNeeded: newSupply[0].quantity_needed,
                    unitCost: newSupply[0].unit_cost,
                    totalCost: newSupply[0].total_cost,
                    priority: newSupply[0].priority,
                    status: newSupply[0].status,
                    notes: newSupply[0].notes,
                    product: {
                        id: newSupply[0].product_id,
                        name: newSupply[0].product_name,
                        code: newSupply[0].product_code,
                        unit: newSupply[0].product_unit,
                        availableStock: newSupply[0].available_stock
                    }
                }
            });
        } catch (error: any) {
            console.error('❌ Error adding supply to event:', error);
            res.status(500).json({
                success: false,
                message: 'Eroare la adăugarea materialului la eveniment'
            });
        }
    },

    // Actualizează un supply pentru eveniment
    updateEventSupply: async (req: Request, res: Response) => {
        try {
            const { eventId, supplyId } = req.params;
            const {
                quantityNeeded,
                quantityAllocated,
                quantityUsed,
                unitCost,
                priority,
                status,
                notes,
                approvedBy,
                allocatedBy
            } = req.body;

            console.log('✏️ Updating event supply:', { eventId, supplyId, status });

            // Verifică dacă supply-ul există
            const [existingSupply] = await pool.execute<RowDataPacket[]>(
                `SELECT es.*, p.name as product_name 
                 FROM event_supplies es 
                 JOIN products p ON es.product_id = p.id 
                 WHERE es.id = ? AND es.event_id = ?`,
                [supplyId, eventId]
            );

            if (existingSupply.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Materialul nu a fost găsit pentru acest eveniment'
                });
            }

            const supply = existingSupply[0];
            const previousStatus = supply.status;

            // Construiește query-ul de update dinamic
            const updateFields = [];
            const updateValues = [];

            if (quantityNeeded !== undefined) {
                updateFields.push('quantity_needed = ?');
                updateValues.push(quantityNeeded);
            }
            if (quantityAllocated !== undefined) {
                updateFields.push('quantity_allocated = ?');
                updateValues.push(quantityAllocated);
            }
            if (quantityUsed !== undefined) {
                updateFields.push('quantity_used = ?');
                updateValues.push(quantityUsed);
            }
            if (unitCost !== undefined) {
                updateFields.push('unit_cost = ?');
                updateValues.push(unitCost);
            }
            if (priority !== undefined) {
                updateFields.push('priority = ?');
                updateValues.push(priority);
            }
            if (status !== undefined) {
                updateFields.push('status = ?');
                updateValues.push(status);
            }
            if (notes !== undefined) {
                updateFields.push('notes = ?');
                updateValues.push(notes);
            }
            if (approvedBy !== undefined) {
                updateFields.push('approved_by = ?');
                updateValues.push(approvedBy);
            }
            if (allocatedBy !== undefined) {
                updateFields.push('allocated_by = ?');
                updateValues.push(allocatedBy);
            }
            if (status === 'DELIVERED') {
                updateFields.push('delivered_at = CURRENT_TIMESTAMP');
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(supplyId, eventId);

            if (updateFields.length > 1) { // > 1 because updated_at is always added
                await pool.execute<ResultSetHeader>(
                    `UPDATE event_supplies SET ${updateFields.join(', ')} WHERE id = ? AND event_id = ?`,
                    updateValues
                );
            }

            // Înregistrează în istoric dacă s-a schimbat statusul
            if (status && status !== previousStatus) {
                const actionMap: Record<string, string> = {
                    'APPROVED': 'APPROVED',
                    'ALLOCATED': 'ALLOCATED',
                    'DELIVERED': 'DELIVERED',
                    'USED': 'USED',
                    'RETURNED': 'RETURNED'
                };

                const action = actionMap[status] || 'UPDATED';

                await pool.execute<ResultSetHeader>(
                    `INSERT INTO event_supply_history (
                        event_supply_id, action, quantity, previous_status, new_status, 
                        performed_by, notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [supplyId, action, quantityAllocated || quantityUsed || 0, previousStatus, status, 
                     approvedBy || allocatedBy, `Status actualizat din ${previousStatus} în ${status}`]
                );
            }

            res.json({
                success: true,
                message: `Materialul "${supply.product_name}" a fost actualizat cu succes`
            });
        } catch (error: any) {
            console.error('❌ Error updating event supply:', error);
            res.status(500).json({
                success: false,
                message: 'Eroare la actualizarea materialului'
            });
        }
    },

    // Șterge un supply de la eveniment
    removeSupplyFromEvent: async (req: Request, res: Response) => {
        try {
            const { eventId, supplyId } = req.params;

            console.log('🗑️ Removing supply from event:', { eventId, supplyId });

            // Verifică dacă supply-ul există
            const [existingSupply] = await pool.execute<RowDataPacket[]>(
                `SELECT es.*, p.name as product_name 
                 FROM event_supplies es 
                 JOIN products p ON es.product_id = p.id 
                 WHERE es.id = ? AND es.event_id = ?`,
                [supplyId, eventId]
            );

            if (existingSupply.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Materialul nu a fost găsit pentru acest eveniment'
                });
            }

            const supply = existingSupply[0];

            // Verifică dacă materialul a fost deja alocat sau utilizat
            if (supply.status === 'ALLOCATED' || supply.status === 'DELIVERED' || supply.status === 'USED') {
                return res.status(400).json({
                    success: false,
                    message: `Nu se poate șterge materialul "${supply.product_name}" deoarece a fost deja ${supply.status.toLowerCase()}`
                });
            }

            // Înregistrează în istoric înainte de ștergere
            await pool.execute<ResultSetHeader>(
                `INSERT INTO event_supply_history (
                    event_supply_id, action, previous_status, new_status, performed_by, notes
                ) VALUES (?, 'CANCELLED', ?, 'CANCELLED', ?, ?)`,
                [supplyId, supply.status, req.user?.id, `Material eliminat din eveniment`]
            );

            // Șterge supply-ul
            await pool.execute<ResultSetHeader>(
                'DELETE FROM event_supplies WHERE id = ? AND event_id = ?',
                [supplyId, eventId]
            );

            res.json({
                success: true,
                message: `Materialul "${supply.product_name}" a fost eliminat cu succes din eveniment`
            });
        } catch (error: any) {
            console.error('❌ Error removing supply from event:', error);
            res.status(500).json({
                success: false,
                message: 'Eroare la eliminarea materialului din eveniment'
            });
        }
    },

    // Obține template-urile de materiale
    getSupplyTemplates: async (req: Request, res: Response) => {
        try {
            console.log('📋 Getting supply templates');

            const [templates] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    st.*,
                    u.first_name as created_by_first_name,
                    u.last_name as created_by_last_name,
                    COUNT(sti.id) as items_count
                FROM event_supply_templates st
                LEFT JOIN users u ON st.created_by = u.id
                LEFT JOIN event_supply_template_items sti ON st.id = sti.template_id
                WHERE st.is_active = TRUE
                GROUP BY st.id, u.id
                ORDER BY st.name
            `);

            const transformedTemplates = templates.map(template => ({
                id: template.id,
                name: template.name,
                description: template.description,
                eventType: template.event_type,
                isActive: template.is_active,
                createdAt: template.created_at,
                updatedAt: template.updated_at,
                itemsCount: template.items_count,
                createdBy: template.created_by ? {
                    id: template.created_by,
                    firstName: template.created_by_first_name,
                    lastName: template.created_by_last_name
                } : null
            }));

            res.json({
                success: true,
                data: transformedTemplates,
                count: transformedTemplates.length
            });
        } catch (error: any) {
            console.error('❌ Error fetching supply templates:', error);
            res.status(500).json({
                success: false,
                message: 'Eroare la încărcarea template-urilor'
            });
        }
    },

    // Aplică un template la un eveniment
    applyTemplateToEvent: async (req: Request, res: Response) => {
        try {
            const { eventId, templateId } = req.params;
            const { requestedBy } = req.body;

            console.log('🎯 Applying template to event:', { eventId, templateId });

            // Verifică dacă template-ul există
            const [templateCheck] = await pool.execute<RowDataPacket[]>(
                'SELECT id, name FROM event_supply_templates WHERE id = ? AND is_active = TRUE',
                [templateId]
            );

            if (templateCheck.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Template-ul nu a fost găsit'
                });
            }

            // Obține articolele din template
            const [templateItems] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    sti.*,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit,
                    p.unit_price as product_unit_price
                FROM event_supply_template_items sti
                JOIN products p ON sti.product_id = p.id
                WHERE sti.template_id = ? AND p.is_active = TRUE
                ORDER BY sti.priority DESC, p.name
            `, [templateId]);

            if (templateItems.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Template-ul nu conține articole valide'
                });
            }

            let addedItems = 0;
            let skippedItems = 0;

            // Adaugă fiecare articol din template la eveniment
            for (const item of templateItems) {
                try {
                    // Verifică dacă produsul nu există deja pentru acest eveniment
                    const [existingSupply] = await pool.execute<RowDataPacket[]>(
                        'SELECT id FROM event_supplies WHERE event_id = ? AND product_id = ?',
                        [eventId, item.product_id]
                    );

                    if (existingSupply.length === 0) {
                        // Adaugă produsul
                        const [result] = await pool.execute<ResultSetHeader>(
                            `INSERT INTO event_supplies (
                                event_id, product_id, quantity_needed, unit_cost, priority, 
                                notes, requested_by
                            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [eventId, item.product_id, item.default_quantity, 
                             item.unit_cost || item.product_unit_price || 0, 
                             item.priority, item.notes, requestedBy]
                        );

                        // Înregistrează în istoric
                        await pool.execute<ResultSetHeader>(
                            `INSERT INTO event_supply_history (
                                event_supply_id, action, quantity, new_status, performed_by, notes
                            ) VALUES (?, 'REQUESTED', ?, 'PENDING', ?, ?)`,
                            [result.insertId, item.default_quantity, requestedBy, 
                             `Adăugat din template: ${templateCheck[0].name}`]
                        );

                        addedItems++;
                    } else {
                        skippedItems++;
                    }
                } catch (itemError) {
                    console.error('Error adding item from template:', itemError);
                    skippedItems++;
                }
            }

            res.json({
                success: true,
                message: `Template "${templateCheck[0].name}" aplicat cu succes`,
                data: {
                    templateName: templateCheck[0].name,
                    totalItems: templateItems.length,
                    addedItems,
                    skippedItems
                }
            });
        } catch (error: any) {
            console.error('❌ Error applying template to event:', error);
            res.status(500).json({
                success: false,
                message: 'Eroare la aplicarea template-ului'
            });
        }
    },

    // Obține istoricul pentru un supply
    getSupplyHistory: async (req: Request, res: Response) => {
        try {
            const { supplyId } = req.params;

            console.log('📚 Getting supply history:', supplyId);

            const [history] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    esh.*,
                    u.first_name as performed_by_first_name,
                    u.last_name as performed_by_last_name
                FROM event_supply_history esh
                LEFT JOIN users u ON esh.performed_by = u.id
                WHERE esh.event_supply_id = ?
                ORDER BY esh.performed_at DESC
            `, [supplyId]);

            const transformedHistory = history.map(record => ({
                id: record.id,
                eventSupplyId: record.event_supply_id,
                action: record.action,
                quantity: record.quantity,
                previousStatus: record.previous_status,
                newStatus: record.new_status,
                notes: record.notes,
                performedAt: record.performed_at,
                performedBy: record.performed_by ? {
                    id: record.performed_by,
                    firstName: record.performed_by_first_name,
                    lastName: record.performed_by_last_name
                } : null
            }));

            res.json({
                success: true,
                data: transformedHistory,
                count: transformedHistory.length
            });
        } catch (error: any) {
            console.error('❌ Error fetching supply history:', error);
            res.status(500).json({
                success: false,
                message: 'Eroare la încărcarea istoricului'
            });
        }
    }
}; 