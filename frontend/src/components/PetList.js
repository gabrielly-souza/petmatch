// src/components/PetList.js
// Esta página exibe a lista completa de animais disponíveis para adoção.

import React, { useEffect, useState, useCallback } from 'react'; // Adicionado useCallback
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

import styles from './PetList.module.css'; // <<-- IMPORTANDO O CSS MODULE
import Chatbot from '../components/Chatbot';

const PetList = () => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // Novo estado para o termo de pesquisa
    const { userToken, isAuthenticated } = useAuth();

    // Adicionado useCallback para fetchAnimals para evitar recriação desnecessária
    const fetchAnimals = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = {
                'Content-Type': 'application/json',
            };
            // Se a API exigir autenticação para buscar animais, você pode adicionar o token:
            // if (userToken) {
            //     headers['Authorization'] = `Bearer ${userToken}`;
            // }

            // Adiciona o termo de pesquisa à URL se não estiver vazio
            const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:5000/api'}/animals${query}`, {
                method: 'GET',
                headers: headers,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao buscar animais.');
            }

            const data = await response.json();
            console.log("Dados de animais recebidos no frontend (PetList.js):", data);
            setAnimals(data);
        } catch (err) {
            setError(err.message);
            console.error("Erro ao buscar animais no frontend (PetList.js):", err);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, userToken, isAuthenticated]); // Dependências: searchTerm, userToken, isAuthenticated

    useEffect(() => {
        fetchAnimals();
    }, [fetchAnimals]); // fetchAnimals é a dependência

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    if (loading) {
        return <p className={styles.loadingMessage}>Carregando animais...</p>;
    }

    if (error) {
        return <p className={styles.errorMessage}>Erro: {error}</p>;
    }

    return (
        <section className={styles.petListSection}> {/* Container centralizado com padding */}
            <h2 className={styles.sectionTitle}>
                Animais Disponíveis
            </h2>

            <div className={styles.searchContainer}> {/* Novo container para a barra de pesquisa */}
                <input
                    type="text"
                    placeholder="Pesquisar por nome, raça, espécie..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className={styles.searchInput}
                />
            </div>

            {animals.length === 0 ? (
                <p className={styles.noAnimalsMessage}>Nenhum animal encontrado com o termo "{searchTerm}".</p>
            ) : (
                <div className={styles.gridContainer}> {/* Grid responsivo */}
                    {animals.map((animal) => (
                        <div
                            key={animal.id}
                            className={styles.petCard}
                        >
                            {animal.foto_principal_url && (
                                <div className={styles.petImageContainer}>
                                    <img
                                        src={animal.foto_principal_url || 'https://placehold.co/400x300/E0E0E0/808080?text=Pet'} // Fallback
                                        alt={animal.nome}
                                        className={styles.petCardImage}
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300/E0E0E0/808080?text=Erro+Imagem'; }} // Fallback em caso de erro
                                    />
                                </div>
                            )}
                            <div className={styles.petInfo}>
                                <div>
                                    <h3 className={styles.petName}>{animal.nome} {animal.idade_texto ? `(${animal.idade_texto})` : ''}</h3>
                                    <p className={styles.petDetails}>
                                        {animal.raca || 'Raça não informada'}, {animal.porte || 'Porte não informado'}
                                    </p>
                                </div>
                                {/* Botão Ver Detalhes - Cor Principal: Vermelho (mais claro) */}
                                <Link
                                    to={`/pet/${animal.id}`}
                                    className={styles.detailsButton}
                                >
                                    Ver Detalhes
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Chatbot />
        </section>
    );
};

export default PetList;
