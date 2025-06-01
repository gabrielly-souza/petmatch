// src/pages/LoginPage.js
import React from 'react';
import Auth from '../components/Auth'; // Ajuste o caminho se Auth.js não estiver mais em src/components

const LoginPage = () => {
    return (
        <div>
            <Auth type="login" />
        </div>
    );
};

export default LoginPage;