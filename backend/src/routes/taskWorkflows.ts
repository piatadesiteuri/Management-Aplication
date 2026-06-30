import express from 'express';
import { TaskWorkflowController } from '../controllers/TaskWorkflowController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Toate rutele necesită autentificare
router.use(authenticate);

// Test endpoint
router.get('/test', TaskWorkflowController.testService);

// Template-uri de task-uri
router.get('/templates', TaskWorkflowController.getTaskTemplates);

// Generare task-uri pentru evenimente
router.post('/generate-tasks', TaskWorkflowController.generateTasksForEvent);

// Task-uri pentru evenimente
router.get('/events/:eventId/tasks', TaskWorkflowController.getTasksForEvent);

// Progresul workflow-ului
router.get('/events/:eventId/progress', TaskWorkflowController.getWorkflowProgress);

// Workflow pentru eveniment
router.get('/events/:eventId/workflow', TaskWorkflowController.getWorkflowForEvent);

// Avansare workflow (când un task este completat)
router.post('/tasks/:taskId/advance', TaskWorkflowController.advanceWorkflow);

export default router; 