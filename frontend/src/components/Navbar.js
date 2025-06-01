// src/components/Navbar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Importando FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw } from '@fortawesome/free-solid-svg-icons'; // Ícone de pata

import styles from './Navbar.module.css'; // <<-- IMPORTANDO O CSS MODULE

const Navbar = () => {
    const { isAuthenticated, logout, userRole } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Estado para controlar o menu mobile

    // Função para alternar o estado do menu mobile
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.navbarContainer}>
                {/* Logo/Nome do Site com Ícone de Pata */}
                <Link to="/" className={styles.logoLink}> {/* Renomeado para logoLink para melhor semântica */}
                    <div className={styles.logoGroup}> {/* Novo container para alinhar texto e ícone */}
                        <span className={styles.logo}>
                            Pet Match
                        </span>
                        <FontAwesomeIcon icon={faPaw} className={styles.pawIcon} /> {/* Ícone de pata */}
                    </div>
                </Link>

                {/* Botão de Menu para Mobile */}
                <div className={styles.mobileMenuButtonContainer}>
                    <button
                        onClick={toggleMobileMenu}
                        className={styles.mobileMenuButton}
                        aria-label="Toggle mobile menu"
                    >
                        {/* Ícone de hambúrguer ou X */}
                        {isMobileMenuOpen ? (
                            <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        ) : (
                            <svg className={styles.menuIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        )}
                    </button>
                </div>

                {/* Links de Navegação (Desktop) */}
                <div className={styles.navLinksDesktop}>
                   
                    {!isAuthenticated && (
                        <>
                            <Link to="/login" className={styles.navLink}>
                                Login
                            </Link>
                            {/* Botão Cadastre-se - Cor Principal: Vermelho */}
                            <Link to="/register" className={styles.registerButton}>
                                Cadastre-se
                            </Link>
                        </>
                    )}

                    {isAuthenticated && (
                        <>
                            <Link to="/profile" className={styles.navLink}>
                                Meu Perfil
                            </Link>
                            {userRole === 'ong_protetor' && (
                                <>
                                    <Link to="/add-pet" className={styles.navLink}>
                                        Cadastrar Pet
                                    </Link>
                                    <Link to="/my-animals" className={styles.navLink}>
                                        Meus Animais
                                    </Link>
                                </>
                            )}
                            {/* Botão Sair - Cor de Destaque/Ação: Azul */}
                            <button
                                onClick={logout}
                                className={styles.logoutButton}
                            >
                                Sair
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Menu Mobile (Visível apenas quando isMobileMenuOpen for true e em telas pequenas) */}
            {isMobileMenuOpen && (
                <div className={`${styles.mobileMenu} ${styles.animateSlideDown}`}>
                    <div className={styles.mobileMenuLinks}>
                        <Link to="/animais" className={styles.mobileNavLink} onClick={toggleMobileMenu}>
                            Animais Disponíveis
                        </Link>
                        {!isAuthenticated && (
                            <>
                                <Link to="/login" className={styles.mobileNavLink} onClick={toggleMobileMenu}>
                                    Login
                                </Link>
                                <Link to="/register" className={styles.mobileRegisterButton} onClick={toggleMobileMenu}>
                                    Cadastre-se
                                </Link>
                            </>
                        )}
                        {isAuthenticated && (
                            <>
                                <Link to="/profile" className={styles.mobileNavLink} onClick={toggleMobileMenu}>
                                    Meu Perfil
                                </Link>
                                {userRole === 'ong_protetor' && (
                                    <>
                                        <Link to="/add-pet" className={styles.mobileNavLink} onClick={toggleMobileMenu}>
                                            Cadastrar Pet
                                        </Link>
                                        <Link to="/my-animals" className={styles.mobileNavLink} onClick={toggleMobileMenu}>
                                            Meus Animais
                                        </Link>
                                    </>
                                )}
                                <button
                                    onClick={() => { logout(); toggleMobileMenu(); }}
                                    className={styles.mobileLogoutButton}
                                >
                                    Sair
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
