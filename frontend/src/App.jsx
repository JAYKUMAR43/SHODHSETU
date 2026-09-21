import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import CitizenHub from './pages/CitizenHub';
import SubmitChallenge from './pages/SubmitChallenge';
import TrackChallenge from './pages/TrackChallenge';
import PublicRegistry from './pages/PublicRegistry';
import LoginPage from './pages/LoginPage';
import UniversityPortal from './pages/UniversityPortal';
import UniversityProfile from './pages/UniversityProfile';
import IndustryPortal from './pages/IndustryPortal';
import ValidationPortal from './pages/ValidationPortal';
import GovernmentDashboard from './pages/GovernmentDashboard';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Verifying session credentials...</div>;
  }

  if (!user) {
    return <Navigate to={`/login?role=${allowedRoles[0] || 'university'}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-xl border border-red-200 text-center space-y-4">
        <h3 className="text-base font-bold text-red-600">Access Restricted</h3>
        <p className="text-xs text-slate-600">
          This portal requires role: <strong>{allowedRoles.join(' or ')}</strong>. You are logged in as <strong>{user.role}</strong>.
        </p>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/citizen" element={<CitizenHub />} />
              <Route path="/submit" element={<SubmitChallenge />} />
              <Route path="/track" element={<TrackChallenge />} />
              <Route path="/registry" element={<PublicRegistry />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/login/:role" element={<LoginPage />} />

              {/* University Role Routes */}
              <Route 
                path="/university" 
                element={
                  <ProtectedRoute allowedRoles={['university', 'government']}>
                    <UniversityPortal />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/university/profile" 
                element={
                  <ProtectedRoute allowedRoles={['university', 'government']}>
                    <UniversityProfile />
                  </ProtectedRoute>
                } 
              />

              {/* Industry / CSR Role Routes */}
              <Route 
                path="/industry" 
                element={
                  <ProtectedRoute allowedRoles={['industry', 'government']}>
                    <IndustryPortal />
                  </ProtectedRoute>
                } 
              />

              {/* District Validation Officer Role Routes */}
              <Route 
                path="/validation" 
                element={
                  <ProtectedRoute allowedRoles={['validation_officer', 'government']}>
                    <ValidationPortal />
                  </ProtectedRoute>
                } 
              />

              {/* Government / State Admin Role Routes */}
              <Route 
                path="/government" 
                element={
                  <ProtectedRoute allowedRoles={['government', 'validation_officer']}>
                    <GovernmentDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
