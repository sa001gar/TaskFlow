import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Admin pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminTeams } from './pages/admin/Teams';
import { AdminUsers } from './pages/admin/Users';
import { AdminTags } from './pages/admin/Tags';

// Staff pages
import { StaffDashboard } from './pages/staff/Dashboard';
import { StaffTeams } from './pages/staff/Teams';
import { StaffTags } from './pages/staff/Tags';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-light-bg">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#2b2d42',
              boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
              border: '2px solid #edf2f4',
              borderRadius: '1rem',
              fontWeight: '500',
            },
            success: {
              style: {
                borderColor: '#10b981',
              },
            },
            error: {
              style: {
                borderColor: '#ef233c',
              },
            },
          }}
        />
        
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <Navbar />
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teams"
            element={
              <ProtectedRoute requiredRole="admin">
                <Navbar />
                <AdminTeams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="admin">
                <Navbar />
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tags"
            element={
              <ProtectedRoute requiredRole="admin">
                <Navbar />
                <AdminTags />
              </ProtectedRoute>
            }
          />
          
          {/* Staff Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="staff">
                <Navbar />
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute requiredRole="staff">
                <Navbar />
                <StaffTeams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tags"
            element={
              <ProtectedRoute requiredRole="staff">
                <Navbar />
                <StaffTags />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;