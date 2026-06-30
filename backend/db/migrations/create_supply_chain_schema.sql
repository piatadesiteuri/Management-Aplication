-- Supply Chain Management Schema
-- Creez toate tabelele necesare pentru sistemul de supply chain

-- Tabel pentru furnizori
CREATE TABLE IF NOT EXISTS suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'România',
    tax_number VARCHAR(50),
    registration_number VARCHAR(50),
    status ENUM('ACTIVE', 'INACTIVE', 'PENDING') DEFAULT 'ACTIVE',
    payment_terms VARCHAR(100) DEFAULT '30 zile',
    delivery_time INT DEFAULT 5,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_orders INT DEFAULT 0,
    total_value DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_suppliers_status (status),
    INDEX idx_suppliers_active (is_active),
    INDEX idx_suppliers_name (name)
);

-- Tabel pentru categorii de produse
CREATE TABLE IF NOT EXISTS product_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES product_categories(id) ON DELETE SET NULL,
    INDEX idx_categories_parent (parent_id),
    INDEX idx_categories_active (is_active)
);

-- Tabel pentru produse
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category_id INT,
    unit VARCHAR(50) NOT NULL DEFAULT 'bucată',
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    min_stock INT DEFAULT 0,
    max_stock INT DEFAULT 1000,
    reorder_point INT DEFAULT 10,
    barcode VARCHAR(255),
    manufacturer VARCHAR(255),
    expiry_months INT,
    storage_conditions TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL,
    INDEX idx_products_category (category_id),
    INDEX idx_products_code (code),
    INDEX idx_products_active (is_active),
    INDEX idx_products_name (name)
);

-- Tabel pentru inventar
CREATE TABLE IF NOT EXISTS inventory (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    location VARCHAR(255) DEFAULT 'Depozit Principal',
    batch_number VARCHAR(100),
    expiry_date DATE,
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    total_value DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    notes TEXT,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_inventory_product (product_id),
    INDEX idx_inventory_location (location),
    INDEX idx_inventory_quantity (quantity),
    INDEX idx_inventory_expiry (expiry_date)
);

-- Tabel pentru mișcări de stoc
CREATE TABLE IF NOT EXISTS stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inventory_id INT NOT NULL,
    type ENUM('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER') NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    reference_document VARCHAR(255),
    reason VARCHAR(255),
    performed_by VARCHAR(255),
    supplier_id INT,
    department_id INT,
    notes TEXT,
    movement_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    INDEX idx_movements_inventory (inventory_id),
    INDEX idx_movements_type (type),
    INDEX idx_movements_date (movement_date),
    INDEX idx_movements_supplier (supplier_id)
);

-- Tabel pentru comenzi de achiziție
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id INT NOT NULL,
    status ENUM('DRAFT', 'PENDING', 'APPROVED', 'SENT', 'RECEIVED', 'CANCELLED') DEFAULT 'DRAFT',
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    total_amount DECIMAL(15,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    final_amount DECIMAL(15,2) DEFAULT 0.00,
    payment_terms VARCHAR(100),
    delivery_address TEXT,
    notes TEXT,
    created_by INT NOT NULL,
    approved_by INT,
    received_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_purchase_orders_supplier (supplier_id),
    INDEX idx_purchase_orders_status (status),
    INDEX idx_purchase_orders_date (order_date),
    INDEX idx_purchase_orders_number (order_number)
);

-- Tabel pentru articolele din comenzile de achiziție
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    purchase_order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    received_quantity INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_purchase_order_items_order (purchase_order_id),
    INDEX idx_purchase_order_items_product (product_id)
);

-- Tabel pentru relația furnizor-produs (ce produse oferă fiecare furnizor)
CREATE TABLE IF NOT EXISTS supplier_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_id INT NOT NULL,
    product_id INT NOT NULL,
    supplier_code VARCHAR(100),
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    min_order_quantity INT DEFAULT 1,
    delivery_time INT DEFAULT 5,
    is_preferred BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_supplier_product (supplier_id, product_id),
    INDEX idx_supplier_products_supplier (supplier_id),
    INDEX idx_supplier_products_product (product_id),
    INDEX idx_supplier_products_preferred (is_preferred)
);

-- Trigger pentru actualizarea automată a stocului la mișcări
DELIMITER //
CREATE TRIGGER update_inventory_on_movement
    AFTER INSERT ON stock_movements
    FOR EACH ROW
BEGIN
    DECLARE current_qty INT DEFAULT 0;
    
    -- Obține cantitatea curentă
    SELECT quantity INTO current_qty 
    FROM inventory 
    WHERE id = NEW.inventory_id;
    
    -- Actualizează cantitatea în funcție de tipul mișcării
    CASE NEW.type
        WHEN 'IN' THEN
            UPDATE inventory 
            SET quantity = current_qty + NEW.quantity,
                last_updated = CURRENT_TIMESTAMP
            WHERE id = NEW.inventory_id;
        WHEN 'OUT' THEN
            UPDATE inventory 
            SET quantity = current_qty - NEW.quantity,
                last_updated = CURRENT_TIMESTAMP
            WHERE id = NEW.inventory_id;
        WHEN 'ADJUSTMENT' THEN
            UPDATE inventory 
            SET quantity = NEW.quantity,
                last_updated = CURRENT_TIMESTAMP
            WHERE id = NEW.inventory_id;
    END CASE;
END//
DELIMITER ;

-- Trigger pentru actualizarea statisticilor furnizorilor
DELIMITER //
CREATE TRIGGER update_supplier_stats
    AFTER INSERT ON purchase_orders
    FOR EACH ROW
BEGIN
    UPDATE suppliers 
    SET total_orders = total_orders + 1,
        total_value = total_value + NEW.final_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.supplier_id;
END//
DELIMITER ;

-- View pentru stocul critic
CREATE VIEW low_stock_products AS
SELECT 
    p.id,
    p.name,
    p.code,
    p.unit,
    p.min_stock,
    p.reorder_point,
    COALESCE(SUM(i.quantity), 0) as current_stock,
    pc.name as category_name
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE p.is_active = TRUE
GROUP BY p.id, p.name, p.code, p.unit, p.min_stock, p.reorder_point, pc.name
HAVING current_stock <= p.reorder_point;

-- View pentru valoarea totală a inventarului
CREATE VIEW inventory_value AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.code as product_code,
    p.unit,
    SUM(i.quantity) as total_quantity,
    AVG(i.unit_cost) as avg_unit_cost,
    SUM(i.total_value) as total_value,
    pc.name as category_name
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE p.is_active = TRUE
GROUP BY p.id, p.name, p.code, p.unit, pc.name
HAVING total_quantity > 0; 