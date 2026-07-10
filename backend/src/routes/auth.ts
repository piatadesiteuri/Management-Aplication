import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { sign } from 'jsonwebtoken';
import { compare } from 'bcrypt';
import { CustomError } from '../middleware/errorHandler';

const router = Router();

// Validare pentru înregistrare
const registerValidation = [
    body('email').isEmail().withMessage('Email invalid'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Parola trebuie să aibă minim 8 caractere')
        .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Parola trebuie să conțină cel puțin o literă mare, o literă mică, un număr și un caracter special'),
    body('first_name').notEmpty().withMessage('Prenumele este obligatoriu'),
    body('last_name').notEmpty().withMessage('Numele este obligatoriu')
];

interface LoginRequest {
  email: string;
  password: string;
}

// Rute publice
router.post('/register', registerValidation, AuthController.register);
router.post('/login', AuthController.login);
router.put('/profile', authenticate, AuthController.updateProfile);
router.put('/change-password', authenticate, AuthController.changePassword);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post('/verify-email', AuthController.verifyEmail);

// Rute protejate (necesită autentificare)
router.get('/me', authenticate, (req, res) => {
    res.json(req.user);
});
router.get('/roles', authenticate, AuthController.getRoles);
router.get('/permissions', authenticate, AuthController.getCurrentPermissions);
router.get('/permissions/catalog', authenticate, authorize('SUPER_ADMIN'), AuthController.getPermissionCatalog);
router.get('/users', authenticate, AuthController.getUsers);

// Administrare utilizatori (doar SUPER_ADMIN)
router.put('/users/:id', authenticate, authorize('SUPER_ADMIN'), AuthController.updateUserDetails);
router.put('/users/:id/status', authenticate, authorize('SUPER_ADMIN'), AuthController.updateUserStatus);
router.put('/users/:id/roles', authenticate, authorize('SUPER_ADMIN'), AuthController.updateUserRoles);
router.put('/users/:id/departments', authenticate, authorize('SUPER_ADMIN'), AuthController.updateUserDepartments);

// Creare / ștergere utilizatori (doar SUPER_ADMIN)
router.post('/users', authenticate, authorize('SUPER_ADMIN'), (AuthController as any).createUser);
router.delete('/users/:id', authenticate, authorize('SUPER_ADMIN'), (AuthController as any).deleteUser);

// Administrare roluri (doar SUPER_ADMIN)
router.post('/roles', authenticate, authorize('SUPER_ADMIN'), AuthController.createRole);
router.put('/roles/:id', authenticate, authorize('SUPER_ADMIN'), AuthController.updateRole);
router.get('/roles/:id/permissions', authenticate, authorize('SUPER_ADMIN'), AuthController.getRolePermissions);
router.put('/roles/:id/permissions', authenticate, authorize('SUPER_ADMIN'), AuthController.updateRolePermissions);

// Administrare grupuri utilizatori (doar SUPER_ADMIN)
router.get('/user-groups', authenticate, authorize('SUPER_ADMIN'), AuthController.getUserGroups);
router.post('/user-groups', authenticate, authorize('SUPER_ADMIN'), AuthController.createUserGroup);
router.put('/user-groups/:id', authenticate, authorize('SUPER_ADMIN'), AuthController.updateUserGroup);

// Profil utilizator (acces pentru toți utilizatorii autentificați)
router.put('/profile', authenticate, AuthController.updateProfile);
router.put('/profile/password', authenticate, AuthController.changePassword);
router.get('/profile/notification-preferences', authenticate, AuthController.getNotificationPreferences);
router.put('/profile/notification-preferences', authenticate, AuthController.updateNotificationPreferences);

export default router; 