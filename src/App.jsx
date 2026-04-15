import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout';
import Homepage from '@/pages/Homepage';
import Login from '@/pages/Login';
import SetNameDialog from '@/components/SetNameDialog';
import NewOrder from '@/pages/NewOrder';
import Orders from '@/pages/Orders';
import Customers from '@/pages/Customers';
import Products from '@/pages/Products';
import Settings from '@/pages/Settings';
import Debts from '@/pages/Debts';
import Dashboard from '@/pages/Dashboard';
import AgentSummary from '@/pages/AgentSummary';
import Help from '@/pages/Help';
import PrivacyPolicy from '@/pages/PrivacyPolicy';

import TermsOfService from '@/pages/TermsOfService';

const ProtectedRoute = ({ element, allowedRoles }) => {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return <PageNotFound />;
  }
  return element;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user, refreshUser } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <img src="https://media.base44.com/images/public/69cbdbfb3ccb589826de82bf/2c09fa58d_SHIN_SHIN_transparent.png" alt="טוען..." className="h-24 animate-pulse" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <>
    <SetNameDialog user={user} onDone={() => window.location.reload()} />
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Homepage />} />
        <Route path="/new-order" element={<NewOrder />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} allowedRoles={['admin', 'user']} />} />
        <Route path="/orders" element={<ProtectedRoute element={<Orders />} allowedRoles={['admin', 'user', 'store_manager']} />} />
        <Route path="/customers" element={<ProtectedRoute element={<Customers />} allowedRoles={['admin', 'user']} />} />
        <Route path="/products" element={<ProtectedRoute element={<Products />} allowedRoles={['admin', 'user']} />} />
        <Route path="/settings" element={<ProtectedRoute element={<Settings />} allowedRoles={['admin']} />} />
        <Route path="/debts" element={<ProtectedRoute element={<Debts />} allowedRoles={['admin', 'user', 'store_manager']} />} />
        <Route path="/agent-summary" element={<ProtectedRoute element={<AgentSummary />} allowedRoles={['admin', 'user']} />} />

        <Route path="/help" element={<Help />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Route>
      <Route path="/login" element={<Login />} />
        <Route path="*" element={<PageNotFound />} />
    </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <Sonner position="bottom-right" duration={3000} richColors />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App