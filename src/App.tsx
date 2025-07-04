import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Teams } from './pages/Teams';
import { TeamDetail } from './pages/TeamDetail';
import { Tags } from './pages/Tags';
import { TagDetail } from './pages/TagDetail';
import { CreateTag } from './pages/CreateTag';
import { CreateTeam } from './pages/CreateTeam';
import { CompanyUsers } from './pages/CompanyUsers';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
            },
          }}
        />
        
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Navbar />
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <Navbar />
                <Teams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/:teamId"
            element={
              <ProtectedRoute>
                <Navbar />
                <TeamDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tags"
            element={
              <ProtectedRoute>
                <Navbar />
                <Tags />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tags/:tagId"
            element={
              <ProtectedRoute>
                <Navbar />
                <TagDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tags/new"
            element={
              <ProtectedRoute>
                <Navbar />
                <CreateTag />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/new"
            element={
              <ProtectedRoute>
                <Navbar />
                <CreateTeam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/users"
            element={
              <ProtectedRoute>
                <Navbar />
                <CompanyUsers />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;