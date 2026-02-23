import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AdminUser {
    id: number;
    username: string;
    role: 'superadmin' | 'nacional' | 'estadal' | 'municipal';
    nombre_completo: string;
    email?: string;
    estado_id?: number | null;
    municipio_id?: number | null;
}

interface AuthContextType {
    admin: AdminUser | null;
    token: string | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isSuperAdmin: () => boolean;
    canManageAdmins: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [admin, setAdmin] = useState<AdminUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('amarillo_token');
        const savedAdmin = localStorage.getItem('amarillo_admin');
        if (savedToken && savedAdmin) {
            try {
                setToken(savedToken);
                setAdmin(JSON.parse(savedAdmin));
            } catch {
                localStorage.removeItem('amarillo_token');
                localStorage.removeItem('amarillo_admin');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string, password: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error de autenticación');
        }
        const data = await res.json();
        setToken(data.token);
        setAdmin(data.admin);
        localStorage.setItem('amarillo_token', data.token);
        localStorage.setItem('amarillo_admin', JSON.stringify(data.admin));
    };

    const logout = async () => {
        if (token) {
            fetch('/api/auth/logout', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => { });
        }
        setToken(null);
        setAdmin(null);
        localStorage.removeItem('amarillo_token');
        localStorage.removeItem('amarillo_admin');
    };

    const isSuperAdmin = () => admin?.role === 'superadmin';
    const canManageAdmins = () => admin?.role === 'superadmin';

    return (
        <AuthContext.Provider value={{ admin, token, isLoading, login, logout, isSuperAdmin, canManageAdmins }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

export function useApiHeaders() {
    const { token } = useAuth();
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}
