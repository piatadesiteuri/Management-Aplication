import { Request, Response } from 'express';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/database';

export const SupplyController = {
    // Suppliers
    getSuppliers: async (req: Request, res: Response) => {
        try {
            console.log('=== SUPPLIERS REQUEST START ===');
            console.log('Getting suppliers with query params:', req.query);
            console.log('Request headers:', req.headers);
            
            // Test pool connection first
            console.log('Testing pool connection...');
            const [testResult] = await pool.execute('SELECT 1 as test');
            console.log('Pool test successful:', testResult);
            
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const offset = (page - 1) * limit;
            const productId = req.query.product_id;
            
            console.log('Pagination params:', { page, limit, offset });
            console.log('Product ID filter:', productId);
            
            // Construiește query-ul în funcție de filtru
            let whereClause = 's.is_active = TRUE';
            let joinClause = '';
            
            if (productId) {
                joinClause = 'JOIN supplier_products sp ON s.id = sp.supplier_id';
                whereClause += ' AND sp.product_id = ? AND sp.is_active = TRUE';
            }
            
            // Get total count
            console.log('Executing count query...');
            const countQuery = `SELECT COUNT(*) as total FROM suppliers s ${joinClause} WHERE ${whereClause}`;
            const countParams = productId ? [productId] : [];
            const [countResult] = await pool.execute<RowDataPacket[]>(countQuery, countParams);
            const total = countResult[0].total;
            console.log('Total suppliers count:', total);
            
            // Get paginated suppliers
            const suppliersQuery = `SELECT 
                s.id, s.name, s.code, s.contact_person, s.email, s.phone, s.address, s.city, s.country,
                s.tax_number, s.registration_number, s.status, s.payment_terms, s.delivery_time,
                s.rating, s.total_orders, s.total_value, s.notes, s.is_active, s.created_at, s.updated_at
            FROM suppliers s 
            ${joinClause}
            WHERE ${whereClause}
            ORDER BY s.name
            LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
            
            const [suppliers] = await pool.execute<RowDataPacket[]>(suppliersQuery, countParams);
            
            console.log('Suppliers fetched successfully:', suppliers.length);
            const response = {
                data: suppliers,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
            console.log('Sending response:', JSON.stringify(response, null, 2));
            res.json(response);
        } catch (error: any) {
            console.error('=== SUPPLIERS ERROR ===');
            console.error('Error fetching suppliers:', error);
            console.error('Error stack:', error.stack);
            console.error('=== END SUPPLIERS ERROR ===');
            res.status(500).json({ message: 'Eroare la încărcarea furnizorilor' });
        }
    },

    getSupplier: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const [suppliers] = await pool.execute<RowDataPacket[]>(
                'SELECT * FROM suppliers WHERE id = ?',
                [id]
            );

            if (suppliers.length === 0) {
                return res.status(404).json({ message: 'Furnizorul nu a fost găsit' });
            }

            res.json(suppliers[0]);
        } catch (error) {
            console.error('Error fetching supplier:', error);
            res.status(500).json({ message: 'Eroare la încărcarea furnizorului' });
        }
    },

    createSupplier: async (req: Request, res: Response) => {
        try {
            const {
                name,
                code,
                contactPerson,
                email,
                phone,
                address,
                city,
                county,
                country,
                taxNumber,
                registrationNumber,
                status,
                paymentTerms,
                deliveryTime,
                notes
            } = req.body;

            if (!name) {
                return res.status(400).json({ message: 'Numele furnizorului este obligatoriu' });
            }

            // Generate code if not provided
            const supplierCode = code || `SUP${Date.now()}`;

            // Check if county column exists, if not, create SQL without it
            const [result] = await pool.execute<ResultSetHeader>(
                `INSERT INTO suppliers (
                    name, code, contact_person, email, phone, address, city, country,
                    tax_number, registration_number, status, payment_terms, delivery_time, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, supplierCode, contactPerson, email, phone, address, city, country || 'România',
                 taxNumber, registrationNumber, status || 'ACTIVE', paymentTerms || '30 zile', 
                 deliveryTime || 5, notes]
            );

            const [newSupplier] = await pool.execute<RowDataPacket[]>(
                `SELECT 
                    id, name, code, contact_person, email, phone, address, city, country,
                    tax_number, registration_number, status, payment_terms, delivery_time,
                    rating, total_orders, total_value, notes, is_active, created_at, updated_at
                FROM suppliers WHERE id = ?`,
                [result.insertId]
            );

            res.status(201).json(newSupplier[0]);
        } catch (error: any) {
            console.error('Error creating supplier:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ message: 'Codul furnizorului există deja' });
            } else {
                res.status(500).json({ message: 'Eroare la crearea furnizorului' });
            }
        }
    },

    updateSupplier: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const {
                name,
                code,
                contactPerson,
                email,
                phone,
                address,
                city,
                county,
                country,
                taxNumber,
                registrationNumber,
                status,
                paymentTerms,
                deliveryTime,
                notes
            } = req.body;

            if (!name) {
                return res.status(400).json({ message: 'Numele furnizorului este obligatoriu' });
            }

            await pool.execute<ResultSetHeader>(
                `UPDATE suppliers SET
                    name = ?, code = ?, contact_person = ?, email = ?, phone = ?,
                    address = ?, city = ?, country = ?, tax_number = ?, registration_number = ?,
                    status = ?, payment_terms = ?, delivery_time = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [name, code, contactPerson, email, phone, address, city, country,
                 taxNumber, registrationNumber, status, paymentTerms, deliveryTime, notes, id]
            );

            const [updatedSupplier] = await pool.execute<RowDataPacket[]>(
                `SELECT 
                    id, name, code, contact_person, email, phone, address, city, country,
                    tax_number, registration_number, status, payment_terms, delivery_time,
                    rating, total_orders, total_value, notes, is_active, created_at, updated_at
                FROM suppliers WHERE id = ?`,
                [id]
            );

            if (updatedSupplier.length === 0) {
                return res.status(404).json({ message: 'Furnizorul nu a fost găsit' });
            }

            res.json(updatedSupplier[0]);
        } catch (error: any) {
            console.error('Error updating supplier:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ message: 'Codul furnizorului există deja' });
            } else {
                res.status(500).json({ message: 'Eroare la actualizarea furnizorului' });
            }
        }
    },

    deleteSupplier: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // Check if supplier exists
            const [supplier] = await pool.execute<RowDataPacket[]>(
                'SELECT id FROM suppliers WHERE id = ?',
                [id]
            );

            if (supplier.length === 0) {
                return res.status(404).json({ message: 'Furnizorul nu a fost găsit' });
            }

            // Check if supplier has associated purchase orders
            const [orders] = await pool.execute<RowDataPacket[]>(
                'SELECT id FROM purchase_orders WHERE supplier_id = ? LIMIT 1',
                [id]
            );

            if (orders.length > 0) {
                return res.status(400).json({
                    message: 'Nu se poate șterge furnizorul deoarece are comenzi asociate'
                });
            }

            await pool.execute<ResultSetHeader>('DELETE FROM suppliers WHERE id = ?', [id]);
            res.json({ message: 'Furnizorul a fost șters cu succes' });
        } catch (error) {
            console.error('Error deleting supplier:', error);
            res.status(500).json({ message: 'Eroare la ștergerea furnizorului' });
        }
    },

    // Products
    getProducts: async (req: Request, res: Response) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const offset = (page - 1) * limit;
            
            // Get total count
            const [countResult] = await pool.execute<RowDataPacket[]>(
                'SELECT COUNT(*) as total FROM products WHERE is_active = TRUE'
            );
            const total = countResult[0].total;
            
            // Get paginated products
            const [products] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    p.id, p.name, p.code, p.description, p.category_id, p.unit, p.unit_price,
                    p.min_stock, p.max_stock, p.reorder_point, p.barcode, p.manufacturer,
                    p.expiry_months, p.storage_conditions, p.is_active, p.created_at, p.updated_at,
                    pc.name as category_name,
                    COALESCE(SUM(i.quantity), 0) as current_stock,
                    CASE 
                        WHEN COALESCE(SUM(i.quantity), 0) = 0 THEN 'EMPTY'
                        WHEN COALESCE(SUM(i.quantity), 0) <= p.reorder_point THEN 'LOW'
                        WHEN COALESCE(SUM(i.quantity), 0) >= p.max_stock THEN 'EXCESS'
                        ELSE 'OK'
                    END as stock_status
                FROM products p
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                LEFT JOIN inventory i ON p.id = i.product_id
                WHERE p.is_active = TRUE
                GROUP BY p.id, p.name, p.code, p.description, p.category_id, p.unit, p.unit_price,
                         p.min_stock, p.max_stock, p.reorder_point, p.barcode, p.manufacturer,
                         p.expiry_months, p.storage_conditions, p.is_active, p.created_at, p.updated_at,
                         pc.name
                ORDER BY p.name
                LIMIT ${Number(limit)} OFFSET ${Number(offset)}`
            );
            
            res.json({
                data: products,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ message: 'Eroare la încărcarea produselor' });
        }
    },

    getProduct: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const [products] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    p.id, p.name, p.code, p.description, p.category_id, p.unit, p.unit_price,
                    p.min_stock, p.max_stock, p.reorder_point, p.barcode, p.manufacturer,
                    p.expiry_months, p.storage_conditions, p.is_active, p.created_at, p.updated_at,
                    pc.name as category_name,
                    COALESCE(SUM(i.quantity), 0) as current_stock
                FROM products p
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                LEFT JOIN inventory i ON p.id = i.product_id
                WHERE p.id = ? AND p.is_active = TRUE
                GROUP BY p.id, p.name, p.code, p.description, p.category_id, p.unit, p.unit_price,
                         p.min_stock, p.max_stock, p.reorder_point, p.barcode, p.manufacturer,
                         p.expiry_months, p.storage_conditions, p.is_active, p.created_at, p.updated_at,
                         pc.name
            `, [id]);

            if (products.length === 0) {
                return res.status(404).json({ message: 'Produsul nu a fost găsit' });
            }

            res.json(products[0]);
        } catch (error) {
            console.error('Error fetching product:', error);
            res.status(500).json({ message: 'Eroare la încărcarea produsului' });
        }
    },

    createProduct: async (req: Request, res: Response) => {
        try {
            const {
                name,
                code,
                description,
                categoryId,
                unit,
                unitPrice,
                minStock,
                maxStock,
                reorderPoint,
                barcode,
                manufacturer,
                expiryMonths,
                storageConditions
            } = req.body;

            if (!name || !code || !unit) {
                return res.status(400).json({ message: 'Numele, codul și unitatea sunt obligatorii' });
            }

            const [result] = await pool.execute<ResultSetHeader>(
                `INSERT INTO products (
                    name, code, description, category_id, unit, unit_price, min_stock, max_stock,
                    reorder_point, barcode, manufacturer, expiry_months, storage_conditions
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [name, code, description, categoryId, unit, unitPrice || 0, minStock || 0, 
                 maxStock || 1000, reorderPoint || 10, barcode, manufacturer, expiryMonths, storageConditions]
            );

            // Create initial inventory record
            await pool.execute<ResultSetHeader>(
                'INSERT INTO inventory (product_id, quantity, location) VALUES (?, 0, ?)',
                [result.insertId, 'Depozit Principal']
            );

            const [newProduct] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    p.id, p.name, p.code, p.description, p.category_id, p.unit, p.unit_price,
                    p.min_stock, p.max_stock, p.reorder_point, p.barcode, p.manufacturer,
                    p.expiry_months, p.storage_conditions, p.is_active, p.created_at, p.updated_at,
                    pc.name as category_name,
                    0 as current_stock
                FROM products p
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                WHERE p.id = ?
            `, [result.insertId]);

            res.status(201).json(newProduct[0]);
        } catch (error: any) {
            console.error('Error creating product:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ message: 'Codul produsului există deja' });
            } else {
                res.status(500).json({ message: 'Eroare la crearea produsului' });
            }
        }
    },

    updateProduct: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const {
                name,
                code,
                description,
                categoryId,
                unit,
                unitPrice,
                minStock,
                maxStock,
                reorderPoint,
                barcode,
                manufacturer,
                expiryMonths,
                storageConditions
            } = req.body;

            if (!name || !code || !unit) {
                return res.status(400).json({ message: 'Numele, codul și unitatea sunt obligatorii' });
            }

            await pool.execute<ResultSetHeader>(
                `UPDATE products SET
                    name = ?, code = ?, description = ?, category_id = ?, unit = ?, unit_price = ?,
                    min_stock = ?, max_stock = ?, reorder_point = ?, barcode = ?, manufacturer = ?,
                    expiry_months = ?, storage_conditions = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [name, code, description, categoryId, unit, unitPrice, minStock, maxStock,
                 reorderPoint, barcode, manufacturer, expiryMonths, storageConditions, id]
            );

            const [updatedProduct] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    p.id, p.name, p.code, p.description, p.category_id, p.unit, p.unit_price,
                    p.min_stock, p.max_stock, p.reorder_point, p.barcode, p.manufacturer,
                    p.expiry_months, p.storage_conditions, p.is_active, p.created_at, p.updated_at,
                    pc.name as category_name,
                    COALESCE(SUM(i.quantity), 0) as current_stock
                FROM products p
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                LEFT JOIN inventory i ON p.id = i.product_id
                WHERE p.id = ?
                GROUP BY p.id, p.name, p.code, p.description, p.category_id, p.unit, p.unit_price,
                         p.min_stock, p.max_stock, p.reorder_point, p.barcode, p.manufacturer,
                         p.expiry_months, p.storage_conditions, p.is_active, p.created_at, p.updated_at,
                         pc.name
            `, [id]);

            if (updatedProduct.length === 0) {
                return res.status(404).json({ message: 'Produsul nu a fost găsit' });
            }

            res.json(updatedProduct[0]);
        } catch (error: any) {
            console.error('Error updating product:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ message: 'Codul produsului există deja' });
            } else {
                res.status(500).json({ message: 'Eroare la actualizarea produsului' });
            }
        }
    },

    deleteProduct: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // Check if product exists
            const [product] = await pool.execute<RowDataPacket[]>(
                'SELECT id FROM products WHERE id = ?',
                [id]
            );

            if (product.length === 0) {
                return res.status(404).json({ message: 'Produsul nu a fost găsit' });
            }

            // Check if product has stock
            const [inventory] = await pool.execute<RowDataPacket[]>(
                'SELECT SUM(quantity) as total_stock FROM inventory WHERE product_id = ?',
                [id]
            );

            if (inventory[0].total_stock > 0) {
                return res.status(400).json({
                    message: 'Nu se poate șterge produsul deoarece are stoc în inventar'
                });
            }

            // Soft delete - mark as inactive
            await pool.execute<ResultSetHeader>(
                'UPDATE products SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );

            res.json({ message: 'Produsul a fost șters cu succes' });
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({ message: 'Eroare la ștergerea produsului' });
        }
    },

    // Categories
    getCategories: async (req: Request, res: Response) => {
        try {
            const [categories] = await pool.execute<RowDataPacket[]>(
                'SELECT * FROM product_categories ORDER BY name'
            );
            res.json(categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ message: 'Eroare la încărcarea categoriilor' });
        }
    },

    // Inventory
    getInventory: async (req: Request, res: Response) => {
        try {
            console.log('=== INVENTORY REQUEST START ===');
            console.log('Getting inventory with query params:', req.query);
            
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const offset = (page - 1) * limit;
            
            console.log('Pagination params:', { page, limit, offset });
            
            // Get total count
            console.log('Executing count query...');
            const [countResult] = await pool.execute<RowDataPacket[]>(
                'SELECT COUNT(*) as total FROM inventory i JOIN products p ON i.product_id = p.id'
            );
            const total = countResult[0].total;
            console.log('Total inventory count:', total);
            
            // Get paginated inventory grouped by product
            console.log('Executing inventory query with params:', [Number(limit), Number(offset)]);
            const [inventory] = await pool.execute<RowDataPacket[]>(
                `SELECT 
                    p.id as product_id,
                    p.name as product_name,
                    p.code as product_code,
                    p.description as product_description,
                    p.unit as product_unit,
                    p.unit_price as product_unit_price,
                    p.min_stock as product_min_stock,
                    p.max_stock as product_max_stock,
                    p.reorder_point as product_reorder_point,
                    pc.id as product_category_id,
                    pc.name as product_category_name,
                    SUM(i.quantity) as total_quantity,
                    AVG(i.unit_cost) as average_unit_cost,
                    SUM(i.total_value) as total_value,
                    COUNT(DISTINCT i.location) as location_count,
                    GROUP_CONCAT(DISTINCT i.location ORDER BY i.location SEPARATOR ', ') as locations,
                    MAX(i.last_updated) as last_updated,
                    GROUP_CONCAT(
                        DISTINCT CONCAT(
                            i.location, ':', i.quantity, ':', 
                            COALESCE(i.unit_cost, 0), ':', 
                            COALESCE(i.batch_number, ''), ':', 
                            COALESCE(i.expiry_date, ''), ':', 
                            i.id
                        ) ORDER BY i.location SEPARATOR '|'
                    ) as location_details
                FROM inventory i
                JOIN products p ON i.product_id = p.id
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                WHERE i.quantity > 0
                GROUP BY p.id, p.name, p.code, p.description, p.unit, p.unit_price,
                         p.min_stock, p.max_stock, p.reorder_point, pc.id, pc.name
                ORDER BY p.name
                LIMIT ${Number(limit)} OFFSET ${Number(offset)}`
            );

            // Transform the flat results into nested objects with location details
            const transformedInventory = inventory.map(item => {
                // Parse location details
                const locationDetails = item.location_details ? 
                    item.location_details.split('|').map((detail: string) => {
                        const [location, quantity, unitCost, batchNumber, expiryDate, id] = detail.split(':');
                        return {
                            id: parseInt(id),
                            location: location,
                            quantity: parseInt(quantity),
                            unitCost: parseFloat(unitCost),
                            batchNumber: batchNumber || null,
                            expiryDate: expiryDate || null,
                        };
                    }) : [];

                return {
                    id: item.product_id, // Use product_id as main ID for grouped view
                    quantity: item.total_quantity,
                    location: item.locations, // All locations as string
                    locationCount: item.location_count,
                    locationDetails: locationDetails,
                    unitCost: item.average_unit_cost,
                    totalValue: item.total_value,
                    lastUpdated: item.last_updated,
                    product: {
                        id: item.product_id,
                        name: item.product_name,
                        code: item.product_code,
                        description: item.product_description,
                        unit: item.product_unit,
                        unit_price: item.product_unit_price,
                        min_stock: item.product_min_stock,
                        max_stock: item.product_max_stock,
                        reorder_point: item.product_reorder_point,
                        category_name: item.product_category_name,
                    },
                };
            });

            res.json({
                data: transformedInventory,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            });
        } catch (error: any) {
            console.error('=== INVENTORY ERROR ===');
            console.error('Error fetching inventory:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('=== END INVENTORY ERROR ===');
            res.status(500).json({ message: 'Eroare la încărcarea stocului' });
        }
    },

    // Purchase Orders
    getPurchaseOrders: async (req: Request, res: Response) => {
        try {
            const [orders] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    po.*,
                    s.name as supplier_name,
                    s.code as supplier_code,
                    s.contact_person as supplier_contact_person,
                    s.email as supplier_email,
                    s.phone as supplier_phone,
                    u1.first_name as created_by_first_name,
                    u1.last_name as created_by_last_name,
                    u2.first_name as approved_by_first_name,
                    u2.last_name as approved_by_last_name
                FROM purchase_orders po
                JOIN suppliers s ON po.supplier_id = s.id
                JOIN users u1 ON po.created_by = u1.id
                LEFT JOIN users u2 ON po.approved_by = u2.id
                ORDER BY po.created_at DESC
            `);

            // Get items for each order
            const ordersWithItems = await Promise.all(orders.map(async (order) => {
                const [items] = await pool.execute<RowDataPacket[]>(`
                    SELECT 
                        poi.*,
                        p.name as product_name,
                        p.code as product_code,
                        p.unit as product_unit,
                        p.description as product_description,
                        pc.name as product_category_name
                    FROM purchase_order_items poi
                    JOIN products p ON poi.product_id = p.id
                    LEFT JOIN product_categories pc ON p.category_id = pc.id
                    WHERE poi.purchase_order_id = ?
                `, [order.id]);

                // Transform the order data
                return {
                    id: order.id,
                    orderNumber: order.order_number,
                    status: order.status,
                    totalAmount: order.total_amount,
                    notes: order.notes,
                    supplier: {
                        id: order.supplier_id,
                        name: order.supplier_name,
                        code: order.supplier_code,
                        contactPerson: order.supplier_contact_person,
                        email: order.supplier_email,
                        phone: order.supplier_phone,
                    },
                    createdBy: {
                        id: order.created_by,
                        firstName: order.created_by_first_name,
                        lastName: order.created_by_last_name,
                    },
                    approvedBy: order.approved_by ? {
                        id: order.approved_by,
                        firstName: order.approved_by_first_name,
                        lastName: order.approved_by_last_name,
                    } : null,
                    createdAt: order.created_at,
                    updatedAt: order.updated_at,
                    items: items.map(item => ({
                        id: item.id,
                        quantity: item.quantity,
                        unitPrice: item.unit_price,
                        totalPrice: item.total_price,
                        notes: item.notes,
                        product: {
                            id: item.product_id,
                            name: item.product_name,
                            code: item.product_code,
                            unit: item.product_unit,
                            description: item.product_description,
                            category: item.product_category_name,
                        },
                    })),
                };
            }));

            res.json(ordersWithItems);
        } catch (error) {
            console.error('Error fetching purchase orders:', error);
            res.status(500).json({ message: 'Eroare la încărcarea comenzilor' });
        }
    },

    // Stock Movements
    getStockMovements: async (req: Request, res: Response) => {
        try {
            const { inventoryId } = req.params;
            const [movements] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    sm.*,
                    i.quantity as current_stock,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit
                FROM stock_movements sm
                JOIN inventory i ON sm.inventory_id = i.id
                JOIN products p ON i.product_id = p.id
                WHERE sm.inventory_id = ?
                ORDER BY sm.created_at DESC
            `, [inventoryId]);

            // Transform the flat results into nested objects
            const transformedMovements = movements.map(movement => ({
                id: movement.id,
                type: movement.type,
                quantity: movement.quantity,
                referenceDocument: movement.reference_document,
                notes: movement.notes,
                createdAt: movement.created_at,
                updatedAt: movement.updated_at,
                inventory: {
                    id: movement.inventory_id,
                    currentStock: movement.current_stock,
                    product: {
                        name: movement.product_name,
                        code: movement.product_code,
                        unit: movement.product_unit,
                    },
                },
            }));

            res.json(transformedMovements);
        } catch (error) {
            console.error('Error fetching stock movements:', error);
            res.status(500).json({ message: 'Eroare la încărcarea mișcărilor de stoc' });
        }
    },

    // TEST endpoint pentru stock movements
    testStockMovement: async (req: Request, res: Response) => {
        try {
            const { inventoryId } = req.params;
            console.log('=== TEST STOCK MOVEMENT ===');
            console.log('Inventory ID:', inventoryId);
            console.log('Request body:', req.body);
            
            // Get current inventory with product details
            const [inventoryRows] = await pool.execute<RowDataPacket[]>(
                `SELECT i.*, p.name as product_name, p.code as product_code, p.unit as product_unit,
                        p.min_stock, p.max_stock, p.reorder_point
                 FROM inventory i 
                 JOIN products p ON i.product_id = p.id 
                 WHERE i.id = ?`,
                [inventoryId]
            );
            
            if (inventoryRows.length === 0) {
                return res.status(404).json({ message: 'Stocul nu a fost găsit' });
            }
            
            const inventory = inventoryRows[0];
            console.log('Found inventory:', inventory);
            
            res.json({
                success: true,
                inventory: {
                    id: inventory.id,
                    product_id: inventory.product_id,
                    quantity: inventory.quantity,
                    location: inventory.location,
                    unit_cost: inventory.unit_cost,
                    product: {
                        name: inventory.product_name,
                        code: inventory.product_code,
                        unit: inventory.product_unit
                    }
                },
                requestData: req.body
            });
        } catch (error: any) {
            console.error('=== TEST ERROR ===');
            console.error('Error:', error);
            console.error('=== END TEST ERROR ===');
            res.status(500).json({ message: 'Eroare la test' });
        }
    },

    // Get product categories
    getProductCategories: async (req: Request, res: Response) => {
        try {
            const [categories] = await pool.execute<RowDataPacket[]>(
                'SELECT id, name, description FROM product_categories ORDER BY name'
            );
            res.json(categories);
        } catch (error) {
            console.error('Error fetching product categories:', error);
            res.status(500).json({ message: 'Eroare la încărcarea categoriilor de produse' });
        }
    },

    createStockMovement: async (req: Request, res: Response) => {
        console.log('🔥🔥🔥 FUNCTION CALLED - createStockMovement');
        console.log('🔥 STOCK MOVEMENT ENDPOINT CALLED!');
        console.log('🔥 METHOD:', req.method);
        console.log('🔥 URL:', req.url);
        console.log('🔥 PARAMS:', req.params);
        console.log('🔥 BODY:', req.body);
        
        try {
            console.log('🔍 STEP 1: Extracting data from request');
            const { inventoryId } = req.params;
            const { type, quantity, unitCost, referenceDocument, reason, performedBy, supplierId, departmentId, notes, movementDate } = req.body;
            
            console.log('🔍 STEP 2: Basic validation');
            if (!type || !quantity || quantity <= 0) {
                console.log('❌ Validation error: type or quantity');
                return res.status(400).json({ message: 'Tipul și cantitatea (pozitivă) sunt obligatorii' });
            }

            if (!movementDate) {
                console.log('❌ Validation error: movementDate');
                return res.status(400).json({ message: 'Data mișcării este obligatorie' });
            }

            console.log('🔍 STEP 3: Getting current inventory');
            // Get current inventory with product details
            const [inventoryRows] = await pool.execute<RowDataPacket[]>(
                `SELECT i.*, p.name as product_name, p.code as product_code, p.unit as product_unit,
                        p.min_stock, p.max_stock, p.reorder_point, p.unit_price as product_unit_price
                 FROM inventory i 
                 JOIN products p ON i.product_id = p.id 
                 WHERE i.id = ?`,
                [inventoryId]
            );
            
            if (inventoryRows.length === 0) {
                console.log('❌ Inventory not found');
                return res.status(404).json({ message: 'Stocul nu a fost găsit' });
            }
            
            const inventory = inventoryRows[0];
            console.log('✅ Found inventory:', inventory);

            console.log('🔍 STEP 4: Calculating new quantities and costs');
            let newQuantity = inventory.quantity;
            let actualQuantity = quantity;
            let newUnitCost = Number(inventory.unit_cost) || 0;
            
            switch (type.toUpperCase()) {
                case 'IN':
                    // Pentru intrări, calculez costul mediu ponderat
                    const currentValue = Number(inventory.quantity) * Number(inventory.unit_cost);
                    const addedValue = Number(quantity) * Number(unitCost || inventory.unit_cost);
                    newQuantity = Number(inventory.quantity) + Number(quantity);
                    newUnitCost = newQuantity > 0 ? (currentValue + addedValue) / newQuantity : Number(inventory.unit_cost);
                    console.log('✅ IN movement:', {
                        currentQuantity: inventory.quantity,
                        currentValue: Number(currentValue).toFixed(2),
                        addedQuantity: quantity,
                        addedValue: Number(addedValue).toFixed(2),
                        newQuantity,
                        newUnitCost: Number(newUnitCost).toFixed(2)
                    });
                    break;
                case 'OUT':
                    if (quantity > inventory.quantity) {
                        console.log('❌ OUT movement - insufficient stock');
                        return res.status(400).json({ 
                            message: `Cantitate insuficientă în stoc. Disponibil: ${inventory.quantity} ${inventory.product_unit}` 
                        });
                    }
                    newQuantity = inventory.quantity - quantity;
                    actualQuantity = -quantity; // Negative for OUT movements
                    // Costul rămâne același pentru ieșiri
                    console.log('✅ OUT movement:', {
                        currentQuantity: inventory.quantity,
                        removedQuantity: quantity,
                        newQuantity,
                        unitCost: Number(newUnitCost).toFixed(2)
                    });
                    break;
                case 'ADJUSTMENT':
                    if (quantity < 0) {
                        console.log('❌ ADJUSTMENT movement - negative quantity');
                        return res.status(400).json({ message: 'Cantitatea pentru ajustare nu poate fi negativă' });
                    }
                    actualQuantity = quantity - inventory.quantity; // Difference for adjustment
                    newQuantity = quantity;
                    // Pentru ajustări, păstrez costul actual
                    console.log('✅ ADJUSTMENT movement:', {
                        currentQuantity: inventory.quantity,
                        adjustedQuantity: quantity,
                        difference: actualQuantity,
                        newQuantity,
                        unitCost: Number(newUnitCost).toFixed(2)
                    });
                    break;
                case 'TRANSFER':
                    if (quantity > inventory.quantity) {
                        console.log('❌ TRANSFER movement - insufficient stock');
                        return res.status(400).json({ 
                            message: `Cantitate insuficientă pentru transfer. Disponibil: ${inventory.quantity} ${inventory.product_unit}` 
                        });
                    }
                    newQuantity = inventory.quantity - quantity;
                    actualQuantity = -quantity; // Negative for TRANSFER movements
                    console.log('✅ TRANSFER movement:', {
                        currentQuantity: inventory.quantity,
                        transferredQuantity: quantity,
                        newQuantity,
                        unitCost: Number(newUnitCost).toFixed(2)
                    });
                    break;
                default:
                    console.log('❌ Invalid movement type');
                    return res.status(400).json({ message: 'Tip de mișcare invalid. Folosiți: IN, OUT, ADJUSTMENT, TRANSFER' });
            }

            console.log('🔍 STEP 5: Inserting stock movement');
            console.log('🔍 Parameters:', {
                inventoryId, type: type.toUpperCase(), actualQuantity, 
                unitCost: Number(unitCost) || Number(inventory.unit_cost) || 0,
                referenceDocument, reason, performedBy, 
                supplierId: supplierId || null, departmentId: departmentId || null, 
                notes, movementDate
            });
            // Create stock movement record
            const [result] = await pool.execute<ResultSetHeader>(
                `INSERT INTO stock_movements (
                    inventory_id, type, quantity, unit_cost, reference_document, reason, 
                    performed_by, supplier_id, department_id, notes, movement_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [inventoryId, type.toUpperCase(), actualQuantity, Number(unitCost) || Number(inventory.unit_cost) || 0, referenceDocument || null, 
                 reason, performedBy, supplierId || null, departmentId || null, notes || null, movementDate]
            );

            console.log('✅ STEP 6: Stock movement created with ID:', result.insertId);

            console.log('🔍 STEP 7: Updating inventory');
            // Update inventory quantity and cost
            await pool.execute(
                'UPDATE inventory SET quantity = ?, unit_cost = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
                [newQuantity, newUnitCost, inventoryId]
            );

            console.log('✅ STEP 8: Inventory updated successfully');

            console.log('🔍 STEP 9: Preparing response');
            const response = {
                success: true,
                message: 'Mișcarea de stoc a fost înregistrată cu succes',
                movement: {
                    id: result.insertId,
                    type: type.toUpperCase(),
                    quantity: Math.abs(actualQuantity),
                    unitCost: Number(unitCost) || Number(inventory.unit_cost) || 0,
                    totalCost: Math.abs(actualQuantity) * (Number(unitCost) || Number(inventory.unit_cost) || 0),
                    referenceDocument,
                    reason,
                    performedBy,
                    movementDate,
                    notes
                },
                inventory: {
                    id: inventory.id,
                    product: {
                        name: inventory.product_name,
                        code: inventory.product_code,
                        unit: inventory.product_unit
                    },
                    previousStock: inventory.quantity,
                    currentStock: newQuantity,
                    previousUnitCost: inventory.unit_cost,
                    currentUnitCost: newUnitCost,
                    totalValue: newQuantity * newUnitCost
                }
            };

            console.log('✅ STEP 10: Response prepared successfully');
            res.status(201).json(response);
        } catch (error: any) {
            console.error('❌ ERROR in createStockMovement:', error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error stack:', error.stack);
            res.status(500).json({ message: 'Eroare la crearea mișcării de stoc', error: error.message });
        }
    },

    // Stock Audit - Istoricul modificărilor de stoc
    getStockAuditLog: async (req: Request, res: Response) => {
        try {
            console.log('🔍 Getting stock audit log');
            const { page = 1, limit = 50, productId, type, dateFrom, dateTo } = req.query;
            const offset = (Number(page) - 1) * Number(limit);

            let whereConditions = [];
            let queryParams = [];

            if (productId) {
                whereConditions.push('sm.inventory_id IN (SELECT id FROM inventory WHERE product_id = ?)');
                queryParams.push(productId);
            }

            if (type) {
                whereConditions.push('sm.type = ?');
                queryParams.push(type);
            }

            if (dateFrom) {
                whereConditions.push('sm.movement_date >= ?');
                queryParams.push(dateFrom);
            }

            if (dateTo) {
                whereConditions.push('sm.movement_date <= ?');
                queryParams.push(dateTo);
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

            // Query pentru istoricul modificărilor
            const query = `
                SELECT 
                    sm.id,
                    sm.type,
                    sm.quantity,
                    sm.unit_cost,
                    sm.total_cost,
                    sm.reference_document,
                    sm.reason,
                    sm.performed_by,
                    sm.supplier_id,
                    sm.department_id,
                    sm.notes,
                    sm.movement_date,
                    sm.created_at,
                    i.id as inventory_id,
                    i.quantity as current_stock,
                    i.unit_cost as current_unit_cost,
                    p.id as product_id,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit,
                    pc.name as product_category,
                    s.name as supplier_name,
                    d.name as department_name,
                    CONCAT(u.first_name, ' ', u.last_name) as user_name,
                    u.email as user_email
                FROM stock_movements sm
                JOIN inventory i ON sm.inventory_id = i.id
                JOIN products p ON i.product_id = p.id
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                LEFT JOIN suppliers s ON sm.supplier_id = s.id
                LEFT JOIN departments d ON sm.department_id = d.id
                LEFT JOIN users u ON sm.performed_by = u.id
                ${whereClause}
                ORDER BY sm.created_at DESC
                LIMIT ${Number(limit)} OFFSET ${Number(offset)}
            `;
            
            console.log('🔍 Query:', query);
            console.log('🔍 Params:', queryParams);
            console.log('🔍 WhereClause:', whereClause);
            console.log('🔍 QueryParams length:', queryParams.length);
            
            const [movements] = await pool.execute<RowDataPacket[]>(query, queryParams);

            // Query pentru total
            const [totalResult] = await pool.execute<RowDataPacket[]>(`
                SELECT COUNT(*) as total
                FROM stock_movements sm
                JOIN inventory i ON sm.inventory_id = i.id
                JOIN products p ON i.product_id = p.id
                LEFT JOIN users u ON sm.performed_by = u.id
                ${whereClause}
            `, queryParams);

            const total = totalResult[0]?.total || 0;

            // Calculez stocul anterior pentru fiecare mișcare
            const movementsWithPreviousStock = movements.map(movement => {
                const previousStock = movement.type === 'IN' 
                    ? movement.current_stock - movement.quantity
                    : movement.type === 'OUT' 
                    ? movement.current_stock + Math.abs(movement.quantity)
                    : movement.current_stock;

                return {
                    ...movement,
                    previous_stock: previousStock,
                    stock_change: movement.quantity,
                    stock_after: movement.current_stock
                };
            });

            res.json({
                success: true,
                data: movementsWithPreviousStock,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            });

        } catch (error: any) {
            console.error('❌ Error getting stock audit log:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Eroare la obținerea istoricului modificărilor de stoc',
                error: error.message 
            });
        }
    },

    // Supplier Products - Funcționalități pentru gestionarea relațiilor furnizor-produs
    getSupplierProducts: async (req: Request, res: Response) => {
        try {
            const { supplierId } = req.params;
            console.log('🔍 Getting products for supplier:', supplierId);

            const [supplierProducts] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    sp.id,
                    sp.supplier_id,
                    sp.product_id,
                    sp.supplier_code,
                    sp.unit_price,
                    sp.min_order_quantity,
                    sp.delivery_time,
                    sp.is_preferred,
                    sp.is_active,
                    sp.created_at,
                    sp.updated_at,
                    p.name as product_name,
                    p.code as product_code,
                    p.description as product_description,
                    p.unit as product_unit,
                    p.unit_price as product_default_price,
                    pc.name as category_name,
                    s.name as supplier_name,
                    COALESCE(SUM(i.quantity), 0) as current_stock
                FROM supplier_products sp
                JOIN products p ON sp.product_id = p.id
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                JOIN suppliers s ON sp.supplier_id = s.id
                LEFT JOIN inventory i ON p.id = i.product_id
                WHERE sp.supplier_id = ? AND sp.is_active = TRUE
                GROUP BY sp.id, sp.supplier_id, sp.product_id, sp.supplier_code, sp.unit_price, 
                         sp.min_order_quantity, sp.delivery_time, sp.is_preferred, sp.is_active,
                         sp.created_at, sp.updated_at, p.name, p.code, p.description, p.unit,
                         p.unit_price, pc.name, s.name
                ORDER BY p.name
            `, [supplierId]);

            const transformedProducts = supplierProducts.map(item => ({
                id: item.id,
                supplierCode: item.supplier_code,
                unitPrice: item.unit_price,
                minOrderQuantity: item.min_order_quantity,
                deliveryTime: item.delivery_time,
                isPreferred: !!item.is_preferred,
                isActive: !!item.is_active,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
                product: {
                    id: item.product_id,
                    name: item.product_name,
                    code: item.product_code,
                    description: item.product_description,
                    unit: item.product_unit,
                    defaultPrice: item.product_default_price,
                    categoryName: item.category_name,
                    currentStock: item.current_stock
                },
                supplier: {
                    id: item.supplier_id,
                    name: item.supplier_name
                }
            }));

            res.json({
                success: true,
                data: transformedProducts,
                count: transformedProducts.length
            });
        } catch (error: any) {
            console.error('❌ Error fetching supplier products:', error);
            res.status(500).json({ message: 'Eroare la încărcarea produselor furnizorului' });
        }
    },

    addProductToSupplier: async (req: Request, res: Response) => {
        try {
            const { supplierId } = req.params;
            const {
                productId,
                supplierCode,
                unitPrice,
                minOrderQuantity,
                deliveryTime,
                isPreferred
            } = req.body;

            console.log('➕ Adding product to supplier:', { supplierId, productId, unitPrice });

            // Verifică dacă furnizorul și produsul există
            const [supplierCheck] = await pool.execute<RowDataPacket[]>(
                'SELECT id, name FROM suppliers WHERE id = ? AND is_active = TRUE',
                [supplierId]
            );

            const [productCheck] = await pool.execute<RowDataPacket[]>(
                'SELECT id, name, code, unit FROM products WHERE id = ? AND is_active = TRUE',
                [productId]
            );

            if (supplierCheck.length === 0) {
                return res.status(404).json({ message: 'Furnizorul nu a fost găsit' });
            }

            if (productCheck.length === 0) {
                return res.status(404).json({ message: 'Produsul nu a fost găsit' });
            }

            // Verifică dacă relația există deja
            const [existingRelation] = await pool.execute<RowDataPacket[]>(
                'SELECT id FROM supplier_products WHERE supplier_id = ? AND product_id = ?',
                [supplierId, productId]
            );

            if (existingRelation.length > 0) {
                return res.status(400).json({ 
                    message: `Produsul "${productCheck[0].name}" este deja asociat cu furnizorul "${supplierCheck[0].name}"` 
                });
            }

            // Dacă acest produs este marcat ca preferat, dezactivează alte furnizori preferați
            if (isPreferred) {
                await pool.execute(
                    'UPDATE supplier_products SET is_preferred = FALSE WHERE product_id = ? AND supplier_id != ?',
                    [productId, supplierId]
                );
            }

            // Creează relația furnizor-produs
            const [result] = await pool.execute<ResultSetHeader>(
                `INSERT INTO supplier_products (
                    supplier_id, product_id, supplier_code, unit_price, min_order_quantity,
                    delivery_time, is_preferred, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
                [supplierId, productId, supplierCode, unitPrice, minOrderQuantity || 1, 
                 deliveryTime || 5, isPreferred || false]
            );

            // Obține relația creată cu toate detaliile
            const [newRelation] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    sp.*,
                    p.name as product_name,
                    p.code as product_code,
                    p.unit as product_unit,
                    s.name as supplier_name
                FROM supplier_products sp
                JOIN products p ON sp.product_id = p.id
                JOIN suppliers s ON sp.supplier_id = s.id
                WHERE sp.id = ?
            `, [result.insertId]);

            res.status(201).json({
                success: true,
                message: `Produsul "${productCheck[0].name}" a fost adăugat cu succes la furnizorul "${supplierCheck[0].name}"`,
                data: {
                    id: newRelation[0].id,
                    supplierCode: newRelation[0].supplier_code,
                    unitPrice: newRelation[0].unit_price,
                    minOrderQuantity: newRelation[0].min_order_quantity,
                    deliveryTime: newRelation[0].delivery_time,
                    isPreferred: !!newRelation[0].is_preferred,
                    product: {
                        id: newRelation[0].product_id,
                        name: newRelation[0].product_name,
                        code: newRelation[0].product_code,
                        unit: newRelation[0].product_unit
                    },
                    supplier: {
                        id: newRelation[0].supplier_id,
                        name: newRelation[0].supplier_name
                    }
                }
            });
        } catch (error: any) {
            console.error('❌ Error adding product to supplier:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ message: 'Această relație furnizor-produs există deja' });
            } else {
                res.status(500).json({ message: 'Eroare la adăugarea produsului la furnizor' });
            }
        }
    },

    updateSupplierProduct: async (req: Request, res: Response) => {
        try {
            const { supplierId, relationId } = req.params;
            const {
                supplierCode,
                unitPrice,
                minOrderQuantity,
                deliveryTime,
                isPreferred
            } = req.body;

            console.log('✏️ Updating supplier product relation:', { supplierId, relationId });

            // Verifică dacă relația există
            const [existingRelation] = await pool.execute<RowDataPacket[]>(
                `SELECT sp.*, p.name as product_name, s.name as supplier_name
                 FROM supplier_products sp
                 JOIN products p ON sp.product_id = p.id
                 JOIN suppliers s ON sp.supplier_id = s.id
                 WHERE sp.id = ? AND sp.supplier_id = ?`,
                [relationId, supplierId]
            );

            if (existingRelation.length === 0) {
                return res.status(404).json({ message: 'Relația furnizor-produs nu a fost găsită' });
            }

            const relation = existingRelation[0];

            // Dacă acest produs este marcat ca preferat, dezactivează alte furnizori preferați
            if (isPreferred && !relation.is_preferred) {
                await pool.execute(
                    'UPDATE supplier_products SET is_preferred = FALSE WHERE product_id = ? AND supplier_id != ?',
                    [relation.product_id, supplierId]
                );
            }

            // Actualizează relația
            await pool.execute(
                `UPDATE supplier_products SET
                    supplier_code = ?, unit_price = ?, min_order_quantity = ?,
                    delivery_time = ?, is_preferred = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND supplier_id = ?`,
                [supplierCode, unitPrice, minOrderQuantity, deliveryTime, 
                 isPreferred || false, relationId, supplierId]
            );

            res.json({
                success: true,
                message: `Relația pentru produsul "${relation.product_name}" a fost actualizată cu succes`,
                data: {
                    id: relationId,
                    supplierCode,
                    unitPrice,
                    minOrderQuantity,
                    deliveryTime,
                    isPreferred: !!isPreferred
                }
            });
        } catch (error: any) {
            console.error('❌ Error updating supplier product:', error);
            res.status(500).json({ message: 'Eroare la actualizarea relației furnizor-produs' });
        }
    },

    removeProductFromSupplier: async (req: Request, res: Response) => {
        try {
            const { supplierId, relationId } = req.params;

            console.log('🗑️ Removing product from supplier:', { supplierId, relationId });

            // Verifică dacă relația există
            const [existingRelation] = await pool.execute<RowDataPacket[]>(
                `SELECT sp.*, p.name as product_name, s.name as supplier_name
                 FROM supplier_products sp
                 JOIN products p ON sp.product_id = p.id
                 JOIN suppliers s ON sp.supplier_id = s.id
                 WHERE sp.id = ? AND sp.supplier_id = ?`,
                [relationId, supplierId]
            );

            if (existingRelation.length === 0) {
                return res.status(404).json({ message: 'Relația furnizor-produs nu a fost găsită' });
            }

            const relation = existingRelation[0];

            // Verifică dacă există comenzi active pentru această relație
            const [activeOrders] = await pool.execute<RowDataPacket[]>(
                `SELECT COUNT(*) as count FROM purchase_orders po
                 JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
                 WHERE po.supplier_id = ? AND poi.product_id = ? 
                 AND po.status IN ('DRAFT', 'PENDING', 'APPROVED', 'SENT')`,
                [supplierId, relation.product_id]
            );

            if (activeOrders[0].count > 0) {
                return res.status(400).json({
                    message: `Nu se poate elimina produsul "${relation.product_name}" deoarece există comenzi active pentru acest furnizor`
                });
            }

            // Elimină relația (soft delete)
            await pool.execute(
                'UPDATE supplier_products SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND supplier_id = ?',
                [relationId, supplierId]
            );

            res.json({
                success: true,
                message: `Produsul "${relation.product_name}" a fost eliminat de la furnizorul "${relation.supplier_name}"`
            });
        } catch (error: any) {
            console.error('❌ Error removing product from supplier:', error);
            res.status(500).json({ message: 'Eroare la eliminarea produsului de la furnizor' });
        }
    },

    getAvailableProductsForSupplier: async (req: Request, res: Response) => {
        try {
            const { supplierId } = req.params;

            console.log('🔍 Getting available products for supplier:', supplierId);

            // Obține produsele care NU sunt încă asociate cu acest furnizor
            const [availableProducts] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    p.id,
                    p.name,
                    p.code,
                    p.description,
                    p.unit,
                    p.unit_price,
                    pc.name as category_name,
                    COALESCE(SUM(i.quantity), 0) as current_stock
                FROM products p
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                LEFT JOIN inventory i ON p.id = i.product_id
                WHERE p.is_active = TRUE 
                AND p.id NOT IN (
                    SELECT product_id 
                    FROM supplier_products 
                    WHERE supplier_id = ? AND is_active = TRUE
                )
                GROUP BY p.id, p.name, p.code, p.description, p.unit, p.unit_price, pc.name
                ORDER BY p.name
            `, [supplierId]);

            const transformedProducts = availableProducts.map(product => ({
                id: product.id,
                name: product.name,
                code: product.code,
                description: product.description,
                unit: product.unit,
                unitPrice: product.unit_price,
                categoryName: product.category_name,
                currentStock: product.current_stock
            }));

            res.json({
                success: true,
                data: transformedProducts,
                count: transformedProducts.length
            });
        } catch (error: any) {
            console.error('❌ Error fetching available products:', error);
            res.status(500).json({ message: 'Eroare la încărcarea produselor disponibile' });
        }
    },

    // Statistici furnizori cu produse
    getSupplierWithProductStats: async (req: Request, res: Response) => {
        try {
            const { supplierId } = req.params;

            const [supplierStats] = await pool.execute<RowDataPacket[]>(`
                SELECT 
                    s.*,
                    COUNT(DISTINCT sp.product_id) as products_count,
                    COUNT(DISTINCT CASE WHEN sp.is_preferred = TRUE THEN sp.product_id END) as preferred_products_count,
                    AVG(sp.unit_price) as avg_unit_price,
                    MIN(sp.unit_price) as min_unit_price,
                    MAX(sp.unit_price) as max_unit_price,
                    AVG(sp.delivery_time) as avg_delivery_time
                FROM suppliers s
                LEFT JOIN supplier_products sp ON s.id = sp.supplier_id AND sp.is_active = TRUE
                WHERE s.id = ? AND s.is_active = TRUE
                GROUP BY s.id
            `, [supplierId]);

            if (supplierStats.length === 0) {
                return res.status(404).json({ message: 'Furnizorul nu a fost găsit' });
            }

            const supplier = supplierStats[0];

            res.json({
                success: true,
                data: {
                    id: supplier.id,
                    name: supplier.name,
                    code: supplier.code,
                    contactPerson: supplier.contact_person,
                    email: supplier.email,
                    phone: supplier.phone,
                    status: supplier.status,
                    totalOrders: supplier.total_orders,
                    totalValue: supplier.total_value,
                    rating: supplier.rating,
                    statistics: {
                        productsCount: supplier.products_count || 0,
                        preferredProductsCount: supplier.preferred_products_count || 0,
                        avgUnitPrice: supplier.avg_unit_price || 0,
                        minUnitPrice: supplier.min_unit_price || 0,
                        maxUnitPrice: supplier.max_unit_price || 0,
                        avgDeliveryTime: supplier.avg_delivery_time || 0
                    }
                }
            });
        } catch (error: any) {
            console.error('❌ Error fetching supplier stats:', error);
            res.status(500).json({ message: 'Eroare la încărcarea statisticilor furnizorului' });
        }
    },
}; 