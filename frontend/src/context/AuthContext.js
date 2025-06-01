// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); // <-- NOVO: Estado de carregamento

    // Efeito para carregar dados do localStorage ao iniciar
    useEffect(() => {
        try {
            const storedToken = localStorage.getItem('userToken');
            const storedRole = localStorage.getItem('userRole');
            const storedId = localStorage.getItem('userId');

            if (storedToken) {
                setUserToken(storedToken);
                setIsAuthenticated(true);
            }
            if (storedRole) {
                setUserRole(storedRole);
            }
            if (storedId) {
                setUserId(parseInt(storedId, 10));
            }
        } catch (error) {
            console.error("Erro ao carregar dados do localStorage:", error);
            // Limpa o localStorage se houver algum erro na leitura
            localStorage.clear();
        } finally {
            setLoading(false); // <-- NOVO: Define loading como false após tentar carregar do localStorage
        }
    }, []); // Executa apenas uma vez na montagem do componente

    // Efeitos para sincronizar estados com localStorage quando mudam
    useEffect(() => {
        if (userToken) {
            localStorage.setItem('userToken', userToken);
        } else {
            localStorage.removeItem('userToken');
        }
        setIsAuthenticated(!!userToken);
    }, [userToken]);

    useEffect(() => {
        if (userRole) {
            localStorage.setItem('userRole', userRole);
        } else {
            localStorage.removeItem('userRole');
        }
    }, [userRole]);

    useEffect(() => {
        if (userId != null) {
            localStorage.setItem('userId', userId.toString());
        } else {
            localStorage.removeItem('userId');
        }
    }, [userId]);

    const login = useCallback((token, role, id) => {
        setUserToken(token);
        setUserRole(role);
        setUserId(id);
    }, []);

    const logout = useCallback(() => {
        setUserToken(null);
        setUserRole(null);
        setUserId(null);
    }, []);

    const getToken = useCallback(() => userToken, [userToken]);

    const isOngProtetor = useCallback(() => {
        return isAuthenticated && userRole === 'ong_protetor';
    }, [isAuthenticated, userRole]);

    const value = {
        userToken,
        userRole,
        userId,
        isAuthenticated,
        loading, // <-- NOVO: Adiciona 'loading' ao valor do contexto
        login,
        logout,
        getToken,
        isOngProtetor,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};