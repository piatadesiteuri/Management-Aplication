import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db';

export interface VehicleDocument {
  id: number;
  vehicle_id: number;
  document_type: string;
  document_number: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  created_at: string;
  updated_at: string;
}

export class DocumentService {
  private static uploadDir = path.join(__dirname, '../../uploads/documents/vehicles');

  // Configurare multer pentru upload
  static getMulterConfig() {
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        try {
          await fs.mkdir(DocumentService.uploadDir, { recursive: true });
          cb(null, DocumentService.uploadDir);
        } catch (error) {
          cb(error as Error, '');
        }
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    });

    return multer({
      storage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'application/pdf', 
          'image/jpeg', 
          'image/png', 
          'image/gif',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/msword', // .doc
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-excel', // .xls
          'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
          'application/vnd.ms-powerpoint', // .ppt
          'text/plain', // .txt
          'application/rtf', // .rtf
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Tip fișier neacceptat. Acceptăm doar PDF, JPG, PNG, GIF, Word (.doc/.docx), Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx), TXT sau RTF.'));
        }
      },
    });
  }

  // Salvează documentul în baza de date
  static async saveDocument(
    vehicleId: number,
    file: Express.Multer.File,
    metadata: {
      documentType: string;
      documentNumber: string;
      issueDate?: string;
      expiryDate?: string;
      issuingAuthority?: string;
    }
  ): Promise<VehicleDocument> {
    const query = `
      INSERT INTO vehicle_documents (
        vehicle_id, document_type, document_number, file_name, file_path,
        file_size, mime_type, issue_date, expiry_date, issuing_authority,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id
    `;

    const values = [
      vehicleId,
      metadata.documentType,
      metadata.documentNumber,
      file.originalname,
      file.path,
      file.size,
      file.mimetype,
      metadata.issueDate || null,
      metadata.expiryDate || null,
      metadata.issuingAuthority || null,
    ];

    const result = await pool.query(query, values);
    const documentId = result.rows[0].id;

    // Returnează documentul salvat
    return this.getDocumentById(documentId);
  }

  // Obține documentul după ID
  static async getDocumentById(id: number): Promise<VehicleDocument> {
    const query = 'SELECT * FROM vehicle_documents WHERE id = $1';
    const results = await pool.query(query, [id]);
    
    if (results.rows.length === 0) {
      throw new Error('Documentul nu a fost găsit');
    }
    
    return results.rows[0];
  }

  // Obține toate documentele pentru un vehicul
  static async getVehicleDocuments(vehicleId: number): Promise<VehicleDocument[]> {
    const query = `
      SELECT * FROM vehicle_documents 
      WHERE vehicle_id = $1 
      ORDER BY created_at DESC
    `;
    
    const results = await pool.query(query, [vehicleId]);
    return results.rows;
  }

  // Șterge document
  static async deleteDocument(id: number): Promise<void> {
    const document = await this.getDocumentById(id);
    
    // Șterge fișierul de pe disk
    try {
      await fs.unlink(document.file_path);
    } catch (error) {
      console.error('Eroare la ștergerea fișierului:', error);
    }
    
    // Șterge din baza de date
    const query = 'DELETE FROM vehicle_documents WHERE id = $1';
    await pool.query(query, [id]);
  }

  // Obține calea pentru descărcare
  static async getDownloadPath(id: number): Promise<string> {
    const document = await this.getDocumentById(id);
    return document.file_path;
  }

  // Verifică dacă documentul există fizic
  static async documentExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Obține statistici documente
  static async getDocumentStats(vehicleId?: number): Promise<{
    total: number;
    expired: number;
    expiringSoon: number;
    byType: Record<string, number>;
  }> {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN expiry_date < CURDATE() THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiringSoon,
        document_type,
        COUNT(*) as type_count
      FROM vehicle_documents
    `;
    
    const params: any[] = [];
    
    if (vehicleId) {
      query += ' WHERE vehicle_id = ?';
      params.push(vehicleId);
    }
    
    query += ' GROUP BY document_type';
    
    const results = await pool.query(query, params);
    
    const stats = {
      total: 0,
      expired: 0,
      expiringSoon: 0,
      byType: {} as Record<string, number>,
    };
    
    results.rows.forEach((row: any) => {
      stats.total += row.type_count;
      stats.expired += row.expired;
      stats.expiringSoon += row.expiringSoon;
      stats.byType[row.document_type] = row.type_count;
    });
    
    return stats;
  }

  // Migrarea pentru tabelul de documente
  static async createDocumentsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS vehicle_documents (
        id SERIAL PRIMARY KEY,
        vehicle_id INT NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        document_number VARCHAR(100) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        issue_date DATE,
        expiry_date DATE,
        issuing_authority VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      )
    `;
    
    await pool.query(query);
  }
}

export default DocumentService; 