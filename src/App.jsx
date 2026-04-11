import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/components/Layout';
const Homepage = lazy(() => import('@/pages/Homepage'));
const NewOrder = lazy(() => import('@/pages/NewOrder'));
const Orders = lazy(() => import('@/pages/Orders'));
const Customers = lazy(() => import('@/pages/Customers'));
const Products = lazy(() => import('@/pages/Products'));
const Settings = lazy(() => import('@/pages/Settings'));
const Debts = lazy(() => import('@/pages/Debts'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const AgentSummary = lazy(() => import('@/pages/AgentSummary'));
const Help = lazy(() => import('@/pages/Help'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ element, allowedRoles }) => {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return <PageNotFound />;
  }
  return element;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user } = useAuth();

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
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Homepage />} />
        <Route path="/new-order" element={<NewOrder />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} allowedRoles={['admin', 'user']} />} />
        <Route path="/orders" element={<ProtectedRoute element={<Orders />} allowedRoles={['admin', 'user']} />} />
        <Route path="/customers" element={<ProtectedRoute element={<Customers />} allowedRoles={['admin', 'user']} />} />
        <Route path="/products" element={<ProtectedRoute element={<Products />} allowedRoles={['admin', 'user']} />} />
        <Route path="/settings" element={<ProtectedRoute element={<Settings />} allowedRoles={['admin']} />} />
        <Route path="/debts" element={<ProtectedRoute element={<Debts />} allowedRoles={['admin', 'user']} />} />
        <Route path="/agent-summary" element={<ProtectedRoute element={<AgentSummary />} allowedRoles={['admin', 'user']} />} />
        <Route path="/help" element={<Help />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
      </Routes>
      </Suspense>
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
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App