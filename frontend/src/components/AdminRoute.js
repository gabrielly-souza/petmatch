// src/components/AdminRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { isAuthenticated, userRole, loading } = useAuth();

    if (loading) {
        // Exibe uma mensagem de carregamento enquanto o estado de autenticação é determinado
        return <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2em' }}>Carregando autenticação...</div>;
    }

    // Assumimos que a role para administradores é 'admin'.
    // Se seu backend usa um nome diferente (ex: 'administrator', 'super_admin'), ajuste userRole === 'admin'.
    if (!isAuthenticated || userRole !== 'admin') {
        // Redireciona para o login ou para a home se não for um administrador
        console.warn('Acesso negado: Usuário não é administrador.');
        return <Navigate to="/login" replace />; // Ou para "/" com uma mensagem de erro
    }
    return children;
};

export default AdminRoute;
