import pool from '../config/database';

export interface ILaboratoryTest {
  id?: number;
  category_id?: number;
  name: string;
  code: string;
  description?: string;
  sample_type: 'SANGE' | 'URINA' | 'FECES' | 'SPUTA' | 'LICHID_CEFALORAHIDIAN' | 'ALTUL';
  preparation_instructions?: string;
  normal_values?: string;
  unit?: string;
  is_active?: boolean;
  requires_special_handling?: boolean;
  estimated_duration_hours?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ITestCategory {
  id?: number;
  name: string;
  code: string;
  description?: string;
  parent_id?: number;
  display_order?: number;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class LaboratoryTest {
  static async findAll(activeOnly: boolean = true): Promise<ILaboratoryTest[]> {
    try {
      const query = activeOnly
        ? 'SELECT * FROM laboratory_tests WHERE is_active = TRUE ORDER BY name'
        : 'SELECT * FROM laboratory_tests ORDER BY name';
      const [rows]: any = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error finding laboratory tests:', error);
      throw error;
    }
  }

  static async findByCategory(categoryId: number, activeOnly: boolean = true): Promise<ILaboratoryTest[]> {
    try {
      const query = activeOnly
        ? 'SELECT * FROM laboratory_tests WHERE category_id = ? AND is_active = TRUE ORDER BY name'
        : 'SELECT * FROM laboratory_tests WHERE category_id = ? ORDER BY name';
      const [rows]: any = await pool.query(query, [categoryId]);
      return rows;
    } catch (error) {
      console.error('Error finding tests by category:', error);
      throw error;
    }
  }

  static async search(query: string, activeOnly: boolean = true): Promise<ILaboratoryTest[]> {
    try {
      const searchTerm = `%${query}%`;
      const sql = activeOnly
        ? `SELECT * FROM laboratory_tests 
           WHERE is_active = TRUE 
           AND (name LIKE ? OR code LIKE ? OR description LIKE ?)
           ORDER BY name`
        : `SELECT * FROM laboratory_tests 
           WHERE name LIKE ? OR code LIKE ? OR description LIKE ?
           ORDER BY name`;
      const [rows]: any = await pool.query(sql, [searchTerm, searchTerm, searchTerm]);
      return rows;
    } catch (error) {
      console.error('Error searching tests:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<ILaboratoryTest | null> {
    try {
      const [rows]: any = await pool.query(
        'SELECT * FROM laboratory_tests WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding test by id:', error);
      throw error;
    }
  }

  static async getCategories(activeOnly: boolean = true): Promise<ITestCategory[]> {
    try {
      const query = activeOnly
        ? 'SELECT * FROM test_categories WHERE is_active = TRUE ORDER BY display_order, name'
        : 'SELECT * FROM test_categories ORDER BY display_order, name';
      const [rows]: any = await pool.query(query);
      return rows;
    } catch (error) {
      console.error('Error finding test categories:', error);
      throw error;
    }
  }
}
