import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importa Link para alternância
import { useAuth } from '../../context/AuthContext';
import { loginUser, registerUser } from '../../services/api';
import { useIMask } from 'react-imask';

import styles from './Auth.module.css'; // <<-- IMPORTANDO O CSS MODULE

const Auth = ({ type }) => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [endereco, setEndereco] = useState('');
    const [nomeOrganizacao, setNomeOrganizacao] = useState('');
    const [cnpjCpf, setCnpjCpf] = useState('');
    const [isOngProtetor, setIsOngProtetor] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();
    const isRegister = type === 'register';

    const {
        ref: phoneInputRef,
        maskRef: phoneMaskRef,
    } = useIMask(
        {
            mask: '(00) 00000-0000',
            lazy: false,
            placeholderChar: '_',
            onAccept: (value, mask) => {
                setTelefone(value);
            },
        }
    );

    const validateCpfCnpj = (value) => {
        if (!value) return false;
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return /^\d{11}$/.test(cleaned);
        } else if (cleaned.length === 14) {
            return /^\d{14}$/.test(cleaned);
        }
        return false;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage('');
        setIsError(false);
        setIsLoading(true);

        const nomeParaValidacao = nome.trim();
        const telefoneParaValidacao = telefone;
        const enderecoParaValidacao = endereco.trim();
        const cnpjCpfParaValidacao = cnpjCpf.replace(/\D/g, '');

        let payload = { email: email.trim(), senha };

        if (isRegister) {
            if (senha.length < 6) {
                setMessage('A senha deve ter no mínimo 6 caracteres.');
                setIsError(true); setIsLoading(false); return;
            }
            if (!email || email.trim() === '') {
                setMessage('Email é obrigatório.');
                setIsError(true); setIsLoading(false); return;
            }

            if (isOngProtetor) {
                const nomeOrganizacaoParaValidacao = nomeOrganizacao.trim();

                if (!nomeOrganizacaoParaValidacao) {
                    setMessage('Nome da organização é obrigatório.');
                    setIsError(true); setIsLoading(false); return;
                }
                if (!cnpjCpfParaValidacao || !validateCpfCnpj(cnpjCpfParaValidacao)) {
                    setMessage('CPF/CNPJ é obrigatório e deve ser válido para ONG/Protetor.');
                    setIsError(true); setIsLoading(false); return;
                }
                if (!telefoneParaValidacao || telefoneParaValidacao.length === 0) {
                    setMessage("O campo Telefone é obrigatório para ONG/Protetor.");
                    setIsError(true); setIsLoading(false); return;
                }
                if (!/^\d{10,11}$/.test(telefoneParaValidacao)) {
                    setMessage("O telefone deve ter 10 ou 11 dígitos numéricos (DDD + número).");
                    setIsError(true); setIsLoading(false); return;
                }
                if (!enderecoParaValidacao) {
                    setMessage("O campo Endereço é obrigatório para ONG/Protetor.");
                    setIsError(true); setIsLoading(false); return;
                }
                if (enderecoParaValidacao.length < 5 || enderecoParaValidacao.length > 255) {
                    setMessage("O endereço deve ter entre 5 e 255 caracteres.");
                    setIsError(true); setIsLoading(false); return;
                }
                payload = {
                    ...payload,
                    nome_organizacao: nomeOrganizacaoParaValidacao,
                    cnpj_cpf: cnpjCpfParaValidacao,
                    telefone: telefoneParaValidacao,
                    endereco: enderecoParaValidacao,
                    role: 'ong_protetor'
                };
            } else { // Usuário Comum
                if (!nomeParaValidacao) {
                    setMessage('Nome é obrigatório.');
                    setIsError(true);
                    setIsLoading(false);
                    return;
                }
                if (telefoneParaValidacao && !/^\d{10,11}$/.test(telefoneParaValidacao)) {
                    setMessage("Formato de telefone inválido. Deve ter 10 ou 11 dígitos numéricos (DDD + número).");
                    setIsError(true); setIsLoading(false); return;
                }
                if (enderecoParaValidacao && (enderecoParaValidacao.length < 5 || enderecoParaValidacao.length > 255)) {
                    setMessage("O endereço deve ter entre 5 e 255 caracteres (se preenchido).");
                    setIsError(true); setIsLoading(false); return;
                }
                payload = {
                    ...payload,
                    nome: nomeParaValidacao,
                    telefone: telefoneParaValidacao,
                    endereco: enderecoParaValidacao,
                    role: 'usuario'
                };
            }
        } else { // Login
            if (!email || email.trim() === '' || !senha) {
                setMessage('Email e senha são obrigatórios para login.');
                setIsError(true);
                setIsLoading(false);
                return;
            }
        }

        try {
            let data;
            if (isRegister) {
                data = await registerUser(payload);
                if (payload.role === 'ong_protetor') {
                    setMessage(data.message || 'ONG/Protetor registrado com sucesso! Aguarde aprovação para logar.');
                } else {
                    setMessage(data.message || 'Usuário registrado com sucesso!');
                }
            } else {
                data = await loginUser(payload.email, payload.senha);
                setMessage(data.message || 'Login bem-sucedido!');
            }
            setIsError(false);
            if (!isRegister && data.access_token) {
                login(data.access_token, data.role, data.id);
                navigate('/');
            } else if (isRegister) {
                if (payload.role === 'ong_protetor') {
                    
                } else {
                    navigate('/login');
                }
            }
        } catch (error) {
            let errorMessage = `Erro: ${error.message}.`;
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = `Erro: ${error.response.data.message}`;
            } else if (error.response && error.response.data && error.response.data.errors) {
                const errors = Object.values(error.response.data.errors).flat().join(' ');
                errorMessage = `Erro: ${errors}`;
            }
            setMessage(errorMessage);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.authBox}>
                <h2 className={styles.formTitle}>
                    {isRegister ? 'Cadastre-se' : 'Entrar'}
                </h2>
                <form className={styles.formSpaceY} onSubmit={handleSubmit}> {/* Usando formSpaceY para espaçamento do formulário */}
                    {isRegister && (
                        <div className={styles.formGroup}>
                            <label htmlFor="souONG" className={styles.checkboxLabelGroup}>
                                <input
                                    type="checkbox"
                                    id="souONG" // Adicionado um ID para que o 'htmlFor' do label possa se referir a ele
                                    checked={isOngProtetor}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setIsOngProtetor(checked);
                                        // Resetar outros campos ao mudar o tipo de usuário
                                        setNome(''); setEmail(''); setSenha('');
                                        setTelefone(''); setEndereco('');
                                        setNomeOrganizacao(''); setCnpjCpf('');
                                        if (phoneMaskRef.current) {
                                            phoneMaskRef.current.value = '';
                                        }
                                        setMessage(''); setIsError(false);
                                    }}
                                    className={styles.checkboxInput}
                                />
                                Sou uma ONG/Protetor
                            </label>
                        </div>
                    )}

                    {isRegister && isOngProtetor && (
                        <>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Nome da Organização:<span className={styles.requiredStar}>*</span></label>
                                <input type="text" value={nomeOrganizacao} onChange={(e) => setNomeOrganizacao(e.target.value)} required
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>CNPJ/CPF:<span className={styles.requiredStar}>*</span></label>
                                <input type="text" value={cnpjCpf} onChange={(e) => setCnpjCpf(e.target.value)} placeholder="Apenas números" maxLength={14} required
                                    className={styles.formInput}
                                />
                            </div>
                        </>
                    )}

                    {isRegister && !isOngProtetor && (
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Nome:<span className={styles.requiredStar}>*</span></label>
                            <input
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                required
                                className={styles.formInput}
                            />
                        </div>
                    )}

                    { (isRegister || type === 'login') && (
                        <>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Email:<span className={styles.requiredStar}>*</span></label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Senha:<span className={styles.requiredStar}>*</span></label>
                                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required
                                    className={styles.formInput}
                                />
                            </div>
                        </>
                    )}

                    {isRegister && (
                        <>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Telefone:
                                    {isOngProtetor && <span className={styles.requiredStar}>*</span>}
                                </label>
                                <input
                                    type="text"
                                    ref={phoneInputRef}
                                    placeholder="(DD) XXXXX-XXXX"
                                    required={isOngProtetor}
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Endereço:
                                    {isOngProtetor && <span className={styles.requiredStar}>*</span>}
                                </label>
                                <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} maxLength={255} required={isOngProtetor}
                                    className={styles.formInput}
                                />
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={styles.submitButton}
                    >
                        {isLoading ? (isRegister ? 'Registrando...' : 'Entrando...') : (isRegister ? 'Registrar' : 'Login')}
                    </button>
                </form>
                {message && (
                    <p className={`${styles.message} ${isError ? styles.error : styles.success}`}>
                        {message}
                    </p>
                )}

                {/* Link para alternar entre Login e Registro */}
                {isRegister ? (
                    <p className={styles.message}> {/* Reutilizando message para centralizar */}
                        Já tem uma conta?{' '}
                        <Link to="/login" className={styles.toggleLink}>
                            Faça Login
                        </Link>
                    </p>
                ) : (
                    <>
                        <p className={styles.message}> {/* Reutilizando message para centralizar */}
                            Não tem uma conta?{' '}
                            <Link to="/register" className={styles.toggleLink}>
                                Cadastre-se
                            </Link>
                        </p>
                        {/* NOVO LINK DE RECUPERAR SENHA - Adicionado aqui */}
                        <p className={styles.message}> {/* Reutilizando message para centralizar */}
                            <Link to="/forgot-password" className={styles.toggleLink}>
                                Recuperar senha
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default Auth;
