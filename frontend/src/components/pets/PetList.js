// Esta página exibe a lista completa de animais disponíveis para adoção.

import React, { useEffect, useState, useCallback } from 'react'; 
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

import styles from './PetList.module.css';
import Chatbot from '../chatbot/Chatbot';

const PetList = () => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); 
    const { userToken, isAuthenticated } = useAuth();

    const fetchAnimals = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = {
                'Content-Type': 'application/json',
            };
        

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
        <section className={styles.petListSection}>
            <h2 className={styles.sectionTitle}>
                Animais Disponíveis
            </h2>

            <div className={styles.searchContainer}> 
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
                <div className={styles.gridContainer}> 
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
