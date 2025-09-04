import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from '../user/ProfilePage.module.css';
import { useNavigate } from 'react-router-dom';
import { useIMask } from 'react-imask';

function ProfilePage() {
    const { userToken, userRole, logout, userId } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [message, setMessage] = useState('');

    // Novos estados para a alteração de senha
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    // Novo estado para controlar a visibilidade dos campos de senha
    const [showPasswordFields, setShowPasswordFields] = useState(false);

    // Configuração da máscara de telefone
    const { ref, maskRef, unmaskedValue } = useIMask({
        mask: '(00) 00000-0000',
        lazy: false,
        placeholderChar: '_',
    });

    const fetchProfile = useCallback(async () => {
        if (!userToken || userId === null) {
            setError("Você precisa estar logado para ver seu perfil.");
            setLoading(false);
            logout();
            navigate('/login');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            setMessage('');
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/user/me`, {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 401) {
                    setError("Sua sessão expirou. Por favor, faça login novamente.");
                    logout();
                } else {
                    throw new Error(errorData.message || 'Falha ao carregar perfil.');
                }
            }
            const data = await response.json();
            setProfile(data);
            
            setFormData({
                ...data,
                telefone: data.telefone ? data.telefone.replace(/\D/g, '') : '',
                endereco: data.endereco || ''
            });

            if (maskRef.current && data.telefone) {
                maskRef.current.unmaskedValue = data.telefone.replace(/\D/g, '');
            } else if (maskRef.current) {
                maskRef.current.unmaskedValue = '';
            }

        } catch (err) {
            console.error("Erro ao buscar perfil:", err);
            setError(err.message || "Erro ao carregar seu perfil.");
            if (err.message.includes("Token") || err.message.includes("Inválido") || err.message.includes("Expired")) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    }, [userToken, userId, logout, navigate, maskRef]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhoneChange = () => {
        setFormData(prev => ({ ...prev, telefone: unmaskedValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!userToken || userId === null) {
            setMessage("Você precisa estar logado para atualizar seu perfil.");
            return;
        }

        const telefoneParaValidacao = maskRef.current ? maskRef.current.unmaskedValue : formData.telefone;
        const enderecoLimpo = formData.endereco ? formData.endereco.trim() : '';

        setError(null);
        setMessage(''); // Limpa mensagens anteriores

        // Validação de campos obrigatórios do perfil (existente)
        if (!telefoneParaValidacao || telefoneParaValidacao.length === 0) {
            setError("O campo Telefone é obrigatório.");
            return;
        }
        if (!/^\d{10,11}$/.test(telefoneParaValidacao)) {
            setError("O telefone deve ter 10 ou 11 dígitos numéricos (DDD + número).");
            return;
        }
        if (!enderecoLimpo) {
            setError("O campo Endereço é obrigatório.");
            return;
        }
        if (enderecoLimpo.length < 5 || enderecoLimpo.length > 255) {
            setError("O endereço deve ter entre 5 e 255 caracteres.");
            return;
        }

        // Validação de senha (NOVO) - Somente se os campos de senha estiverem visíveis e a nova senha for preenchida
        if (showPasswordFields && newPassword) {
            if (!currentPassword) {
                setError("Por favor, digite sua senha atual para alterar a senha.");
                return;
            }
            if (newPassword.length < 6) {
                setError("A nova senha deve ter no mínimo 6 caracteres.");
                return;
            }
            if (newPassword !== confirmNewPassword) {
                setError("A nova senha e a confirmação não coincidem.");
                return;
            }
        }

        try {
            const payload = { ...formData };
            payload.telefone = telefoneParaValidacao;
            payload.endereco = enderecoLimpo;

            // Adiciona os campos de senha ao payload se eles foram preenchidos e válidos
            if (showPasswordFields && newPassword) {
                payload.current_password = currentPassword;
                payload.new_password = newPassword;
            }

            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/user/me`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao atualizar perfil.');
            }
            const data = await response.json();
            setMessage(data.message || 'Perfil atualizado com sucesso!');
            
            // Atualiza o perfil exibido com os novos dados
            setProfile({
                ...formData,
                telefone: payload.telefone,
                endereco: payload.endereco,
                // Não atualiza a senha no estado do frontend por segurança
            });
            setIsEditing(false);
            // Limpa os campos de senha após uma atualização bem-sucedida
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setShowPasswordFields(false); // Esconde os campos de senha
        } catch (err) {
            console.error("Erro ao atualizar perfil:", err);
            setError(err.message || "Erro ao atualizar seu perfil. Tente novamente.");
            if (err.message.includes("Token") || err.message.includes("Inválido") || err.message.includes("Expired")) {
                logout();
            }
        }
    };

    const handleDeactivateAccount = async () => {
        if (!userToken || userId === null) {
            // Usar um modal personalizado em vez de alert/confirm
            setMessage("Você precisa estar logado para inativar sua conta.");
            setError(true);
            return;
        }

        const userConfirmed = window.confirm(
            "Tem certeza que deseja inativar sua conta? Esta ação é irreversível e você perderá o acesso."
        );

        if (!userConfirmed) {
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setMessage('');

            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/user/deactivate`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao inativar conta.');
            }

            const data = await response.json();
            // Usar um modal personalizado em vez de alert
            alert(data.message || "Conta inativada com sucesso!");
            logout();
            navigate('/');
        } catch (err) {
            console.error("Erro ao inativar conta:", err);
            setError(err.message || "Erro ao inativar sua conta. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className={styles['profile-container']}>Carregando perfil...</div>;
    }
    if (error && typeof error === 'string' && !isEditing) { // Exibe erro apenas se não estiver editando ou for string
        return <div className={styles['profile-container']} style={{ color: 'red' }}>Erro: {error}</div>;
    }
    if (!profile) {
        return <div className={styles['profile-container']}>Nenhum perfil encontrado.</div>;
    }

    return (
        <div className={styles['profile-container']}>
            <h2>Meu Perfil</h2>
            {!isEditing ? (
                <div className={styles['profile-display']}>
                    {userRole === 'usuario' ? (
                        <>
                            <p><strong>Nome:</strong> {profile.nome}</p>
                        </>
                    ) : (
                        <>
                            <p><strong>Nome da Organização:</strong> {profile.nome_organizacao}</p>
                            <p><strong>CNPJ/CPF:</strong> {profile.cnpj_cpf || 'Não informado'}</p>
                            <p><strong>Status:</strong> {profile.aprovado ? 'Aprovado' : 'Aguardando Aprovação'}</p>
                        </>
                    )}
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Telefone:</strong> {profile.telefone ? formatPhoneNumber(profile.telefone) : 'Não informado'}</p>
                    <p><strong>Endereço:</strong> {profile.endereco || 'Não informado'}</p>
                    <button onClick={() => {
                        setIsEditing(true);
                        setShowPasswordFields(false); // Garante que os campos de senha estão escondidos ao iniciar a edição
                        setCurrentPassword(''); // Limpa os campos de senha
                        setNewPassword('');
                        setConfirmNewPassword('');
                        setError(null); // Limpa erros
                        setMessage(''); // Limpa mensagens
                    }} className={styles.editButton}>Editar Perfil</button>
                    <button
                        onClick={handleDeactivateAccount}
                        className={styles.deactivateButton}
                    >
                        Inativar Conta
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className={styles['profile-form']}>
                    {userRole === 'usuario' ? (
                        <div className={styles['form-group']}>
                            <label htmlFor="nome">Nome:</label>
                            <input
                                type="text"
                                id="nome"
                                name="nome"
                                value={formData.nome || ''}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    ) : (
                        <div className={styles['form-group']}>
                            <label htmlFor="nome_organizacao">Nome da Organização:</label>
                            <input
                                type="text"
                                id="nome_organizacao"
                                name="nome_organizacao"
                                value={formData.nome_organizacao || ''}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}
                    <div className={styles['form-group']}>
                        <label htmlFor="email">Email:<span className={styles['required-asterisk']}>*</span></label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className={styles['form-group']}>
                        <label htmlFor="telefone">Telefone: <span className={styles['required-asterisk']}>*</span></label>
                        <input
                            type="text"
                            id="telefone"
                            name="telefone"
                            ref={ref}
                            onChange={handlePhoneChange}
                            placeholder="(DD) XXXXX-XXXX"
                            required
                        />
                    </div>
                    <div className={styles['form-group']}>
                        <label htmlFor="endereco">Endereço: <span className={styles['required-asterisk']}>*</span></label>
                        <input
                            type="text"
                            id="endereco"
                            name="endereco"
                            value={formData.endereco || ''}
                            onChange={handleChange}
                            maxLength={255}
                            required
                        />
                    </div>
                    {userRole === 'ong_protetor' && (
                        <div className={styles['form-group']}>
                            <label htmlFor="cnpj_cpf">CNPJ/CPF:</label>
                            <input
                                type="text"
                                id="cnpj_cpf"
                                name="cnpj_cpf"
                                value={formData.cnpj_cpf || ''}
                                onChange={handleChange}
                            />
                        </div>
                    )}

                    {/* Botão para mostrar/esconder campos de senha */}
                    {!showPasswordFields && (
                        <button
                            type="button"
                            onClick={() => setShowPasswordFields(true)}
                            className={styles.changePasswordButton} // Nova classe para este botão
                        >
                            Alterar Senha
                        </button>
                    )}

                    {/* NOVOS CAMPOS PARA ALTERAÇÃO DE SENHA - Renderizados condicionalmente */}
                    {showPasswordFields && (
                        <>
                            <h3 className={styles['form-subtitle']}>Alterar Senha (Opcional)</h3>
                            <div className={styles['form-group']}>
                                <label htmlFor="current-password">Senha Atual:<span className={styles['required-asterisk']}>*</span></label>
                                <input
                                    type="password"
                                    id="current-password"
                                    name="currentPassword"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Digite sua senha atual"
                                    required={showPasswordFields && newPassword.length > 0} // Torna obrigatório se nova senha for digitada
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label htmlFor="new-password">Nova Senha:<span className={styles['required-asterisk']}>*</span></label>
                                <input
                                    type="password"
                                    id="new-password"
                                    name="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    required={showPasswordFields && currentPassword.length > 0} // Torna obrigatório se senha atual for digitada
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label htmlFor="confirm-new-password">Confirmar Nova Senha:<span className={styles['required-asterisk']}>*</span></label>
                                <input
                                    type="password"
                                    id="confirm-new-password"
                                    name="confirmNewPassword"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    placeholder="Confirme sua nova senha"
                                    required={showPasswordFields && currentPassword.length > 0} // Torna obrigatório se senha atual for digitada
                                />
                            </div>
                            {/* Botão para esconder os campos de senha, se desejar */}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPasswordFields(false);
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setConfirmNewPassword('');
                                    setError(null); // Limpa erros de validação
                                }}
                                className={styles.hidePasswordButton} // Nova classe para este botão
                            >
                                Esconder Campos de Senha
                            </button>
                        </>
                    )}

                    <div className={styles['flex-justify-center-gap-4']}>
                        <button type="submit" className={styles.saveButton}>Salvar Alterações</button>
                        <button type="button" onClick={() => {
                            setIsEditing(false);
                            // Limpa os campos de senha ao cancelar a edição
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmNewPassword('');
                            setShowPasswordFields(false); // Esconde os campos de senha ao cancelar
                            setError(null); // Limpa erros de validação ao cancelar
                            setMessage(''); // Limpa mensagens
                        }} className={styles.cancelButton}>Cancelar</button>
                    </div>
                </form>
            )}
            {message && <p className={styles['message-success']}>{message}</p>}
            {error && <p className={styles['message-error']}>{error}</p>}
        </div>
    );
}

function formatPhoneNumber(phoneNumberString) {
    if (!phoneNumberString) return '';
    const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    let match;

    match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phoneNumberString;
}

export default ProfilePage;
