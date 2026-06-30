import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/database';

export const AutoOrderController = {
    // Analizează evenimentele pentru perioada următoare și identifică materialele necesare
    analyzeUpcomingEvents: async (req: Request, res: Response) => {
        try {
            const { days = 7 } = req.query; // Implicit analizăm următoarele 7 zile
            
            console.log('🔍 Analyzing upcoming events for auto-order workflow');

            // Calculăm perioada de analiză
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + Number(days));

            // Obținem evenimentele din perioada specificată
            const [upcomingEvents] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    ce.id,
                    ce.title,
                    ce.start_time,
                    ce.end_time,
                    ce.type,
                    ce.status
                FROM calendar_events ce
                WHERE ce.start_time BETWEEN ? AND ?
                AND ce.status IN ('PENDING', 'APPROVED')
                ORDER BY ce.start_time
            `, [startDate.toISOString(), endDate.toISOString()]);

            if (upcomingEvents.length === 0) {
                return res.json({
                    success: true,
                    message: 'Nu există evenimente în perioada specificată',
                    data: {
                        period: { startDate, endDate, days: Number(days) },
                        events: [],
                        materialNeeds: [],
                        recommendations: []
                    }
                });
            }

            // Pentru fiecare eveniment, obținem materialele necesare
            const materialAnalysis = await Promise.all(
                upcomingEvents.map(async (event) => {
                    const [eventSupplies] = await pool.execute<RowDataPacket[]>(`
                        SELECT 
                            es.*,
                            p.name as product_name,
                            p.code as product_code,
                            p.unit as product_unit,
                            p.unit_price as product_unit_price,
                            COALESCE(SUM(i.quantity), 0) as available_stock,
                            pc.name as category_name
                        FROM event_supplies es
                        JOIN products p ON es.product_id = p.id
                        LEFT JOIN inventory i ON p.id = i.product_id
                        LEFT JOIN product_categories pc ON p.category_id = pc.id
                        WHERE es.event_id = ?
                        AND es.status IN ('PENDING', 'APPROVED', 'ALLOCATED')
                        GROUP BY es.id, p.id, pc.id
                    `, [event.id]);

                    return {
                        event: {
                            id: event.id,
                            title: event.title,
                            startTime: event.start_time,
                            endTime: event.end_time,
                            type: event.type,
                            status: event.status
                        },
                        supplies: eventSupplies.map(supply => ({
                            id: supply.id,
                            productId: supply.product_id,
                            productName: supply.product_name,
                            productCode: supply.product_code,
                            quantityNeeded: supply.quantity_needed,
                            quantityAllocated: supply.quantity_allocated,
                            unitCost: supply.unit_cost,
                            priority: supply.priority,
                            status: supply.status,
                            availableStock: supply.available_stock,
                            unit: supply.product_unit,
                            categoryName: supply.category_name,
                            shortage: Math.max(0, supply.quantity_needed - supply.available_stock)
                        }))
                    };
                })
            );

            // Calculăm necesitățile totale pe produs
            const productNeeds = new Map();
            
            materialAnalysis.forEach(({ event, supplies }) => {
                supplies.forEach(supply => {
                    const key = supply.productId;
                    if (!productNeeds.has(key)) {
                        productNeeds.set(key, {
                            productId: supply.productId,
                            productName: supply.productName,
                            productCode: supply.productCode,
                            unit: supply.unit,
                            categoryName: supply.categoryName,
                            availableStock: supply.availableStock,
                            totalNeeded: 0,
                            totalAllocated: 0,
                            totalShortage: 0,
                            averageUnitCost: 0,
                            events: [],
                            priority: 'LOW'
                        });
                    }

                    const current = productNeeds.get(key);
                    current.totalNeeded += supply.quantityNeeded;
                    current.totalAllocated += supply.quantityAllocated;
                    current.totalShortage += supply.shortage;
                    current.averageUnitCost = supply.unitCost; // Simplificat - ar trebui să calculez media ponderată
                    current.events.push({
                        eventId: event.id,
                        eventTitle: event.title,
                        eventDate: event.startTime,
                        quantityNeeded: supply.quantityNeeded,
                        priority: supply.priority
                    });

                    // Determinăm prioritatea maximă
                    const priorityOrder: Record<string, number> = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
                    if (priorityOrder[supply.priority] > priorityOrder[current.priority]) {
                        current.priority = supply.priority;
                    }
                });
            });

            const materialNeeds = Array.from(productNeeds.values());

            // Generăm recomandări pentru comenzi automate
            const recommendations = materialNeeds
                .filter(need => need.totalShortage > 0)
                .map(need => {
                    const recommendedQuantity = Math.ceil(need.totalShortage * 1.2); // 20% buffer
                    const estimatedCost = recommendedQuantity * need.averageUnitCost;
                    
                    return {
                        productId: need.productId,
                        productName: need.productName,
                        productCode: need.productCode,
                        currentStock: need.availableStock,
                        totalNeeded: need.totalNeeded,
                        shortage: need.totalShortage,
                        recommendedQuantity,
                        estimatedCost,
                        priority: need.priority,
                        urgentEvents: need.events
                            .filter((e: any) => new Date(e.eventDate).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000) // 3 zile
                            .length,
                        categoryName: need.categoryName,
                        unit: need.unit
                    };
                })
                .sort((a, b) => {
                    // Sortăm după prioritate și apoi după urgența evenimentelor
                    const priorityOrder: Record<string, number> = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                        return priorityOrder[b.priority] - priorityOrder[a.priority];
                    }
                    return b.urgentEvents - a.urgentEvents;
                });

            res.json({
                success: true,
                data: {
                    period: {
                        startDate,
                        endDate,
                        days: Number(days)
                    },
                    summary: {
                        totalEvents: upcomingEvents.length,
                        eventsWithMaterials: materialAnalysis.filter(m => m.supplies.length > 0).length,
                        totalMaterialTypes: materialNeeds.length,
                        totalShortageItems: recommendations.length,
                        estimatedTotalCost: recommendations.reduce((sum, r) => sum + r.estimatedCost, 0)
                    },
                    events: materialAnalysis,
                    materialNeeds,
                    recommendations
                }
            });
        } catch (error: any) {
            console.error('❌ Error analyzing upcoming events:', error);
            res.status(500).json({
                success: false,
                message: 'Eroare la analiza evenimentelor viitoare'
            });
        }
    },

    // Generează o comandă automată pe baza recomandărilor
    generateAutoOrder: async (req: Request, res: Response) => {
        try {
            const { 
                supplierId, 
                productIds, 
                notes = 'Comandă generată automat pe baza evenimentelor viitoare',
                approveImmediately = false 
            } = req.body;

            console.log('🤖 Generating auto order:', { supplierId, productIds: productIds?.length });

            if (!supplierId || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Furnizorul și lista de produse sunt obligatorii'
                });
            }

            // Verifică dacă furnizorul există
            const [supplierCheck] = await pool.execute<RowDataPacket[]>(
                'SELECT id, name FROM suppliers WHERE id = ? AND is_active = TRUE',
                [supplierId]
            );

            if (supplierCheck.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Furnizorul nu a fost găsit'
                });
            }

            // Obține recomandările pentru produsele specificate
            const analysisResult = await AutoOrderController.analyzeUpcomingEvents(req, res);
            if (!analysisResult) return; // Dacă analiza a eșuat, răspunsul a fost deja trimis

            // Simulăm obținerea datelor din analiză (în realitate ar trebui să refactorizez pentru a reutiliza logica)
            const analysis = await getAnalysisData(7); // Helper function
            const relevantRecommendations = analysis.recommendations.filter(r => 
                productIds.includes(r.productId)
            );

            if (relevantRecommendations.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Nu există recomandări pentru produsele selectate'
                });
            }

            // Generează numărul comenzii
            const orderNumber = `AUTO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

            // Calculează valoarea totală
            const totalAmount = relevantRecommendations.reduce((sum, rec) => sum + rec.estimatedCost, 0);

            // Creează comanda de achiziție
            const [orderResult] = await pool.execute<ResultSetHeader>(
                `INSERT INTO purchase_orders (
                    order_number, supplier_id, status, total_amount, notes, created_by
                ) VALUES (?, ?, ?, ?, ?, ?)`,
                [orderNumber, supplierId, approveImmediately ? 'APPROVED' : 'DRAFT', totalAmount, notes, req.user?.id || 1]
            );

            const orderId = orderResult.insertId;

            // Adaugă articolele în comandă
            for (const recommendation of relevantRecommendations) {
                await pool.execute<ResultSetHeader>(
                    `INSERT INTO purchase_order_items (
                        purchase_order_id, product_id, quantity, unit_price, total_price, notes
                    ) VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        orderId,
                        recommendation.productId,
                        recommendation.recommendedQuantity,
                        recommendation.estimatedCost / recommendation.recommendedQuantity,
                        recommendation.estimatedCost,
                        `Auto-generată: deficit ${recommendation.shortage} ${recommendation.unit}`
                    ]
                );
            }

            // Înregistrează în istoric că a fost o comandă automată
            await pool.execute<ResultSetHeader>(
                `INSERT INTO stock_movements (
                    product_id, type, quantity, reference_document, reason, performed_by, notes
                ) VALUES (?, 'ADJUSTMENT', 0, ?, 'AUTO_ORDER_CREATED', ?, ?)`,
                [
                    relevantRecommendations[0].productId, // Primul produs ca referință
                    orderNumber,
                    req.user?.id || 1,
                    `Comandă automată creată pentru ${relevantRecommendations.length} produse`
                ]
            );

            res.status(201).json({
                success: true,
                message: `Comanda automată ${orderNumber} a fost creată cu succes`,
                data: {
                    orderId,
                    orderNumber,
                    supplier: supplierCheck[0],
                    totalAmount,
                    itemsCount: relevantRecommendations.length,
                    status: approveImmediately ? 'APPROVED' : 'DRAFT',
                    items: relevantRecommendations.map(rec => ({
                        productId: rec.productId,
                        productName: rec.productName,
                        quantity: rec.recommendedQuantity,
                        unitPrice: rec.estimatedCost / rec.recommendedQuantity,
                        totalPrice: rec.estimatedCost,
                        shortage: rec.shortage,
                        priority: rec.priority
                    }))
                }
            });
        } catch (error: any) {
            console.error('❌ Error generating auto order:', error);
            res.status(500).json({
                success: false,
                message: 'Eroare la generarea comenzii automate'
            });
        }
    },

    // Obține statistici pentru dashboard-ul de management al comenzilor automate
    getAutoOrderStats: async (req: Request, res: Response) => {
        try {
            console.log('📊 Getting auto order statistics');

            // Statistici pentru ultimele 30 de zile
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const [stats] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    COUNT(DISTINCT po.id) as total_auto_orders,
                    SUM(po.total_amount) as total_value,
                    COUNT(DISTINCT CASE WHEN po.status = 'APPROVED' THEN po.id END) as approved_orders,
                    COUNT(DISTINCT CASE WHEN po.status = 'DRAFT' THEN po.id END) as draft_orders,
                    COUNT(DISTINCT poi.product_id) as unique_products_ordered,
                    AVG(po.total_amount) as average_order_value
                FROM purchase_orders po
                LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
                WHERE po.notes LIKE '%Auto%' 
                AND po.created_at >= ?
            `, [thirtyDaysAgo.toISOString()]);

            // Produsele cel mai des comandate automat
            const [topProducts] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    p.id,
                    p.name,
                    p.code,
                    COUNT(poi.id) as order_frequency,
                    SUM(poi.quantity) as total_quantity_ordered,
                    SUM(poi.total_price) as total_value_ordered,
                    AVG(poi.unit_price) as average_unit_price
                FROM purchase_order_items poi
                JOIN products p ON poi.product_id = p.id
                JOIN purchase_orders po ON poi.purchase_order_id = po.id
                WHERE po.notes LIKE '%Auto%'
                AND po.created_at >= ?
                GROUP BY p.id, p.name, p.code
                ORDER BY order_frequency DESC, total_quantity_ordered DESC
                LIMIT 10
            `, [thirtyDaysAgo.toISOString()]);

            // Evenimente viitoare care necesită materiale
            const futureEvents = new Date();
            futureEvents.setDate(futureEvents.getDate() + 14); // Următoarele 2 săptămâni

            const [upcomingNeedsStats] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    COUNT(DISTINCT ce.id) as events_with_materials,
                    COUNT(DISTINCT es.product_id) as unique_products_needed,
                    SUM(es.quantity_needed) as total_quantity_needed,
                    COUNT(DISTINCT CASE WHEN es.priority = 'CRITICAL' THEN es.id END) as critical_supplies,
                    COUNT(DISTINCT CASE WHEN es.status = 'PENDING' THEN es.id END) as pending_approvals
                FROM calendar_events ce
                JOIN event_supplies es ON ce.id = es.event_id
                WHERE ce.start_time BETWEEN NOW() AND ?
                AND ce.status IN ('PENDING', 'APPROVED')
            `, [futureEvents.toISOString()]);

            res.json({
                success: true,
                data: {
                    period: {
                        startDate: thirtyDaysAgo,
                        endDate: new Date(),
                        days: 30
                    },
                    orderStats: {
                        totalAutoOrders: stats[0].total_auto_orders || 0,
                        totalValue: stats[0].total_value || 0,
                        approvedOrders: stats[0].approved_orders || 0,
                        draftOrders: stats[0].draft_orders || 0,
                        uniqueProductsOrdered: stats[0].unique_products_ordered || 0,
                        averageOrderValue: stats[0].average_order_value || 0
                    },
                    topProducts: topProducts.map(product => ({
                        id: product.id,
                        name: product.name,
                        code: product.code,
                        orderFrequency: product.order_frequency,
                        totalQuantityOrdered: product.total_quantity_ordered,
                        totalValueOrdered: product.total_value_ordered,
                        averageUnitPrice: product.average_unit_price
                    })),
                    upcomingNeeds: {
                        eventsWithMaterials: upcomingNeedsStats[0].events_with_materials || 0,
                        uniqueProductsNeeded: upcomingNeedsStats[0].unique_products_needed || 0,
                        totalQuantityNeeded: upcomingNeedsStats[0].total_quantity_needed || 0,
                        criticalSupplies: upcomingNeedsStats[0].critical_supplies || 0,
                        pendingApprovals: upcomingNeedsStats[0].pending_approvals || 0
                    }
                }
            });
        } catch (error: any) {
            console.error('❌ Error getting auto order stats:', error);
            res.status(500).json({
                success: false,
                message: 'Eroare la obținerea statisticilor pentru comenzile automate'
            });
        }
    }
};

