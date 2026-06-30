import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database';
import path from 'path';
import fs from 'fs';
import { ActivityLogService } from '../services/ActivityLogService';

interface Vehicle extends RowDataPacket {
  id: number;
  brand: string;
  model: string;
  registration_number: string;
  year: number;
  status: string;
  category: string;
  fuel_type: string;
  tank_capacity: number;
  current_mileage: number;
  assigned_department_id: number | null;
  observations: string | null;
  created_at: Date;
  updated_at: Date;
}

interface VehicleDocument extends RowDataPacket {
  id: number;
  vehicle_id: number;
  type: string;
  number: string;
  issue_date: string;
  expiry_date: string;
  issuing_authority: string;
  file_path: string;
  created_at: Date;
  updated_at: Date;
}

interface VehicleMaintenance extends RowDataPacket {
  id: number;
  vehicle_id: number;
  date: string;
  type: string;
  description: string;
  cost: number;
  mileage: number;
  performed_by: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  created_at: Date;
  updated_at: Date;
}

interface VehicleFuelRecord extends RowDataPacket {
  id: number;
  vehicle_id: number;
  date: string;
  quantity: number;
  cost: number;
  mileage: number;
  fuel_type: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  location: string;
  driver: string;
  efficiency: number;
  cost_per_km: number;
  created_at: Date;
  updated_at: Date;
}

interface VehicleUsageRecord extends RowDataPacket {
  id: number;
  vehicle_id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  start_mileage: number;
  end_mileage: number;
  purpose: string;
  route: string;
  created_at: Date;
  updated_at: Date;
}

export class VehicleController {
  static async getVehicles(req: Request, res: Response) {
    try {
      console.log('🔍 Fetching all vehicles');
      const [vehicles] = await pool.execute<Vehicle[]>(`
        SELECT * FROM vehicles ORDER BY created_at DESC
      `);
      console.log('✅ Successfully fetched vehicles:', vehicles);
      res.json(vehicles);
    } catch (error: any) {
      console.error('❌ Error fetching vehicles:', error);
      res.status(500).json({ message: 'Eroare la obținerea vehiculelor', error: error.message });
    }
  }

  static async getVehicle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log(`🔍 Fetching vehicle with ID: ${id}`);
      
      const [vehicles] = await pool.execute<Vehicle[]>('SELECT * FROM vehicles WHERE id = ?', [id]);
      
      if (vehicles.length === 0) {
        console.log(`❌ Vehicle with ID ${id} not found`);
        return res.status(404).json({ message: 'Vehiculul nu a fost găsit' });
      }

