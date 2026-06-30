import { Request, Response } from 'express';
import pool from '../config/database';

export const DepartmentController = {
    // Get all departments
    getDepartments: async (req: Request, res: Response) => {
        try {
            const [departments] = await pool.execute(
                'SELECT * FROM departments ORDER BY name'
            );
            res.json(departments);
        } catch (error) {
            console.error('Error fetching departments:', error);
            res.status(500).json({ message: 'Eroare la încărcarea departamentelor' });
        }
    },

    // Get departments for a specific user
    getUserDepartments: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const [departments] = await pool.execute(`
                SELECT d.* 
                FROM departments d
                JOIN department_users du ON d.id = du.department_id
                WHERE du.user_id = ?
                ORDER BY d.name
            `, [id]);
            res.json(departments);
        } catch (error) {
            console.error('Error fetching user departments:', error);
            res.status(500).json({ message: 'Eroare la încărcarea departamentelor utilizatorului' });
        }
    },

    // Get a specific department
    getDepartment: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const [departments] = await pool.execute(
                'SELECT * FROM departments WHERE id = ?',
                [id]
            );
            
            if ((departments as any[]).length === 0) {
                return res.status(404).json({ message: 'Departamentul nu a fost găsit' });
            }
            
            res.json((departments as any[])[0]);
        } catch (error) {
            console.error('Error fetching department:', error);
            res.status(500).json({ message: 'Eroare la încărcarea departamentului' });
        }
    },

    // Create a new department
    createDepartment: async (req: Request, res: Response) => {
        try {
            const { name, description } = req.body;
            
            if (!name) {
                return res.status(400).json({ message: 'Numele departamentului este obligatoriu' });
            }

            const [result] = await pool.execute(
                'INSERT INTO departments (name, description) VALUES (?, ?)',
                [name, description || null]
            );

            const [newDepartment] = await pool.execute(
                'SELECT * FROM departments WHERE id = ?',
                [(result as any).insertId]
            );

            res.status(201).json((newDepartment as any[])[0]);
        } catch (error) {
            console.error('Error creating department:', error);
            res.status(500).json({ message: 'Eroare la crearea departamentului' });
        }
    },

    // Update a department
    updateDepartment: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            if (!name) {
                return res.status(400).json({ message: 'Numele departamentului este obligatoriu' });
            }

            await pool.execute(
                'UPDATE departments SET name = ?, description = ? WHERE id = ?',
                [name, description || null, id]
            );

            const [updatedDepartment] = await pool.execute(
                'SELECT * FROM departments WHERE id = ?',
                [id]
            );

            if ((updatedDepartment as any[]).length === 0) {
                return res.status(404).json({ message: 'Departamentul nu a fost găsit' });
            }

            res.json((updatedDepartment as any[])[0]);
        } catch (error) {
            console.error('Error updating department:', error);
            res.status(500).json({ message: 'Eroare la actualizarea departamentului' });
        }
    },

    // Delete a department
    deleteDepartment: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            
            const [result] = await pool.execute(
                'DELETE FROM departments WHERE id = ?',
                [id]
            );

            if ((result as any).affectedRows === 0) {
                return res.status(404).json({ message: 'Departamentul nu a fost găsit' });
            }

            res.status(204).send();
        } catch (error) {
            console.error('Error deleting department:', error);
            res.status(500).json({ message: 'Eroare la ștergerea departamentului' });
        }
    }
}; 