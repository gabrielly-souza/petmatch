// src/pages/LoginPage.js
import React from 'react';
import Auth from '../login/Auth';

// Podemos criar um CSS Module simples para LoginPage se precisar de estilos específicos
// import styles from './LoginPage.module.css'; // Opcional, se precisar de estilos aqui

const LoginPage = () => {
    return (
        // Usando a classe authContainer do Auth.module.css para centralizar e dar fundo
        // Ou, se quiser um arquivo específico para LoginPage, crie LoginPage.module.css
        // e importe-o aqui. Por simplicidade, Auth.module.css.authContainer já faz o trabalho.
        <div className={Auth.authContainer}> {/* Reutilizando a classe do Auth.module.css */}
            <Auth type="login" />
        </div>
    );
};

export default LoginPage;
