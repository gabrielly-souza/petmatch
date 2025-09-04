// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importe o Navbar
import Navbar from './components//navbar/Navbar';

// Importe suas páginas
import HomePage from './components/homepage/HomePage';
import LoginPage from './components/login/LoginPage';
import RegisterPage from './components/login/RegisterPage';
import AddPetForm from './components/pets/AddPetForm';
import OngAnimalManagementPage from './components/user/OngAnimalManagement';
import EditPetForm from './components/pets/EditPetForm';
import PetDetails from './components/pets/PetDetails';
import PetList from './components/pets/PetList';
import ProfilePage from './components/user/ProfilePage';
import ForgotPassword from './components/login/ForgotPassword';

import AdminDashboard from './components/user/AdminDashboard'; 
import AdminRoute from './components/user/AdminRoute'; 

// Componente para rotas protegidas que exigem APENAS autenticação
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2em' }}>Carregando autenticação...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return children;
};


// Componente para rotas protegidas que exigem ser ONG/Protetor e autenticado
const ProtectedOngRoute = ({ children }) => {
    const { isAuthenticated, userRole, loading } = useAuth();

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2em' }}>Carregando autenticação...</div>;
    }

    if (!isAuthenticated || (userRole !== 'ong_protetor' && userRole !== 'admin')) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Navbar />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/pet/:id" element={<PetDetails />} />
                    <Route path="/animais" element={<PetList />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* Rota protegida para o perfil do usuário (qualquer usuário logado) */}
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    } />

                    {/* Rotas protegidas para ONGs/Protetores */}
                    <Route path="/add-pet" element={
                        <ProtectedOngRoute>
                            <AddPetForm />
                        </ProtectedOngRoute>
                    } />
                    <Route path="/my-animals" element={
                        <ProtectedOngRoute>
                            <OngAnimalManagementPage />
                        </ProtectedOngRoute>
                    } />
                    <Route path="/edit-pet/:id" element={
                        <ProtectedOngRoute>
                            <EditPetForm />
                        </ProtectedOngRoute>
                    } />

                    {/* --- Rota protegida para o Painel de Administração --- */}
                    <Route path="/admin" element={
                        <AdminRoute> {/* Usando o novo nome */}
                            <AdminDashboard /> {/* Usando o novo nome */}
                        </AdminRoute>
                    } />

                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;