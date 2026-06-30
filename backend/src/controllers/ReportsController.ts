import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/database';
import { ActivityLogService } from '../services/ActivityLogService';

export const ReportsController = {
    // 📊 RAPORT ANALIZĂ VÂNZĂRI PRODUSE (pe baza stock movements)
    getProductSalesAnalysis: async (req: Request, res: Response) => {
        try {
            console.log('📊 Generating product sales analysis with params:', req.query);
            const { startDate, endDate, categoryId } = req.query;
            
            // Verifică parametrii obligatorii
            if (!startDate || !endDate) {
                return res.status(400).json({ 
                    message: 'Parametrii startDate și endDate sunt obligatorii' 
                });
            }
            
            let query = `
                SELECT 
                    p.id as product_id,
                    p.name as product_name,
                    p.description,
                    p.code,
                    p.unit_price,
                    p.reorder_point,
                    p.is_active,
                    COALESCE(pc.name, 'Fără categorie') as category_name,
                    
                    -- Stoc curent
                    COALESCE(SUM(i.quantity), 0) as current_stock,
                    COALESCE(AVG(i.unit_cost), 0) as avg_unit_cost,
                    COALESCE(SUM(i.total_value), 0) as total_stock_value,
                    
                    -- Mișcări de stoc
                    COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0) as total_sold,
                    COALESCE(SUM(CASE WHEN sm.type = 'IN' THEN sm.quantity ELSE 0 END), 0) as total_received,
                    COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.total_cost ELSE 0 END), 0) as total_sales_value,
                    COUNT(DISTINCT sm.id) as total_movements,
                    
                    -- Calcule
                    ROUND(COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END) / NULLIF(DATEDIFF(?, ?), 0), 0), 2) as daily_avg_sales,
                    ROUND(COALESCE(SUM(CASE WHEN sm.type = 'OUT' THEN sm.total_cost ELSE 0 END) / NULLIF(SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END), 0), 0), 2) as avg_selling_price
                    
                FROM products p
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                LEFT JOIN inventory i ON p.id = i.product_id
                LEFT JOIN stock_movements sm ON i.id = sm.inventory_id
                    AND sm.movement_date BETWEEN ? AND ?
                WHERE p.is_active = TRUE
            `;
            
            const params: any[] = [endDate, startDate, startDate, endDate];
            
            if (categoryId && categoryId !== 'all') {
                query += ' AND p.category_id = ?';
                params.push(categoryId);
            }
            
            query += `
                GROUP BY p.id, p.name, p.description, p.code, p.unit_price, p.reorder_point, p.is_active, pc.name
                ORDER BY total_sales_value DESC, total_sold DESC
                LIMIT 100
            `;
            
            console.log('📊 Executing query:', query);
            console.log('📊 With params:', params);
            
            const [products] = await pool.execute<RowDataPacket[]>(query, params);
            
            console.log('📊 Found products:', products.length);
            
            // Calculez statistici generale
            const summary = {
                totalProducts: products.length,
                totalSalesValue: products.reduce((sum: number, p: any) => sum + (parseFloat(p.total_sales_value) || 0), 0),
                totalQuantitySold: products.reduce((sum: number, p: any) => sum + (parseInt(p.total_sold) || 0), 0),
                avgDailySales: products.reduce((sum: number, p: any) => sum + (parseFloat(p.daily_avg_sales) || 0), 0),
                topSellingProduct: products.length > 0 ? products[0] : null,
                lowStockProducts: products.filter((p: any) => parseInt(p.current_stock) < 10).length
            };
            
            console.log('📊 Summary:', summary);
            
            // Log activitatea de generare raport
            const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
            await ActivityLogService.createLog({
                user_id: req.user?.id || 1,
                action_type: 'REPORT_GENERATED',
                entity_type: 'SYSTEM',
                entity_id: null,
                description: `A generat raportul "Analiză Vânzări Produse"`,
                details: {
                    report_type: 'PRODUCT_SALES_ANALYSIS',
                    parameters: { startDate, endDate, categoryId },
                    products_count: products.length,
                    total_sales_value: summary.totalSalesValue
                },
                ip_address: ipAddress
            });

            res.json({
                products,
                summary,
                generatedAt: new Date().toISOString(),
                parameters: { startDate, endDate, categoryId },
                reportType: 'PRODUCT_SALES_ANALYSIS'
            });
            
        } catch (error) {
            console.error('❌ Error generating product sales analysis:', error);
            res.status(500).json({ 
                message: 'Eroare la generarea analizei vânzărilor de produse',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // 🚗 RAPORT ANALIZĂ MENTENANȚĂ VEHICULE (costuri și frecvență) - ÎMBUNĂTĂȚIT
    getVehicleMaintenanceAnalysis: async (req: Request, res: Response) => {
        try {
            console.log('🚗 Generating enhanced vehicle maintenance analysis with params:', req.query);
            const { startDate, endDate, vehicleId, customization } = req.query;
            
            // Parsez opțiunile de personalizare
            let reportCustomization = {
                includeBasicInfo: true,
                includeMaintenance: true,
                includeFuel: true,
                includeUsage: true,
                includeCosts: true,
                includeAnalysis: true,
                includeCharts: false
            };
            
            if (customization) {
                try {
                    const parsedCustomization = typeof customization === 'string' 
                        ? JSON.parse(customization) 
                        : customization;
                    reportCustomization = { ...reportCustomization, ...parsedCustomization };
                } catch (e) {
                    console.log('⚠️ Could not parse customization, using defaults');
                }
            }
            
            console.log('🎨 Report customization:', reportCustomization);
            
            if (!startDate || !endDate) {
                return res.status(400).json({ 
                    message: 'Parametrii startDate și endDate sunt obligatorii' 
                });
            }
            
            // Query principal pentru vehicule cu date complete
            let query = `
                SELECT 
                    v.id as vehicle_id,
                    v.brand,
                    v.model,
                    v.registration_number,
                    v.year,
                    v.current_mileage,
                    v.status,
                    v.fuel_type,
                    v.tank_capacity,
                    v.category,
                    COALESCE(d.name, 'Neasignat') as department_name,
                    
                    -- Mentenanță
                    COUNT(vm.id) as maintenance_count,
                    COALESCE(SUM(vm.cost), 0) as total_maintenance_cost,
                    COALESCE(AVG(vm.cost), 0) as avg_maintenance_cost,
                    MAX(vm.date) as last_maintenance_date,
                    MIN(vm.date) as first_maintenance_date,
                    COALESCE(DATEDIFF(MAX(vm.date), MIN(vm.date)), 0) as maintenance_period_days,
                    ROUND(COALESCE(COUNT(vm.id) / NULLIF(DATEDIFF(MAX(vm.date), MIN(vm.date)), 0) * 30, 0), 2) as monthly_maintenance_frequency,
                    ROUND(COALESCE(SUM(vm.cost) / NULLIF(v.current_mileage, 0) * 1000, 0), 2) as cost_per_1000km,
                    GROUP_CONCAT(DISTINCT vm.type ORDER BY vm.type) as maintenance_types,
                    
                    -- Combustibil
                    COALESCE(SUM(vf.quantity), 0) as total_fuel_consumed,
                    COALESCE(SUM(vf.cost), 0) as total_fuel_cost,
                    COALESCE(AVG(vf.cost / NULLIF(vf.quantity, 0)), 0) as avg_fuel_price,
                    ROUND(COALESCE(v.current_mileage / NULLIF(SUM(vf.quantity), 0) * 100, 0), 2) as fuel_efficiency_km_per_100l,
                    
                    -- Utilizare
                    COALESCE(SUM(vu.end_mileage - vu.start_mileage), 0) as total_distance_traveled,
                    COUNT(DISTINCT vu.user_id) as unique_drivers,
                    COUNT(vu.id) as total_trips,
                    COALESCE(AVG(vu.end_mileage - vu.start_mileage), 0) as avg_trip_distance,
                    COALESCE(SUM(DATEDIFF(vu.end_date, vu.start_date)), 0) as total_usage_days,
                    
                    -- Costuri totale
                    COALESCE(SUM(vm.cost), 0) + COALESCE(SUM(vf.cost), 0) as total_operational_cost
                    
                FROM vehicles v
                LEFT JOIN departments d ON v.assigned_department_id = d.id
                LEFT JOIN vehicle_maintenance vm ON v.id = vm.vehicle_id
                    AND vm.date BETWEEN ? AND ?
                LEFT JOIN vehicle_fuel vf ON v.id = vf.vehicle_id
                    AND vf.date BETWEEN ? AND ?
                LEFT JOIN vehicle_usage vu ON v.id = vu.vehicle_id
                    AND vu.start_date BETWEEN ? AND ?
                WHERE 1=1
            `;
            
            const params: any[] = [startDate, endDate, startDate, endDate, startDate, endDate];
            
            if (vehicleId && vehicleId !== 'all') {
                query += ' AND v.id = ?';
                params.push(vehicleId);
            }
            
            query += `
                GROUP BY v.id, v.brand, v.model, v.registration_number, v.year, v.current_mileage, v.status, v.fuel_type, v.tank_capacity, v.category, d.name
                ORDER BY total_operational_cost DESC
                LIMIT 50
            `;
            
            console.log('🚗 Executing enhanced query:', query);
            const [vehicles] = await pool.execute<RowDataPacket[]>(query, params);
            console.log('🚗 Found vehicles with enhanced data:', vehicles.length);
            
            // Analiza detaliată pe tipuri de mentenanță
            const maintenanceTypesQuery = `
                SELECT 
                    COALESCE(vm.type, 'Necunoscut') as type,
                    COUNT(*) as frequency,
                    COALESCE(SUM(vm.cost), 0) as total_cost,
                    COALESCE(AVG(vm.cost), 0) as avg_cost,
                    COALESCE(MIN(vm.cost), 0) as min_cost,
                    COALESCE(MAX(vm.cost), 0) as max_cost
                FROM vehicle_maintenance vm
                WHERE vm.date BETWEEN ? AND ?
                GROUP BY vm.type
                ORDER BY total_cost DESC
                LIMIT 20
            `;
            
            const [maintenanceTypes] = await pool.execute<RowDataPacket[]>(maintenanceTypesQuery, [startDate, endDate]);
            
            // Analiza pe tipuri de combustibil
            const fuelAnalysisQuery = `
                SELECT 
                    v.fuel_type,
                    COUNT(DISTINCT v.id) as vehicle_count,
                    COALESCE(SUM(vf.quantity), 0) as total_fuel_consumed,
                    COALESCE(SUM(vf.cost), 0) as total_fuel_cost,
                    COALESCE(AVG(vf.cost / NULLIF(vf.quantity, 0)), 0) as avg_fuel_price
                FROM vehicles v
                LEFT JOIN vehicle_fuel vf ON v.id = vf.vehicle_id
                    AND vf.date BETWEEN ? AND ?
                WHERE v.fuel_type IS NOT NULL
                GROUP BY v.fuel_type
                ORDER BY total_fuel_cost DESC
            `;
            
            const [fuelAnalysis] = await pool.execute<RowDataPacket[]>(fuelAnalysisQuery, [startDate, endDate]);
            
            const summary = {
                totalVehicles: vehicles.length,
                totalMaintenanceCost: vehicles.reduce((sum: number, v: any) => sum + (parseFloat(v.total_maintenance_cost) || 0), 0),
                totalFuelCost: vehicles.reduce((sum: number, v: any) => sum + (parseFloat(v.total_fuel_cost) || 0), 0),
                totalOperationalCost: vehicles.reduce((sum: number, v: any) => sum + (parseFloat(v.total_operational_cost) || 0), 0),
                avgCostPerVehicle: vehicles.length > 0 ? vehicles.reduce((sum: number, v: any) => sum + (parseFloat(v.total_operational_cost) || 0), 0) / vehicles.length : 0,
                totalDistanceTraveled: vehicles.reduce((sum: number, v: any) => sum + (parseFloat(v.total_distance_traveled) || 0), 0),
                totalFuelConsumed: vehicles.reduce((sum: number, v: any) => sum + (parseFloat(v.total_fuel_consumed) || 0), 0),
                avgFuelEfficiency: vehicles.length > 0 ? vehicles.reduce((sum: number, v: any) => sum + (parseFloat(v.fuel_efficiency_km_per_100l) || 0), 0) / vehicles.length : 0,
                mostExpensiveVehicle: vehicles.length > 0 ? vehicles[0] : null,
                maintenanceTypes: maintenanceTypes,
                fuelAnalysis: fuelAnalysis
            };
            
            // Log activitatea de generare raport
            const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
            await ActivityLogService.createLog({
                user_id: req.user?.id || 1,
                action_type: 'REPORT_GENERATED',
                entity_type: 'SYSTEM',
                entity_id: null,
                description: `A generat raportul "Analiză Mentenanță Vehicule"`,
                details: {
                    report_type: 'VEHICLE_MAINTENANCE_ANALYSIS',
                    parameters: { startDate, endDate, vehicleId },
                    vehicles_count: vehicles.length,
                    total_maintenance_cost: summary.totalMaintenanceCost
                },
                ip_address: ipAddress
            });

            res.json({
                vehicles,
                summary,
                customization: reportCustomization,
                generatedAt: new Date().toISOString(),
                parameters: { startDate, endDate, vehicleId },
                reportType: 'VEHICLE_MAINTENANCE_ANALYSIS'
            });
            
        } catch (error) {
            console.error('❌ Error generating enhanced vehicle maintenance analysis:', error);
            res.status(500).json({ 
                message: 'Eroare la generarea analizei de mentenanță vehicule',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // 🛣️ RAPORT ANALIZĂ TRASEE ȘI UTILIZARE VEHICULE
    getVehicleUsageAnalysis: async (req: Request, res: Response) => {
        try {
            console.log('🛣️ Generating vehicle usage analysis with params:', req.query);
            const { startDate, endDate, departmentId } = req.query;
            
            if (!startDate || !endDate) {
                return res.status(400).json({ 
                    message: 'Parametrii startDate și endDate sunt obligatorii' 
                });
            }
            
            let query = `
                SELECT 
                    v.id as vehicle_id,
                    v.brand,
                    v.model,
                    v.registration_number,
                    COALESCE(d.name, 'Neasignat') as department_name,
                    COUNT(vu.id) as total_trips,
                    COALESCE(SUM(vu.end_mileage - vu.start_mileage), 0) as total_distance,
                    COALESCE(AVG(vu.end_mileage - vu.start_mileage), 0) as avg_trip_distance,
                    COALESCE(SUM(TIMESTAMPDIFF(HOUR, vu.start_date, vu.end_date)), 0) as total_usage_hours,
                    COALESCE(AVG(TIMESTAMPDIFF(HOUR, vu.start_date, vu.end_date)), 0) as avg_trip_duration,
                    COUNT(DISTINCT vu.user_id) as unique_drivers,
                    GROUP_CONCAT(DISTINCT CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) ORDER BY u.last_name SEPARATOR ', ') as drivers,
                    ROUND(COALESCE(SUM(vu.end_mileage - vu.start_mileage) / NULLIF(COUNT(vu.id), 0), 0), 2) as efficiency_km_per_trip
                FROM vehicles v
                LEFT JOIN departments d ON v.assigned_department_id = d.id
                LEFT JOIN vehicle_usage vu ON v.id = vu.vehicle_id
                    AND vu.start_date BETWEEN ? AND ?
                LEFT JOIN users u ON vu.user_id = u.id
                WHERE 1=1
            `;
            
            const params: any[] = [startDate, endDate];
            
            if (departmentId && departmentId !== 'all') {
                query += ' AND v.assigned_department_id = ?';
                params.push(departmentId);
            }
            
            query += `
                GROUP BY v.id, v.brand, v.model, v.registration_number, d.name
                ORDER BY total_distance DESC
                LIMIT 50
            `;
            
            console.log('🛣️ Executing query:', query);
            const [vehicles] = await pool.execute<RowDataPacket[]>(query, params);
            console.log('🛣️ Found vehicles:', vehicles.length);
            
            // Analiza pe scopuri de utilizare
            const purposeAnalysisQuery = `
                SELECT 
                    COALESCE(vu.purpose, 'Necunoscut') as purpose,
                    COUNT(*) as frequency,
                    COALESCE(SUM(vu.end_mileage - vu.start_mileage), 0) as total_distance,
                    COALESCE(AVG(vu.end_mileage - vu.start_mileage), 0) as avg_distance,
                    COALESCE(SUM(TIMESTAMPDIFF(HOUR, vu.start_date, vu.end_date)), 0) as total_hours
                FROM vehicle_usage vu
                WHERE vu.start_date BETWEEN ? AND ?
                GROUP BY vu.purpose
                ORDER BY total_distance DESC
                LIMIT 20
            `;
            
            const [purposeAnalysis] = await pool.execute<RowDataPacket[]>(purposeAnalysisQuery, [startDate, endDate]);
            
            const summary = {
                totalVehicles: vehicles.length,
                totalDistance: vehicles.reduce((sum: number, v: any) => sum + (parseFloat(v.total_distance) || 0), 0),
                totalTrips: vehicles.reduce((sum: number, v: any) => sum + (parseInt(v.total_trips) || 0), 0),
                avgDistancePerTrip: vehicles.length > 0 ? vehicles.reduce((sum: number, v: any) => sum + (parseFloat(v.avg_trip_distance) || 0), 0) / vehicles.length : 0,
                mostUsedVehicle: vehicles.length > 0 ? vehicles[0] : null,
                purposeAnalysis: purposeAnalysis
            };
            
            res.json({
                vehicles,
                summary,
                generatedAt: new Date().toISOString(),
                parameters: { startDate, endDate, departmentId },
                reportType: 'VEHICLE_USAGE_ANALYSIS'
            });
            
        } catch (error) {
            console.error('❌ Error generating vehicle usage analysis:', error);
            res.status(500).json({ 
                message: 'Eroare la generarea analizei de utilizare vehicule',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // 📅 RAPORT ANALIZĂ EVENIMENTE ȘI ACTIVITĂȚI
    getEventsActivityAnalysis: async (req: Request, res: Response) => {
        try {
            console.log('📅 Generating events activity analysis with params:', req.query);
            const { startDate, endDate, departmentId, eventType } = req.query;
            
            if (!startDate || !endDate) {
                return res.status(400).json({ 
                    message: 'Parametrii startDate și endDate sunt obligatorii' 
                });
            }
            
            let query = `
                SELECT 
                    ce.id,
                    ce.title,
                    ce.type,
                    ce.start_time,
                    ce.end_time,
                    ce.location,
                    COALESCE(TIMESTAMPDIFF(HOUR, ce.start_time, ce.end_time), 0) as duration_hours,
                    COALESCE(d.name, 'Neasignat') as department_name,
                    CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as created_by,
                    COALESCE(v.registration_number, 'Fără vehicul') as vehicle_used,
                    DATE(ce.start_time) as event_date,
                    DAYNAME(ce.start_time) as day_of_week,
                    HOUR(ce.start_time) as start_hour
                FROM calendar_events ce
                LEFT JOIN departments d ON ce.department_id = d.id
                LEFT JOIN users u ON ce.user_id = u.id
                LEFT JOIN vehicles v ON ce.vehicle_id = v.id
                WHERE ce.start_time BETWEEN ? AND ?
            `;
            
            const params: any[] = [startDate, endDate];
            
            if (departmentId && departmentId !== 'all') {
                query += ' AND ce.department_id = ?';
                params.push(departmentId);
            }
            
            if (eventType && eventType !== 'all') {
                query += ' AND ce.type = ?';
                params.push(eventType);
            }
            
            query += ' ORDER BY ce.start_time DESC LIMIT 200';
            
            console.log('📅 Executing query:', query);
            const [events] = await pool.execute<RowDataPacket[]>(query, params);
            console.log('📅 Found events:', events.length);
            
            // Analiză pe tipuri de evenimente
            const eventTypesAnalysis = events.reduce((acc: any, event: any) => {
                const type = event.type || 'Necunoscut';
                if (!acc[type]) {
                    acc[type] = {
                        count: 0,
                        totalDuration: 0,
                        avgDuration: 0
                    };
                }
                acc[type].count++;
                acc[type].totalDuration += event.duration_hours || 0;
                acc[type].avgDuration = acc[type].totalDuration / acc[type].count;
                return acc;
            }, {});
            
            // Analiză pe zile ale săptămânii
            const dayOfWeekAnalysis = events.reduce((acc: any, event: any) => {
                const day = event.day_of_week || 'Necunoscut';
                acc[day] = (acc[day] || 0) + 1;
                return acc;
            }, {});
            
            // Analiză pe ore de început
            const hourAnalysis = events.reduce((acc: any, event: any) => {
                const hour = event.start_hour || 0;
                acc[hour] = (acc[hour] || 0) + 1;
                return acc;
            }, {});
            
            const summary = {
                totalEvents: events.length,
                totalDuration: events.reduce((sum: number, e: any) => sum + (parseFloat(e.duration_hours) || 0), 0),
                avgEventDuration: events.length > 0 ? events.reduce((sum: number, e: any) => sum + (parseFloat(e.duration_hours) || 0), 0) / events.length : 0,
                eventsWithVehicles: events.filter((e: any) => e.vehicle_used && e.vehicle_used !== 'Fără vehicul').length,
                eventTypesAnalysis,
                dayOfWeekAnalysis,
                hourAnalysis,
                busyDays: Object.entries(dayOfWeekAnalysis).sort(([,a], [,b]) => (b as number) - (a as number)).slice(0, 3)
            };
            
            res.json({
                events,
                summary,
                generatedAt: new Date().toISOString(),
                parameters: { startDate, endDate, departmentId, eventType },
                reportType: 'EVENTS_ACTIVITY_ANALYSIS'
            });
            
        } catch (error) {
            console.error('❌ Error generating events activity analysis:', error);
            res.status(500).json({ 
                message: 'Eroare la generarea analizei de evenimente și activități',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // 📋 RAPORT TEMPLATE-URI DISPONIBILE (actualizat cu rapoarte reale)
    getReportTemplates: async (req: Request, res: Response) => {
        try {
            console.log('📋 Fetching report templates');
            
            // Obțin opțiunile pentru filtre din baza de date
            const [departments] = await pool.execute<RowDataPacket[]>('SELECT id, name FROM departments ORDER BY name');
            const [categories] = await pool.execute<RowDataPacket[]>('SELECT id, name FROM product_categories ORDER BY name');
            const [vehicles] = await pool.execute<RowDataPacket[]>('SELECT id, CONCAT(brand, " ", model, " (", registration_number, ")") as name FROM vehicles ORDER BY brand, model');
            const [eventTypes] = await pool.execute<RowDataPacket[]>('SELECT DISTINCT type FROM calendar_events WHERE type IS NOT NULL ORDER BY type');
            
            const templates = [
                {
                    id: 'product-sales-analysis',
                    name: 'Analiză Vânzări Produse',
                    description: 'Analiză detaliată a vânzărilor pe produse cu valori, cantități și tendințe',
                    category: 'SUPPLY',
                    popularity: 95,
                    estimatedTime: '2-3 minute',
                    parameters: [
                        { id: 'startDate', name: 'Data început', type: 'date', required: true },
                        { id: 'endDate', name: 'Data sfârșit', type: 'date', required: true },
                        { 
                            id: 'categoryId', 
                            name: 'Categorie produse', 
                            type: 'select', 
                            required: false,
                            options: [
                                { value: 'all', label: 'Toate categoriile' },
                                ...categories.map((cat: any) => ({ value: cat.id.toString(), label: cat.name }))
                            ]
                        }
                    ]
                },
                {
                    id: 'vehicle-maintenance-analysis',
                    name: 'Analiză Mentenanță Vehicule',
                    description: 'Analiză costuri și frecvență mentenanță cu predicții și recomandări',
                    category: 'VEHICLES',
                    popularity: 92,
                    estimatedTime: '1-2 minute',
                    parameters: [
                        { id: 'startDate', name: 'Data început', type: 'date', required: true },
                        { id: 'endDate', name: 'Data sfârșit', type: 'date', required: true },
                        { 
                            id: 'vehicleId', 
                            name: 'Vehicul specific', 
                            type: 'select', 
                            required: false,
                            options: [
                                { value: 'all', label: 'Toate vehiculele' },
                                ...vehicles.map((veh: any) => ({ value: veh.id.toString(), label: veh.name }))
                            ]
                        }
                    ]
                },
                {
                    id: 'vehicle-usage-analysis',
                    name: 'Analiză Trasee și Utilizare',
                    description: 'Analiză detaliată a traseelor, distanțelor și eficienței vehiculelor',
                    category: 'OPERATIONAL',
                    popularity: 88,
                    estimatedTime: '2-4 minute',
                    parameters: [
                        { id: 'startDate', name: 'Data început', type: 'date', required: true },
                        { id: 'endDate', name: 'Data sfârșit', type: 'date', required: true },
                        { 
                            id: 'departmentId', 
                            name: 'Departament', 
                            type: 'select', 
                            required: false,
                            options: [
                                { value: 'all', label: 'Toate departamentele' },
                                ...departments.map((dept: any) => ({ value: dept.id.toString(), label: dept.name }))
                            ]
                        }
                    ]
                },
                {
                    id: 'events-activity-analysis',
                    name: 'Analiză Evenimente și Activități',
                    description: 'Analiză evenimente calendar cu durate, tipuri și pattern-uri de activitate',
                    category: 'OPERATIONAL',
                    popularity: 85,
                    estimatedTime: '1-3 minute',
                    parameters: [
                        { id: 'startDate', name: 'Data început', type: 'date', required: true },
                        { id: 'endDate', name: 'Data sfârșit', type: 'date', required: true },
                        { 
                            id: 'departmentId', 
                            name: 'Departament', 
                            type: 'select', 
                            required: false,
                            options: [
                                { value: 'all', label: 'Toate departamentele' },
                                ...departments.map((dept: any) => ({ value: dept.id.toString(), label: dept.name }))
                            ]
                        },
                        { 
                            id: 'eventType', 
                            name: 'Tip eveniment', 
                            type: 'select', 
                            required: false,
                            options: [
                                { value: 'all', label: 'Toate tipurile' },
                                ...eventTypes.map((type: any) => ({ value: type.type, label: type.type }))
                            ]
                        }
                    ]
                }
            ];
            
            console.log('📋 Returning templates with options:', templates.length);
            res.json(templates);
            
        } catch (error) {
            console.error('❌ Error fetching report templates:', error);
            res.status(500).json({ 
                message: 'Eroare la încărcarea template-urilor de rapoarte',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    // Rapoarte pentru utilizatori - Evenimentele mele
    getMyEvents: async (req: Request, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'Utilizator neautentificat' });
            }

            const [events] = await pool.execute(`
                SELECT 
                    ce.id,
                    ce.title,
                    ce.type,
                    ce.start_time,
                    ce.end_time,
                    ce.status,
                    ea.role,
                    d.name as department,
                    v.registration_number as vehicle,
                    CONCAT(u.first_name, ' ', u.last_name) as created_by,
                    (
                        SELECT GROUP_CONCAT(CONCAT(p.name, ' (', eso.quantity, ' ', p.unit, ')') SEPARATOR ', ')
                        FROM event_stock_operations eso
                        LEFT JOIN products p ON eso.product_id = p.id
                        WHERE eso.event_id = ce.id AND eso.created_by = ?
                    ) as materials
                FROM calendar_events ce
                LEFT JOIN event_assignments ea ON ce.id = ea.event_id
                LEFT JOIN departments d ON ce.department_id = d.id
                LEFT JOIN vehicles v ON ce.vehicle_id = v.id
                LEFT JOIN users u ON ce.user_id = u.id
                WHERE ea.user_id = ?
                ORDER BY ce.start_time DESC
            `, [userId, userId]);

            // Calculăm sumarul
            const summary = {
                totalEvents: (events as any[]).length,
                totalHours: (events as any[]).reduce((sum, event) => {
                    const start = new Date(event.start_time);
                    const end = new Date(event.end_time);
                    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                }, 0),
                types: (events as any[]).reduce((acc, event) => {
                    acc[event.type] = (acc[event.type] || 0) + 1;
                    return acc;
                }, {}),
                topEvents: (events as any[]).slice(0, 5)
            };

            res.json({ events, summary });
        } catch (error) {
            console.error('Error generating my events report:', error);
            res.status(500).json({ message: 'Eroare la generarea raportului' });
        }
    },

    // Materiale gestionate de utilizator
    getMyMaterials: async (req: Request, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'Utilizator neautentificat' });
            }

            const [materials] = await pool.execute(`
                SELECT 
                    ce.id as eventId,
                    ce.title as eventTitle,
                    p.name as productName,
                    eso.quantity,
                    p.unit,
                    eso.created_at as date,
                    eso.operation_type,
                    eso.unit_cost
                FROM event_stock_operations eso
                LEFT JOIN calendar_events ce ON eso.event_id = ce.id
                LEFT JOIN products p ON eso.product_id = p.id
                WHERE eso.created_by = ?
                ORDER BY eso.created_at DESC
            `, [userId]);

            res.json({ materials });
        } catch (error) {
            console.error('Error generating my materials report:', error);
            res.status(500).json({ message: 'Eroare la generarea raportului' });
        }
    },

    // Vehicule utilizate de utilizator
    getMyVehicles: async (req: Request, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'Utilizator neautentificat' });
            }

            const [usages] = await pool.execute(`
                SELECT 
                    ce.id as eventId,
                    ce.title as eventTitle,
                    v.registration_number as vehicle,
                    v.brand,
                    v.model,
                    ce.start_time,
                    ce.end_time,
                    CONCAT(u.first_name, ' ', u.last_name) as driver
                FROM calendar_events ce
                LEFT JOIN vehicles v ON ce.vehicle_id = v.id
                LEFT JOIN users u ON ce.user_id = u.id
                WHERE ce.user_id = ? AND ce.vehicle_id IS NOT NULL
                ORDER BY ce.start_time DESC
            `, [userId]);

            res.json({ usages });
        } catch (error) {
            console.error('Error generating my vehicles report:', error);
            res.status(500).json({ message: 'Eroare la generarea raportului' });
        }
    },

    // Sumar prezență și activitate
    getMyPresenceSummary: async (req: Request, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'Utilizator neautentificat' });
            }

            const [events] = await pool.execute(`
                SELECT 
                    ce.id,
                    ce.title,
                    ce.type,
                    ce.start_time,
                    ce.end_time,
                    ce.status,
                    ea.role
                FROM calendar_events ce
                LEFT JOIN event_assignments ea ON ce.id = ea.event_id
                WHERE ea.user_id = ?
                ORDER BY ce.start_time DESC
            `, [userId]);

            const summary = {
                totalEvents: (events as any[]).length,
                totalHours: (events as any[]).reduce((sum, event) => {
                    const start = new Date(event.start_time);
                    const end = new Date(event.end_time);
                    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                }, 0),
                types: (events as any[]).reduce((acc, event) => {
                    acc[event.type] = (acc[event.type] || 0) + 1;
                    return acc;
                }, {}),
                topEvents: (events as any[]).slice(0, 5)
            };

            res.json(summary);
        } catch (error) {
            console.error('Error generating my presence summary:', error);
            res.status(500).json({ message: 'Eroare la generarea raportului' });
        }
    },

    // Feedback și observații
    getMyFeedback: async (req: Request, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'Utilizator neautentificat' });
            }

            // Pentru moment, returnăm evenimentele la care utilizatorul a participat
            // În viitor, se poate adăuga o tabelă separată pentru feedback
            const [feedbacks] = await pool.execute(`
                SELECT 
                    ce.id as eventId,
                    ce.title as eventTitle,
                    'Participare confirmată' as feedback,
                    ea.created_at as date,
                    ea.role
                FROM event_assignments ea
                LEFT JOIN calendar_events ce ON ea.event_id = ce.id
                WHERE ea.user_id = ?
                ORDER BY ea.created_at DESC
            `, [userId]);

            res.json({ feedbacks });
        } catch (error) {
            console.error('Error generating my feedback report:', error);
            res.status(500).json({ message: 'Eroare la generarea raportului' });
        }
    },

  // Salvare raport în baza de date
  saveReport: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Utilizator neautentificat' });
      }

      const { templateId, name, data, parameters, customization, exportFormat } = req.body;

      const [result] = await pool.execute(`
        INSERT INTO user_reports (
          user_id, template_id, name, data, parameters, customization, 
          export_format, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        userId,
        templateId,
        name,
        JSON.stringify(data),
        JSON.stringify(parameters),
        JSON.stringify(customization),
        exportFormat,
        'COMPLETED'
      ]);

      const reportId = (result as any).insertId;

      // Returnăm raportul salvat
      const [savedReport] = await pool.execute(`
        SELECT * FROM user_reports WHERE id = ?
      `, [reportId]);

      res.status(201).json((savedReport as any[])[0]);
    } catch (error) {
      console.error('Error saving report:', error);
      res.status(500).json({ message: 'Eroare la salvarea raportului' });
    }
  },

  // Preluare rapoarte salvate ale utilizatorului
  getSavedReports: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Utilizator neautentificat' });
      }

      const [reports] = await pool.execute(`
        SELECT 
          id, template_id, name, status, export_format, created_at,
          JSON_LENGTH(data) as data_size
        FROM user_reports 
        WHERE user_id = ?
        ORDER BY created_at DESC
      `, [userId]);

      res.json(reports);
    } catch (error) {
      console.error('Error fetching saved reports:', error);
      res.status(500).json({ message: 'Eroare la încărcarea rapoartelor' });
    }
  },

  // Preluare detaliile unui raport salvat
  getSavedReportDetails: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const { reportId } = req.params;

      if (!userId) {
        return res.status(401).json({ message: 'Utilizator neautentificat' });
      }

      const [reports] = await pool.execute(`
        SELECT * FROM user_reports 
        WHERE id = ? AND user_id = ?
      `, [reportId, userId]);

      if ((reports as any[]).length === 0) {
        return res.status(404).json({ message: 'Raportul nu a fost găsit' });
      }

      const report = (reports as any[])[0];
      
      // Parsează datele JSON
      try {
        report.data = JSON.parse(report.data);
        report.parameters = JSON.parse(report.parameters);
        report.customization = JSON.parse(report.customization);
      } catch (parseError) {
        console.warn('Error parsing report JSON data:', parseError);
      }

      res.json(report);
    } catch (error) {
      console.error('Error fetching saved report details:', error);
      res.status(500).json({ message: 'Eroare la încărcarea detaliilor raportului' });
    }
  },

  exportReport: async (req: Request, res: Response) => {
    try {
      const { data, format, reportType } = req.body;
      
      if (!data || !format || !reportType) {
        return res.status(400).json({ 
          message: 'Tip raport necunoscut sau date lipsă',
          error: 'Parametri lipsă pentru export'
        });
      }

      let csvContent = '';
      let fileName = '';

      // Suport pentru rapoartele user
      if (reportType === 'my-events') {
        const { events, summary } = data;
        fileName = `evenimentele-mele-${new Date().toISOString().split('T')[0]}.csv`;
        
        csvContent = 'ID,Titlu,Tip,Data început,Data sfârșit,Status,Rol,Departament,Vehicul,Materiale\n';
        events.forEach((event: any) => {
          csvContent += `${event.id},"${event.title}","${event.type}","${event.start_time}","${event.end_time}","${event.status}","${event.role}","${event.department || ''}","${event.vehicle || ''}","${event.materials || ''}"\n`;
        });
        
        // Adăugăm sumarul la sfârșit
        csvContent += `\nSumar:\n`;
        csvContent += `Total evenimente,${summary.totalEvents}\n`;
        csvContent += `Total ore,${summary.totalHours.toFixed(2)}\n`;
        csvContent += `Tipuri evenimente,${Object.keys(summary.types).join(', ')}\n`;
        
      } else if (reportType === 'my-materials') {
        const { materials } = data;
        fileName = `materiale-gestionate-${new Date().toISOString().split('T')[0]}.csv`;
        
        csvContent = 'ID Eveniment,Titlu Eveniment,Produs,Cantitate,Unitate,Data,Tip Operație,Cost Unitar\n';
        materials.forEach((material: any) => {
          csvContent += `${material.eventId},"${material.eventTitle}","${material.productName}",${material.quantity},"${material.unit}","${material.date}","${material.operation_type}",${material.unit_cost || 0}\n`;
        });
        
      } else if (reportType === 'my-vehicles') {
        const { usages } = data;
        fileName = `vehicule-utilizate-${new Date().toISOString().split('T')[0]}.csv`;
        
        csvContent = 'ID Eveniment,Titlu Eveniment,Vehicul,Marca,Model,Data început,Data sfârșit,Șofer\n';
        usages.forEach((usage: any) => {
          csvContent += `${usage.eventId},"${usage.eventTitle}","${usage.vehicle}","${usage.brand}","${usage.model}","${usage.start_time}","${usage.end_time}","${usage.driver}"\n`;
        });
        
      } else if (reportType === 'my-presence-summary') {
        fileName = `prezenta-activitate-${new Date().toISOString().split('T')[0]}.csv`;
        
        csvContent = 'Metrică,Valoare\n';
        csvContent += `Total evenimente,${data.totalEvents}\n`;
        csvContent += `Total ore,${data.totalHours.toFixed(2)}\n`;
        
        // Adăugăm tipurile de evenimente
        Object.entries(data.types).forEach(([type, count]) => {
          csvContent += `${type},${count}\n`;
        });
        
        // Adăugăm top evenimente
        csvContent += `\nTop evenimente:\n`;
        data.topEvents.forEach((event: any, index: number) => {
          csvContent += `${index + 1},"${event.title}","${event.type}","${event.start_time}"\n`;
        });
        
      } else if (reportType === 'my-feedback') {
        const { feedbacks } = data;
        fileName = `feedback-observatii-${new Date().toISOString().split('T')[0]}.csv`;
        
        csvContent = 'ID Eveniment,Titlu Eveniment,Feedback,Data,Rol\n';
        feedbacks.forEach((feedback: any) => {
          csvContent += `${feedback.eventId},"${feedback.eventTitle}","${feedback.feedback}","${feedback.date}","${feedback.role}"\n`;
        });
        
      } else if (reportType === 'product-sales-analysis' || reportType === 'PRODUCT_SALES_ANALYSIS') {
        fileName = `analiza-vanzari-produse-${new Date().toISOString().split('T')[0]}.csv`;
        
        csvContent = '\uFEFF'; // BOM pentru UTF-8
        csvContent += `"Raport Analiză Vânzări Produse"\n`;
        csvContent += `"Generat la: ${new Date().toLocaleString('ro-RO')}"\n`;
        csvContent += '\n';
        
        csvContent += 'ID Produs,Nume Produs,Cod Produs,Descriere,Preț Unitar,Categorie,Stoc Curent,Valoare Stoc,Cantitate Vândută,Valoare Vânzări,Vânzări Zilnice Medii\n';
        
        if (data.products) {
          data.products.forEach((product: any) => {
            csvContent += `${product.product_id},"${product.product_name || 'N/A'}","${product.code || 'N/A'}","${product.description || 'N/A'}",${product.unit_price || 0},"${product.category_name || 'N/A'}",${product.current_stock || 0},${product.total_stock_value || 0},${product.total_sold || 0},${product.total_sales_value || 0},${product.daily_avg_sales || 0}\n`;
          });
        }
        
        // Adăugăm statistici la sfârșit
        if (data.summary) {
          csvContent += '\n\n"=== STATISTICI ==="\n';
          Object.entries(data.summary).forEach(([key, value]) => {
            csvContent += `"${key}","${value}"\n`;
          });
        }
        
      } else if (reportType === 'vehicle-maintenance-analysis' || reportType === 'VEHICLE_MAINTENANCE_ANALYSIS') {
        fileName = `analiza-mentenanta-vehicule-${new Date().toISOString().split('T')[0]}.csv`;
        
        csvContent = '\uFEFF'; // BOM pentru UTF-8
        
        // SECȚIUNEA 1: INFORMAȚII VEHICULE
        csvContent += '"=== INFORMAȚII VEHICULE ==="\n';
        csvContent += '"ID","Marca","Model","Număr","Anul","Kilometraj","Status","Combustibil","Rezervor","Categorie","Departament"\n';
        
        if (data.vehicles) {
          data.vehicles.forEach((vehicle: any) => {
            csvContent += `${vehicle.vehicle_id || 'N/A'},"${vehicle.brand || 'N/A'}","${vehicle.model || 'N/A'}","${vehicle.registration_number || 'N/A'}",${vehicle.year || 'N/A'},${vehicle.current_mileage || 'N/A'},"${vehicle.status || 'N/A'}","${vehicle.fuel_type || 'N/A'}",${vehicle.tank_capacity || 'N/A'},"${vehicle.category || 'N/A'}","${vehicle.department_name || 'N/A'}"\n`;
          });
        }

        csvContent += '\n';

        // SECȚIUNEA 2: MENTENANȚĂ
        csvContent += '"=== MENTENANȚĂ ==="\n';
        csvContent += '"ID","Vehicul","Intervenții","Cost Total (RON)","Cost Mediu (RON)","Cost/1000km","Tipuri","Ultima Dată"\n';
        
        if (data.vehicles) {
          data.vehicles.forEach((vehicle: any) => {
            const maintenanceTypes = vehicle.maintenance_types || 'Fără date';
            const lastMaintenance = vehicle.last_maintenance_date ? 
              new Date(vehicle.last_maintenance_date).toLocaleDateString('ro-RO') : 'Fără date';
            
            csvContent += `${vehicle.vehicle_id || 'N/A'},"${vehicle.brand || 'N/A'} ${vehicle.model || 'N/A'}",${vehicle.maintenance_count || 0},${Number(vehicle.total_maintenance_cost || 0).toFixed(2)},${Number(vehicle.avg_maintenance_cost || 0).toFixed(2)},${Number(vehicle.cost_per_1000km || 0).toFixed(2)},"${maintenanceTypes}","${lastMaintenance}"\n`;
          });
        }

        csvContent += '\n';

        // SECȚIUNEA 3: COMBUSTIBIL
        csvContent += '"=== COMBUSTIBIL ==="\n';
        csvContent += '"ID","Vehicul","Consumat (L)","Cost (RON)","Preț/L (RON)","Eficiență (km/100L)","Evaluare"\n';
        
        if (data.vehicles) {
          data.vehicles.forEach((vehicle: any) => {
            const fuelConsumed = Number(vehicle.total_fuel_consumed || 0);
            const fuelCost = Number(vehicle.total_fuel_cost || 0);
            const avgPrice = Number(vehicle.avg_fuel_price || 0);
            const efficiency = Number(vehicle.fuel_efficiency_km_per_100l || 0);
            
            let evaluation = 'Fără date';
            if (fuelConsumed > 0) {
              evaluation = efficiency > 8 ? 'Eficient' : efficiency > 6 ? 'Normal' : 'Ineficient';
            }
            
            csvContent += `${vehicle.vehicle_id || 'N/A'},"${vehicle.brand || 'N/A'} ${vehicle.model || 'N/A'}",${fuelConsumed.toFixed(2)},${fuelCost.toFixed(2)},${avgPrice.toFixed(2)},${efficiency.toFixed(2)},"${evaluation}"\n`;
          });
        }

        csvContent += '\n';

        // SECȚIUNEA 4: UTILIZARE
        csvContent += '"=== UTILIZARE ==="\n';
        csvContent += '"ID","Vehicul","Distanță (km)","Călătorii","Distanță Medie","Șoferi","Zile","Status"\n';
        
        if (data.vehicles) {
          data.vehicles.forEach((vehicle: any) => {
            const distance = Number(vehicle.total_distance_traveled || 0);
            const trips = Number(vehicle.total_trips || 0);
            const avgDistance = Number(vehicle.avg_trip_distance || 0);
            const drivers = Number(vehicle.unique_drivers || 0);
            const days = Number(vehicle.total_usage_days || 0);
            
            let status = 'Fără date';
            if (trips > 0) {
              status = trips > 20 ? 'Intensă' : trips > 10 ? 'Normală' : 'Redusă';
            }
            
            csvContent += `${vehicle.vehicle_id || 'N/A'},"${vehicle.brand || 'N/A'} ${vehicle.model || 'N/A'}",${distance.toFixed(2)},${trips},${avgDistance.toFixed(2)},${drivers},${days},"${status}"\n`;
          });
        }

        csvContent += '\n';

        // SECȚIUNEA 5: COSTURI TOTALE
        csvContent += '"=== COSTURI TOTALE ==="\n';
        csvContent += '"ID","Vehicul","Mentenanță (RON)","Combustibil (RON)","Total (RON)","Cost/km","Recomandare"\n';
        
        if (data.vehicles) {
          data.vehicles.forEach((vehicle: any) => {
            const maintenanceCost = Number(vehicle.total_maintenance_cost || 0);
            const fuelCost = Number(vehicle.total_fuel_cost || 0);
            const totalCost = maintenanceCost + fuelCost;
            const mileage = Number(vehicle.current_mileage || 0);
            const costPerKm = mileage > 0 ? (totalCost / mileage) : 0;
            
            let recommendation = 'Monitorizare normală';
            if (costPerKm > 2) {
              recommendation = 'Costuri ridicate';
            } else if (costPerKm > 1) {
              recommendation = 'Costuri moderate';
            } else if (costPerKm > 0) {
              recommendation = 'Costuri normale';
            }
            
            csvContent += `${vehicle.vehicle_id || 'N/A'},"${vehicle.brand || 'N/A'} ${vehicle.model || 'N/A'}",${maintenanceCost.toFixed(2)},${fuelCost.toFixed(2)},${totalCost.toFixed(2)},${costPerKm.toFixed(4)},"${recommendation}"\n`;
          });
        }

        csvContent += '\n';

        // SECȚIUNEA 6: STATISTICI
        csvContent += '"=== STATISTICI ==="\n';
        csvContent += '"Indicator","Valoare","Unitate"\n';
        
        if (data.vehicles) {
          // Calculez statistici din datele vehiculelor
          let totalVehicles = data.vehicles.length;
          let totalMaintenanceCost = 0;
          let totalFuelCost = 0;
          let totalFuelConsumed = 0;
          let totalDistance = 0;
          let totalTrips = 0;
          
          data.vehicles.forEach((vehicle: any) => {
            totalMaintenanceCost += Number(vehicle.total_maintenance_cost || 0);
            totalFuelCost += Number(vehicle.total_fuel_cost || 0);
            totalFuelConsumed += Number(vehicle.total_fuel_consumed || 0);
            totalDistance += Number(vehicle.total_distance_traveled || 0);
            totalTrips += Number(vehicle.total_trips || 0);
          });
          
          csvContent += `"Vehicule analizate","${totalVehicles}","bucăți"\n`;
          csvContent += `"Cost total mentenanță","${totalMaintenanceCost.toFixed(2)}","lei"\n`;
          csvContent += `"Cost mediu per vehicul","${(totalMaintenanceCost / totalVehicles).toFixed(2)}","lei"\n`;
          csvContent += `"Combustibil consumat","${totalFuelConsumed.toFixed(2)}","litri"\n`;
          csvContent += `"Cost total combustibil","${totalFuelCost.toFixed(2)}","lei"\n`;
          csvContent += `"Distanță totală","${totalDistance.toFixed(2)}","km"\n`;
          csvContent += `"Numărul de călătorii","${totalTrips}","călătorii"\n`;
          csvContent += `"Cost operațional total","${(totalMaintenanceCost + totalFuelCost).toFixed(2)}","lei"\n`;
        }
        
      } else if (reportType === 'vehicle-usage-analysis' || reportType === 'VEHICLE_USAGE_ANALYSIS') {
        fileName = `analiza-utilizare-vehicule-${new Date().toISOString().split('T')[0]}.csv`;
        
        csvContent = '\uFEFF'; // BOM pentru UTF-8
        csvContent += `"Raport Analiză Utilizare Vehicule"\n`;
        csvContent += `"Generat la: ${new Date().toLocaleString('ro-RO')}"\n`;
        csvContent += '\n';
        
        csvContent += 'ID Vehicul,Marca,Model,Număr,Departament,Distanță Totală (km),Număr Călătorii,Distanță Medie (km),Șoferi Unici,Zile Utilizare,Ultima Utilizare,Status\n';
        
        if (data.vehicles) {
          data.vehicles.forEach((vehicle: any) => {
            csvContent += `${vehicle.vehicle_id},"${vehicle.brand}","${vehicle.model}","${vehicle.registration_number}","${vehicle.department_name || 'N/A'}",${vehicle.total_distance || 0},${vehicle.total_trips || 0},${vehicle.avg_distance || 0},${vehicle.unique_drivers || 0},${vehicle.usage_days || 0},"${vehicle.last_usage || 'N/A'}","${vehicle.status}"\n`;
          });
        }
        
        // Adăugăm statistici la sfârșit
        if (data.summary) {
          csvContent += '\n\n"=== STATISTICI ==="\n';
          Object.entries(data.summary).forEach(([key, value]) => {
            csvContent += `"${key}","${value}"\n`;
          });
        }
        
      } else if (reportType === 'events-activity-analysis' || reportType === 'EVENTS_ACTIVITY_ANALYSIS') {
        fileName = `analiza-activitate-evenimente-${new Date().toISOString().split('T')[0]}.csv`;
        
        csvContent = '\uFEFF'; // BOM pentru UTF-8
        csvContent += `"Raport Analiză Activitate Evenimente"\n`;
        csvContent += `"Generat la: ${new Date().toLocaleString('ro-RO')}"\n`;
        csvContent += '\n';
        
        csvContent += 'ID Eveniment,Titlu,Descriere,Tip,Data Start,Data Sfârșit,Locație,Organizator,Vehicul Utilizat,Ziua Săptămânii,Durată (ore)\n';
        
        if (data.events) {
          data.events.forEach((event: any) => {
            csvContent += `${event.event_id},"${event.title || 'N/A'}","${event.description || 'N/A'}","${event.type || 'N/A'}","${event.start_date || 'N/A'}","${event.end_date || 'N/A'}","${event.location || 'N/A'}","${event.organizer_name || 'N/A'}","${event.vehicle_info || 'N/A'}","${event.day_of_week || 'N/A'}",${event.duration_hours || 0}\n`;
          });
        }
        
        // Adăugăm statistici la sfârșit
        if (data.summary) {
          csvContent += '\n\n"=== STATISTICI ==="\n';
          Object.entries(data.summary).forEach(([key, value]) => {
            csvContent += `"${key}","${value}"\n`;
          });
        }
        
      } else {
        return res.status(400).json({ 
          message: 'Tip raport necunoscut sau date lipsă',
          error: `Tipul ${reportType} nu este suportat sau datele lipsesc`
        });
      }

      // Setez headerele pentru download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'no-cache');

      // Trimitem conținutul CSV
      res.send(csvContent);
    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({ 
        message: 'Eroare la exportul raportului',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
    }
}; 