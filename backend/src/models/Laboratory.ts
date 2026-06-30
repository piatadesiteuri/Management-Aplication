import pool from '../config/database';

export interface ILaboratory {
  id?: number;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface ILaboratoryDoctor {
  id?: number;
  laboratory_id: number;
  user_id: number;
  is_responsible?: boolean;
  specialization?: string;
  created_at?: Date;
}

export class Laboratory {
  static async findAll(activeOnly: boolean = true): Promise<ILaboratory[]> {
    try {
      const query = activeOnly
        ? 'SELECT * FROM laboratories WHERE is_active = TRUE ORDER BY name'
        : 'SELECT * FROM laboratories ORDER BY name';
      const [rows]: any = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error finding laboratories:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<ILaboratory | null> {
    try {
      const [rows]: any = await pool.query(
        'SELECT * FROM laboratories WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding laboratory by id:', error);
      throw error;
    }
  }

  static async findByCode(code: string): Promise<ILaboratory | null> {
    try {
      const [rows]: any = await pool.query(
        'SELECT * FROM laboratories WHERE code = ?',
        [code]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding laboratory by code:', error);
      throw error;
    }
  }

  static async getDoctors(laboratoryId: number): Promise<any[]> {
    try {
      const [rows]: any = await pool.query(
        `SELECT ld.*, u.id as user_id, u.email, u.first_name, u.last_name
         FROM laboratory_doctors ld
         JOIN users u ON ld.user_id = u.id
         WHERE ld.laboratory_id = ? AND u.is_active = TRUE
         ORDER BY ld.is_responsible DESC, u.last_name`,
        [laboratoryId]
      );
      return rows;
    } catch (error) {
      console.error('Error finding laboratory doctors:', error);
      throw error;
    }
  }
}
