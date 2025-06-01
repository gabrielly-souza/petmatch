// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importe o Navbar
import Navbar from './components/Navbar';

// Importe suas páginas
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AddPetForm from './components/AddPetForm'; // Provavelmente deve ser uma página: src/pages/AddPetPage.js
import OngAnimalManagementPage from './components/OngAnimalManagement'; // Provavelmente deve ser uma página: src/pages/OngAnimalManagementPage.js
import EditPetForm from './pages/EditPetForm';
import PetDetails from './components/PetDetails'; // Provavelmente deve ser uma página: src/pages/PetDetailsPage.js
import PetList from './components/PetList'; // Provavelmente deve ser uma página: src/pages/PetListPage.js
import ProfilePage from './pages/ProfilePage'; // <--- NOVA: Importando ProfilePage
import ForgotPassword from './components/ForgotPassword'; 

// Componente para rotas protegidas que exigem APENAS autenticação
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        // Exibe uma mensagem de carregamento enquanto o estado de autenticação é determinado
        return <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2em' }}>Carregando autenticação...</div>;
    }

    if (!isAuthenticated) {
        // Redireciona para o login se não estiver autenticado
        return <Navigate to="/login" replace />;
    }
    return children;
};


// Componente para rotas protegidas que exigem ser ONG/Protetor e autenticado
const ProtectedOngRoute = ({ children }) => {
    const { isAuthenticated, userRole, loading } = useAuth();

    if (loading) {
        // Exibe uma mensagem de carregamento enquanto o estado de autenticação é determinado
        return <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2em' }}>Carregando autenticação...</div>;
    }

    if (!isAuthenticated || userRole !== 'ong_protetor') {
        // Redireciona para o login ou para a home se não for ONG/Protetor
        // Pode ser /login ou / para uma mensagem de "Acesso negado"
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

            </Routes>
        </AuthProvider>
    </Router>
  );
}

export default App;