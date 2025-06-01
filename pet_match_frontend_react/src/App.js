// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; 

// Importe o Navbar do novo local
import Navbar from './components/Navbar'; // Ajuste o caminho se criou pasta Navbar: './components/Navbar/Navbar';

// Importe suas páginas
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AddPetForm from './components/AddPetForm';
import OngAnimalManagementPage from './components/OngAnimalManagement';
import EditPetForm from './pages/EditPetForm';
import PetDetails from './components/PetDetails';

// Componente para rotas protegidas (exemplo)
const ProtectedOngRoute = ({ children }) => {
    const { isAuthenticated, userRole, loading } = useAuth(); 

    if (!isAuthenticated || userRole !== 'ong_protetor') {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// A Navbar já está importada e não é mais definida aqui
// const Navbar = () => { ... };

function App() {
  return (
    <Router>
        <AuthProvider>
            <Navbar /> {/* O componente Navbar é usado aqui */}
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/pet/:id" element={<PetDetails />} />

                {/* Rotas protegidas para ONGs */}
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