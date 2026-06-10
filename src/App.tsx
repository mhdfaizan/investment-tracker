import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DataEntry from './components/DataEntry';
import Overview from './components/Overview';
import LoginPage from './components/LoginPage';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/Toast';

function DashboardPage() {
  const navigate = useNavigate();
  const { canAccess } = useAuth();
  return (
    <Dashboard
      onSelectBusiness={(name: string) => {
        if (!canAccess(name)) return;
        navigate(`/business/${encodeURIComponent(name)}`);
      }}
    />
  );
}

function DataEntryPage() {
  const { user } = useAuth();
  if (user?.allowedBusinesses) return <Navigate to="/" replace />;
  return <DataEntry />;
}

function OverviewPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { canAccess } = useAuth();
  const businessName = decodeURIComponent(name || '');

  if (!canAccess(businessName)) {
    return <Navigate to="/" replace />;
  }

  return <Overview businessName={businessName} onBack={() => navigate('/')} />;
}

function AppShell() {
  const { user } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();

  if (!user) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Routes>
        <Route element={<Layout showToast={showToast} />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/add" element={<DataEntryPage />} />
          <Route path="/business/:name" element={<OverviewPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
