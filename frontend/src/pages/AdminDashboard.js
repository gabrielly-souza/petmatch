// src/pages/AdminDashboard.js

import React, { useState, useEffect } from 'react';
// REMOVIDA A IMPORTAÇÃO DO NAVBAR: import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Importa os módulos CSS
import pageStyles from '../components/AdminDashboard.module.css';
import sidebarStyles from '../components/AdminSidebar.module.css';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('pets');
    const { isAuthenticated, loading, userRole } = useAuth();
    const navigate = useNavigate();

    // Redirecionar se o usuário não for admin
    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated || userRole !== 'admin') {
                console.warn('Acesso negado: Usuário não é administrador.');
                navigate('/login', { replace: true });
            }
        }
    }, [isAuthenticated, userRole, loading, navigate]);

    // Exibir um spinner de carregamento ou mensagem enquanto verifica o status do usuário
    if (loading || !isAuthenticated || userRole !== 'admin') {
        return (
            <div className={pageStyles.loadingContainer}>
                <p>Carregando ou você não tem permissão para acessar esta página...</p>
            </div>
        );
    }

    // --- Componentes internos para cada aba (mantidos como estavam) ---

    const renderManagePets = () => (
        <div>
            <h3>Gerenciar Animais</h3>
            <p>Aqui você poderá ver todos os animais cadastrados no sistema.</p>
            <div className={pageStyles.tablePlaceholder}>
                <h4>Lista de Animais</h4>
                <ul>
                    <li>Tobi (Cachorro) - Disponível <button>Editar</button> <button>Inativar</button></li>
                    <li>Mia (Gato) - Em Processo <button>Editar</button> <button>Inativar</button></li>
                    <li>Jack (Cachorro) - Disponível <button>Editar</button> <button>Inativar</button></li>
                </ul>
            </div>
        </div>
    );

    const renderManageUsers = () => (
        <div>
            <h3>Gerenciar Usuários</h3>
            <p>Aqui você poderá ver e gerenciar todos os usuários do sistema.</p>
            <div className={pageStyles.tablePlaceholder}>
                <h4>Lista de Usuários</h4>
                <ul>
                    <li>Usuário A (Comum) - Ativo <button>Inativar</button></li>
                    <li>Usuário B (ONG - Pendente) - <button>Aprovar</button> <button>Inativar</button></li>
                    <li>Admin (Administrador) - Ativo</li>
                </ul>
            </div>
        </div>
    );

    const renderManageOngs = () => (
        <div>
            <h3>Gerenciar ONGs/Protetores</h3>
            <p>Aqui você poderá ver as ONGs e protetores e aprovar suas contas.</p>
            <div className={pageStyles.tablePlaceholder}>
                <h4>Lista de ONGs/Protetores</h4>
                <ul>
                    <li>ONG Amiga (Cidade X) - Status: Pendente <button>Aprovar</button> <button>Rejeitar</button></li>
                    <li>Protetor Legal (Bairro Y) - Status: Aprovado <button>Inativar</button></li>
                </ul>
            </div>
        </div>
    );

    return (
        <div>
            {/* REMOVIDA A RENDERIZAÇÃO DO NAVBAR AQUI: <Navbar /> */}
            <h1 className={pageStyles.adminTitle}>Painel de Administração</h1>
            <div className={pageStyles.adminContainer}>
                {/* Sidebar interna */}
                <aside className={sidebarStyles.sidebar}>
                    <ul className={sidebarStyles.navList}>
                        <li
                            className={`${sidebarStyles.navItem} ${activeTab === 'pets' ? sidebarStyles.active : ''}`}
                            onClick={() => setActiveTab('pets')}
                        >
                            Gerenciar Animais
                        </li>
                        <li
                            className={`${sidebarStyles.navItem} ${activeTab === 'users' ? sidebarStyles.active : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            Gerenciar Usuários
                        </li>
                        <li
                            className={`${sidebarStyles.navItem} ${activeTab === 'ongs' ? sidebarStyles.active : ''}`}
                            onClick={() => setActiveTab('ongs')}
                        >
                            Gerenciar ONGs/Protetores
                        </li>
                    </ul>
                </aside>
                {/* Área de conteúdo */}
                <div className={pageStyles.contentArea}>
                    {activeTab === 'pets' && renderManagePets()}
                    {activeTab === 'users' && renderManageUsers()}
                    {activeTab === 'ongs' && renderManageOngs()}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;