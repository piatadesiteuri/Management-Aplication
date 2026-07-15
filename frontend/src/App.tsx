import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerification from './components/auth/EmailVerification';
import Dashboard from './components/Dashboard';
import Calendar from './components/calendar/Calendar';
import Layout from './components/Layout';
import UserLayout from './layouts/UserLayout';
import SupplierList from './components/supply/SupplierList';
import ProductList from './components/supply/ProductList';
import InventoryList from './components/supply/InventoryList';
import VehicleList from './components/vehicles/VehicleList';
import TestVehicles from './pages/TestVehicles';
import TestSuppliers from './pages/TestSuppliers';
import TestProducts from './pages/TestProducts';
import TestInventory from './pages/TestInventory';
import TestUsers from './pages/TestUsers';
import TestSettings from './pages/TestSettings';
import TestReports from './pages/TestReports';
import UserManagement from './components/admin/UserManagement';
import SystemSettings from './components/admin/SystemSettings';
import ReportsManagement from './components/reports/ReportsManagement';
import UserDashboard from './pages/UserDashboard';
import UserProfile from './pages/UserProfile';
import BusinessIntelligencePage from './pages/BusinessIntelligencePage';
import DocumentsPage from './pages/DocumentsPage';
import TasksPageNew from './pages/TasksPageNew';
import UserReports from './pages/UserReports';
import AlertsPage from './pages/AlertsPage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import AutomatedReportsPage from './pages/AutomatedReportsPage';
import CronJobsTestPage from './pages/CronJobsTestPage';
import NotificationsPage from './pages/NotificationsPage';
import StockAuditPage from './pages/StockAuditPage';
import MaterialRequestsPage from './pages/MaterialRequestsPage';
import TraceabilityPage from './pages/TraceabilityPage';
import RegistryPage from './pages/RegistryPage';
import PatientsPage from './pages/PatientsPage';
import AnalysisRequestsPage from './pages/AnalysisRequestsPage';
import LaboratoryTestsPage from './pages/LaboratoryTestsPage';
import PatientPortalPage from './pages/PatientPortalPage';
import ElectronicFormsPage from './pages/ElectronicFormsPage';
import PharmacyLabImagingPage from './pages/PharmacyLabImagingPage';
import PharmacyPage from './pages/PharmacyPage';
import InteroperabilityPage from './pages/InteroperabilityPage';
import PersonalDataAccessReportPage from './pages/PersonalDataAccessReportPage';
import BudgetExecutionPage from './pages/BudgetExecutionPage';
import { useAuth } from './hooks/useAuth';
import { ADMIN_ENTRY_ROLES } from './config/permissions';

// Removed unused ProtectedRoute function

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user || !user.roles.some(role => ADMIN_ENTRY_ROLES.includes(role))) {
    return <Navigate to="/user/dashboard" />;
  }

  return <>{children}</>;
}

function UserRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function PermissionRoute({
  children,
  requiredPermissions,
  fallbackTo,
}: {
  children: React.ReactNode;
  requiredPermissions: string[];
  fallbackTo: string;
}) {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredPermissions.length > 0 && !requiredPermissions.some((permission) => hasPermission(permission))) {
    return <Navigate to={fallbackTo} replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          
          {/* Rute de test pentru dezvoltare */}
          <Route path="/test/vehicles" element={<TestVehicles />} />
          <Route path="/test/suppliers" element={<TestSuppliers />} />
          <Route path="/test/products" element={<TestProducts />} />
          <Route path="/test/inventory" element={<TestInventory />} />
          <Route path="/test/users" element={<TestUsers />} />
          <Route path="/test/settings" element={<TestSettings />} />
          <Route path="/test/reports" element={<TestReports />} />
          
          {/* Rute pentru utilizatori normali */}
          <Route
            path="/user"
            element={
              <UserRoute>
                <UserLayout>
                  <Outlet />
                </UserLayout>
              </UserRoute>
            }
          >
            <Route path="dashboard" element={<PermissionRoute requiredPermissions={['dashboard.view']} fallbackTo="/user/profile"><UserDashboard /></PermissionRoute>} />
            <Route path="calendar" element={<PermissionRoute requiredPermissions={['calendar.view']} fallbackTo="/user/dashboard"><Calendar /></PermissionRoute>} />
            <Route path="tasks" element={<PermissionRoute requiredPermissions={['tasks.view']} fallbackTo="/user/dashboard"><TasksPageNew /></PermissionRoute>} />
            <Route path="documents" element={<PermissionRoute requiredPermissions={['documents.view']} fallbackTo="/user/dashboard"><DocumentsPage /></PermissionRoute>} />
            <Route path="reports" element={<PermissionRoute requiredPermissions={['reports.view']} fallbackTo="/user/dashboard"><UserReports /></PermissionRoute>} />
            <Route path="budget" element={<PermissionRoute requiredPermissions={['budget.view']} fallbackTo="/user/dashboard"><BudgetExecutionPage /></PermissionRoute>} />
            <Route path="profile" element={<PermissionRoute requiredPermissions={['profile.view']} fallbackTo="/user/dashboard"><UserProfile /></PermissionRoute>} />
            <Route path="notifications" element={<PermissionRoute requiredPermissions={['notifications.view']} fallbackTo="/user/dashboard"><NotificationsPage /></PermissionRoute>} />
            <Route path="stock-audit" element={<PermissionRoute requiredPermissions={['stock_audit.view']} fallbackTo="/user/dashboard"><StockAuditPage /></PermissionRoute>} />
            <Route path="material-requests" element={<PermissionRoute requiredPermissions={['material_requests.view']} fallbackTo="/user/dashboard"><MaterialRequestsPage /></PermissionRoute>} />
            <Route path="traceability" element={<PermissionRoute requiredPermissions={['traceability.view']} fallbackTo="/user/dashboard"><TraceabilityPage /></PermissionRoute>} />
            <Route path="supply">
              <Route path="suppliers" element={<PermissionRoute requiredPermissions={['supply.view']} fallbackTo="/user/dashboard"><SupplierList /></PermissionRoute>} />
              <Route path="products" element={<PermissionRoute requiredPermissions={['supply.view']} fallbackTo="/user/dashboard"><ProductList /></PermissionRoute>} />
              <Route path="inventory" element={<PermissionRoute requiredPermissions={['supply.view']} fallbackTo="/user/dashboard"><InventoryList /></PermissionRoute>} />
            </Route>
            <Route path="portal" element={<PermissionRoute requiredPermissions={['patient_portal.view']} fallbackTo="/user/dashboard"><PatientPortalPage /></PermissionRoute>} />
            <Route path="lims">
              <Route index element={<PermissionRoute requiredPermissions={['lims.view']} fallbackTo="/user/dashboard"><AnalysisRequestsPage /></PermissionRoute>} />
              <Route path="tests" element={<PermissionRoute requiredPermissions={['lims.view']} fallbackTo="/user/dashboard"><LaboratoryTestsPage /></PermissionRoute>} />
            </Route>
            <Route path="pharmacy" element={<PermissionRoute requiredPermissions={['pharmacy.view']} fallbackTo="/user/dashboard"><PharmacyPage /></PermissionRoute>} />
          </Route>
          
          {/* Rute pentru admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Layout />
              </AdminRoute>
            }
          >
            <Route path="dashboard" element={<PermissionRoute requiredPermissions={['dashboard.view']} fallbackTo="/admin/notifications"><Dashboard /></PermissionRoute>} />
            <Route path="calendar" element={<PermissionRoute requiredPermissions={['calendar.view']} fallbackTo="/admin/notifications"><Calendar /></PermissionRoute>} />
            <Route path="tasks" element={<PermissionRoute requiredPermissions={['tasks.view']} fallbackTo="/admin/notifications"><TasksPageNew /></PermissionRoute>} />
            <Route path="documents" element={<PermissionRoute requiredPermissions={['documents.view']} fallbackTo="/admin/notifications"><DocumentsPage /></PermissionRoute>} />
            <Route path="vehicles" element={<PermissionRoute requiredPermissions={['vehicles.view']} fallbackTo="/admin/dashboard"><VehicleList /></PermissionRoute>} />
            <Route path="material-requests" element={<PermissionRoute requiredPermissions={['material_requests.view']} fallbackTo="/admin/dashboard"><MaterialRequestsPage /></PermissionRoute>} />
            <Route path="supply">
              <Route path="suppliers" element={<PermissionRoute requiredPermissions={['supply.view']} fallbackTo="/admin/dashboard"><SupplierList /></PermissionRoute>} />
              <Route path="products" element={<PermissionRoute requiredPermissions={['supply.view']} fallbackTo="/admin/dashboard"><ProductList /></PermissionRoute>} />
              <Route path="inventory" element={<PermissionRoute requiredPermissions={['supply.view']} fallbackTo="/admin/dashboard"><InventoryList /></PermissionRoute>} />
            </Route>
            <Route path="users" element={<PermissionRoute requiredPermissions={['users.manage']} fallbackTo="/admin/dashboard"><UserManagement /></PermissionRoute>} />
            <Route path="settings" element={<PermissionRoute requiredPermissions={['system_settings.manage', 'roles.manage']} fallbackTo="/admin/dashboard"><SystemSettings /></PermissionRoute>} />
            <Route path="reports" element={<PermissionRoute requiredPermissions={['reports.view']} fallbackTo="/admin/dashboard"><ReportsManagement /></PermissionRoute>} />
            <Route path="business-intelligence" element={<PermissionRoute requiredPermissions={['bi.view']} fallbackTo="/admin/dashboard"><BusinessIntelligencePage /></PermissionRoute>} />
            <Route path="automated-reports" element={<PermissionRoute requiredPermissions={['automated_reports.view']} fallbackTo="/admin/dashboard"><AutomatedReportsPage /></PermissionRoute>} />
            <Route path="cron-jobs-test" element={<PermissionRoute requiredPermissions={['automated_reports.view']} fallbackTo="/admin/dashboard"><CronJobsTestPage /></PermissionRoute>} />
            <Route path="alerts" element={<PermissionRoute requiredPermissions={['alerts.view']} fallbackTo="/admin/dashboard"><AlertsPage /></PermissionRoute>} />
            <Route path="activity-logs" element={<PermissionRoute requiredPermissions={['activity_logs.view']} fallbackTo="/admin/dashboard"><ActivityLogsPage /></PermissionRoute>} />
            <Route path="notifications" element={<PermissionRoute requiredPermissions={['notifications.view']} fallbackTo="/admin/dashboard"><NotificationsPage /></PermissionRoute>} />
            <Route path="stock-audit" element={<PermissionRoute requiredPermissions={['stock_audit.view']} fallbackTo="/admin/dashboard"><StockAuditPage /></PermissionRoute>} />
            <Route path="traceability" element={<PermissionRoute requiredPermissions={['traceability.view']} fallbackTo="/admin/dashboard"><TraceabilityPage /></PermissionRoute>} />
            <Route path="registry" element={<PermissionRoute requiredPermissions={['documents.view']} fallbackTo="/admin/dashboard"><RegistryPage /></PermissionRoute>} />
            <Route path="patients" element={<PermissionRoute requiredPermissions={['patients.view']} fallbackTo="/admin/dashboard"><PatientsPage /></PermissionRoute>} />
            <Route path="portal" element={<PermissionRoute requiredPermissions={['patient_portal.view']} fallbackTo="/admin/dashboard"><PatientPortalPage /></PermissionRoute>} />
            <Route path="lims">
              <Route index element={<PermissionRoute requiredPermissions={['lims.view']} fallbackTo="/admin/dashboard"><AnalysisRequestsPage /></PermissionRoute>} />
              <Route path="tests" element={<PermissionRoute requiredPermissions={['lims.view']} fallbackTo="/admin/dashboard"><LaboratoryTestsPage /></PermissionRoute>} />
            </Route>
            <Route path="electronic-forms" element={<PermissionRoute requiredPermissions={['documents.view']} fallbackTo="/admin/dashboard"><ElectronicFormsPage /></PermissionRoute>} />
            <Route path="pharmacy" element={<PermissionRoute requiredPermissions={['pharmacy.view']} fallbackTo="/admin/dashboard"><PharmacyPage /></PermissionRoute>} />
            <Route path="pharmacy-lab-imaging" element={<PermissionRoute requiredPermissions={['pharmacy.view', 'lims.view']} fallbackTo="/admin/dashboard"><PharmacyLabImagingPage /></PermissionRoute>} />
            <Route path="interoperability" element={<PermissionRoute requiredPermissions={['interoperability.view']} fallbackTo="/admin/dashboard"><InteroperabilityPage /></PermissionRoute>} />
            <Route path="personal-data-access-report" element={<PermissionRoute requiredPermissions={['personal_data_access.view']} fallbackTo="/admin/dashboard"><PersonalDataAccessReportPage /></PermissionRoute>} />
            <Route path="budget" element={<PermissionRoute requiredPermissions={['budget.view']} fallbackTo="/admin/dashboard"><BudgetExecutionPage /></PermissionRoute>} />
          </Route>

          {/* Redirecționare bazată pe rol */}
          <Route path="/" element={<NavigateToDashboard />} />
          <Route path="/notifications" element={<Navigate to="/admin/notifications" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

function NavigateToDashboard() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Dacă este admin, merge la dashboard-ul admin
  if (user.roles.some(role => ADMIN_ENTRY_ROLES.includes(role))) {
    return <Navigate to="/admin/dashboard" />;
  }
  
  // Altfel merge la dashboard-ul utilizatorului normal
  return <Navigate to="/user/dashboard" />;
}

export default App;
