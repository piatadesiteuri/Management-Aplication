import pool from '../config/database';

export interface IAnalysisRequest {
  id?: number;
  request_number?: string; // Opțional pentru că este generat automat
  patient_id: number;
  laboratory_id: number;
  responsible_doctor_id?: number;
  referring_doctor_id?: number;
  diagnosis?: string;
  observations?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'CANCELLED';
  reception_type: 'WITH_RECEPTION' | 'WITH_LABELING' | 'WITHOUT_RECEPTION';
  reception_date?: Date;
  labeling_date?: Date;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IAnalysisRequestTest {
  id?: number;
  request_id: number;
  test_id: number;
  priority: 'NORMAL' | 'URGENT' | 'STAT';
  notes?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  result_value?: string;
  result_unit?: string;
  result_interpretation?: string;
  completed_at?: Date;
  completed_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

export class AnalysisRequest {
  static async generateRequestNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const [rows]: any = await pool.query(
      `SELECT COUNT(*) as count FROM analysis_requests 
       WHERE request_number LIKE ? AND YEAR(created_at) = ?`,
      [`CER-${year}-%`, year]
    );
    const nextNumber = (rows[0].count || 0) + 1;
    return `CER-${year}-${String(nextNumber).padStart(6, '0')}`;
  }

  static async create(requestData: IAnalysisRequest, testIds: number[]): Promise<IAnalysisRequest> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Generează numărul cererii
      const requestNumber = await this.generateRequestNumber();

      // Creează cererea
      const [result]: any = await connection.query(
        `INSERT INTO analysis_requests 
         (request_number, patient_id, laboratory_id, responsible_doctor_id, referring_doctor_id,
          diagnosis, observations, status, reception_type, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          requestNumber,
          requestData.patient_id,
          requestData.laboratory_id,
          requestData.responsible_doctor_id || null,
          requestData.referring_doctor_id || null,
          requestData.diagnosis || null,
          requestData.observations || null,
          requestData.status || 'DRAFT',
          requestData.reception_type || 'WITHOUT_RECEPTION',
          requestData.created_by
        ]
      );

      const requestId = result.insertId;

      // Adaugă testele
      if (testIds && testIds.length > 0) {
        const testValues = testIds.map(testId => [requestId, testId, 'NORMAL', 'PENDING']);
        await connection.query(
          `INSERT INTO analysis_request_tests (request_id, test_id, priority, status) VALUES ?`,
          [testValues]
        );
      }

      await connection.commit();

      // Returnează cererea creată
      const [created]: any = await connection.query(
        'SELECT * FROM analysis_requests WHERE id = ?',
        [requestId]
      );

      return created[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findAll(filters?: {
    patient_id?: number;
    laboratory_id?: number;
    status?: string;
    reception_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      let query = `
        SELECT 
          ar.*,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.identity_number as patient_identity,
          l.name as laboratory_name,
          l.code as laboratory_code,
          u1.first_name as created_by_first_name,
          u1.last_name as created_by_last_name,
          COUNT(art.id) as test_count
        FROM analysis_requests ar
        LEFT JOIN patients p ON ar.patient_id = p.id
        LEFT JOIN laboratories l ON ar.laboratory_id = l.id
        LEFT JOIN users u1 ON ar.created_by = u1.id
        LEFT JOIN analysis_request_tests art ON ar.id = art.request_id
      `;

      const conditions: string[] = [];
      const params: any[] = [];

      if (filters?.patient_id) {
        conditions.push('ar.patient_id = ?');
        params.push(filters.patient_id);
      }
      if (filters?.laboratory_id) {
        conditions.push('ar.laboratory_id = ?');
        params.push(filters.laboratory_id);
      }
      if (filters?.status) {
        conditions.push('ar.status = ?');
        params.push(filters.status);
      }
      if (filters?.reception_type) {
        conditions.push('ar.reception_type = ?');
        params.push(filters.reception_type);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' GROUP BY ar.id ORDER BY ar.created_at DESC';

      if (filters?.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
        if (filters?.offset) {
          query += ' OFFSET ?';
          params.push(filters.offset);
        }
      }

      const [rows]: any = await pool.query(query, params);
      
      // Adaugă informații despre categorii pentru fiecare test
      for (const row of rows) {
        if (row.test_count > 0) {
          // Obține detaliile testelor pentru această cerere
          const [testDetails]: any = await pool.query(
            `            SELECT 
              art.*,
              art.result_pdf_path as result_pdf_path,
              art.result_pdf_filename as result_pdf_filename,
              lt.name as test_name,
              lt.code as test_code,
              lt.description as test_description,
              lt.sample_type,
              lt.unit as test_unit,
              lt.normal_values as test_normal_values,
              lt.estimated_duration_hours as test_duration,
              tc.name as category_name
            FROM analysis_request_tests art
            JOIN laboratory_tests lt ON art.test_id = lt.id
            LEFT JOIN test_categories tc ON lt.category_id = tc.id
            WHERE art.request_id = ?
            ORDER BY art.id`,
            [row.id]
          );
          row.tests = testDetails;
        }
      }
      
      return rows;
    } catch (error) {
      console.error('Error finding analysis requests:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<any | null> {
    try {
      const [rows]: any = await pool.query(
        `SELECT 
          ar.*,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.identity_number as patient_identity,
          p.date_of_birth as patient_date_of_birth,
          p.gender as patient_gender,
          l.name as laboratory_name,
          l.code as laboratory_code,
          u1.first_name as created_by_first_name,
          u1.last_name as created_by_last_name
        FROM analysis_requests ar
        LEFT JOIN patients p ON ar.patient_id = p.id
        LEFT JOIN laboratories l ON ar.laboratory_id = l.id
        LEFT JOIN users u1 ON ar.created_by = u1.id
        WHERE ar.id = ?`,
        [id]
      );

      if (!rows[0]) return null;

      // Obține testele asociate
      const [tests]: any = await pool.query(
        `SELECT 
          art.*,
          art.result_pdf_path as result_pdf_path,
          art.result_pdf_filename as result_pdf_filename,
          lt.name as test_name,
          lt.code as test_code,
          lt.description as test_description,
          lt.sample_type,
          lt.unit as test_unit,
          lt.normal_values as test_normal_values,
          lt.estimated_duration_hours as test_duration
        FROM analysis_request_tests art
        JOIN laboratory_tests lt ON art.test_id = lt.id
        WHERE art.request_id = ?
        ORDER BY art.id`,
        [id]
      );

      return {
        ...rows[0],
        tests
      };
    } catch (error) {
      console.error('Error finding analysis request by id:', error);
      throw error;
    }
  }

  static async updateStatus(id: number, status: string, userId?: number): Promise<void> {
    try {
      const updates: any[] = ['status = ?'];
      const params: any[] = [status];

      if (status === 'RECEIVED') {
        updates.push('reception_date = NOW()');
      }

      if (userId) {
        updates.push('updated_at = NOW()');
      }

      await pool.query(
        `UPDATE analysis_requests SET ${updates.join(', ')} WHERE id = ?`,
        [...params, id]
      );
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }
}
