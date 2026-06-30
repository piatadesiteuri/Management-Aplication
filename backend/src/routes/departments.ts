import { Router } from 'express';
import { DepartmentController } from '../controllers/DepartmentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Get all departments
router.get('/', authenticate, DepartmentController.getDepartments);

// Get departments for a specific user
router.get('/user/:id', authenticate, DepartmentController.getUserDepartments);

// Get a specific department
router.get('/:id', authenticate, DepartmentController.getDepartment);

// Create a new department (SUPER_ADMIN only)
router.post('/', authenticate, authorize('SUPER_ADMIN'), DepartmentController.createDepartment);

// Update a department (SUPER_ADMIN only)
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), DepartmentController.updateDepartment);

// Delete a department (SUPER_ADMIN only)
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), DepartmentController.deleteDepartment);

export default router; 