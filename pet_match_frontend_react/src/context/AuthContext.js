import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Inicializa estados lendo do localStorage UMA VEZ
    const [userToken, setUserToken] = useState(localStorage.getItem('userToken') || null);
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);
    const [userId, setUserId] = useState(() => {
        const storedId = localStorage.getItem('userId');
        return storedId ? parseInt(storedId, 10) : null;
    });

    // isAuthenticated é um estado derivado que reage a userToken
    const [isAuthenticated, setIsAuthenticated] = useState(!!(localStorage.getItem('userToken')));

    // Efeito para sincronizar os estados e localStorage
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
        // Quando userId muda
        // --- CORREÇÃO AQUI: Use != null para verificar null E undefined ---
        if (userId != null) { // Isso verifica se userId NÃO é nem null nem undefined
            localStorage.setItem('userId', userId.toString());
        } else {
            localStorage.removeItem('userId');
        }
    }, [userId]);


    const login = useCallback((token, role, id) => {
        console.log("AuthContext: Função login chamada com token, role, id:", token, role, id);
        setUserToken(token);
        setUserRole(role);
        setUserId(id);
    }, []);

    const logout = useCallback(() => {
        console.log("AuthContext: Função logout chamada.");
        setUserToken(null);
        setUserRole(null);
        setUserId(null);
    }, []);

    const getToken = useCallback(() => userToken, [userToken]);

    const isOngProtetor = useCallback(() => {
        console.log("AuthContext: Verificando isOngProtetor. isAuthenticated:", isAuthenticated, "userRole atual:", userRole);
        return isAuthenticated && userRole === 'ong_protetor';
    }, [isAuthenticated, userRole]);

    const value = {
        userToken,
        userRole,
        userId,
        isAuthenticated,
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