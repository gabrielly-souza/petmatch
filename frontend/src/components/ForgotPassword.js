// src/pages/ForgotPassword.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Para o link de volta ao login
import styles from './ForgotPassword.module.css'; // Importa o CSS Module

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');
        setIsError(false);
        setIsLoading(true);

        if (!email || !email.trim()) {
            setMessage('Por favor, insira seu email.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        // Simulação de chamada de API para recuperar senha
        // Em um cenário real, você faria uma requisição POST para seu backend
        // Ex: const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/forgot-password`, {
        //        method: 'POST',
        //        headers: { 'Content-Type': 'application/json' },
        //        body: JSON.stringify({ email })
        //    });
        //    const data = await response.json();
        //    if (response.ok) {
        //        setMessage(data.message || 'Um link de recuperação de senha foi enviado para o seu email.');
        //        setIsError(false);
        //    } else {
        //        setMessage(data.message || 'Erro ao solicitar recuperação de senha.');
        //        setIsError(true);
        //    }

        try {
            // Simula um atraso de rede
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Simula uma resposta de sucesso ou erro da API
            const success = true; // Altere para false para testar o erro

            if (success) {
                setMessage('Um link de recuperação de senha foi enviado para o seu email. Por favor, verifique sua caixa de entrada.');
                setIsError(false);
                setEmail(''); // Limpa o campo de email após o sucesso
            } else {
                setMessage('Não foi possível encontrar uma conta com este email. Por favor, verifique e tente novamente.');
                setIsError(true);
            }
        } catch (error) {
            console.error("Erro na recuperação de senha:", error);
            setMessage('Ocorreu um erro inesperado. Tente novamente mais tarde.');
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.forgotPasswordContainer}>
            <div className={styles.forgotPasswordBox}>
                <h2 className={styles.formTitle}>Recuperar Senha</h2>
                <form className={styles.formSpaceY} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="email" className={styles.formLabel}>Email:<span className={styles.requiredStar}>*</span></label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={styles.formInput}
                            placeholder="seuemail@exemplo.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={styles.submitButton}
                    >
                        {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                    </button>
                </form>

                {message && (
                    <p className={`${styles.message} ${isError ? styles.error : styles.success}`}>
                        {message}
                    </p>
                )}

                <p className={styles.message}>
                    <Link to="/login" className={styles.toggleLink}>
                        Voltar para o Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