// Helper function pentru a obține analiza evenimentelor (refactorizată pentru reutilizare)
async function getAnalysisData(days: number = 7) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    const [upcomingEvents] = await pool.execute<RowDataPacket[]>(`
        SELECT 
            ce.id,
            ce.title,
            ce.start_time,
            ce.end_time,
            ce.type,
            ce.status
        FROM calendar_events ce
        WHERE ce.start_time BETWEEN ? AND ?
        AND ce.status IN ('PENDING', 'APPROVED')
        ORDER BY ce.start_time
    `, [startDate.toISOString(), endDate.toISOString()]);

    // Analiza materialelor necesare (cod similar cu cel din analyzeUpcomingEvents)
    const materialAnalysis = await Promise.all(
        upcomingEvents.map(async (event) => {
            const [eventSupplies] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    es.*,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit,
                    p.unit_price as product_unit_price,
                    COALESCE(SUM(i.quantity), 0) as available_stock
                FROM event_supplies es
                JOIN products p ON es.product_id = p.id
                LEFT JOIN inventory i ON p.id = i.product_id
                WHERE es.event_id = ?
                AND es.status IN ('PENDING', 'APPROVED', 'ALLOCATED')
                GROUP BY es.id, p.id
            `, [event.id]);

            return {
                event,
                supplies: eventSupplies.map(supply => ({
                    productId: supply.product_id,
                    productName: supply.product_name,
                    productCode: supply.product_code,
                    quantityNeeded: supply.quantity_needed,
                    availableStock: supply.available_stock,
                    unitCost: supply.unit_cost,
                    priority: supply.priority,
                    unit: supply.product_unit,
                    shortage: Math.max(0, supply.quantity_needed - supply.available_stock)
                }))
            };
        })
    );

    // Calculează recomandările
    const productNeeds = new Map();
    materialAnalysis.forEach(({ supplies }) => {
        supplies.forEach(supply => {
            const key = supply.productId;
            if (!productNeeds.has(key)) {
                productNeeds.set(key, {
                    productId: supply.productId,
                    productName: supply.productName,
                    productCode: supply.productCode,
                    unit: supply.unit,
                    totalShortage: 0,
                    averageUnitCost: supply.unitCost,
                    priority: supply.priority
                });
            }
            const current = productNeeds.get(key);
            current.totalShortage += supply.shortage;
        });
    });

    const recommendations = Array.from(productNeeds.values())
        .filter(need => need.totalShortage > 0)
        .map(need => ({
            productId: need.productId,
            productName: need.productName,
            productCode: need.productCode,
            shortage: need.totalShortage,
            recommendedQuantity: Math.ceil(need.totalShortage * 1.2),
            estimatedCost: Math.ceil(need.totalShortage * 1.2) * need.averageUnitCost,
            priority: need.priority,
            unit: need.unit
        }));

    return { recommendations };
} 