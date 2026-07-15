import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import authRoutes from './routes/auth';
import calendarRoutes from './routes/calendar';
import departmentRoutes from './routes/departments';
import supplyRoutes from './routes/supply';
import eventSupplyRoutes from './routes/eventSupply';
import eventStockRoutes from './routes/eventStock';
import autoOrderRoutes from './routes/autoOrder';
import vehicleRoutes from './routes/vehicles';
import reportsRoutes from './routes/reports';
import approvalWorkflowRoutes from './routes/approvalWorkflow';
import documentsRoutes from './routes/documents';
import notificationsRoutes from './routes/notifications';
import alertsRoutes from './routes/alerts';
import activityLogsRoutes from './routes/activityLogs';
import tasksRoutes from './routes/tasks';
import taskWorkflowsRoutes from './routes/taskWorkflows';
import kpiRoutes from './routes/kpis';
import automatedReportsRoutes from './routes/automatedReports';
import stockRoutes from './routes/stock';
import fuelConsumptionRoutes from './routes/fuelConsumption';
import dailyActivityRoutes from './routes/dailyActivity';
import materialRequestRoutes from './routes/materialRequests';
import traceabilityRoutes from './routes/traceability';
import registryRoutes from './routes/registry';
import workflowEngineRoutes from './routes/workflowEngine';
import patientsRoutes from './routes/patients';
import portalRoutes from './routes/portal';
import dashboardRoutes from './routes/dashboard';
import electronicFormsRoutes from './routes/electronicForms';
import interoperabilityRoutes from './routes/interoperability';
import budgetRoutes from './routes/budget';
import limsRoutes from './routes/lims';
import pharmacyRoutes from './routes/pharmacy';
import { errorHandler } from './middleware/errorHandler';
import { RuleEngineService } from './services/RuleEngineService';
import { AlertSchedulerService } from './services/AlertSchedulerService';
import { TaskSchedulerService } from './services/TaskSchedulerService';

config();

const app: Express = express();
// Default-uri pentru instanța Brașov (evită conflict cu alte proiecte)
const port = process.env.PORT || 3100;
const frontendPort = process.env.FRONTEND_PORT || '5174';

const configuredOrigins = (process.env.FRONTEND_URL || `http://localhost:${frontendPort}`)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isDevOriginAllowed = (origin: string) => {
  if (process.env.NODE_ENV === 'production') return false;
  return new RegExp(
    `^https?:\\/\\/(localhost|127\\.0\\.0\\.1|192\\.168\\.\\d+\\.\\d+|10\\.\\d+\\.\\d+\\.\\d+|172\\.(1[6-9]|2\\d|3[0-1])\\.\\d+\\.\\d+):${frontendPort}$`
  ).test(origin);
};

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || configuredOrigins.includes(origin) || isDevOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware pentru a seta charset UTF-8 pentru toate răspunsurile JSON
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function(body: any) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson(body);
  };
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/supply', supplyRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/approval-workflow', approvalWorkflowRoutes);
app.use('/api/event-supply', eventSupplyRoutes);
app.use('/api/auto-order', autoOrderRoutes);
app.use('/api/event-stock', eventStockRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/activity-logs', activityLogsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/task-workflows', taskWorkflowsRoutes);
app.use('/api/kpis', kpiRoutes);
app.use('/api/automated-reports', automatedReportsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/fuel-consumption', fuelConsumptionRoutes);
app.use('/api/material-requests', materialRequestRoutes);
app.use('/api/traceability', traceabilityRoutes);
app.use('/api/registry', registryRoutes);
app.use('/api/workflow-engine', workflowEngineRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/electronic-forms', electronicFormsRoutes);
app.use('/api/interoperability', interoperabilityRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/lims', limsRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
console.log('🔧 Registering daily activity routes...');
app.use('/api/daily-activity', dailyActivityRoutes);
console.log('✅ Daily activity routes registered');

// Error handling
app.use(errorHandler);

// --- WebSocket setup ---
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/api/ws' });

// Map userId -> ws connection
const wsClients = new Map();

wss.on('connection', (ws: WebSocket & { userId?: string | number }, req: http.IncomingMessage) => {
  // Așteptăm ca frontendul să trimită userId după conectare
  ws.on('message', (msg: string) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'auth' && data.userId) {
        ws.userId = data.userId;
        wsClients.set(data.userId, ws);
      }
    } catch {}
  });
  ws.on('close', () => {
    if (ws.userId) wsClients.delete(ws.userId);
  });
});

