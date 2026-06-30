import express from 'express';
import { TaskController } from '../controllers/TaskController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Test database connection (no authentication required)
router.get('/test-connection', TaskController.testConnection);

// Toate rutele necesită autentificare
router.use(authenticate);

// Rute pentru task-uri
router.get('/', TaskController.getAllTasks);
router.get('/stats', TaskController.getTaskStats);
router.get('/my-tasks', TaskController.getMyTasks);
router.get('/created-by-me', TaskController.getTasksCreatedByMe);

router.post('/', TaskController.createTask);

router.get('/:id', TaskController.getTaskById);
router.put('/:id', TaskController.updateTask);
router.delete('/:id', TaskController.deleteTask);

// Acțiuni speciale pentru task-uri
router.post('/:id/start', TaskController.startTask);
router.post('/:id/complete', TaskController.completeTask);
router.post('/:id/cancel', TaskController.cancelTask);

// Comentarii pentru task-uri
router.get('/:id/comments', TaskController.getTaskComments);
router.post('/:id/comments', TaskController.addTaskComment);

// Istoric pentru task-uri
router.get('/:id/history', TaskController.getTaskHistory);

export default router; 