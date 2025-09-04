// src/components/Navbar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw } from '@fortawesome/free-solid-svg-icons';

import styles from './Navbar.module.css';

const Navbar = () => {
    const { isAuthenticated, logout, userRole } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.navbarContainer}>
                <Link to="/" className={styles.logoLink}>
                    <div className={styles.logoGroup}>
                        <span className={styles.logo}>
                            Pet Match
                        </span>
                        <FontAwesomeIcon icon={faPaw} className={styles.pawIcon} />
                    </div>
                </Link>

                <div className={styles.mobileMenuButtonContainer}>
                    <button
                        onClick={toggleMobileMenu}
                        className={styles.mobileMenuButton}
                        aria-label="Toggle mobile menu"
                    >
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

                <div className={styles.navLinksDesktop}>

                    {!isAuthenticated && (
                        <>
                            <Link to="/login" className={styles.navLink}>
                                Login
                            </Link>
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

                            {(userRole === 'ong_protetor' || userRole === 'admin') && (
                                <Link to="/add-pet" className={styles.navLink}>
                                    Cadastrar Pet
                                </Link>
                            )}

                            {userRole === 'ong_protetor' && (
                                <Link to="/my-animals" className={styles.navLink}>
                                    Meus Animais
                                </Link>
                            )}

                            {/* Link para o Painel Admin: Apenas para Administradores */}
                            {userRole === 'admin' && (
                                <Link to="/admin" className={styles.navLink}>
                                    Painel Admin
                                </Link>
                            )}

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

            {/* Menu Mobile */}
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
                                {/* Ajuste para 'Cadastrar Pet' (Mobile): Admin e ONG/Protetor */}
                                {(userRole === 'ong_protetor' || userRole === 'admin') && (
                                    <Link to="/add-pet" className={styles.mobileNavLink} onClick={toggleMobileMenu}>
                                        Cadastrar Pet
                                    </Link>
                                )}
                                {/* 'Meus Animais' (Mobile): APENAS ONG/Protetor */}
                                {userRole === 'ong_protetor' && (
                                    <Link to="/my-animals" className={styles.mobileNavLink} onClick={toggleMobileMenu}>
                                        Meus Animais
                                    </Link>
                                )}

                                {/* Link para o Painel Admin (Mobile): Apenas para Administradores */}
                                {userRole === 'admin' && (
                                    <Link to="/admin" className={styles.mobileNavLink} onClick={toggleMobileMenu}>
                                        Painel Admin
                                    </Link>
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