// Funcție globală pentru a trimite notificări
export function sendNotification(userId: string | number, notification: any) {
  // Validare notificare înainte de trimitere
  if (!notification || typeof notification !== 'object') {
    console.warn('🚫 Invalid notification object for user', userId, ':', notification);
    return;
  }
  
  if (!notification.message || typeof notification.message !== 'string' || notification.message.trim() === '') {
    console.warn('🚫 Notification without valid message for user', userId, ':', notification);
    return;
  }
  
  const validatedNotification = {
    ...notification,
    message: notification.message.trim(),
    type: notification.type || 'notification',
    timestamp: new Date().toISOString()
  };
  
  const ws = wsClients.get(userId);
  if (ws && ws.readyState === 1) {
    try {
      ws.send(JSON.stringify(validatedNotification));
      console.log('📡 Sent notification to user', userId, ':', validatedNotification.message);
    } catch (error) {
      console.error('❌ Error sending notification to user', userId, ':', error);
    }
  } else {
    console.warn('🚫 No WebSocket connection for user', userId);
  }
}

// Funcție globală pentru a trimite notificări de activitate
export function broadcastActivityLog(log: any) {
  // Validare log înainte de broadcast
  if (!log || typeof log !== 'object') {
    console.warn('🚫 Invalid log object for broadcast:', log);
    return;
  }
  
  if (!log.description || typeof log.description !== 'string' || log.description.trim() === '') {
    console.warn('🚫 Activity log without valid description:', log);
    return;
  }
  
  // Filtrează activity logs care nu ar trebui să fie broadcast ca notificări
  const excludedActionTypes = [
    'LOGIN',
    'LOGOUT', 
    'PASSWORD_CHANGE',
    'PROFILE_UPDATE',
    'VIEW_PAGE',
    'CLICK_BUTTON',
    'LOAD_DATA',
    'SEARCH',
    'FILTER',
    'SORT',
    'PAGE_VISIT',
    'SESSION_START',
    'SESSION_END'
  ];
  
  if (log.action_type && excludedActionTypes.includes(log.action_type)) {
    console.log('📋 Activity log NOT broadcasted (excluded type):', log.action_type, '-', log.description);
    return;
  }
  
  // Doar pentru activity logs importante care ar trebui să fie notificări
  const notificationWorthyTypes = [
    'ASSIGNMENT_CREATED',
    'ASSIGNMENT_DELETED',
    'ALERT_CREATED', 
    'NOTIFICATION_SENT',
    'EVENT_ASSIGNED',
    'EVENT_UNASSIGNED',
    'REPORT_GENERATED',
    'DOCUMENT_UPLOADED',
    'APPROVAL_REQUIRED',
    'STATUS_CHANGED'
  ];
  
  if (log.action_type && !notificationWorthyTypes.includes(log.action_type)) {
    console.log('📋 Activity log NOT broadcasted (not notification worthy):', log.action_type);
    return;
  }
  
  const validatedLog = {
    ...log,
    description: log.description.trim(),
    created_at: log.created_at || new Date().toISOString()
  };
  
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      try {
        client.send(JSON.stringify({
          type: 'activity_log',
          data: validatedLog
        }));
        console.log('📡 Broadcasted important activity log:', validatedLog.action_type, '-', validatedLog.description);
      } catch (error) {
        console.error('❌ Error broadcasting to client:', error);
      }
    }
  });
}

// Inițializez serviciile la pornirea aplicației
async function initializeServices() {
  try {
    console.log('🚀 Inițializez serviciile...');
    
    // Inițializez Rule Engine
    const ruleEngine = RuleEngineService.getInstance();
    ruleEngine.startRuleEngine();
    
    // Inițializez Alert Scheduler
    const alertScheduler = AlertSchedulerService.getInstance();
    await alertScheduler.startScheduler();
    
    // Inițializez Cron Jobs pentru rapoarte automate
    await TaskSchedulerService.getInstance().initialize();    
    console.log('✅ Toate serviciile au fost inițializate cu succes');
  } catch (error) {
    console.error('❌ Eroare la inițializarea serviciilor:', error);
  }
}

// Pornește serverul (0.0.0.0 = accesibil și pe IP din rețea, nu doar localhost)
server.listen(Number(port), '0.0.0.0', async () => {
  console.log(`🚀 Serverul rulează pe portul ${port}`);
  console.log(`   Local:   http://localhost:${port}`);
  console.log(`   Rețea:   http://<IP-ul-tău>:${port}`);
  await initializeServices();
});