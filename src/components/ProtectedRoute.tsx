import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
    children: React.ReactNode;
    requiredRole?: 'superadmin';
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
    const { admin, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f8f8f5] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 bg-[#FDD041] rounded-full animate-pulse" />
                    <p className="text-sm text-gray-500">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!admin) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    if (requiredRole && admin.role !== requiredRole) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return <>{children}</>;
}
