
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';
import { AlertCircle } from 'lucide-react'; // For displaying message

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && currentUser.role !== 'admin') {
    // Optionally, redirect to a specific "access denied" page or show a message
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-4">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
            <p className="text-muted-foreground">
                No tienes los permisos necesarios para acceder a esta sección.
            </p>
            <p className="text-muted-foreground mt-1">
                Contacta al administrador si crees que esto es un error.
            </p>
        </div>
    );
  }

  return children;
};

export default ProtectedRoute;
