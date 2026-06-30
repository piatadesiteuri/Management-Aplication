import { Request, Response } from 'express';
import pool from '../config/database';

export const PharmacyController = {
  // ========== UNITĂȚI ==========
  getUnits: async (req: Request, res: Response) => {
    try {
      const [rows]: any = await pool.execute(
        'SELECT * FROM pharmacy_units ORDER BY name'
      );
      res.json(rows);
    } catch (error) {
      console.error('Error fetching units:', error);
      res.status(500).json({ message: 'Eroare la încărcarea unităților' });
    }
  },

  createUnit: async (req: Request, res: Response) => {
    try {
      const { code, name, description, address, phone, email } = req.body;
      
      const [result]: any = await pool.execute(
        `INSERT INTO pharmacy_units (code, name, description, address, phone, email)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [code, name, description || null, address || null, phone || null, email || null]
      );
      
      res.status(201).json({ id: result.insertId, message: 'Unitate creată cu succes' });
    } catch (error: any) {
      console.error('Error creating unit:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ message: 'Codul unității există deja' });
      } else {
        res.status(500).json({ message: 'Eroare la crearea unității' });
      }
    }
  },

  updateUnit: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { code, name, description, address, phone, email, is_active } = req.body;
      
      await pool.execute(
        `UPDATE pharmacy_units 
         SET code = ?, name = ?, description = ?, address = ?, phone = ?, email = ?, is_active = ?
         WHERE id = ?`,
        [code, name, description || null, address || null, phone || null, email || null, is_active !== undefined ? is_active : true, id]
      );
      
      res.json({ message: 'Unitate actualizată cu succes' });
    } catch (error: any) {
      console.error('Error updating unit:', error);
      res.status(500).json({ message: 'Eroare la actualizarea unității' });
    }
  },

  deleteUnit: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM pharmacy_units WHERE id = ?', [id]);
      res.json({ message: 'Unitate ștearsă cu succes' });
    } catch (error) {
      console.error('Error deleting unit:', error);
      res.status(500).json({ message: 'Eroare la ștergerea unității' });
    }
  },

  // ========== GESTIUNI ==========
  getStorages: async (req: Request, res: Response) => {
    try {
      const { unitId } = req.query;
      let query = `
        SELECT s.*, u.name as unit_name, u.code as unit_code
        FROM pharmacy_storages s
        JOIN pharmacy_units u ON s.unit_id = u.id
      `;
      const params: any[] = [];
      
      if (unitId) {
        query += ' WHERE s.unit_id = ?';
        params.push(unitId);
      }
      
      query += ' ORDER BY u.name, s.name';
      
      const [rows]: any = await pool.execute(query, params);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching storages:', error);
      res.status(500).json({ message: 'Eroare la încărcarea gestiunilor' });
    }
  },

  createStorage: async (req: Request, res: Response) => {
    try {
      const { unit_id, code, name, description, storage_type, location, responsible_person } = req.body;
      
      const [result]: any = await pool.execute(
        `INSERT INTO pharmacy_storages (unit_id, code, name, description, storage_type, location, responsible_person)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [unit_id, code, name, description || null, storage_type || 'PRINCIPAL', location || null, responsible_person || null]
      );
      
      res.status(201).json({ id: result.insertId, message: 'Gestiune creată cu succes' });
    } catch (error: any) {
      console.error('Error creating storage:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ message: 'Codul gestiunii există deja pentru această unitate' });
      } else {
        res.status(500).json({ message: 'Eroare la crearea gestiunii' });
      }
    }
  },

  updateStorage: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { code, name, description, storage_type, location, responsible_person, is_active } = req.body;
      
      await pool.execute(
        `UPDATE pharmacy_storages 
         SET code = ?, name = ?, description = ?, storage_type = ?, location = ?, responsible_person = ?, is_active = ?
         WHERE id = ?`,
        [code, name, description || null, storage_type || 'PRINCIPAL', location || null, responsible_person || null, is_active !== undefined ? is_active : true, id]
      );
      
      res.json({ message: 'Gestiune actualizată cu succes' });
    } catch (error: any) {
      console.error('Error updating storage:', error);
      res.status(500).json({ message: 'Eroare la actualizarea gestiunii' });
    }
  },

  deleteStorage: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM pharmacy_storages WHERE id = ?', [id]);
      res.json({ message: 'Gestiune ștearsă cu succes' });
    } catch (error) {
      console.error('Error deleting storage:', error);
      res.status(500).json({ message: 'Eroare la ștergerea gestiunii' });
    }
  },

  // ========== ARTICOLE ==========
  getArticles: async (req: Request, res: Response) => {
    try {
      const { search, typeId, manufacturerId } = req.query;
      let query = `
        SELECT a.*, 
               at.name as article_type_name, at.code as article_type_code,
               m.name as manufacturer_name, m.code as manufacturer_code,
               uom.name as unit_of_measure_name, uom.abbreviation as unit_of_measure_abbreviation
        FROM pharmacy_articles a
        JOIN pharmacy_article_types at ON a.article_type_id = at.id
        JOIN pharmacy_units_of_measure uom ON a.unit_of_measure_id = uom.id
        LEFT JOIN pharmacy_manufacturers m ON a.manufacturer_id = m.id
        WHERE 1=1
      `;
      const params: any[] = [];
      
      if (search) {
        query += ' AND (a.name LIKE ? OR a.code LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      if (typeId) {
        query += ' AND a.article_type_id = ?';
        params.push(typeId);
      }
      
      if (manufacturerId) {
        query += ' AND a.manufacturer_id = ?';
        params.push(manufacturerId);
      }
      
      query += ' ORDER BY a.name';
      
      const [rows]: any = await pool.execute(query, params);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ message: 'Eroare la încărcarea articolelor' });
    }
  },

  createArticle: async (req: Request, res: Response) => {
    try {
      const {
        code, name, description, article_type_id, manufacturer_id, unit_of_measure_id,
        atc_code, cim_code, barcode, requires_prescription, is_controlled,
        min_stock_level, max_stock_level
      } = req.body;
      
      const [result]: any = await pool.execute(
        `INSERT INTO pharmacy_articles 
         (code, name, description, article_type_id, manufacturer_id, unit_of_measure_id,
          atc_code, cim_code, barcode, requires_prescription, is_controlled,
          min_stock_level, max_stock_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code, name, description || null, article_type_id, manufacturer_id || null, unit_of_measure_id,
          atc_code || null, cim_code || null, barcode || null,
          requires_prescription || false, is_controlled || false,
          min_stock_level || 0, max_stock_level || 0
        ]
      );
      
      res.status(201).json({ id: result.insertId, message: 'Articol creat cu succes' });
    } catch (error: any) {
      console.error('Error creating article:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ message: 'Codul articolului există deja' });
      } else {
        res.status(500).json({ message: 'Eroare la crearea articolului' });
      }
    }
  },

  updateArticle: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        code, name, description, article_type_id, manufacturer_id, unit_of_measure_id,
        atc_code, cim_code, barcode, requires_prescription, is_controlled,
        min_stock_level, max_stock_level, is_active
      } = req.body;
      
      await pool.execute(
        `UPDATE pharmacy_articles 
         SET code = ?, name = ?, description = ?, article_type_id = ?, manufacturer_id = ?, unit_of_measure_id = ?,
             atc_code = ?, cim_code = ?, barcode = ?, requires_prescription = ?, is_controlled = ?,
             min_stock_level = ?, max_stock_level = ?, is_active = ?
         WHERE id = ?`,
        [
          code, name, description || null, article_type_id, manufacturer_id || null, unit_of_measure_id,
          atc_code || null, cim_code || null, barcode || null,
          requires_prescription || false, is_controlled || false,
          min_stock_level || 0, max_stock_level || 0, is_active !== undefined ? is_active : true, id
        ]
      );
      
      res.json({ message: 'Articol actualizat cu succes' });
    } catch (error: any) {
      console.error('Error updating article:', error);
      res.status(500).json({ message: 'Eroare la actualizarea articolului' });
    }
  },

  deleteArticle: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM pharmacy_articles WHERE id = ?', [id]);
      res.json({ message: 'Articol șters cu succes' });
    } catch (error) {
      console.error('Error deleting article:', error);
      res.status(500).json({ message: 'Eroare la ștergerea articolului' });
    }
  },

  // ========== FURNIZORI ==========
  getSuppliers: async (req: Request, res: Response) => {
    try {
      const [rows]: any = await pool.execute(
        'SELECT * FROM pharmacy_suppliers ORDER BY name'
      );
      res.json(rows);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      res.status(500).json({ message: 'Eroare la încărcarea furnizorilor' });
    }
  },

  createSupplier: async (req: Request, res: Response) => {
    try {
      const {
        code, name, fiscal_code, registration_number, address, phone, email,
        contact_person, payment_terms, delivery_terms
      } = req.body;
      
      const [result]: any = await pool.execute(
        `INSERT INTO pharmacy_suppliers 
         (code, name, fiscal_code, registration_number, address, phone, email,
          contact_person, payment_terms, delivery_terms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code, name, fiscal_code || null, registration_number || null,
          address || null, phone || null, email || null,
          contact_person || null, payment_terms || null, delivery_terms || null
        ]
      );
      
      res.status(201).json({ id: result.insertId, message: 'Furnizor creat cu succes' });
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
        code, name, fiscal_code, registration_number, address, phone, email,
        contact_person, payment_terms, delivery_terms, is_active
      } = req.body;
      
      await pool.execute(
        `UPDATE pharmacy_suppliers 
         SET code = ?, name = ?, fiscal_code = ?, registration_number = ?, address = ?, phone = ?, email = ?,
             contact_person = ?, payment_terms = ?, delivery_terms = ?, is_active = ?
         WHERE id = ?`,
        [
          code, name, fiscal_code || null, registration_number || null,
          address || null, phone || null, email || null,
          contact_person || null, payment_terms || null, delivery_terms || null,
          is_active !== undefined ? is_active : true, id
        ]
      );
      
      res.json({ message: 'Furnizor actualizat cu succes' });
    } catch (error: any) {
      console.error('Error updating supplier:', error);
      res.status(500).json({ message: 'Eroare la actualizarea furnizorului' });
    }
  },

  deleteSupplier: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM pharmacy_suppliers WHERE id = ?', [id]);
      res.json({ message: 'Furnizor șters cu succes' });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({ message: 'Eroare la ștergerea furnizorului' });
    }
  },

  // ========== DATE AUXILIARE ==========
  getArticleTypes: async (req: Request, res: Response) => {
    try {
      const [rows]: any = await pool.execute(
        'SELECT * FROM pharmacy_article_types WHERE is_active = TRUE ORDER BY name'
      );
      res.json(rows);
    } catch (error) {
      console.error('Error fetching article types:', error);
      res.status(500).json({ message: 'Eroare la încărcarea tipurilor de articole' });
    }
  },

  getManufacturers: async (req: Request, res: Response) => {
    try {
      const [rows]: any = await pool.execute(
        'SELECT * FROM pharmacy_manufacturers WHERE is_active = TRUE ORDER BY name'
      );
      res.json(rows);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
      res.status(500).json({ message: 'Eroare la încărcarea producătorilor' });
    }
  },

  createManufacturer: async (req: Request, res: Response) => {
    try {
      const { code, name, country, address, phone, email } = req.body;
      
      const [result]: any = await pool.execute(
        `INSERT INTO pharmacy_manufacturers (code, name, country, address, phone, email)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [code, name, country || null, address || null, phone || null, email || null]
      );
      
      res.status(201).json({ id: result.insertId, message: 'Producător creat cu succes' });
    } catch (error: any) {
      console.error('Error creating manufacturer:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ message: 'Codul producătorului există deja' });
      } else {
        res.status(500).json({ message: 'Eroare la crearea producătorului' });
      }
    }
  },

  getUnitsOfMeasure: async (req: Request, res: Response) => {
    try {
      const [rows]: any = await pool.execute(
        'SELECT * FROM pharmacy_units_of_measure WHERE is_active = TRUE ORDER BY name'
      );
      res.json(rows);
    } catch (error) {
      console.error('Error fetching units of measure:', error);
      res.status(500).json({ message: 'Eroare la încărcarea unităților de măsură' });
    }
  },

  // ========== NOTE DE INTRARE ==========
  getNextEntryNoteNumber: async (req: Request, res: Response) => {
    try {
      const currentYear = new Date().getFullYear();
      const prefix = 'NI';
      
      // Găsește ultima notă de intrare din anul curent
      const [rows]: any = await pool.execute(`
        SELECT note_number 
        FROM pharmacy_entry_notes 
        WHERE note_number LIKE ? 
        ORDER BY note_number DESC 
        LIMIT 1
      `, [`${prefix}-%/${currentYear}`]);
      
      let nextNumber = 1;
      if (rows && rows.length > 0) {
        const lastNumber = rows[0].note_number;
        // Extrage numărul din formatul "NI-001/2026"
        const match = lastNumber.match(/\d+/);
        if (match) {
          nextNumber = parseInt(match[0]) + 1;
        }
      }
      
      const nextNoteNumber = `${prefix}-${String(nextNumber).padStart(3, '0')}/${currentYear}`;
      res.json({ next_number: nextNoteNumber });
    } catch (error) {
      console.error('Error getting next entry note number:', error);
      res.status(500).json({ message: 'Eroare la generarea numărului' });
    }
  },

  getNextRegisterNumber: async (req: Request, res: Response) => {
    try {
      const currentYear = new Date().getFullYear();
      const prefix = 'COND';
      
      const [rows]: any = await pool.execute(`
        SELECT register_number 
        FROM pharmacy_registers 
        WHERE register_number LIKE ? 
        ORDER BY register_number DESC 
        LIMIT 1
      `, [`${prefix}-%/${currentYear}`]);
      
      let nextNumber = 1;
      if (rows && rows.length > 0) {
        const lastNumber = rows[0].register_number;
        const match = lastNumber.match(/\d+/);
        if (match) {
          nextNumber = parseInt(match[0]) + 1;
        }
      }
      
      const nextRegisterNumber = `${prefix}-${String(nextNumber).padStart(3, '0')}/${currentYear}`;
      res.json({ next_number: nextRegisterNumber });
    } catch (error) {
      console.error('Error getting next register number:', error);
      res.status(500).json({ message: 'Eroare la generarea numărului' });
    }
  },

  getNextPrescriptionNumber: async (req: Request, res: Response) => {
    try {
      const currentYear = new Date().getFullYear();
      const prefix = 'RET';
      
      const [rows]: any = await pool.execute(`
        SELECT prescription_number 
        FROM pharmacy_prescriptions 
        WHERE prescription_number LIKE ? 
        ORDER BY prescription_number DESC 
        LIMIT 1
      `, [`${prefix}-%/${currentYear}`]);
      
      let nextNumber = 1;
      if (rows && rows.length > 0) {
        const lastNumber = rows[0].prescription_number;
        const match = lastNumber.match(/\d+/);
        if (match) {
          nextNumber = parseInt(match[0]) + 1;
        }
      }
      
      const nextPrescriptionNumber = `${prefix}-${String(nextNumber).padStart(3, '0')}/${currentYear}`;
      res.json({ next_number: nextPrescriptionNumber });
    } catch (error) {
      console.error('Error getting next prescription number:', error);
      res.status(500).json({ message: 'Eroare la generarea numărului' });
    }
  },

  getNextTransferNoteNumber: async (req: Request, res: Response) => {
    try {
      const currentYear = new Date().getFullYear();
      const prefix = 'TRANS';
      
      const [rows]: any = await pool.execute(`
        SELECT note_number 
        FROM pharmacy_entry_notes 
        WHERE document_number LIKE ? AND note_number LIKE ?
        ORDER BY note_number DESC 
        LIMIT 1
      `, [`TRANSFER-%`, `${prefix}-%/${currentYear}`]);
      
      let nextNumber = 1;
      if (rows && rows.length > 0) {
        const lastNumber = rows[0].note_number;
        const match = lastNumber.match(/\d+/);
        if (match) {
          nextNumber = parseInt(match[0]) + 1;
        }
      }
      
      const nextTransferNumber = `${prefix}-${String(nextNumber).padStart(3, '0')}/${currentYear}`;
      res.json({ next_number: nextTransferNumber });
    } catch (error) {
      console.error('Error getting next transfer note number:', error);
      res.status(500).json({ message: 'Eroare la generarea numărului' });
    }
  },

  getNextElaborationNumber: async (req: Request, res: Response) => {
    try {
      const currentYear = new Date().getFullYear();
      const prefix = 'ELAB';
      
      const [rows]: any = await pool.execute(`
        SELECT elaboration_number 
        FROM pharmacy_elaborations 
        WHERE elaboration_number LIKE ? 
        ORDER BY elaboration_number DESC 
        LIMIT 1
      `, [`${prefix}%`]);
      
      let nextNumber = 1;
      if (rows && rows.length > 0) {
        const lastNumber = rows[0].elaboration_number;
        const match = lastNumber.match(/\d+/);
        if (match) {
          nextNumber = parseInt(match[0]) + 1;
        }
      }
      
      const nextElaborationNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;
      res.json({ next_number: nextElaborationNumber });
    } catch (error) {
      console.error('Error getting next elaboration number:', error);
      res.status(500).json({ message: 'Eroare la generarea numărului' });
    }
  },

  getDoctors: async (req: Request, res: Response) => {
    try {
      const { search } = req.query;
      let query = `
        SELECT DISTINCT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          GROUP_CONCAT(DISTINCT r.name) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.is_active = TRUE
      `;
      const params: any[] = [];
      
      if (search) {
        query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      query += ' GROUP BY u.id ORDER BY u.last_name, u.first_name LIMIT 100';
      
      const [rows]: any = await pool.execute(query, params);
      
      // Formatează rezultatele
      const doctors = rows.map((user: any) => ({
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        email: user.email,
        roles: user.roles ? String(user.roles).split(',') : []
      }));
      
      res.json(doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      res.status(500).json({ message: 'Eroare la încărcarea medicilor' });
    }
  },

  getNextStockInitNumber: async (req: Request, res: Response) => {
    try {
      const currentYear = new Date().getFullYear();
      const prefix = 'INIT';
      
      const [rows]: any = await pool.execute(`
        SELECT note_number 
        FROM pharmacy_entry_notes 
        WHERE document_number LIKE ? AND note_number LIKE ?
        ORDER BY note_number DESC 
        LIMIT 1
      `, [`INIT-%`, `${prefix}%`]);
      
      let nextNumber = 1;
      if (rows && rows.length > 0) {
        const lastNumber = rows[0].note_number;
        const match = lastNumber.match(/\d+/);
        if (match) {
          nextNumber = parseInt(match[0]) + 1;
        }
      }
      
      const nextInitNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;
      res.json({ next_number: nextInitNumber });
    } catch (error) {
      console.error('Error getting next stock init number:', error);
      res.status(500).json({ message: 'Eroare la generarea numărului' });
    }
  },

  getEntryNotes: async (req: Request, res: Response) => {
    try {
      const [rows]: any = await pool.execute(`
        SELECT en.*, 
               s.name as storage_name, s.code as storage_code,
               sup.name as supplier_name, sup.code as supplier_code
        FROM pharmacy_entry_notes en
        JOIN pharmacy_storages s ON en.storage_id = s.id
        JOIN pharmacy_suppliers sup ON en.supplier_id = sup.id
        ORDER BY en.entry_date DESC, en.note_number DESC
      `);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching entry notes:', error);
      res.status(500).json({ message: 'Eroare la încărcarea notelor de intrare' });
    }
  },

  getEntryNoteById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [notes]: any = await pool.execute(`
        SELECT en.*, 
               s.name as storage_name, s.code as storage_code,
               sup.name as supplier_name, sup.code as supplier_code
        FROM pharmacy_entry_notes en
        JOIN pharmacy_storages s ON en.storage_id = s.id
        JOIN pharmacy_suppliers sup ON en.supplier_id = sup.id
        WHERE en.id = ?
      `, [id]);
      
      if (!notes || notes.length === 0) {
        return res.status(404).json({ message: 'Nota de intrare nu a fost găsită' });
      }

      const [items]: any = await pool.execute(`
        SELECT eni.*, a.name as article_name, a.code as article_code,
               uom.name as unit_of_measure_name
        FROM pharmacy_entry_note_items eni
        JOIN pharmacy_articles a ON eni.article_id = a.id
        LEFT JOIN pharmacy_units_of_measure uom ON a.unit_of_measure_id = uom.id
        WHERE eni.entry_note_id = ?
        ORDER BY eni.line_number, eni.id
      `, [id]);

      res.json({ ...notes[0], items });
    } catch (error) {
      console.error('Error fetching entry note:', error);
      res.status(500).json({ message: 'Eroare la încărcarea notei de intrare' });
    }
  },

  createEntryNote: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      const { note_number, storage_id, supplier_id, entry_date, reception_date, 
              document_number, document_date, notes, items } = req.body;
      
      if (!req.user) {
        await conn.rollback();
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      // Calculează total_value din items
      const total_value = items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unit_cost), 0);

      const [result]: any = await conn.execute(`
        INSERT INTO pharmacy_entry_notes 
        (note_number, storage_id, supplier_id, entry_date, reception_date, 
         document_number, document_date, total_value, notes, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?)
      `, [note_number, storage_id, supplier_id, entry_date, reception_date || entry_date,
          document_number || null, document_date || null, total_value, notes || null, req.user.id]);

      const entryNoteId = result.insertId;

      // Adaugă items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await conn.execute(`
          INSERT INTO pharmacy_entry_note_items 
          (entry_note_id, article_id, quantity, unit_cost, total_cost, batch_number, expiry_date, line_number)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [entryNoteId, item.article_id, item.quantity, item.unit_cost, 
            item.quantity * item.unit_cost, item.batch_number || null, 
            item.expiry_date || null, i + 1]);
      }

      await conn.commit();
      conn.release();
      res.status(201).json({ id: entryNoteId, message: 'Nota de intrare creată cu succes' });
    } catch (error: any) {
      await conn.rollback();
      conn.release();
      console.error('Error creating entry note:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ message: 'Numărul notei de intrare există deja' });
      } else {
        res.status(500).json({ message: 'Eroare la crearea notei de intrare' });
      }
    }
  },

  updateEntryNote: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      const { id } = req.params;
      const { storage_id, supplier_id, entry_date, reception_date, 
              document_number, document_date, notes, status, items } = req.body;

      // Calculează total_value din items
      const total_value = items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unit_cost), 0);

      await conn.execute(`
        UPDATE pharmacy_entry_notes 
        SET storage_id = ?, supplier_id = ?, entry_date = ?, reception_date = ?,
            document_number = ?, document_date = ?, total_value = ?, notes = ?, status = ?
        WHERE id = ?
      `, [storage_id, supplier_id, entry_date, reception_date || entry_date,
          document_number || null, document_date || null, total_value, notes || null, status || 'DRAFT', id]);

      // Șterge items vechi și adaugă cele noi
      await conn.execute('DELETE FROM pharmacy_entry_note_items WHERE entry_note_id = ?', [id]);
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await conn.execute(`
          INSERT INTO pharmacy_entry_note_items 
          (entry_note_id, article_id, quantity, unit_cost, total_cost, batch_number, expiry_date, line_number)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, item.article_id, item.quantity, item.unit_cost, 
            item.quantity * item.unit_cost, item.batch_number || null, 
            item.expiry_date || null, i + 1]);
      }

      // Dacă status este VALIDATED, actualizează stocul
      if (status === 'VALIDATED') {
        for (const item of items) {
          // Verifică dacă există deja stoc pentru acest articol în această gestiune
          const [existingStock]: any = await conn.execute(`
            SELECT id, quantity FROM pharmacy_stock 
            WHERE storage_id = ? AND article_id = ?
          `, [storage_id, item.article_id]);

          if (existingStock && existingStock.length > 0) {
            // Actualizează stocul existent
            await conn.execute(`
              UPDATE pharmacy_stock 
              SET quantity = quantity + ?, unit_cost = ?, expiry_date = ?, batch_number = ?
              WHERE id = ?
            `, [item.quantity, item.unit_cost, item.expiry_date || null, item.batch_number || null, existingStock[0].id]);
          } else {
            // Creează stoc nou
            await conn.execute(`
              INSERT INTO pharmacy_stock (storage_id, article_id, quantity, unit_cost, expiry_date, batch_number)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [storage_id, item.article_id, item.quantity, item.unit_cost, 
                item.expiry_date || null, item.batch_number || null]);
          }

          // Adaugă mișcare de stoc
          await conn.execute(`
            INSERT INTO pharmacy_stock_movements 
            (movement_date, storage_id, article_id, movement_type, quantity, unit_cost, total_value,
             document_type, document_id, document_number, batch_number, expiry_date, notes, performed_by)
            VALUES (NOW(), ?, ?, 'IN', ?, ?, ?, 'ENTRY_NOTE', ?, ?, ?, ?, 'Intrare stoc', ?)
          `, [storage_id, item.article_id, item.quantity, item.unit_cost, 
              item.quantity * item.unit_cost, id, req.body.note_number || null,
              item.batch_number || null, item.expiry_date || null, req.user?.id || null]);
        }
      }

      await conn.commit();
      conn.release();
      res.json({ message: 'Nota de intrare actualizată cu succes' });
    } catch (error: any) {
      await conn.rollback();
      conn.release();
      console.error('Error updating entry note:', error);
      res.status(500).json({ message: 'Eroare la actualizarea notei de intrare' });
    }
  },

  // ========== CONDICI ==========
  getRegisters: async (req: Request, res: Response) => {
    try {
      const [rows]: any = await pool.execute(`
        SELECT r.*, s.name as storage_name, s.code as storage_code
        FROM pharmacy_registers r
        JOIN pharmacy_storages s ON r.storage_id = s.id
        ORDER BY r.register_date DESC, r.register_number DESC
      `);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching registers:', error);
      res.status(500).json({ message: 'Eroare la încărcarea condicilor' });
    }
  },

  getRegisterById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [registers]: any = await pool.execute(`
        SELECT r.*, s.name as storage_name, s.code as storage_code
        FROM pharmacy_registers r
        JOIN pharmacy_storages s ON r.storage_id = s.id
        WHERE r.id = ?
      `, [id]);
      
      if (!registers || registers.length === 0) {
        return res.status(404).json({ message: 'Condica nu a fost găsită' });
      }

      const [items]: any = await pool.execute(`
        SELECT ri.*, a.name as article_name, a.code as article_code,
               uom.name as unit_of_measure_name
        FROM pharmacy_register_items ri
        JOIN pharmacy_articles a ON ri.article_id = a.id
        LEFT JOIN pharmacy_units_of_measure uom ON a.unit_of_measure_id = uom.id
        WHERE ri.register_id = ?
        ORDER BY ri.line_number, ri.id
      `, [id]);

      res.json({ ...registers[0], items });
    } catch (error) {
      console.error('Error fetching register:', error);
      res.status(500).json({ message: 'Eroare la încărcarea condicii' });
    }
  },

  createRegister: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      const { register_number, storage_id, register_date, patient_name, patient_identity,
              doctor_name, prescription_number, notes, items } = req.body;
      
      if (!req.user) {
        await conn.rollback();
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      // Calculează total_value din items
      const total_value = items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unit_price), 0);

      const [result]: any = await conn.execute(`
        INSERT INTO pharmacy_registers 
        (register_number, storage_id, register_date, patient_name, patient_identity,
         doctor_name, prescription_number, total_value, notes, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?)
      `, [register_number, storage_id, register_date, patient_name || null, patient_identity || null,
          doctor_name || null, prescription_number || null, total_value, notes || null, req.user.id]);

      const registerId = result.insertId;

      // Adaugă items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await conn.execute(`
          INSERT INTO pharmacy_register_items 
          (register_id, article_id, quantity, unit_price, total_price, line_number)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [registerId, item.article_id, item.quantity, item.unit_price, 
            item.quantity * item.unit_price, i + 1]);
      }

      await conn.commit();
      conn.release();
      res.status(201).json({ id: registerId, message: 'Condică creată cu succes' });
    } catch (error: any) {
      await conn.rollback();
      conn.release();
      console.error('Error creating register:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ message: 'Numărul condicii există deja' });
      } else {
        res.status(500).json({ message: 'Eroare la crearea condicii' });
      }
    }
  },

  updateRegister: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      const { id } = req.params;
      const { storage_id, register_date, patient_name, patient_identity,
              doctor_name, prescription_number, notes, status, items } = req.body;

      if (!req.user) {
        await conn.rollback();
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      // Calculează total_value din items
      const total_value = items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unit_price), 0);

      const issuedAt = status === 'ISSUED' ? new Date() : null;

      await conn.execute(`
        UPDATE pharmacy_registers 
        SET storage_id = ?, register_date = ?, patient_name = ?, patient_identity = ?,
            doctor_name = ?, prescription_number = ?, total_value = ?, notes = ?, 
            status = ?, issued_by = ?, issued_at = ?
        WHERE id = ?
      `, [storage_id, register_date, patient_name || null, patient_identity || null,
          doctor_name || null, prescription_number || null, total_value, notes || null, 
          status || 'DRAFT', status === 'ISSUED' ? req.user.id : null, issuedAt, id]);

      // Șterge items vechi și adaugă cele noi
      await conn.execute('DELETE FROM pharmacy_register_items WHERE register_id = ?', [id]);
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await conn.execute(`
          INSERT INTO pharmacy_register_items 
          (register_id, article_id, quantity, unit_price, total_price, line_number)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [id, item.article_id, item.quantity, item.unit_price, 
            item.quantity * item.unit_price, i + 1]);
      }

      // Dacă status este ISSUED, scade din stoc
      if (status === 'ISSUED') {
        for (const item of items) {
          // Verifică stoc disponibil
          const [stock]: any = await conn.execute(`
            SELECT id, quantity FROM pharmacy_stock 
            WHERE storage_id = ? AND article_id = ?
          `, [storage_id, item.article_id]);

          if (!stock || stock.length === 0 || stock[0].quantity < item.quantity) {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ 
              message: `Stoc insuficient pentru articolul ${item.article_name || item.article_id}` 
            });
          }

          // Scade din stoc
          await conn.execute(`
            UPDATE pharmacy_stock 
            SET quantity = quantity - ?
            WHERE id = ?
          `, [item.quantity, stock[0].id]);

          // Adaugă mișcare de stoc
          const [register]: any = await conn.execute('SELECT register_number FROM pharmacy_registers WHERE id = ?', [id]);
          await conn.execute(`
            INSERT INTO pharmacy_stock_movements 
            (movement_date, storage_id, article_id, movement_type, quantity, unit_cost, total_value,
             document_type, document_id, document_number, notes, performed_by)
            VALUES (NOW(), ?, ?, 'OUT', ?, ?, ?, 'REGISTER', ?, ?, 'Ieșire condică', ?)
          `, [storage_id, item.article_id, item.quantity, item.unit_price, 
              item.quantity * item.unit_price, id, register[0].register_number, req.user.id]);
        }
      }

      await conn.commit();
      conn.release();
      res.json({ message: 'Condică actualizată cu succes' });
    } catch (error: any) {
      await conn.rollback();
      conn.release();
      console.error('Error updating register:', error);
      res.status(500).json({ message: 'Eroare la actualizarea condicii' });
    }
  },

  // ========== REȚETE ==========
  getPrescriptions: async (req: Request, res: Response) => {
    try {
      const [rows]: any = await pool.execute(`
        SELECT p.*, s.name as storage_name, s.code as storage_code
        FROM pharmacy_prescriptions p
        JOIN pharmacy_storages s ON p.storage_id = s.id
        ORDER BY p.prescription_date DESC, p.prescription_number DESC
      `);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      res.status(500).json({ message: 'Eroare la încărcarea rețetelor' });
    }
  },

  getPrescriptionById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [prescriptions]: any = await pool.execute(`
        SELECT p.*, s.name as storage_name, s.code as storage_code
        FROM pharmacy_prescriptions p
        JOIN pharmacy_storages s ON p.storage_id = s.id
        WHERE p.id = ?
      `, [id]);
      
      if (!prescriptions || prescriptions.length === 0) {
        return res.status(404).json({ message: 'Rețeta nu a fost găsită' });
      }

      const [items]: any = await pool.execute(`
        SELECT pi.*, a.name as article_name, a.code as article_code,
               uom.name as unit_of_measure_name
        FROM pharmacy_prescription_items pi
        JOIN pharmacy_articles a ON pi.article_id = a.id
        LEFT JOIN pharmacy_units_of_measure uom ON a.unit_of_measure_id = uom.id
        WHERE pi.prescription_id = ?
        ORDER BY pi.line_number, pi.id
      `, [id]);

      res.json({ ...prescriptions[0], items });
    } catch (error) {
      console.error('Error fetching prescription:', error);
      res.status(500).json({ message: 'Eroare la încărcarea rețetei' });
    }
  },

  createPrescription: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      const { prescription_number, storage_id, prescription_date, patient_name, patient_identity,
              patient_age, patient_gender, doctor_name, doctor_specialty, diagnosis, notes, items } = req.body;
      
      if (!req.user) {
        await conn.rollback();
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      // Calculează total_value din items
      const total_value = items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unit_price), 0);

      const [result]: any = await conn.execute(`
        INSERT INTO pharmacy_prescriptions 
        (prescription_number, storage_id, prescription_date, patient_name, patient_identity,
         patient_age, patient_gender, doctor_name, doctor_specialty, diagnosis, total_value, notes, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?)
      `, [prescription_number, storage_id, prescription_date, patient_name || null, patient_identity || null,
          patient_age || null, patient_gender || null, doctor_name || null, doctor_specialty || null,
          diagnosis || null, total_value, notes || null, req.user.id]);

      const prescriptionId = result.insertId;

      // Adaugă items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await conn.execute(`
          INSERT INTO pharmacy_prescription_items 
          (prescription_id, article_id, quantity, unit_price, total_price, dosage, 
           administration_route, frequency, duration_days, line_number)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [prescriptionId, item.article_id, item.quantity, item.unit_price, 
            item.quantity * item.unit_price, item.dosage || null, item.administration_route || null,
            item.frequency || null, item.duration_days || null, i + 1]);
      }

      await conn.commit();
      conn.release();
      res.status(201).json({ id: prescriptionId, message: 'Rețetă creată cu succes' });
    } catch (error: any) {
      await conn.rollback();
      conn.release();
      console.error('Error creating prescription:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ message: 'Numărul rețetei există deja' });
      } else {
        res.status(500).json({ message: 'Eroare la crearea rețetei' });
      }
    }
  },

  updatePrescription: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      const { id } = req.params;
      const { storage_id, prescription_date, patient_name, patient_identity,
              patient_age, patient_gender, doctor_name, doctor_specialty, diagnosis, notes, status, items } = req.body;

      if (!req.user) {
        await conn.rollback();
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      // Calculează total_value din items
      const total_value = items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unit_price), 0);

      const dispensedAt = status === 'DISPENSED' ? new Date() : null;

      await conn.execute(`
        UPDATE pharmacy_prescriptions 
        SET storage_id = ?, prescription_date = ?, patient_name = ?, patient_identity = ?,
            patient_age = ?, patient_gender = ?, doctor_name = ?, doctor_specialty = ?,
            diagnosis = ?, total_value = ?, notes = ?, status = ?, 
            dispensed_by = ?, dispensed_at = ?
        WHERE id = ?
      `, [storage_id, prescription_date, patient_name || null, patient_identity || null,
          patient_age || null, patient_gender || null, doctor_name || null, doctor_specialty || null,
          diagnosis || null, total_value, notes || null, status || 'DRAFT',
          status === 'DISPENSED' ? req.user.id : null, dispensedAt, id]);

      // Șterge items vechi și adaugă cele noi
      await conn.execute('DELETE FROM pharmacy_prescription_items WHERE prescription_id = ?', [id]);
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await conn.execute(`
          INSERT INTO pharmacy_prescription_items 
          (prescription_id, article_id, quantity, unit_price, total_price, dosage, 
           administration_route, frequency, duration_days, line_number)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, item.article_id, item.quantity, item.unit_price, 
            item.quantity * item.unit_price, item.dosage || null, item.administration_route || null,
            item.frequency || null, item.duration_days || null, i + 1]);
      }

      // Dacă status este DISPENSED, scade din stoc
      if (status === 'DISPENSED') {
        for (const item of items) {
          // Verifică stoc disponibil
          const [stock]: any = await conn.execute(`
            SELECT id, quantity FROM pharmacy_stock 
            WHERE storage_id = ? AND article_id = ?
          `, [storage_id, item.article_id]);

          if (!stock || stock.length === 0 || stock[0].quantity < item.quantity) {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ 
              message: `Stoc insuficient pentru articolul ${item.article_name || item.article_id}` 
            });
          }

          // Scade din stoc
          await conn.execute(`
            UPDATE pharmacy_stock 
            SET quantity = quantity - ?
            WHERE id = ?
          `, [item.quantity, stock[0].id]);

          // Adaugă mișcare de stoc
          const [prescription]: any = await conn.execute('SELECT prescription_number FROM pharmacy_prescriptions WHERE id = ?', [id]);
          await conn.execute(`
            INSERT INTO pharmacy_stock_movements 
            (movement_date, storage_id, article_id, movement_type, quantity, unit_cost, total_value,
             document_type, document_id, document_number, notes, performed_by)
            VALUES (NOW(), ?, ?, 'OUT', ?, ?, ?, 'PRESCRIPTION', ?, ?, 'Ieșire rețetă', ?)
          `, [storage_id, item.article_id, item.quantity, item.unit_price, 
              item.quantity * item.unit_price, id, prescription[0].prescription_number, req.user.id]);
        }
      }

      await conn.commit();
      conn.release();
      res.json({ message: 'Rețetă actualizată cu succes' });
    } catch (error: any) {
      await conn.rollback();
      conn.release();
      console.error('Error updating prescription:', error);
      res.status(500).json({ message: 'Eroare la actualizarea rețetei' });
    }
  },

  // ========== STOC CURENT ==========
  getCurrentStock: async (req: Request, res: Response) => {
    try {
      const { storageId } = req.query;
      let query = `
        SELECT s.*, 
               a.name as article_name, a.code as article_code,
               st.name as storage_name, st.code as storage_code,
               uom.name as unit_of_measure_name
        FROM pharmacy_stock s
        JOIN pharmacy_articles a ON s.article_id = a.id
        JOIN pharmacy_storages st ON s.storage_id = st.id
        LEFT JOIN pharmacy_units_of_measure uom ON a.unit_of_measure_id = uom.id
        WHERE s.quantity > 0
      `;
      const params: any[] = [];
      
      if (storageId) {
        query += ' AND s.storage_id = ?';
        params.push(storageId);
      }
      
      query += ' ORDER BY st.name, a.name';
      
      const [rows]: any = await pool.execute(query, params);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching current stock:', error);
      res.status(500).json({ message: 'Eroare la încărcarea stocului curent' });
    }
  },

  // ========== MIȘCĂRI STOC ==========
  getStockMovements: async (req: Request, res: Response) => {
    try {
      const { storageId, articleId, startDate, endDate } = req.query;
      let query = `
        SELECT sm.*, 
               a.name as article_name, a.code as article_code,
               s.name as storage_name, s.code as storage_code
        FROM pharmacy_stock_movements sm
        JOIN pharmacy_articles a ON sm.article_id = a.id
        JOIN pharmacy_storages s ON sm.storage_id = s.id
        WHERE 1=1
      `;
      const params: any[] = [];
      
      if (storageId) {
        query += ' AND sm.storage_id = ?';
        params.push(storageId);
      }
      
      if (articleId) {
        query += ' AND sm.article_id = ?';
        params.push(articleId);
      }
      
      if (startDate) {
        query += ' AND DATE(sm.movement_date) >= ?';
        params.push(startDate);
      }
      
      if (endDate) {
        query += ' AND DATE(sm.movement_date) <= ?';
        params.push(endDate);
      }
      
      query += ' ORDER BY sm.movement_date DESC, sm.id DESC';
      
      const [rows]: any = await pool.execute(query, params);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      res.status(500).json({ message: 'Eroare la încărcarea mișcărilor de stoc' });
    }
  },

  // ========== NOTE DE TRANSFER ==========
  getTransferNotes: async (req: Request, res: Response) => {
    try {
      // Note de transfer sunt stocate ca entry_notes cu document_number care începe cu 'TRANSFER-'
      const [rows]: any = await pool.execute(`
        SELECT en.*, 
               s.name as storage_name, s.code as storage_code
        FROM pharmacy_entry_notes en
        JOIN pharmacy_storages s ON en.storage_id = s.id
        WHERE en.document_number LIKE 'TRANSFER-%'
        ORDER BY en.entry_date DESC, en.note_number DESC
      `);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching transfer notes:', error);
      res.status(500).json({ message: 'Eroare la încărcarea notelor de transfer' });
    }
  },

  getTransferNoteById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [notes]: any = await pool.execute(`
        SELECT en.*, 
               s.name as storage_name, s.code as storage_code
        FROM pharmacy_entry_notes en
        JOIN pharmacy_storages s ON en.storage_id = s.id
        WHERE en.id = ? AND en.document_number LIKE 'TRANSFER-%'
      `, [id]);
      
      if (!notes || notes.length === 0) {
        return res.status(404).json({ message: 'Nota de transfer nu a fost găsită' });
      }

      const [items]: any = await pool.execute(`
        SELECT eni.*, a.name as article_name, a.code as article_code,
               uom.name as unit_of_measure_name
        FROM pharmacy_entry_note_items eni
        JOIN pharmacy_articles a ON eni.article_id = a.id
        LEFT JOIN pharmacy_units_of_measure uom ON a.unit_of_measure_id = uom.id
        WHERE eni.entry_note_id = ?
        ORDER BY eni.line_number, eni.id
      `, [id]);

      res.json({ ...notes[0], items });
    } catch (error) {
      console.error('Error fetching transfer note:', error);
      res.status(500).json({ message: 'Eroare la încărcarea notei de transfer' });
    }
  },

  createTransferNote: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      const { note_number, from_storage_id, to_storage_id, transfer_date, notes, items } = req.body;
      
      if (!req.user) {
        await conn.rollback();
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      // Calculează total_value din items
      const total_value = items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unit_cost), 0);

      // Creează nota de transfer ca entry_note cu document_number special
      const document_number = `TRANSFER-${Date.now()}`;
      
      // Folosim un supplier dummy pentru a respecta NOT NULL constraint
      const [dummySupplier]: any = await conn.execute(
        'SELECT id FROM pharmacy_suppliers LIMIT 1'
      );
      
      if (!dummySupplier || dummySupplier.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ message: 'Nu există furnizori în sistem' });
      }

      const [result]: any = await conn.execute(`
        INSERT INTO pharmacy_entry_notes 
        (note_number, storage_id, supplier_id, entry_date, reception_date, 
         document_number, document_date, total_value, notes, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'VALIDATED', ?)
      `, [note_number, to_storage_id, dummySupplier[0].id, transfer_date, transfer_date,
          document_number, transfer_date, total_value, notes || null, req.user.id]);

      const transferNoteId = result.insertId;

      // Adaugă items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await conn.execute(`
          INSERT INTO pharmacy_entry_note_items 
          (entry_note_id, article_id, quantity, unit_cost, total_cost, batch_number, expiry_date, line_number)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [transferNoteId, item.article_id, item.quantity, item.unit_cost, 
            item.quantity * item.unit_cost, item.batch_number || null, 
            item.expiry_date || null, i + 1]);
      }

      // Scade din stocul sursă și adaugă în stocul destinație
      for (const item of items) {
        // Verifică stoc disponibil în gestiunea sursă
        const [stockFrom]: any = await conn.execute(`
          SELECT id, quantity FROM pharmacy_stock 
          WHERE storage_id = ? AND article_id = ?
        `, [from_storage_id, item.article_id]);

        if (!stockFrom || stockFrom.length === 0 || stockFrom[0].quantity < item.quantity) {
          await conn.rollback();
          conn.release();
          return res.status(400).json({ 
            message: `Stoc insuficient în gestiunea sursă pentru articolul ${item.article_name || item.article_id}` 
          });
        }

        // Scade din stocul sursă
        await conn.execute(`
          UPDATE pharmacy_stock 
          SET quantity = quantity - ?
          WHERE id = ?
        `, [item.quantity, stockFrom[0].id]);

        // Adaugă în stocul destinație
        const [stockTo]: any = await conn.execute(`
          SELECT id, quantity FROM pharmacy_stock 
          WHERE storage_id = ? AND article_id = ?
        `, [to_storage_id, item.article_id]);

        if (stockTo && stockTo.length > 0) {
          await conn.execute(`
            UPDATE pharmacy_stock 
            SET quantity = quantity + ?, unit_cost = ?, expiry_date = ?, batch_number = ?
            WHERE id = ?
          `, [item.quantity, item.unit_cost, item.expiry_date || null, item.batch_number || null, stockTo[0].id]);
        } else {
          await conn.execute(`
            INSERT INTO pharmacy_stock (storage_id, article_id, quantity, unit_cost, expiry_date, batch_number)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [to_storage_id, item.article_id, item.quantity, item.unit_cost, 
              item.expiry_date || null, item.batch_number || null]);
        }

        // Adaugă mișcări de stoc
        await conn.execute(`
          INSERT INTO pharmacy_stock_movements 
          (movement_date, storage_id, article_id, movement_type, quantity, unit_cost, total_value,
           document_type, document_id, document_number, batch_number, expiry_date, notes, performed_by)
          VALUES (NOW(), ?, ?, 'TRANSFER_OUT', ?, ?, ?, 'TRANSFER', ?, ?, ?, ?, 'Transfer ieșire', ?)
        `, [from_storage_id, item.article_id, item.quantity, item.unit_cost, 
            item.quantity * item.unit_cost, transferNoteId, note_number,
            item.batch_number || null, item.expiry_date || null, req.user.id]);

        await conn.execute(`
          INSERT INTO pharmacy_stock_movements 
          (movement_date, storage_id, article_id, movement_type, quantity, unit_cost, total_value,
           document_type, document_id, document_number, batch_number, expiry_date, notes, performed_by)
          VALUES (NOW(), ?, ?, 'TRANSFER_IN', ?, ?, ?, 'TRANSFER', ?, ?, ?, ?, 'Transfer intrare', ?)
        `, [to_storage_id, item.article_id, item.quantity, item.unit_cost, 
            item.quantity * item.unit_cost, transferNoteId, note_number,
            item.batch_number || null, item.expiry_date || null, req.user.id]);
      }

      await conn.commit();
      conn.release();
      res.status(201).json({ id: transferNoteId, message: 'Nota de transfer creată cu succes' });
    } catch (error: any) {
      await conn.rollback();
      conn.release();
      console.error('Error creating transfer note:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ message: 'Numărul notei de transfer există deja' });
      } else {
        res.status(500).json({ message: 'Eroare la crearea notei de transfer' });
      }
    }
  },

  // ========== ELABORĂRI ==========
  getElaborations: async (req: Request, res: Response) => {
    try {
      const [rows]: any = await pool.execute(`
        SELECT e.*, 
               s.name as storage_name, s.code as storage_code,
               a.name as resulting_article_name, a.code as resulting_article_code
        FROM pharmacy_elaborations e
        JOIN pharmacy_storages s ON e.storage_id = s.id
        LEFT JOIN pharmacy_articles a ON e.resulting_article_id = a.id
        ORDER BY e.elaboration_date DESC, e.elaboration_number DESC
      `);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching elaborations:', error);
      res.status(500).json({ message: 'Eroare la încărcarea elaborărilor' });
    }
  },

  getElaborationById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [elaborations]: any = await pool.execute(`
        SELECT e.*, 
               s.name as storage_name, s.code as storage_code,
               a.name as resulting_article_name, a.code as resulting_article_code
        FROM pharmacy_elaborations e
        JOIN pharmacy_storages s ON e.storage_id = s.id
        LEFT JOIN pharmacy_articles a ON e.resulting_article_id = a.id
        WHERE e.id = ?
      `, [id]);
      
      if (!elaborations || elaborations.length === 0) {
        return res.status(404).json({ message: 'Elaborarea nu a fost găsită' });
      }

      const [items]: any = await pool.execute(`
        SELECT ei.*, a.name as article_name, a.code as article_code,
               uom.name as unit_of_measure_name
        FROM pharmacy_elaboration_items ei
        JOIN pharmacy_articles a ON ei.article_id = a.id
        LEFT JOIN pharmacy_units_of_measure uom ON a.unit_of_measure_id = uom.id
        WHERE ei.elaboration_id = ?
        ORDER BY ei.line_number, ei.id
      `, [id]);

      res.json({ ...elaborations[0], items });
    } catch (error) {
      console.error('Error fetching elaboration:', error);
      res.status(500).json({ message: 'Eroare la încărcarea elaborării' });
    }
  },

  createElaboration: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      const { elaboration_number, storage_id, elaboration_date, name, description, 
              resulting_article_id, resulting_quantity, notes, items } = req.body;
      
      if (!req.user) {
        await conn.rollback();
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      // Calculează total_cost din items
      const total_cost = items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unit_cost), 0);

      const [result]: any = await conn.execute(`
        INSERT INTO pharmacy_elaborations 
        (elaboration_number, storage_id, elaboration_date, name, description,
         resulting_article_id, total_cost, resulting_quantity, notes, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?)
      `, [elaboration_number, storage_id, elaboration_date, name, description || null,
          resulting_article_id || null, total_cost, resulting_quantity, notes || null, req.user.id]);

      const elaborationId = result.insertId;

      // Adaugă items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await conn.execute(`
          INSERT INTO pharmacy_elaboration_items 
          (elaboration_id, article_id, quantity, unit_cost, total_cost, line_number)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [elaborationId, item.article_id, item.quantity, item.unit_cost, 
            item.quantity * item.unit_cost, i + 1]);
      }

      await conn.commit();
      conn.release();
      res.status(201).json({ id: elaborationId, message: 'Elaborare creată cu succes' });
    } catch (error: any) {
      await conn.rollback();
      conn.release();
      console.error('Error creating elaboration:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ message: 'Numărul elaborării există deja' });
      } else {
        res.status(500).json({ message: 'Eroare la crearea elaborării' });
      }
    }
  },

  updateElaboration: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      const { id } = req.params;
      const { elaboration_number, storage_id, elaboration_date, name, description,
              resulting_article_id, resulting_quantity, notes, status, items } = req.body;
      
      if (!req.user) {
        await conn.rollback();
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      // Calculează total_cost din items
      const total_cost = items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unit_cost), 0);

      // Actualizează elaborarea
      await conn.execute(`
        UPDATE pharmacy_elaborations 
        SET elaboration_number = ?, storage_id = ?, elaboration_date = ?, name = ?,
            description = ?, resulting_article_id = ?, total_cost = ?, resulting_quantity = ?,
            notes = ?, status = ?, completed_at = CASE WHEN ? = 'COMPLETED' THEN NOW() ELSE completed_at END
        WHERE id = ?
      `, [elaboration_number, storage_id, elaboration_date, name, description || null,
          resulting_article_id || null, total_cost, resulting_quantity, notes || null,
          status || 'DRAFT', status || 'DRAFT', id]);

      // Șterge items vechi și adaugă cele noi
      await conn.execute('DELETE FROM pharmacy_elaboration_items WHERE elaboration_id = ?', [id]);
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await conn.execute(`
          INSERT INTO pharmacy_elaboration_items 
          (elaboration_id, article_id, quantity, unit_cost, total_cost, line_number)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [id, item.article_id, item.quantity, item.unit_cost, 
            item.quantity * item.unit_cost, i + 1]);
      }

      // Dacă statusul este COMPLETED, scade componentele din stoc și adaugă articolul rezultat
      if (status === 'COMPLETED' && resulting_article_id) {
        // Scade componentele din stoc
        for (const item of items) {
          const [stock]: any = await conn.execute(`
            SELECT id, quantity FROM pharmacy_stock 
            WHERE storage_id = ? AND article_id = ?
          `, [storage_id, item.article_id]);

          if (!stock || stock.length === 0 || stock[0].quantity < item.quantity) {
            await conn.rollback();
            conn.release();
            return res.status(400).json({ 
              message: `Stoc insuficient pentru articolul ${item.article_name || item.article_id}` 
            });
          }

          await conn.execute(`
            UPDATE pharmacy_stock 
            SET quantity = quantity - ?
            WHERE id = ?
          `, [item.quantity, stock[0].id]);

          // Adaugă mișcare de stoc pentru ieșire
          await conn.execute(`
            INSERT INTO pharmacy_stock_movements 
            (movement_date, storage_id, article_id, movement_type, quantity, unit_cost, total_value,
             document_type, document_id, document_number, notes, performed_by)
            VALUES (NOW(), ?, ?, 'OUT', ?, ?, ?, 'ELABORATION', ?, ?, 'Elaborare - componentă', ?)
          `, [storage_id, item.article_id, item.quantity, item.unit_cost, 
              item.quantity * item.unit_cost, id, elaboration_number, req.user.id]);
        }

        // Adaugă articolul rezultat în stoc
        const unit_cost_result = total_cost / resulting_quantity;
        const [resultStock]: any = await conn.execute(`
          SELECT id, quantity FROM pharmacy_stock 
          WHERE storage_id = ? AND article_id = ?
        `, [storage_id, resulting_article_id]);

        if (resultStock && resultStock.length > 0) {
          await conn.execute(`
            UPDATE pharmacy_stock 
            SET quantity = quantity + ?, unit_cost = ?
            WHERE id = ?
          `, [resulting_quantity, unit_cost_result, resultStock[0].id]);
        } else {
          await conn.execute(`
            INSERT INTO pharmacy_stock (storage_id, article_id, quantity, unit_cost)
            VALUES (?, ?, ?, ?)
          `, [storage_id, resulting_article_id, resulting_quantity, unit_cost_result]);
        }

        // Adaugă mișcare de stoc pentru intrare
        await conn.execute(`
          INSERT INTO pharmacy_stock_movements 
          (movement_date, storage_id, article_id, movement_type, quantity, unit_cost, total_value,
           document_type, document_id, document_number, notes, performed_by)
          VALUES (NOW(), ?, ?, 'IN', ?, ?, ?, 'ELABORATION', ?, ?, 'Elaborare - articol rezultat', ?)
        `, [storage_id, resulting_article_id, resulting_quantity, unit_cost_result, 
            total_cost, id, elaboration_number, req.user.id]);
      }

      await conn.commit();
      conn.release();
      res.json({ message: 'Elaborare actualizată cu succes' });
    } catch (error: any) {
      await conn.rollback();
      conn.release();
      console.error('Error updating elaboration:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ message: 'Numărul elaborării există deja' });
      } else {
        res.status(500).json({ message: 'Eroare la actualizarea elaborării' });
      }
    }
  },

  // ========== INIȚIALIZARE STOC ==========
  getStockInitializations: async (req: Request, res: Response) => {
    try {
      // Inițializările sunt stocate ca entry_notes cu document_number care începe cu 'INIT-'
      const [rows]: any = await pool.execute(`
        SELECT en.*, 
               s.name as storage_name, s.code as storage_code
        FROM pharmacy_entry_notes en
        JOIN pharmacy_storages s ON en.storage_id = s.id
        WHERE en.document_number LIKE 'INIT-%'
        ORDER BY en.entry_date DESC, en.note_number DESC
      `);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching stock initializations:', error);
      res.status(500).json({ message: 'Eroare la încărcarea inițializărilor de stoc' });
    }
  },

  getStockInitializationById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [notes]: any = await pool.execute(`
        SELECT en.*, 
               s.name as storage_name, s.code as storage_code
        FROM pharmacy_entry_notes en
        JOIN pharmacy_storages s ON en.storage_id = s.id
        WHERE en.id = ? AND en.document_number LIKE 'INIT-%'
      `, [id]);
      
      if (!notes || notes.length === 0) {
        return res.status(404).json({ message: 'Inițializarea de stoc nu a fost găsită' });
      }

      const [items]: any = await pool.execute(`
        SELECT eni.*, a.name as article_name, a.code as article_code,
               uom.name as unit_of_measure_name
        FROM pharmacy_entry_note_items eni
        JOIN pharmacy_articles a ON eni.article_id = a.id
        LEFT JOIN pharmacy_units_of_measure uom ON a.unit_of_measure_id = uom.id
        WHERE eni.entry_note_id = ?
        ORDER BY eni.line_number, eni.id
      `, [id]);

      res.json({ ...notes[0], items });
    } catch (error) {
      console.error('Error fetching stock initialization:', error);
      res.status(500).json({ message: 'Eroare la încărcarea inițializării de stoc' });
    }
  },

  createStockInitialization: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      const { note_number, storage_id, entry_date, notes, items } = req.body;
      
      if (!req.user) {
        await conn.rollback();
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      // Calculează total_value din items
      const total_value = items.reduce((sum: number, item: any) => 
        sum + (item.quantity * item.unit_cost), 0);

      // Folosim un supplier dummy pentru a respecta NOT NULL constraint
      const [dummySupplier]: any = await conn.execute(
        'SELECT id FROM pharmacy_suppliers LIMIT 1'
      );
      
      if (!dummySupplier || dummySupplier.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ message: 'Nu există furnizori în sistem' });
      }

      const document_number = `INIT-${Date.now()}`;

      const [result]: any = await conn.execute(`
        INSERT INTO pharmacy_entry_notes 
        (note_number, storage_id, supplier_id, entry_date, reception_date, 
         document_number, document_date, total_value, notes, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?)
      `, [note_number, storage_id, dummySupplier[0].id, entry_date, entry_date,
          document_number, entry_date, total_value, notes || null, req.user.id]);

      const initId = result.insertId;

      // Adaugă items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await conn.execute(`
          INSERT INTO pharmacy_entry_note_items 
          (entry_note_id, article_id, quantity, unit_cost, total_cost, batch_number, expiry_date, line_number)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [initId, item.article_id, item.quantity, item.unit_cost, 
            item.quantity * item.unit_cost, item.batch_number || null, 
            item.expiry_date || null, i + 1]);
      }

      await conn.commit();
      conn.release();
      res.status(201).json({ id: initId, message: 'Inițializare stoc creată cu succes' });
    } catch (error: any) {
      await conn.rollback();
      conn.release();
      console.error('Error creating stock initialization:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ message: 'Numărul inițializării există deja' });
      } else {
        res.status(500).json({ message: 'Eroare la crearea inițializării de stoc' });
      }
    }
  },

  validateStockInitialization: async (req: Request, res: Response) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      
      const { id } = req.params;
      
      if (!req.user) {
        await conn.rollback();
        conn.release();
        return res.status(401).json({ message: 'Neautentificat' });
      }

      // Obține inițializarea și items
      const [notes]: any = await conn.execute(`
        SELECT * FROM pharmacy_entry_notes WHERE id = ? AND document_number LIKE 'INIT-%'
      `, [id]);
      
      if (!notes || notes.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(404).json({ message: 'Inițializarea nu a fost găsită' });
      }

      const note = notes[0];

      const [items]: any = await conn.execute(`
        SELECT * FROM pharmacy_entry_note_items WHERE entry_note_id = ?
      `, [id]);

      // Actualizează statusul la VALIDATED
      await conn.execute(`
        UPDATE pharmacy_entry_notes SET status = 'VALIDATED' WHERE id = ?
      `, [id]);

      // Adaugă în stoc
      for (const item of items) {
        const [stock]: any = await conn.execute(`
          SELECT id, quantity FROM pharmacy_stock 
          WHERE storage_id = ? AND article_id = ?
        `, [note.storage_id, item.article_id]);

        if (stock && stock.length > 0) {
          await conn.execute(`
            UPDATE pharmacy_stock 
            SET quantity = quantity + ?, unit_cost = ?, expiry_date = ?, batch_number = ?
            WHERE id = ?
          `, [item.quantity, item.unit_cost, item.expiry_date || null, 
              item.batch_number || null, stock[0].id]);
        } else {
          await conn.execute(`
            INSERT INTO pharmacy_stock (storage_id, article_id, quantity, unit_cost, expiry_date, batch_number)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [note.storage_id, item.article_id, item.quantity, item.unit_cost, 
              item.expiry_date || null, item.batch_number || null]);
        }

        // Adaugă mișcare de stoc
        await conn.execute(`
          INSERT INTO pharmacy_stock_movements 
          (movement_date, storage_id, article_id, movement_type, quantity, unit_cost, total_value,
           document_type, document_id, document_number, batch_number, expiry_date, notes, performed_by)
          VALUES (NOW(), ?, ?, 'IN', ?, ?, ?, 'STOCK_INIT', ?, ?, ?, ?, 'Inițializare stoc', ?)
        `, [note.storage_id, item.article_id, item.quantity, item.unit_cost, 
            item.total_cost, id, note.note_number, item.batch_number || null, 
            item.expiry_date || null, req.user.id]);
      }

      await conn.commit();
      conn.release();
      res.json({ message: 'Inițializare stoc validată cu succes' });
    } catch (error: any) {
      await conn.rollback();
      conn.release();
      console.error('Error validating stock initialization:', error);
      res.status(500).json({ message: 'Eroare la validarea inițializării de stoc' });
    }
  },

  // ========== EXPORT CJAS ==========
  exportCJAS: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, storageId } = req.query;
      
      // Obține toate documentele din perioada specificată
      let query = `
        SELECT 
          'ENTRY_NOTE' as document_type,
          en.note_number as document_number,
          en.entry_date as document_date,
          en.total_value,
          s.name as storage_name,
          s.code as storage_code
        FROM pharmacy_entry_notes en
        JOIN pharmacy_storages s ON en.storage_id = s.id
        WHERE en.status = 'VALIDATED' AND en.document_number NOT LIKE 'TRANSFER-%' AND en.document_number NOT LIKE 'INIT-%'
      `;
      
      const params: any[] = [];
      
      if (startDate) {
        query += ' AND DATE(en.entry_date) >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND DATE(en.entry_date) <= ?';
        params.push(endDate);
      }
      if (storageId) {
        query += ' AND en.storage_id = ?';
        params.push(storageId);
      }

      query += `
        UNION ALL
        SELECT 
          'REGISTER' as document_type,
          r.register_number as document_number,
          r.register_date as document_date,
          r.total_value,
          s.name as storage_name,
          s.code as storage_code
        FROM pharmacy_registers r
        JOIN pharmacy_storages s ON r.storage_id = s.id
        WHERE r.status = 'ISSUED'
      `;
      
      if (startDate) {
        query += ' AND DATE(r.register_date) >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND DATE(r.register_date) <= ?';
        params.push(endDate);
      }
      if (storageId) {
        query += ' AND r.storage_id = ?';
        params.push(storageId);
      }

      query += `
        UNION ALL
        SELECT 
          'PRESCRIPTION' as document_type,
          p.prescription_number as document_number,
          p.prescription_date as document_date,
          p.total_value,
          s.name as storage_name,
          s.code as storage_code
        FROM pharmacy_prescriptions p
        JOIN pharmacy_storages s ON p.storage_id = s.id
        WHERE p.status = 'DISPENSED'
      `;
      
      if (startDate) {
        query += ' AND DATE(p.prescription_date) >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND DATE(p.prescription_date) <= ?';
        params.push(endDate);
      }
      if (storageId) {
        query += ' AND p.storage_id = ?';
        params.push(storageId);
      }

      query += ' ORDER BY document_date DESC, document_type';

      const [rows]: any = await pool.execute(query, params);
      
      // Formatează datele pentru export CJAS (simplificat - în producție ar trebui format specific CJAS)
      const exportData = {
        export_date: new Date().toISOString(),
        period: {
          start: startDate || null,
          end: endDate || null
        },
        documents: rows,
        summary: {
          total_documents: rows.length,
          total_value: rows.reduce((sum: number, doc: any) => sum + Number(doc.total_value || 0), 0)
        }
      };

      res.json(exportData);
    } catch (error) {
      console.error('Error exporting CJAS:', error);
      res.status(500).json({ message: 'Eroare la exportul CJAS' });
    }
  },

  // ========== FIȘA MĂRFII ==========
  getProductSheet: async (req: Request, res: Response) => {
    try {
      const { articleId, startDate, endDate } = req.query;
      
      if (!articleId) {
        return res.status(400).json({ message: 'articleId este obligatoriu' });
      }

      // Obține informații despre articol
      const [articles]: any = await pool.execute(`
        SELECT a.*, 
               at.name as article_type_name,
               m.name as manufacturer_name,
               uom.name as unit_of_measure_name
        FROM pharmacy_articles a
        LEFT JOIN pharmacy_article_types at ON a.article_type_id = at.id
        LEFT JOIN pharmacy_manufacturers m ON a.manufacturer_id = m.id
        LEFT JOIN pharmacy_units_of_measure uom ON a.unit_of_measure_id = uom.id
        WHERE a.id = ?
      `, [articleId]);

      if (!articles || articles.length === 0) {
        return res.status(404).json({ message: 'Articolul nu a fost găsit' });
      }

      const article = articles[0];

      // Obține stocul curent pe gestiuni
      const [currentStock]: any = await pool.execute(`
        SELECT s.*, st.name as storage_name, st.code as storage_code
        FROM pharmacy_stock s
        JOIN pharmacy_storages st ON s.storage_id = st.id
        WHERE s.article_id = ? AND s.quantity > 0
        ORDER BY st.name
      `, [articleId]);

      // Obține mișcările de stoc
      let movementsQuery = `
        SELECT sm.*, s.name as storage_name, s.code as storage_code
        FROM pharmacy_stock_movements sm
        JOIN pharmacy_storages s ON sm.storage_id = s.id
        WHERE sm.article_id = ?
      `;
      const params: any[] = [articleId];

      if (startDate) {
        movementsQuery += ' AND DATE(sm.movement_date) >= ?';
        params.push(startDate);
      }
      if (endDate) {
        movementsQuery += ' AND DATE(sm.movement_date) <= ?';
        params.push(endDate);
      }

      movementsQuery += ' ORDER BY sm.movement_date DESC';

      const [movements]: any = await pool.execute(movementsQuery, params);

      // Calculează statistici
      const totalIn = movements
        .filter((m: any) => m.movement_type === 'IN' || m.movement_type === 'TRANSFER_IN')
        .reduce((sum: number, m: any) => sum + Number(m.quantity || 0), 0);
      
      const totalOut = movements
        .filter((m: any) => m.movement_type === 'OUT' || m.movement_type === 'TRANSFER_OUT')
        .reduce((sum: number, m: any) => sum + Number(m.quantity || 0), 0);

      res.json({
        article,
        current_stock: currentStock,
        movements,
        statistics: {
          total_in: totalIn,
          total_out: totalOut,
          net_movement: totalIn - totalOut,
          period: {
            start: startDate || null,
            end: endDate || null
          }
        }
      });
    } catch (error) {
      console.error('Error fetching product sheet:', error);
      res.status(500).json({ message: 'Eroare la încărcarea fișei mărfii' });
    }
  },
};
