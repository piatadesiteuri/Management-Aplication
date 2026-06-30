import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import pool from '../config/database';
import { getJwtSecret } from '../utils/authConfig';
import { PermissionService } from '../services/PermissionService';

interface JwtPayload {
    userId: number;
    email: string;
    roles: string[];
}

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                roles: string[];
                permissions?: string[];
                is_active: boolean;
                is_email_verified: boolean;
                first_name?: string;
                last_name?: string;
            };
        }
    }
}

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token lipsește' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verify(
            token,
            getJwtSecret()
        ) as JwtPayload;

        // Verificăm utilizatorul și rolurile sale
        const [users] = await pool.execute(`
            SELECT u.*, GROUP_CONCAT(r.name) as roles 
            FROM users u 
            LEFT JOIN user_roles ur ON u.id = ur.user_id 
            LEFT JOIN roles r ON ur.role_id = r.id 
            WHERE u.id = ?
            GROUP BY u.id
        `, [decoded.userId]);

        const user = (users as any[])[0];

        if (!user) {
            return res.status(401).json({ message: 'Utilizator invalid' });
        }

        if (!user.is_active) {
            return res.status(401).json({ message: 'Cont inactiv' });
        }

        // Mapăm rolul ADMIN la SUPER_ADMIN pentru compatibilitate
        let roles: string[] = Array.isArray(user.roles) ? user.roles : [user.roles || user.role];
        if (roles.includes('ADMIN')) {
            roles = roles.map((role: string) => role === 'ADMIN' ? 'SUPER_ADMIN' : role);
        }

        const permissions = await PermissionService.getEffectivePermissionsForUser(user.id);

        req.user = {
            id: user.id,
            email: user.email,
            roles: roles,
            permissions,
            is_active: user.is_active,
            is_email_verified: user.is_email_verified,
            first_name: user.first_name,
            last_name: user.last_name
        };
        next();
    } catch (error) {
        console.error('❌ Authentication error:', error);
        return res.status(401).json({ message: 'Token invalid' });
    }
};

export const authorize = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Neautentificat' });
        }

        // Permite accesul dacă userul are rolul SUPER_ADMIN, indiferent de allowedRoles
        if (req.user.roles.includes('SUPER_ADMIN')) {
            return next();
        }

        const hasAllowedRole = req.user.roles.some(role => allowedRoles.includes(role));
        if (!hasAllowedRole) {
            return res.status(403).json({ message: 'Acces interzis' });
        }

        next();
    };
}; 

export const authorizePermission = (...requiredPermissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Neautentificat' });
        }

        if (req.user.roles.includes('SUPER_ADMIN')) {
            return next();
        }

        const userPermissions = req.user.permissions || [];
        const hasPermission = requiredPermissions.some((permission) => userPermissions.includes(permission));

        if (!hasPermission) {
            return res.status(403).json({ message: 'Nu ai permisiunea necesară pentru această acțiune' });
        }

        next();
    };
};