      console.log('✅ Successfully fetched vehicle:', vehicles[0]);
      res.json(vehicles[0]);
    } catch (error: any) {
      console.error(`❌ Error fetching vehicle ${req.params.id}:`, error);
      res.status(500).json({ message: 'Eroare la obținerea vehiculului', error: error.message });
    }
  }

  static async createVehicle(req: Request, res: Response) {
    try {
      console.log('➕ Creating new vehicle:', req.body);
      const {
        brand,
        model,
        registrationNumber,
        year,
        status = 'AVAILABLE',
        category,
        fuelType,
        tankCapacity,
        currentMileage = 0,
        assignedDepartmentId,
        observations
      } = req.body;

      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO vehicles (
          brand, model, registration_number, year, status, category,
          fuel_type, tank_capacity, current_mileage, assigned_department_id, observations
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          brand,
          model,
          registrationNumber,
          year,
          status,
          category,
          fuelType,
          tankCapacity,
          currentMileage,
          assignedDepartmentId || null,
          observations || null
        ]
      );

      const vehicleId = result.insertId;
      
      // Log activitatea
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
      await ActivityLogService.logVehicleCreated(
        req.user?.id || 1,
        vehicleId,
        brand,
        model,
        ipAddress
      );

      console.log('✅ Successfully created vehicle:', result);
      res.status(201).json({
        id: vehicleId,
        brand,
        model,
        registration_number: registrationNumber,
        year,
        status,
        category,
        fuel_type: fuelType,
        tank_capacity: tankCapacity,
        current_mileage: currentMileage,
        assigned_department_id: assignedDepartmentId || null,
        observations: observations || null
      });
    } catch (error: any) {
      console.error('❌ Error creating vehicle:', error);
      res.status(500).json({ message: 'Eroare la crearea vehiculului', error: error.message });
    }
  }

  static async updateVehicle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log(`📝 Updating vehicle ${id}:`, req.body);
      
      const {
        brand,
        model,
        registrationNumber,
        year,
        status,
        category,
        fuelType,
        tankCapacity,
        currentMileage,
        assignedDepartmentId,
        observations
      } = req.body;

      const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE vehicles SET
          brand = ?,
          model = ?,
          registration_number = ?,
          year = ?,
          status = ?,
          category = ?,
          fuel_type = ?,
          tank_capacity = ?,
          current_mileage = ?,
          assigned_department_id = ?,
          observations = ?
        WHERE id = ?`,
        [
          brand,
          model,
          registrationNumber,
          year,
          status,
          category,
          fuelType,
          tankCapacity,
          currentMileage,
          assignedDepartmentId || null,
          observations || null,
          id
        ]
      );

      if (result.affectedRows === 0) {
        console.log(`❌ Vehicle with ID ${id} not found for update`);
        return res.status(404).json({ message: 'Vehiculul nu a fost găsit' });
      }

      console.log('✅ Successfully updated vehicle:', result);
      res.json({ 
        id: parseInt(id),
        brand,
        model,
        registration_number: registrationNumber,
        year,
        status,
        category,
        fuel_type: fuelType,
        tank_capacity: tankCapacity,
        current_mileage: currentMileage,
        assigned_department_id: assignedDepartmentId || null,
        observations: observations || null
      });
    } catch (error: any) {
      console.error(`❌ Error updating vehicle ${req.params.id}:`, error);
      res.status(500).json({ message: 'Eroare la actualizarea vehiculului', error: error.message });
    }
  }

  static async deleteVehicle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log(`🗑️ Deleting vehicle ${id}`);

      const [result] = await pool.execute<ResultSetHeader>('DELETE FROM vehicles WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        console.log(`❌ Vehicle with ID ${id} not found for deletion`);
        return res.status(404).json({ message: 'Vehiculul nu a fost găsit' });
      }

      console.log('✅ Successfully deleted vehicle:', result);
      res.json({ message: 'Vehiculul a fost șters cu succes' });
    } catch (error: any) {
      console.error(`❌ Error deleting vehicle ${req.params.id}:`, error);
      res.status(500).json({ message: 'Eroare la ștergerea vehiculului', error: error.message });
    }
  }

  // Document methods
  static async getVehicleDocuments(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log(`🔍 Fetching documents for vehicle ${id}`);

      const [documents] = await pool.execute<VehicleDocument[]>(
        'SELECT * FROM vehicle_documents WHERE vehicle_id = ? ORDER BY created_at DESC',
        [id]
      );

      console.log('✅ Successfully fetched vehicle documents:', documents);
      res.json(documents);
    } catch (error: any) {
      console.error(`❌ Error fetching documents for vehicle ${req.params.id}:`, error);
      res.status(500).json({ message: 'Eroare la obținerea documentelor', error: error.message });
    }
  }

  static async createVehicleDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: 'Fișierul este obligatoriu' });
      }

      console.log(`📄 Creating document for vehicle ${id}:`, req.body);
      
      const {
        documentType,
        documentNumber,
        issueDate,
        expiryDate,
        issuingAuthority,
        observations
      } = req.body;

      // Validez că vehiculul există
      const [vehicles] = await pool.execute<Vehicle[]>('SELECT id FROM vehicles WHERE id = ?', [id]);
      if (vehicles.length === 0) {
        // Șterg fișierul dacă vehiculul nu există
        fs.unlinkSync(file.path);
        return res.status(404).json({ message: 'Vehiculul nu a fost găsit' });
      }

      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO vehicle_documents (
          vehicle_id, type, number, issue_date, expiry_date, 
          issuing_authority, file_path, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          id,
          documentType,
          documentNumber,
          issueDate,
          expiryDate,
          issuingAuthority,
          file.path
        ]
      );

      const documentId = result.insertId;
      
      // Obține informațiile despre vehicul pentru logging
      const [vehicleResult] = await pool.execute<Vehicle[]>(
        'SELECT brand, model, registration_number FROM vehicles WHERE id = ?',
        [id]
      );
      const vehicle = vehicleResult[0];
      
      // Log activitatea
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
      await ActivityLogService.createLog({
        user_id: req.user?.id || 1,
        action_type: 'VEHICLE_DOCUMENT_ADDED',
        entity_type: 'VEHICLE',
        entity_id: parseInt(id),
        description: `A încărcat documentul "${documentType}" pentru vehiculul "${vehicle?.brand} ${vehicle?.model}"`,
        details: {
          vehicle_id: parseInt(id),
          vehicle_brand: vehicle?.brand,
          vehicle_model: vehicle?.model,
          document_type: documentType,
          document_number: documentNumber
        },
        ip_address: ipAddress
      });

      const newDocument = {
        id: documentId,
        vehicle_id: parseInt(id),
        type: documentType,
        number: documentNumber,
        issue_date: issueDate,
        expiry_date: expiryDate,
        issuing_authority: issuingAuthority,
        file_path: file.path,
        file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype
      };

      console.log('✅ Successfully created vehicle document:', newDocument);
      res.status(201).json(newDocument);
    } catch (error: any) {
      console.error(`❌ Error creating document for vehicle ${req.params.id}:`, error);
      
      // Șterg fișierul în caz de eroare
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file after failed upload:', unlinkError);
        }
      }
      
      res.status(500).json({ message: 'Eroare la crearea documentului', error: error.message });
    }
  }

  static async downloadVehicleDocument(req: Request, res: Response) {
    try {
      const { documentId } = req.params;
      console.log(`📥 Downloading document ${documentId}`);

      const [documents] = await pool.execute<VehicleDocument[]>(
        'SELECT * FROM vehicle_documents WHERE id = ?',
        [documentId]
      );

      if (documents.length === 0) {
        return res.status(404).json({ message: 'Documentul nu a fost găsit' });
      }

      const document = documents[0];
      const filePath = document.file_path;

      // Verific dacă fișierul există fizic
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Fișierul nu a fost găsit pe server' });
      }

      // Setez headerele pentru download
      const fileName = `${document.type}-${document.number}${path.extname(filePath)}`;
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');

      console.log('✅ Successfully serving document for download');
      res.sendFile(path.resolve(filePath));
    } catch (error: any) {
      console.error(`❌ Error downloading document ${req.params.documentId}:`, error);
      res.status(500).json({ message: 'Eroare la descărcarea documentului', error: error.message });
    }
  }

  static async viewVehicleDocument(req: Request, res: Response) {
    try {
      const { documentId } = req.params;
      console.log(`👁️ [DEBUG] Viewing document ${documentId}`);
      console.log(`👁️ [DEBUG] Request headers:`, req.headers);
      console.log(`👁️ [DEBUG] Request params:`, req.params);

      const [documents] = await pool.execute<VehicleDocument[]>(
        'SELECT * FROM vehicle_documents WHERE id = ?',
        [documentId]
      );

      if (documents.length === 0) {
        return res.status(404).json({ message: 'Documentul nu a fost găsit' });
      }

      const document = documents[0];
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
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      console.log('✅ Successfully serving document for viewing');
      res.sendFile(path.resolve(filePath));
    } catch (error: any) {
      console.error(`❌ Error viewing document ${req.params.documentId}:`, error);
      res.status(500).json({ message: 'Eroare la vizualizarea documentului', error: error.message });
    }
  }

  static async deleteVehicleDocument(req: Request, res: Response) {
    try {
      const { documentId } = req.params;
      console.log(`🗑️ Deleting document ${documentId}`);

      // Obțin informațiile documentului pentru a șterge și fișierul
      const [documents] = await pool.execute<VehicleDocument[]>(
        'SELECT * FROM vehicle_documents WHERE id = ?',
        [documentId]
      );

      if (documents.length === 0) {
        return res.status(404).json({ message: 'Documentul nu a fost găsit' });
      }

      const document = documents[0];

      // Șterg înregistrarea din baza de date
      const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM vehicle_documents WHERE id = ?',
        [documentId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Documentul nu a fost găsit' });
      }

      // Șterg fișierul fizic
      try {
        if (fs.existsSync(document.file_path)) {
          fs.unlinkSync(document.file_path);
          console.log('✅ Successfully deleted physical file');
        }
      } catch (fileError) {
        console.warn('⚠️ Warning: Could not delete physical file:', fileError);
        // Nu opresc procesul dacă nu pot șterge fișierul
      }

      console.log('✅ Successfully deleted vehicle document');
      res.json({ message: 'Documentul a fost șters cu succes' });
    } catch (error: any) {
      console.error(`❌ Error deleting document ${req.params.documentId}:`, error);
      res.status(500).json({ message: 'Eroare la ștergerea documentului', error: error.message });
    }
  }

  // Vehicle History Methods
  static async getVehicleHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log(`📊 Fetching history for vehicle ${id}`);

      // Obțin istoricul de mentenanță
      const [maintenance] = await pool.execute<VehicleMaintenance[]>(
        'SELECT * FROM vehicle_maintenance WHERE vehicle_id = ? ORDER BY date DESC',
        [id]
      );

      // Obțin istoricul de combustibil
      const [fuel] = await pool.execute<VehicleFuelRecord[]>(
        'SELECT * FROM vehicle_fuel_records WHERE vehicle_id = ? ORDER BY date DESC',
        [id]
      );

      // Obțin istoricul de utilizare
      const [usage] = await pool.execute<VehicleUsageRecord[]>(
        'SELECT * FROM vehicle_usage_records WHERE vehicle_id = ? ORDER BY start_date DESC',
        [id]
      );

      const history = {
        maintenance,
        fuel,
        usage
      };

      console.log('✅ Successfully fetched vehicle history:', {
        maintenance: maintenance.length,
        fuel: fuel.length,
        usage: usage.length
      });

      res.json(history);
    } catch (error: any) {
      console.error(`❌ Error fetching history for vehicle ${req.params.id}:`, error);
      res.status(500).json({ message: 'Eroare la obținerea istoricului vehiculului', error: error.message });
    }
  }

  static async addMaintenanceRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log(`🔧 Adding maintenance record for vehicle ${id}:`, req.body);

      const {
        date,
        type,
        description,
        cost = 0,
        mileage = 0,
        performedBy,
        status = 'COMPLETED',
        priority = 'MEDIUM'
      } = req.body;

      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO vehicle_maintenance (
          vehicle_id, date, type, description, cost, mileage, 
          performed_by, status, priority
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, date, type, description, cost, mileage, performedBy, status, priority]
      );

      const newRecord = {
        id: result.insertId,
        vehicle_id: parseInt(id),
        date,
        type,
        description,
        cost,
        mileage,
        performed_by: performedBy,
        status,
        priority
      };

      console.log('✅ Successfully added maintenance record:', newRecord);
      res.status(201).json(newRecord);
    } catch (error: any) {
      console.error(`❌ Error adding maintenance record for vehicle ${req.params.id}:`, error);
      res.status(500).json({ message: 'Eroare la adăugarea înregistrării de mentenanță', error: error.message });
    }
  }

  static async addFuelRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log(`⛽ Adding fuel record for vehicle ${id}:`, req.body);

      const {
        date,
        quantity,
        cost,
        mileage,
        fuelType = 'DIESEL',
        location,
        driver,
        efficiency,
        costPerKm
      } = req.body;

      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO vehicle_fuel_records (
          vehicle_id, date, quantity, cost, mileage, fuel_type,
          location, driver, efficiency, cost_per_km
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, date, quantity, cost, mileage, fuelType, location, driver, efficiency, costPerKm]
      );

      const newRecord = {
        id: result.insertId,
        vehicle_id: parseInt(id),
        date,
        quantity,
        cost,
        mileage,
        fuel_type: fuelType,
        location,
        driver,
        efficiency,
        cost_per_km: costPerKm
      };

      console.log('✅ Successfully added fuel record:', newRecord);
      res.status(201).json(newRecord);
    } catch (error: any) {
      console.error(`❌ Error adding fuel record for vehicle ${req.params.id}:`, error);
      res.status(500).json({ message: 'Eroare la adăugarea înregistrării de combustibil', error: error.message });
    }
  }

  static async addUsageRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log(`🚗 Adding usage record for vehicle ${id}:`, req.body);

      const {
        userId,
        startDate,
        endDate,
        startMileage,
        endMileage,
        purpose,
        route
      } = req.body;

      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO vehicle_usage_records (
          vehicle_id, user_id, start_date, end_date, start_mileage,
          end_mileage, purpose, route
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, userId, startDate, endDate, startMileage, endMileage, purpose, route]
      );

      const newRecord = {
        id: result.insertId,
        vehicle_id: parseInt(id),
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        start_mileage: startMileage,
        end_mileage: endMileage,
        purpose,
        route
      };

      console.log('✅ Successfully added usage record:', newRecord);
      res.status(201).json(newRecord);
    } catch (error: any) {
      console.error(`❌ Error adding usage record for vehicle ${req.params.id}:`, error);
      res.status(500).json({ message: 'Eroare la adăugarea înregistrării de utilizare', error: error.message });
    }
  }
} 