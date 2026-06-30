import pool from '../config/database';
import bcrypt from 'bcryptjs';

export interface IUser {
    id?: number;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    is_active?: boolean;
    is_email_verified?: boolean;
    last_login?: Date;
    roles?: string[];
}

export class User {
    static async findByEmail(email: string): Promise<IUser | null> {
        try {
            const [rows]: any = await pool.query(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    static async create(userData: IUser): Promise<IUser> {
        const { email, password, first_name, last_name } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const [result]: any = await pool.query(
                'INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)',
                [email, hashedPassword, first_name, last_name]
            );

            return { ...userData, id: result.insertId, password: hashedPassword };
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    static async verifyEmail(userId: number): Promise<void> {
        try {
            await pool.query(
                'UPDATE users SET is_email_verified = true WHERE id = ?',
                [userId]
            );
        } catch (error) {
            console.error('Error verifying email:', error);
            throw error;
        }
    }

    static async getUserRoles(userId: number): Promise<string[]> {
        try {
            const [rows]: any = await pool.query(
                `SELECT r.name 
                FROM roles r 
                JOIN user_roles ur ON r.id = ur.role_id 
                WHERE ur.user_id = ?`,
                [userId]
            );
            return rows.map((row: any) => row.name);
        } catch (error) {
            console.error('Error getting user roles:', error);
            throw error;
        }
    }

    static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword);
    }
} 