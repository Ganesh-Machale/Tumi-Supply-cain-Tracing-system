import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

// Sidebar & Navbar Layout Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Supply from './pages/Supply';
import Inventory from './pages/Inventory';
import Products from './pages/Products';
import Locations from './pages/Locations';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import Users from './pages/Users';
import Profile from './pages/Profile';

// App Shell Layout Wrapper
const AppLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Collapsible Left Navigation */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar onMenuClick={() => setIsMobileOpen(true)} />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-5 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Access Auth Route */}
            <Route path="/login" element={<Login />} />

            {/* Authenticated Application routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Default landing page */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Common dashboard and trackers */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="supply" element={<Supply />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="products" element={<Products />} />
              <Route path="locations" element={<Locations />} />
              <Route path="reports" element={<Reports />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="profile" element={<Profile />} />

              {/* Administrative Only Routes */}
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Users />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback Catch-All */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
