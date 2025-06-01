// src/components/Auth.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importado para usar navigate
import { useAuth } from '../context/AuthContext'; // Importado para usar o contexto de autenticação
import { loginUser, registerUser } from '../api'; // IMPORTAÇÃO ESSENCIAL para chamar a API

import styles from './Auth.module.css'; // Importa o CSS Module para estilização

const Auth = ({ type }) => {
    // Estados para os campos do formulário
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [nome, setNome] = useState(''); // Para usuário geral
    const [telefone, setTelefone] = useState('');
    const [endereco, setEndereco] = useState('');

    // NOVOS ESTADOS para cadastro de ONG/Protetor
    const [nomeOrganizacao, setNomeOrganizacao] = useState('');
    const [cnpjCpf, setCnpjCpf] = useState('');
    const [isOngProtetor, setIsOngProtetor] = useState(false); // Para alternar o formulário

    // Estados para mensagens de feedback ao usuário
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    // Hooks do React Router e do Contexto de Autenticação
    const navigate = useNavigate(); // <--- DECLARAÇÃO CORRIGIDA
    const { login } = useAuth(); // <--- DECLARAÇÃO CORRIGIDA

    // Variável derivada para saber se é registro ou login
    const isRegister = type === 'register'; // <--- DECLARAÇÃO CORRIGIDA

    const handleSubmit = async (event) => {
        event.preventDefault(); // Previne o comportamento padrão de recarregar a página
        setMessage(''); // Limpa mensagens anteriores
        setIsError(false); // Reseta o estado de erro

        let payload = { email, senha }; // <--- DECLARAÇÃO CORRIGIDA: Inicializa payload

        if (isRegister) {
            if (isOngProtetor) {
                // Campos para ONG/Protetor no registro
                if (!nomeOrganizacao || !cnpjCpf || !email || !senha) {
                    setMessage('Nome da organização, CNPJ/CPF, email e senha são obrigatórios para registro de ONG/Protetor.');
                    setIsError(true);
                    return;
                }
                payload = {
                    ...payload,
                    nome_organizacao: nomeOrganizacao,
                    cnpj_cpf: cnpjCpf,
                    telefone,
                    endereco,
                    role: 'ong_protetor' // Adiciona a role diretamente aqui
                };
            } else {
                // Campos para Usuário normal no registro
                if (!nome || !email || !senha) {
                    setMessage('Nome, email e senha são obrigatórios para registro de usuário.');
                    setIsError(true);
                    return;
                }
                payload = {
                    ...payload,
                    nome,
                    telefone,
                    endereco,
                    role: 'usuario_comum' // Adiciona a role diretamente aqui
                };
            }
        } else {
            // Login
            if (!email || !senha) {
                setMessage('Email e senha são obrigatórios para login.');
                setIsError(true);
                return;
            }
            // Para o login, o payload já é { email, senha }
        }

        try {
            let data;
            if (isRegister) {
                // Chama a função de registro do api.js
                data = await registerUser(payload); // payload já contém todos os campos necessários (usuário ou ONG)
            } else {
                // Chama a função de login do api.js
                data = await loginUser(payload.email, payload.senha); // Passa email e senha separadamente para loginUser
            }

            // --- INÍCIO: LOG PARA DEPURAR ROLE ---
            console.log("Resposta do Backend para Login/Registro em Auth.js:", data);
            // --- FIM: LOG PARA DEPURAR ROLE ---

            if (data && data.message) { // Verificar se data existe e tem message
                setMessage(data.message);
            } else {
                setMessage('Sucesso!');
            }
            setIsError(false);

            if (!isRegister && data.access_token) {
                // --- INÍCIO: LOG PARA DEPURAR ROLE ---
                console.log("Chamando AuthContext.login com:", data.access_token, data.role, data.id); // <--- LOG REFORÇADO
                // --- FIM: LOG PARA DEPURAR ROLE ---
                login(data.access_token, data.role, data.id); // <--- CHAMADA CORRETA
                navigate('/'); // Redireciona para a Home após login
            } else if (isRegister) {
                // Se for registro de ONG/Protetor, pode mostrar mensagem de aprovação
                if (data.role === 'ong_protetor') {
                    setMessage(data.message + ' Por favor, aguarde a aprovação para logar.');
                } else {
                    setMessage(data.message);
                }
                navigate('/login'); // Redireciona para a página de login após registro bem-sucedido
            }
        } catch (error) {
            setMessage(`Erro de conexão: ${error.message}. Verifique se o backend está rodando.`);
            setIsError(true);
            console.error('Erro na requisição:', error);
        }
    };

    return (
        <div className={styles.authContainer}> {/* Aplica o estilo de container centralizador */}
            <div className={styles.authBox}> {/* Aplica o estilo de caixa do formulário */}
                <h2>{isRegister ? 'Cadastre-se' : 'Entrar'}</h2>
                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <div>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isOngProtetor}
                                    onChange={(e) => setIsOngProtetor(e.target.checked)}
                                />
                                Sou uma ONG/Protetor
                            </label>
                        </div>
                    )}

                    {/* Campos para ONG/Protetor (visíveis no registro se checkbox marcado) */}
                    {isRegister && isOngProtetor && (
                        <>
                            <div>
                                <label>Nome da Organização:</label>
                                <input
                                    type="text"
                                    value={nomeOrganizacao}
                                    onChange={(e) => setNomeOrganizacao(e.target.value)}
                                    required={isOngProtetor}
                                />
                            </div>
                            <div>
                                <label>CNPJ/CPF:</label>
                                <input
                                    type="text"
                                    value={cnpjCpf}
                                    onChange={(e) => setCnpjCpf(e.target.value)}
                                    required={isOngProtetor}
                                />
                            </div>
                        </>
                    )}

                    {/* Campos para Usuário normal (visíveis no registro se checkbox NÃO marcado) */}
                    {isRegister && !isOngProtetor && (
                        <div>
                            <label>Nome:</label>
                            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required={!isOngProtetor} />
                        </div>
                    )}

                    {/* Campos comuns a ambos os registros e login */}
                    <div>
                        <label>Email:</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div>
                        <label>Senha:</label>
                        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
                    </div>

                    {/* Campos opcionais para ambos os registros */}
                    {isRegister && (
                        <>
                            <div>
                                <label>Telefone (opcional):</label>
                                <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                            </div>
                            <div>
                                <label>Endereço (opcional):</label>
                                <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
                            </div>
                        </>
                    )}

                    <button type="submit">{isRegister ? 'Registrar' : 'Login'}</button>
                </form>
                {message && (
                    <p className={`${styles.message} ${isError ? styles.error : styles.success}`}>{message}</p>
                )}
            </div>
        </div>
    );
};

export default Auth; // <--- EXPORT DEFAULT Adicionado/Corrigido