// src/pages/PetDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './PetDetails.module.css'; // Ou './PetDetails.css' se não usar CSS Modules

function PetDetails() {
    const { id } = useParams();
    const [animal, setAnimal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Novos estados para o contato
    const [showContact, setShowContact] = useState(false);
    const [contactInfo, setContactInfo] = useState(null);
    const [contactLoading, setContactLoading] = useState(false);
    const [contactError, setContactError] = useState(null);

    // Obtenha userRole, userId e userToken do AuthContext
    const { userRole, userId, userToken } = useAuth();

    useEffect(() => {
        const fetchPetDetails = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`http://localhost:5000/api/animals/${id}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("Animal não encontrado.");
                    }
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
                }

                const data = await response.json();
                setAnimal(data);
            } catch (err) {
                console.error("Erro ao buscar detalhes do animal:", err);
                setError(err.message || "Ocorreu um erro ao carregar os detalhes do animal.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPetDetails();
        }
    }, [id]);

    // Nova função para buscar e exibir o contato
    const handleShowContact = async () => {
        if (!animal || !animal.ong_protetor_id) {
            setContactError("Informações do protetor não disponíveis para este animal.");
            return;
        }

        setContactLoading(true);
        setContactError(null);
        try {
            const response = await fetch(`http://localhost:5000/api/ong-protetor/${animal.ong_protetor_id}/contact`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Se você decidir proteger a rota no backend, ative a linha abaixo:
                    // 'Authorization': `Bearer ${userToken}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao buscar informações de contato.');
            }

            const data = await response.json();
            setContactInfo(data);
            setShowContact(true); // Exibe a div de contato
        } catch (err) {
            console.error("Erro ao buscar contato:", err);
            setContactError(err.message || "Erro ao carregar informações de contato. Tente novamente.");
        } finally {
            setContactLoading(false);
        }
    };

    if (loading) {
        return <div className={styles['animal-detail-container']}>Carregando detalhes do animal...</div>;
    }

    if (error) {
        return <div className={styles['animal-detail-container']} style={{ color: 'red' }}>Erro: {error}</div>;
    }

    if (!animal) {
        return <div className={styles['animal-detail-container']}>Nenhum animal encontrado com este ID.</div>;
    }

    // Lógica para verificar se o usuário logado é o dono do animal
    const canEdit = userRole === 'ong_protetor' && userId === animal.ong_protetor_id;

    return (
        <div className={styles['animal-detail-container']}>
            {/* O H2 foi movido para cá, antes do contêiner flexível de imagem/detalhes */}
            <h2>{animal.nome}</h2>

            {/* Contêiner flexível para a imagem e os detalhes */}
            <div className={styles['detail-content']}>
                <div className={styles['detail-image-wrapper']}>
                    <img
                        src={animal.foto_principal_url || 'https://via.placeholder.com/300?text=Sem+Foto'}
                        alt={animal.nome}
                        className={styles['animal-image']}
                    />
                </div>

                <div className={styles['detail-info']}>
                    <p><strong>Espécie:</strong> {animal.especie}</p>
                    <p><strong>Raça:</strong> {animal.raca || 'Vira-lata'}</p>
                    <p><strong>Porte:</strong> {animal.porte}</p>
                    <p><strong>Idade:</strong> {animal.idade_texto}</p>
                    <p><strong>Sexo:</strong> {animal.sexo}</p>
                    <p><strong>Cores:</strong> {animal.cores || 'Não informado'}</p>
                    <p><strong>Saúde:</strong> {animal.saude || 'Informações de saúde não disponíveis'}</p>
                    <p>
                        <strong>Personalidades:</strong>{' '}
                        {animal.personalidades && animal.personalidades.length > 0
                            ? animal.personalidades.join(', ')
                            : 'Nenhuma personalidade cadastrada'
                        }
                    </p>
                    <p><strong>Descrição:</strong> {animal.descricao}</p>
                    <p><strong>Status de Adoção:</strong> {animal.status_adocao}</p>
                </div>
            </div>

            {/* Grupo de botões */}
            <div className={styles['button-group']}>
                {!canEdit && (
                    <button
                        onClick={handleShowContact}
                        className={styles['contact-button']}
                        disabled={contactLoading}
                    >
                        {contactLoading ? 'Carregando Contato...' : 'Entrar em Contato'}
                    </button>
                )}

                {canEdit && (
                    <Link to={`/edit-pet/${animal.id}`} className={styles['edit-button']}>
                        Editar Animal
                    </Link>
                )}

                <Link to="/animais" className={styles['back-button']}>
                    Voltar para a Lista
                </Link>
            </div>


            {/* Área para exibir as informações de contato */}
            {showContact && contactInfo && (
                <div className={styles['contact-info-box']}>
                    <h3>Informações de Contato da ONG/Protetor:</h3>
                    <p><strong>Nome:</strong> {contactInfo.nome_organizacao || 'Não informado'}</p>
                    <p><strong>Email:</strong> <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a></p>
                    {contactInfo.telefone && <p><strong>Telefone:</strong> {contactInfo.telefone}</p>}
                    {contactInfo.endereco && <p><strong>Endereço:</strong> {contactInfo.endereco}</p>}
                </div>
            )}

            {contactError && <div className={styles['contact-error-message']}>{contactError}</div>}
        </div>
    );
}

export default PetDetails;
