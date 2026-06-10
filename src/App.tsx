import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DataEntry from './components/DataEntry';
import Overview from './components/Overview';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/Toast';

function DashboardPage() {
  const navigate = useNavigate();
  return (
    <Dashboard
      onSelectBusiness={(name: string) =>
        navigate(`/business/${encodeURIComponent(name)}`)
      }
    />
  );
}

function DataEntryPage() {
  return <DataEntry />;
}

function OverviewPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const businessName = decodeURIComponent(name || '');
  return <Overview businessName={businessName} onBack={() => navigate('/')} />;
}

export default function App() {
  const { toasts, showToast, dismissToast } = useToast();

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
