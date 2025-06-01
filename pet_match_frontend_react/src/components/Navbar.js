// src/components/Navbar.js

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

import styles from './Navbar.module.css'; 

const Navbar = () => {
    const { isAuthenticated, logout, userRole } = useAuth();

    return (
        <nav className={styles.navbar}>
            {/* *** MUDANÇA AQUI: VOLTA PARA '/' *** */}
            <Link to="/" className={styles.navHomeLink}>PetMatch</Link> 

            <div className={styles.navLinks}>
                {/* O link de Animais Disponíveis já está correto para o scroll */}
                <Link to="/#animais-disponiveis">Animais Disponíveis</Link> 

                {!isAuthenticated && <Link to="/login">Login</Link>}
                {!isAuthenticated && <Link to="/register">Cadastre-se</Link>}
                {isAuthenticated && userRole === 'ong_protetor' && <Link to="/add-pet">Cadastrar Pet</Link>}
                {isAuthenticated && userRole === 'ong_protetor' && <Link to="/my-animals">Meus Animais</Link>}
                {isAuthenticated && <button onClick={logout}>Sair</button>}
            </div>
        </nav>
    );
};

export default Navbar;