import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../models/User';
import EmailService from '../services/EmailService';
import { sign } from 'jsonwebtoken';
import { compare, hash } from 'bcrypt';
import { ActivityLogService } from '../services/ActivityLogService';
import pool from '../config/database';
import { getJwtRefreshSecret, getJwtSecret } from '../utils/authConfig';
import { PermissionService } from '../services/PermissionService';

interface JwtPayload {
    userId: number;
    email: string;
    roles: string[];
}

const generateTokens = (userId: number, email: string, roles: string[]) => {
    const accessToken = sign(
        { userId, email, roles },
        getJwtSecret(),
        { expiresIn: '12h' } // increased session duration from 15m to 12h
    );

    const refreshToken = sign(
        { userId },
        getJwtRefreshSecret(),
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

export const AuthController = {
    register: async (req: Request, res: Response) => {
        try {
            const { email, password, first_name, last_name } = req.body;

            // Validare date de intrare
            if (!email || !password || !first_name || !last_name) {
                return res.status(400).json({
                    success: false,
                    message: 'Toate câmpurile sunt obligatorii'
                });
            }

            // Verifică dacă utilizatorul există deja
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Un cont cu acest email există deja'
                });
            }

            // Creează utilizatorul (parola va fi hash-uită în User.create)
            const hashedPassword = await hash(password, 10);
            const [result]: any = await pool.execute(
                'INSERT INTO users (email, password, first_name, last_name, is_active, is_email_verified) VALUES (?, ?, ?, ?, ?, ?)',
                [email, hashedPassword, first_name, last_name, false, false]
            );

            const userId = result.insertId;

            // Generează token de verificare (cod numeric de 6 cifre)
            const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // Expiră în 24 de ore

            // Salvează token-ul în baza de date
            await pool.execute(
                'INSERT INTO verification_tokens (user_id, token, type, expires_at) VALUES (?, ?, ?, ?)',
                [userId, verificationToken, 'EMAIL_VERIFICATION', expiresAt]
            );

            // Trimite email de verificare
            try {
                await EmailService.sendVerificationEmail(email, verificationToken);
            } catch (emailError) {
                console.error('Error sending verification email:', emailError);
                // Nu returnăm eroare dacă email-ul nu poate fi trimis, dar logăm eroarea
                // Utilizatorul poate cere retrimiterea email-ului mai târziu
            }

            // Log activitatea de înregistrare
            try {
                const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
                const userAgent = req.headers['user-agent'];
                await ActivityLogService.createLog({
                    user_id: userId,
                    action_type: 'USER_REGISTERED',
                    entity_type: 'USER',
                    entity_id: userId,
                    description: `Utilizator înregistrat: ${email}`,
                    ip_address: ipAddress,
                    user_agent: userAgent
                });
            } catch (logError) {
                console.error('Error logging user registration:', logError);
            }

            res.status(201).json({
                success: true,
                message: 'Cont creat cu succes. Vă rugăm să verificați email-ul pentru a activa contul.',
                userId: userId
            });
        } catch (error: any) {
            console.error('Register error:', error);
            
            // Verifică dacă eroarea este din cauza unei încălcări de constraint (email duplicat)
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    success: false,
                    message: 'Un cont cu acest email există deja'
                });
            }

            res.status(500).json({
                success: false,
                message: 'A apărut o eroare la crearea contului'
            });
        }
    },

    verifyEmail: async (req: Request, res: Response) => {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token-ul de verificare este obligatoriu'
                });
            }

            // Găsește token-ul în baza de date
            const [tokens]: any = await pool.execute(
                `SELECT vt.*, u.id as user_id, u.email, u.is_email_verified 
                 FROM verification_tokens vt 
                 JOIN users u ON vt.user_id = u.id 
                 WHERE vt.token = ? AND vt.type = 'EMAIL_VERIFICATION'`,
                [token]
            );

            if (!tokens || tokens.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Token de verificare invalid'
                });
            }

            const verificationToken = tokens[0];

            // Verifică dacă token-ul a expirat
            if (new Date(verificationToken.expires_at) < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Token-ul de verificare a expirat. Vă rugăm să solicitați unul nou.'
                });
            }

            // Verifică dacă email-ul este deja verificat
            if (verificationToken.is_email_verified) {
                return res.status(400).json({
                    success: false,
                    message: 'Email-ul a fost deja verificat'
                });
            }

            // Activează contul utilizatorului
            await pool.execute(
                'UPDATE users SET is_email_verified = true, is_active = true WHERE id = ?',
                [verificationToken.user_id]
            );

            // Șterge token-ul folosit
            await pool.execute(
                'DELETE FROM verification_tokens WHERE id = ?',
                [verificationToken.id]
            );

            // Log activitatea de verificare
            try {
                const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
                const userAgent = req.headers['user-agent'];
                await ActivityLogService.createLog({
                    user_id: verificationToken.user_id,
                    action_type: 'EMAIL_VERIFIED',
                    entity_type: 'USER',
                    entity_id: verificationToken.user_id,
                    description: `Email verificat pentru: ${verificationToken.email}`,
                    ip_address: ipAddress,
                    user_agent: userAgent
                });
            } catch (logError) {
                console.error('Error logging email verification:', logError);
            }

            res.json({
                success: true,
                message: 'Email verificat cu succes. Contul a fost activat.'
            });
        } catch (error) {
            console.error('Verify email error:', error);
            res.status(500).json({
                success: false,
                message: 'A apărut o eroare la verificarea email-ului'
            });
        }
    },

    login: async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email și parola sunt obligatorii'
                });
            }

            // Găsim utilizatorul și rolurile sale
            const [users] = await pool.execute(`
                SELECT u.*, GROUP_CONCAT(r.name) as roles 
                FROM users u 
                LEFT JOIN user_roles ur ON u.id = ur.user_id 
                LEFT JOIN roles r ON ur.role_id = r.id 
                WHERE u.email = ?
                GROUP BY u.id
            `, [email]);

            const user = (users as any[])[0];

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Email sau parolă incorectă'
                });
            }

            if (!user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'Contul nu este activ'
                });
            }

            const isValidPassword = await compare(password, user.password);

            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Email sau parolă incorectă'
                });
            }

            const roles = user.roles ? user.roles.split(',') : [];
            const tokens = generateTokens(user.id, user.email, roles);
            const permissions = await PermissionService.getEffectivePermissionsForUser(user.id);

            // Salvăm refresh token-ul în baza de date
            await pool.execute(
                'UPDATE users SET refresh_token = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [tokens.refreshToken, user.id]
            );

            // Setăm refresh token-ul în cookie
            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 zile
            });

            // Log activitatea de autentificare
            const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
            const userAgent = req.headers['user-agent'];
            try {
                await ActivityLogService.logUserLogin(
                    user.id,
                    user.email,
                    ipAddress,
                    userAgent
                );
            } catch (logError) {
                console.error('❌ Error logging user login:', logError);
            }

            const response = {
                success: true,
                token: tokens.accessToken, // Schimbat din accessToken în token pentru compatibilitate
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    isActive: user.is_active,
                    isEmailVerified: user.is_email_verified,
                    roles,
                    permissions
                }
            };
            res.json(response);
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'A apărut o eroare internă'
            });
        }
    },

    refreshToken: async (req: Request, res: Response) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token lipsește'
                });
            }

            const decoded = jwt.verify(refreshToken, getJwtRefreshSecret()) as { userId?: number };
            if (!decoded?.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token invalid'
                });
            }

            // Găsim utilizatorul și rolurile sale folosind refresh token-ul
            const [users] = await pool.execute(`
                SELECT u.*, GROUP_CONCAT(r.name) as roles 
                FROM users u 
                LEFT JOIN user_roles ur ON u.id = ur.user_id 
                LEFT JOIN roles r ON ur.role_id = r.id 
                WHERE u.refresh_token = ?
                GROUP BY u.id
            `, [refreshToken]);

            const user = (users as any[])[0];

            if (!user || Number(user.id) !== Number(decoded.userId) || !user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token invalid'
                });
            }

            const roles = user.roles ? user.roles.split(',') : [];
            const tokens = generateTokens(user.id, user.email, roles);

            // Actualizăm refresh token-ul în baza de date
            await pool.execute(
                'UPDATE users SET refresh_token = ? WHERE id = ?',
                [tokens.refreshToken, user.id]
            );

            // Setăm noul refresh token în cookie
            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                success: true,
                token: tokens.accessToken // Schimbat din accessToken în token pentru compatibilitate
            });
        } catch (error) {
            console.error('Refresh token error:', error);
            res.status(500).json({
                success: false,
                message: 'A apărut o eroare la reînnoirea token-ului'
            });
        }
    },

    logout: async (req: Request, res: Response) => {
        try {
            // Log activitatea de deconectare ÎNAINTE de a șterge token-ul
            let logoutLogCreated = false;
            if (req.user) {
                const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
                try {
                    await ActivityLogService.logUserLogout(
                        req.user.id,
                        req.user.email,
                        ipAddress
                    );
                    logoutLogCreated = true;
                    
                    // Mică întârziere pentru a permite WebSocket-ului să trimită mesajul
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (logError) {
                    console.error('❌ Error creating logout log:', logError);
                }
            }

            // Șterge refresh token-ul din baza de date
            const refreshToken = req.cookies.refreshToken;
            if (refreshToken) {
                await pool.execute(
                    'UPDATE users SET refresh_token = NULL WHERE refresh_token = ?',
                    [refreshToken]
                );
            }

            // Șterge cookie-ul
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });

            // Trimite răspunsul
            res.json({ 
                success: true, 
                message: 'Deconectat cu succes',
                logoutLogged: logoutLogCreated
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.json({ 
                success: true, 
                message: 'Deconectat cu succes' 
            });
        }
    },

    getRoles: async (req: Request, res: Response) => {
        try {
            const [roles] = await pool.execute('SELECT id, name, description FROM roles ORDER BY name');
            const enrichedRoles = await Promise.all(
                (roles as any[]).map(async (role) => ({
                    ...role,
                    permissions: await PermissionService.getRolePermissions(Number(role.id))
                }))
            );
            res.json(enrichedRoles);
        } catch (error) {
            console.error('Error fetching roles:', error);
            res.status(500).json({ message: 'Eroare la încărcarea rolurilor' });
        }
    },

    getCurrentPermissions: async (req: Request, res: Response) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Neautentificat' });
            }

            const permissions = await PermissionService.getEffectivePermissionsForUser(req.user.id);
            return res.json({
                roles: req.user.roles,
                permissions
            });
        } catch (error) {
            console.error('Error fetching current permissions:', error);
            return res.status(500).json({ message: 'Eroare la încărcarea permisiunilor' });
        }
    },

    getRolePermissions: async (req: Request, res: Response) => {
        try {
            const roleId = Number(req.params.id);
            if (!roleId) {
                return res.status(400).json({ message: 'Rol invalid' });
            }

            const permissions = await PermissionService.getRolePermissions(roleId);
            return res.json({ roleId, permissions });
        } catch (error) {
            console.error('Error fetching role permissions:', error);
            return res.status(500).json({ message: 'Eroare la încărcarea permisiunilor rolului' });
        }
    },

    getPermissionCatalog: async (_req: Request, res: Response) => {
        try {
            const permissions = await PermissionService.getCatalogFromDb();
            return res.json(permissions);
        } catch (error) {
            console.error('Error fetching permission catalog:', error);
            return res.status(500).json({ message: 'Eroare la încărcarea catalogului de permisiuni' });
        }
    },

    updateRolePermissions: async (req: Request, res: Response) => {
        try {
            const roleId = Number(req.params.id);
            const permissionCodes = Array.isArray(req.body?.permissions) ? req.body.permissions : [];

            if (!roleId) {
                return res.status(400).json({ message: 'Rol invalid' });
            }

            await PermissionService.setRolePermissions(roleId, permissionCodes);

            await ActivityLogService.createLog({
                user_id: req.user!.id,
                action_type: 'ROLE_PERMISSIONS_UPDATED',
                entity_type: 'ROLE',
                entity_id: roleId,
                description: `A actualizat permisiunile pentru rolul #${roleId}`,
                details: { permissions: permissionCodes }
            });

            return res.json({
                success: true,
                roleId,
                permissions: await PermissionService.getRolePermissions(roleId)
            });
        } catch (error: any) {
            console.error('Error updating role permissions:', error);
            return res.status(500).json({
                message: error?.message || 'Eroare la actualizarea permisiunilor rolului'
            });
        }
    },

    getUsers: async (req: Request, res: Response) => {
        try {
            const [users] = await pool.execute(`
                SELECT 
                    u.id,
                    u.email,
                    u.first_name as firstName,
                    u.last_name as lastName,
                    u.is_active as isActive,
                    u.is_email_verified as isEmailVerified,
                    u.last_login as lastLogin,
                    u.created_at as createdAt,
                    u.updated_at as updatedAt,
                    GROUP_CONCAT(DISTINCT r.name) as roles,
                    GROUP_CONCAT(DISTINCT d.name) as departments
                FROM users u 
                LEFT JOIN user_roles ur ON u.id = ur.user_id 
                LEFT JOIN roles r ON ur.role_id = r.id 
                LEFT JOIN department_users du ON u.id = du.user_id
                LEFT JOIN departments d ON du.department_id = d.id
                GROUP BY u.id
                ORDER BY u.first_name, u.last_name
            `);
            
            // Procesăm rezultatele pentru a transforma roles din string în array
            const processedUsers = (users as any[]).map(user => ({
                ...user,
                roles: user.roles ? String(user.roles).split(',') : [],
                departments: user.departments ? String(user.departments).split(',') : []
            }));
            
            res.json(processedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ message: 'Eroare la încărcarea utilizatorilor' });
        }
    },

    updateUserStatus: async (req: Request, res: Response) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Neautentificat' });
            }

            const targetUserId = Number(req.params.id);
            const { isActive } = req.body as { isActive?: boolean };

            if (!Number.isFinite(targetUserId)) {
                return res.status(400).json({ message: 'ID utilizator invalid' });
            }
            if (typeof isActive !== 'boolean') {
                return res.status(400).json({ message: 'Câmpul isActive trebuie să fie boolean' });
            }
            // Protecție simplă: nu permite dezactivarea propriului cont
            if (targetUserId === req.user.id && isActive === false) {
                return res.status(400).json({ message: 'Nu îți poți dezactiva propriul cont' });
            }

            // Obțin userul țintă pentru audit + verificare existență
            const [rows] = await pool.execute(
                'SELECT id, email, first_name, last_name, is_active FROM users WHERE id = ?',
                [targetUserId]
            );
            const target = (rows as any[])[0];
            if (!target) {
                return res.status(404).json({ message: 'Utilizatorul nu a fost găsit' });
            }

            await pool.execute('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, targetUserId]);

            // Audit
            const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || undefined;
            await ActivityLogService.createLog({
                user_id: req.user.id,
                action_type: 'USER_STATUS_CHANGED',
                entity_type: 'USER',
                entity_id: targetUserId,
                description: `A ${isActive ? 'activat' : 'dezactivat'} utilizatorul ${target.email}`,
                details: {
                    target_user_id: targetUserId,
                    target_email: target.email,
                    previous_is_active: !!target.is_active,
                    new_is_active: isActive
                },
                ip_address: ipAddress
            });

            return res.json({ success: true });
        } catch (error) {
            console.error('Error updating user status:', error);
            return res.status(500).json({ message: 'Eroare la actualizarea statusului utilizatorului' });
        }
    },

    updateUserRoles: async (req: Request, res: Response) => {
        const conn = await pool.getConnection();
        try {
            if (!req.user) {
                conn.release();
                return res.status(401).json({ message: 'Neautentificat' });
            }

            const targetUserId = Number(req.params.id);
            const { roles } = req.body as { roles?: string[] };

            if (!Number.isFinite(targetUserId)) {
                conn.release();
                return res.status(400).json({ message: 'ID utilizator invalid' });
            }
            if (!Array.isArray(roles) || roles.length === 0 || roles.some(r => typeof r !== 'string' || r.trim() === '')) {
                conn.release();
                return res.status(400).json({ message: 'roles trebuie să fie un array de string-uri (minim 1 rol)' });
            }

            // normalize
            const requestedRoles = Array.from(new Set(roles.map(r => r.trim())));

            // Verific user țintă + roluri curente
            const [userRows] = await conn.execute(
                `SELECT u.id, u.email, GROUP_CONCAT(r.name) as roles
                 FROM users u
                 LEFT JOIN user_roles ur ON u.id = ur.user_id
                 LEFT JOIN roles r ON ur.role_id = r.id
                 WHERE u.id = ?
                 GROUP BY u.id`,
                [targetUserId]
            );
            const target = (userRows as any[])[0];
            if (!target) {
                conn.release();
                return res.status(404).json({ message: 'Utilizatorul nu a fost găsit' });
            }
            const previousRoles = target.roles ? String(target.roles).split(',') : [];

            // Map roluri -> id și validate
            const placeholders = requestedRoles.map(() => '?').join(',');
            const [roleRows] = await conn.execute(
                `SELECT id, name FROM roles WHERE name IN (${placeholders})`,
                requestedRoles
            );
            const found = roleRows as any[];
            if (found.length !== requestedRoles.length) {
                const foundNames = new Set(found.map(r => r.name));
                const missing = requestedRoles.filter(r => !foundNames.has(r));
                conn.release();
                return res.status(400).json({ message: `Roluri invalide: ${missing.join(', ')}` });
            }

            await conn.beginTransaction();

            // șterg rolurile vechi și inserez pe cele noi
            await conn.execute('DELETE FROM user_roles WHERE user_id = ?', [targetUserId]);
            for (const r of found) {
                await conn.execute('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [targetUserId, r.id]);
            }

            await conn.commit();

            // Audit
            const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || undefined;
            await ActivityLogService.createLog({
                user_id: req.user.id,
                action_type: 'USER_ROLES_CHANGED',
                entity_type: 'USER',
                entity_id: targetUserId,
                description: `A modificat rolurile utilizatorului ${target.email}`,
                details: {
                    target_user_id: targetUserId,
                    target_email: target.email,
                    previous_roles: previousRoles,
                    new_roles: requestedRoles
                },
                ip_address: ipAddress
            });

            conn.release();
            return res.json({ success: true, roles: requestedRoles });
        } catch (error) {
            try { await conn.rollback(); } catch {}
            conn.release();
            console.error('Error updating user roles:', error);
            return res.status(500).json({ message: 'Eroare la actualizarea rolurilor utilizatorului' });
        }
    }
    ,

    updateUserDetails: async (req: Request, res: Response) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Neautentificat' });
            }

            const targetUserId = Number(req.params.id);
            if (!Number.isFinite(targetUserId)) {
                return res.status(400).json({ message: 'ID utilizator invalid' });
            }

            const { email, firstName, lastName } = req.body as {
                email?: string;
                firstName?: string;
                lastName?: string;
            };

            // Obțin userul curent pentru audit + verificare existență
            const [rows] = await pool.execute(
                'SELECT id, email, first_name, last_name FROM users WHERE id = ?',
                [targetUserId]
            );
            const existing = (rows as any[])[0];
            if (!existing) {
                return res.status(404).json({ message: 'Utilizatorul nu a fost găsit' });
            }

            const nextEmail = typeof email === 'string' ? email.trim() : existing.email;
            const nextFirstName = typeof firstName === 'string' ? firstName.trim() : existing.first_name;
            const nextLastName = typeof lastName === 'string' ? lastName.trim() : existing.last_name;

            if (!nextEmail) return res.status(400).json({ message: 'Email-ul este obligatoriu' });
            if (!nextFirstName) return res.status(400).json({ message: 'Prenumele este obligatoriu' });
            if (!nextLastName) return res.status(400).json({ message: 'Numele este obligatoriu' });

            await pool.execute(
                'UPDATE users SET email = ?, first_name = ?, last_name = ? WHERE id = ?',
                [nextEmail, nextFirstName, nextLastName, targetUserId]
            );

            const changes: any = {};
            if (existing.email !== nextEmail) changes.email = { from: existing.email, to: nextEmail };
            if (existing.first_name !== nextFirstName) changes.first_name = { from: existing.first_name, to: nextFirstName };
            if (existing.last_name !== nextLastName) changes.last_name = { from: existing.last_name, to: nextLastName };

            const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || undefined;
            await ActivityLogService.createLog({
                user_id: req.user.id,
                action_type: 'USER_UPDATED',
                entity_type: 'USER',
                entity_id: targetUserId,
                description: `A actualizat datele utilizatorului ${nextEmail}`,
                details: {
                    target_user_id: targetUserId,
                    target_email: nextEmail,
                    changes
                },
                ip_address: ipAddress
            });

            return res.json({ success: true });
        } catch (error: any) {
            // Duplicate email
            if (error?.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Acest email este deja folosit de alt utilizator' });
            }
            console.error('Error updating user details:', error);
            return res.status(500).json({ message: 'Eroare la actualizarea utilizatorului' });
        }
    },

    updateUserDepartments: async (req: Request, res: Response) => {
        const conn = await pool.getConnection();
        try {
            if (!req.user) {
                conn.release();
                return res.status(401).json({ message: 'Neautentificat' });
            }

            const targetUserId = Number(req.params.id);
            if (!Number.isFinite(targetUserId)) {
                conn.release();
                return res.status(400).json({ message: 'ID utilizator invalid' });
            }

            const { departmentIds } = req.body as { departmentIds?: number[] };
            if (!Array.isArray(departmentIds) || departmentIds.some((id) => !Number.isFinite(id))) {
                conn.release();
                return res.status(400).json({ message: 'departmentIds trebuie să fie un array de numere' });
            }

            // user existe?
            const [userRows] = await conn.execute('SELECT id, email FROM users WHERE id = ?', [targetUserId]);
            const target = (userRows as any[])[0];
            if (!target) {
                conn.release();
                return res.status(404).json({ message: 'Utilizatorul nu a fost găsit' });
            }

            // departamente curente (pt audit)
            const [prevDeptRows] = await conn.execute(
                `SELECT d.id, d.name
                 FROM departments d
                 JOIN department_users du ON du.department_id = d.id
                 WHERE du.user_id = ?
                 ORDER BY d.name`,
                [targetUserId]
            );
            const previousDepartments = (prevDeptRows as any[]).map((d) => ({ id: d.id, name: d.name }));

            // validate department ids
            if (departmentIds.length > 0) {
                const placeholders = departmentIds.map(() => '?').join(',');
                const [deptRows] = await conn.execute(
                    `SELECT id, name FROM departments WHERE id IN (${placeholders})`,
                    departmentIds
                );
                const found = deptRows as any[];
                if (found.length !== Array.from(new Set(departmentIds)).length) {
                    const foundIds = new Set(found.map((d) => d.id));
                    const missing = Array.from(new Set(departmentIds)).filter((id) => !foundIds.has(id));
                    conn.release();
                    return res.status(400).json({ message: `Departamente invalide: ${missing.join(', ')}` });
                }
            }

            await conn.beginTransaction();
            await conn.execute('DELETE FROM department_users WHERE user_id = ?', [targetUserId]);
            for (const deptId of Array.from(new Set(departmentIds))) {
                await conn.execute('INSERT INTO department_users (department_id, user_id, is_manager) VALUES (?, ?, 0)', [deptId, targetUserId]);
            }
            await conn.commit();

            const [newDeptRows] = await conn.execute(
                `SELECT d.id, d.name
                 FROM departments d
                 JOIN department_users du ON du.department_id = d.id
                 WHERE du.user_id = ?
                 ORDER BY d.name`,
                [targetUserId]
            );
            const newDepartments = (newDeptRows as any[]).map((d) => ({ id: d.id, name: d.name }));

            const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || undefined;
            await ActivityLogService.createLog({
                user_id: req.user.id,
                action_type: 'USER_DEPARTMENTS_CHANGED',
                entity_type: 'USER',
                entity_id: targetUserId,
                description: `A modificat departamentele utilizatorului ${target.email}`,
                details: {
                    target_user_id: targetUserId,
                    target_email: target.email,
                    previous_departments: previousDepartments,
                    new_departments: newDepartments
                },
                ip_address: ipAddress
            });

            conn.release();
            return res.json({ success: true, departments: newDepartments });
        } catch (error) {
            try { await conn.rollback(); } catch {}
            conn.release();
            console.error('Error updating user departments:', error);
            return res.status(500).json({ message: 'Eroare la actualizarea departamentelor utilizatorului' });
        }
    },

    // Creare utilizator (doar SUPER_ADMIN)
    createUser: async (req: Request, res: Response) => {
        const conn = await pool.getConnection();
        try {
            const {
                email,
                password,
                firstName,
                lastName,
                first_name,
                last_name,
                role,
                roles,
                departmentIds,
                isActive,
                isEmailVerified,
                phone
            } = req.body as any;

            const nextEmail = typeof email === 'string' ? email.trim() : '';
            const nextPassword = typeof password === 'string' ? password : '';
            const nextFirstName = typeof firstName === 'string' ? firstName.trim() : (typeof first_name === 'string' ? first_name.trim() : '');
            const nextLastName = typeof lastName === 'string' ? lastName.trim() : (typeof last_name === 'string' ? last_name.trim() : '');

            const requestedRoles: string[] = Array.isArray(roles)
                ? roles
                : typeof role === 'string'
                  ? [role]
                  : [];

            const requestedRoleNames = Array.from(
                new Set(requestedRoles.map((r) => String(r || '').trim()).filter(Boolean))
            );

            const requestedDepartmentIds: number[] = Array.isArray(departmentIds)
                ? departmentIds.map((d: any) => Number(d)).filter((d: number) => Number.isFinite(d))
                : [];

            const active = typeof isActive === 'boolean' ? isActive : true;
            const emailVerified = typeof isEmailVerified === 'boolean' ? isEmailVerified : true;

            if (!nextEmail) return res.status(400).json({ message: 'Email obligatoriu' });
            if (!nextPassword) return res.status(400).json({ message: 'Parola obligatorie' });
            if (!nextFirstName) return res.status(400).json({ message: 'Prenume obligatoriu' });
            if (!nextLastName) return res.status(400).json({ message: 'Nume obligatoriu' });
            if (requestedRoleNames.length === 0) return res.status(400).json({ message: 'Cel puțin un rol este obligatoriu' });
            if (requestedDepartmentIds.length === 0) return res.status(400).json({ message: 'Cel puțin un departament este obligatoriu' });

            // Verificare email unic
            const [existingRows] = await conn.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [nextEmail]);
            if ((existingRows as any[]).length > 0) {
                conn.release();
                return res.status(400).json({ message: 'Un cont cu acest email există deja' });
            }

            // Validate roles
            const rolePlaceholders = requestedRoleNames.map(() => '?').join(',');
            const [roleRows] = await conn.execute(
                `SELECT id, name FROM roles WHERE name IN (${rolePlaceholders})`,
                requestedRoleNames
            );

            const foundRoleRows = roleRows as any[];
            if (foundRoleRows.length !== requestedRoleNames.length) {
                const foundNames = new Set(foundRoleRows.map((r) => r.name));
                const missing = requestedRoleNames.filter((r) => !foundNames.has(r));
                conn.release();
                return res.status(400).json({ message: `Roluri invalide: ${missing.join(', ')}` });
            }

            // Validate departments
            const deptUnique = Array.from(new Set(requestedDepartmentIds));
            const deptPlaceholders = deptUnique.map(() => '?').join(',');
            const [deptRows] = await conn.execute(
                `SELECT id FROM departments WHERE id IN (${deptPlaceholders})`,
                deptUnique
            );
            const foundDeptRows = deptRows as any[];
            if (foundDeptRows.length !== deptUnique.length) {
                const foundIds = new Set(foundDeptRows.map((d) => Number(d.id)));
                const missing = deptUnique.filter((id) => !foundIds.has(id));
                conn.release();
                return res.status(400).json({ message: `Departamente invalide: ${missing.join(', ')}` });
            }

            await conn.beginTransaction();

            const hashedPassword = await hash(nextPassword, 10);
            const [userInsertResult]: any = await conn.execute(
                'INSERT INTO users (email, password, first_name, last_name, is_active, is_email_verified) VALUES (?, ?, ?, ?, ?, ?)',
                [nextEmail, hashedPassword, nextFirstName, nextLastName, active ? 1 : 0, emailVerified ? 1 : 0]
            );

            const targetUserId: number = Number(userInsertResult.insertId);

            // Insert roles
            for (const rName of requestedRoleNames) {
                const r = foundRoleRows.find((x) => x.name === rName);
                if (!r) continue;
                await conn.execute('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [targetUserId, Number(r.id)]);
            }

            // Insert departments
            for (const deptId of deptUnique) {
                await conn.execute(
                    'INSERT INTO department_users (department_id, user_id, is_manager) VALUES (?, ?, 0)',
                    [deptId, targetUserId]
                );
            }

            await conn.commit();

            // Audit
            const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || undefined;
            await ActivityLogService.createLog({
                user_id: req.user!.id,
                action_type: 'USER_CREATED',
                entity_type: 'USER',
                entity_id: targetUserId,
                description: `A creat utilizatorul ${nextEmail}`,
                details: {
                    target_user_id: targetUserId,
                    target_email: nextEmail,
                    roles: requestedRoleNames,
                    department_ids: deptUnique
                },
                ip_address: ipAddress
            });

            conn.release();
            return res.status(201).json({
                success: true,
                user: {
                    id: targetUserId,
                    email: nextEmail,
                    firstName: nextFirstName,
                    lastName: nextLastName,
                    roles: requestedRoleNames,
                    departmentIds: deptUnique
                }
            });
        } catch (error) {
            try { await conn.rollback(); } catch {}
            conn.release();
            console.error('Error creating user:', error);
            return res.status(500).json({ message: 'Eroare la crearea utilizatorului' });
        }
    },

    // Ștergere utilizator (hard delete)
    deleteUser: async (req: Request, res: Response) => {
        const conn = await pool.getConnection();
        try {
            if (!req.user) {
                conn.release();
                return res.status(401).json({ message: 'Neautentificat' });
            }

            const targetUserId = Number(req.params.id);
            if (!Number.isFinite(targetUserId)) {
                conn.release();
                return res.status(400).json({ message: 'ID utilizator invalid' });
            }

            // protecție: nu permite ștergerea/dezactivarea propriului cont
            if (targetUserId === req.user.id) {
                conn.release();
                return res.status(400).json({ message: 'Nu îți poți dezactiva propriul cont' });
            }

            await conn.beginTransaction();

            // Reasignăm referințele istorice care altfel ar bloca sau ar șterge date utile.
            // Păstrăm datele din aplicație, dar eliminăm utilizatorul din tabela users.
            const safeReassignTargets = [
                { table: 'form_templates', column: 'created_by' },
                { table: 'form_instances', column: 'created_by' },
                { table: 'form_comments', column: 'created_by' },
                { table: 'form_archive_links', column: 'linked_by' },
                { table: 'analysis_requests', column: 'created_by' },
                { table: 'registry_entries', column: 'created_by' },
                { table: 'registry_documents', column: 'uploaded_by' },
                { table: 'registry_works', column: 'created_by' },
                { table: 'registry_work_transfers', column: 'created_by' },
                { table: 'patient_message_threads', column: 'created_by' },
                { table: 'patient_messages', column: 'sender_user_id' },
                { table: 'patient_documents', column: 'uploaded_by' },
                { table: 'patient_identity_documents', column: 'uploaded_by' },
                { table: 'event_documents', column: 'uploaded_by' },
                { table: 'event_templates', column: 'created_by' },
                { table: 'document_templates', column: 'created_by' },
                { table: 'document_comments', column: 'user_id' },
                { table: 'transport_events', column: 'created_by' },
                { table: 'tasks', column: 'assigned_to' },
                { table: 'tasks', column: 'assigned_by' },
                { table: 'approval_requests', column: 'requester_id' }
            ];

            for (const target of safeReassignTargets) {
                try {
                    await conn.execute(
                        `UPDATE \`${target.table}\` SET \`${target.column}\` = ? WHERE \`${target.column}\` = ?`,
                        [req.user.id, targetUserId]
                    );
                } catch (reassignError: any) {
                    // Unele tabele pot să nu existe în toate instanțele sau pot avea altă structură.
                    if (!['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR'].includes(reassignError?.code)) {
                        throw reassignError;
                    }
                }
            }

            // Ștergem legăturile temporare / pivot-uri înainte să încercăm să ștergem userul.
            await conn.execute('DELETE FROM user_roles WHERE user_id = ?', [targetUserId]);
            await conn.execute('DELETE FROM department_users WHERE user_id = ?', [targetUserId]);
            await conn.execute('DELETE FROM verification_tokens WHERE user_id = ?', [targetUserId]);

            const [delRes]: any = await conn.execute(
                'DELETE FROM users WHERE id = ?',
                [targetUserId]
            );

            if (delRes.affectedRows === 0) {
                await conn.rollback();
                conn.release();
                return res.status(404).json({ message: 'Utilizatorul nu a fost găsit' });
            }

            const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || undefined;
            await ActivityLogService.createLog({
                user_id: req.user.id,
                action_type: 'USER_DELETED',
                entity_type: 'USER',
                entity_id: targetUserId,
                description: `A șters utilizatorul #${targetUserId} din baza de date`,
                ip_address: ipAddress
            });

            await conn.commit();

            conn.release();
            return res.json({ success: true, deleted: true });
        } catch (error) {
            try { await conn.rollback(); } catch {}
            conn.release();
            console.error('Error deleting user:', error);
            return res.status(409).json({
                message: 'Nu se poate șterge utilizatorul din cauza unor date dependente care nu au putut fi reasignate.'
            });
        }
    },

    // Creare rol nou
    createRole: async (req: Request, res: Response) => {
        try {
            const { name, description, permissions } = req.body;
            if (!name) {
                return res.status(400).json({ message: 'Numele rolului este obligatoriu' });
            }

            const conn = await pool.getConnection();
            await conn.beginTransaction();

            try {
                const [result] = await conn.execute(
                    'INSERT INTO roles (name, description) VALUES (?, ?)',
                    [name.toUpperCase(), description || null]
                );

                const roleId = (result as any).insertId;
                await conn.commit();
                conn.release();

                if (Array.isArray(permissions)) {
                    await PermissionService.setRolePermissions(Number(roleId), permissions);
                }

                await ActivityLogService.createLog({
                    user_id: req.user!.id,
                    action_type: 'ROLE_CREATED',
                    entity_type: 'ROLE',
                    entity_id: roleId,
                    description: `A creat rolul ${name}`,
                    details: { role_name: name, description, permissions }
                });

                return res.json({
                    success: true,
                    role: {
                        id: roleId,
                        name,
                        description,
                        permissions: Array.isArray(permissions) ? permissions : []
                    }
                });
            } catch (error: any) {
                await conn.rollback();
                conn.release();
                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'Rolul există deja' });
                }
                throw error;
            }
        } catch (error) {
            console.error('Error creating role:', error);
            return res.status(500).json({ message: 'Eroare la crearea rolului' });
        }
    },

    // Actualizare rol
    updateRole: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, description, permissions } = req.body;

            const conn = await pool.getConnection();
            await conn.beginTransaction();

            try {
                const [existing] = await conn.execute('SELECT * FROM roles WHERE id = ?', [id]);
                if ((existing as any[]).length === 0) {
                    conn.release();
                    return res.status(404).json({ message: 'Rolul nu a fost găsit' });
                }

                await conn.execute(
                    'UPDATE roles SET name = ?, description = ? WHERE id = ?',
                    [name?.toUpperCase() || (existing as any[])[0].name, description || null, id]
                );

                await conn.commit();
                conn.release();

                if (Array.isArray(permissions)) {
                    await PermissionService.setRolePermissions(Number(id), permissions);
                }

                await ActivityLogService.createLog({
                    user_id: req.user!.id,
                    action_type: 'ROLE_UPDATED',
                    entity_type: 'ROLE',
                    entity_id: Number(id),
                    description: `A actualizat rolul ${name || id}`,
                    details: { role_id: id, name, description, permissions }
                });

                return res.json({
                    success: true,
                    role: {
                        id: Number(id),
                        name: name?.toUpperCase() || (existing as any[])[0].name,
                        description: description ?? (existing as any[])[0].description ?? null,
                        permissions: Array.isArray(permissions)
                            ? permissions
                            : await PermissionService.getRolePermissions(Number(id))
                    }
                });
            } catch (error: any) {
                await conn.rollback();
                conn.release();
                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'Numele rolului există deja' });
                }
                throw error;
            }
        } catch (error) {
            console.error('Error updating role:', error);
            return res.status(500).json({ message: 'Eroare la actualizarea rolului' });
        }
    },

    // Obține grupuri utilizatori (folosim departamentele ca grupuri)
    getUserGroups: async (req: Request, res: Response) => {
        try {
            const [groups] = await pool.execute(`
                SELECT 
                    d.id,
                    d.name,
                    d.description,
                    COUNT(DISTINCT du.user_id) as user_count
                FROM departments d
                LEFT JOIN department_users du ON d.id = du.department_id
                GROUP BY d.id
                ORDER BY d.name
            `);
            res.json(groups);
        } catch (error) {
            console.error('Error fetching user groups:', error);
            res.status(500).json({ message: 'Eroare la încărcarea grupurilor' });
        }
    },

    // Creare grup utilizatori (departament)
    createUserGroup: async (req: Request, res: Response) => {
        try {
            const { name, description } = req.body;
            if (!name) {
                return res.status(400).json({ message: 'Numele grupului este obligatoriu' });
            }

            const conn = await pool.getConnection();
            await conn.beginTransaction();

            try {
                const [result] = await conn.execute(
                    'INSERT INTO departments (name, description) VALUES (?, ?)',
                    [name, description || null]
                );

                const groupId = (result as any).insertId;
                await conn.commit();
                conn.release();

                await ActivityLogService.createLog({
                    user_id: req.user!.id,
                    action_type: 'USER_GROUP_CREATED',
                    entity_type: 'DEPARTMENT',
                    entity_id: groupId,
                    description: `A creat grupul ${name}`,
                    details: { group_name: name, description }
                });

                return res.json({ success: true, group: { id: groupId, name, description } });
            } catch (error: any) {
                await conn.rollback();
                conn.release();
                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'Grupul există deja' });
                }
                throw error;
            }
        } catch (error) {
            console.error('Error creating user group:', error);
            return res.status(500).json({ message: 'Eroare la crearea grupului' });
        }
    },

    // Actualizare grup utilizatori
    updateUserGroup: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            const conn = await pool.getConnection();
            await conn.beginTransaction();

            try {
                const [existing] = await conn.execute('SELECT * FROM departments WHERE id = ?', [id]);
                if ((existing as any[]).length === 0) {
                    conn.release();
                    return res.status(404).json({ message: 'Grupul nu a fost găsit' });
                }

                await conn.execute(
                    'UPDATE departments SET name = ?, description = ? WHERE id = ?',
                    [name, description || null, id]
                );

                await conn.commit();
                conn.release();

                await ActivityLogService.createLog({
                    user_id: req.user!.id,
                    action_type: 'USER_GROUP_UPDATED',
                    entity_type: 'DEPARTMENT',
                    entity_id: Number(id),
                    description: `A actualizat grupul ${name || id}`,
                    details: { group_id: id, name, description }
                });

                return res.json({ success: true });
            } catch (error: any) {
                await conn.rollback();
                conn.release();
                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'Numele grupului există deja' });
                }
                throw error;
            }
        } catch (error) {
            console.error('Error updating user group:', error);
            return res.status(500).json({ message: 'Eroare la actualizarea grupului' });
        }
    },

    // Actualizare profil utilizator (date personale)
    updateProfile: async (req: Request, res: Response) => {
        try {
            const userId = req.user!.id;
            const { firstName, lastName, email } = req.body;

            const conn = await pool.getConnection();
            await conn.beginTransaction();

            try {
                await conn.execute(
                    'UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?',
                    [firstName, lastName, email, userId]
                );

                await conn.commit();
                conn.release();

                return res.json({ success: true, message: 'Profil actualizat cu succes' });
            } catch (error: any) {
                await conn.rollback();
                conn.release();
                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ message: 'Email-ul există deja' });
                }
                throw error;
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            return res.status(500).json({ message: 'Eroare la actualizarea profilului' });
        }
    },

    // Schimbare parolă utilizator
    changePassword: async (req: Request, res: Response) => {
        try {
            const userId = req.user!.id;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: 'Parola curentă și noua parolă sunt obligatorii' });
            }

            const conn = await pool.getConnection();

            try {
                const [users] = await conn.execute('SELECT password FROM users WHERE id = ?', [userId]);
                const user = (users as any[])[0];

                if (!user) {
                    conn.release();
                    return res.status(404).json({ message: 'Utilizatorul nu a fost găsit' });
                }

                const isMatch = await compare(currentPassword, user.password);
                if (!isMatch) {
                    conn.release();
                    return res.status(400).json({ message: 'Parola curentă este incorectă' });
                }

                const bcrypt = require('bcrypt');
                const hashedPassword = await bcrypt.hash(newPassword, 10);

                await conn.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
                conn.release();

                await ActivityLogService.createLog({
                    user_id: userId,
                    action_type: 'PASSWORD_CHANGED',
                    entity_type: 'USER',
                    entity_id: userId,
                    description: 'A schimbat parola',
                });

                return res.json({ success: true, message: 'Parola a fost schimbată cu succes' });
            } catch (error) {
                conn.release();
                throw error;
            }
        } catch (error) {
            console.error('Error changing password:', error);
            return res.status(500).json({ message: 'Eroare la schimbarea parolei' });
        }
    },

    // Obține preferințe notificări utilizator (mock pentru moment)
    getNotificationPreferences: async (req: Request, res: Response) => {
        try {
            const userId = req.user!.id;
            // Pentru moment returnăm preferințe default
            // În viitor putem crea o tabelă user_notification_preferences
            res.json({
                emailNotifications: true,
                smsNotifications: false,
                notifyOnSystemErrors: true,
                notifyOnUserActions: false,
            });
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
            res.status(500).json({ message: 'Eroare la încărcarea preferințelor' });
        }
    },

    // Actualizare preferințe notificări
    updateNotificationPreferences: async (req: Request, res: Response) => {
        try {
            const userId = req.user!.id;
            const { emailNotifications, smsNotifications, notifyOnSystemErrors, notifyOnUserActions } = req.body;

            // Pentru moment doar returnăm succes
            // În viitor putem salva în user_notification_preferences
            return res.json({ success: true, message: 'Preferințele au fost actualizate' });
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            return res.status(500).json({ message: 'Eroare la actualizarea preferințelor' });
        }
    }
}; 