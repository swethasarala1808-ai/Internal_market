import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MaterialList from './pages/MaterialList';
import MaterialDetail from './pages/MaterialDetail';
import UploadMaterial from './pages/UploadMaterial';
import ApprovedLibrary from './pages/ApprovedLibrary';
import StaffList from './pages/StaffList';
import Profile from './pages/Profile';
import Solutions from './pages/Solutions';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
};

const MarketingRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'marketing' ? children : <Navigate to="/" />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/materials" element={<PrivateRoute><MaterialList /></PrivateRoute>} />
        <Route path="/material/:id" element={<PrivateRoute><MaterialDetail /></PrivateRoute>} />
        <Route path="/upload" element={<PrivateRoute><MarketingRoute><UploadMaterial /></MarketingRoute></PrivateRoute>} />
        <Route path="/library" element={<PrivateRoute><ApprovedLibrary /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/solutions" element={<PrivateRoute><MarketingRoute><Solutions /></MarketingRoute></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
