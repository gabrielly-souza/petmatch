// src/pages/FeaturedPetList.js
// Este componente agora atua como a seção de "Animais em Destaque" para a Home Page,
// exibindo cards de pets e um card lateral para "Ver Todos os Animais".

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ViewAllPetsCard from './ViewAllPetsCard'; // Importa o card "Ver Todos"

import styles from '../components/FeaturedPetList.module.css'; // <<-- IMPORTANDO O CSS MODULE

const FeaturedPetList = () => { // Mantendo o nome original
    const [animals, setAnimals] = useState([]);
    const [totalAnimalsCount, setTotalAnimalsCount] = useState(0); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnimals = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/animals`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Falha ao buscar animais em destaque.');
                }

                const data = await response.json();
                console.log("Dados de animais recebidos para destaque (FeaturedPetList):", data);
                
                setTotalAnimalsCount(data.length); 
                
                // Pega os 2 primeiros animais para destaque para se encaixar no layout de 3 colunas com o card "Ver Todos"
                const featured = data.slice(0, 2); 
                setAnimals(featured);

            } catch (err) {
                setError(err.message);
                console.error("Erro ao buscar animais em destaque:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnimals();
    }, []);

    if (loading) {
        return (
            <div className={styles.loadingMessage}>Carregando animais em destaque...</div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorMessage}>Erro ao carregar destaques: {error}</div>
        );
    }

    // Se não houver animais, exibe apenas o card "Ver Todos" e uma mensagem
    if (animals.length === 0 && totalAnimalsCount === 0) {
        return (
            <section className={styles.featuredSection}>
                <div className={styles.gridContainer}>
                    <div className={styles.noAnimalsMessage}>
                        Nenhum animal disponível para adoção no momento. Volte em breve!
                    </div>
                    {/* Renderiza o card "Ver Todos os Animais" mesmo se não houver pets */}
                    <ViewAllPetsCard petsCount={totalAnimalsCount} />
                </div>
            </section>
        );
    }

    return (
        <section className={styles.featuredSection}>
            <div className={styles.gridContainer}>
                {animals.map((animal) => (
                    <div 
                        key={animal.id} 
                        className={styles.petCard}
                        onClick={() => window.location.href = `/pet/${animal.id}`} // Navega para a página de detalhes
                    >
                        <div className={styles.petImageContainer}>
                            <img
                                src={animal.foto_principal_url || 'https://placehold.co/400x300/E0E0E0/808080?text=Pet'} // Fallback
                                alt={animal.nome}
                                className={styles.petCardImage}
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300/E0E0E0/808080?text=Erro+Imagem'; }} // Fallback em caso de erro
                            />
                        </div>

                        <div className={styles.petInfo}>
                            <div>
                                <h3 className={styles.petName}>{animal.nome}</h3>
                                <p className={styles.petDetails}>
                                    {animal.idade_texto ? `${animal.idade_texto}, ` : ''}{animal.raca || 'Vira-lata'}, {animal.porte || 'Médio'}
                                </p>
                            </div>
                            <button
                                onClick={() => window.location.href = `/pet/${animal.id}`}
                                className={styles.detailsButton}
                            >
                                Ver Detalhes
                            </button>
                        </div>
                    </div>
                ))}

                {totalAnimalsCount > 0 && (
                    <ViewAllPetsCard petsCount={totalAnimalsCount} />
                )}
            </div>
        </section>
    );
};

export default FeaturedPetList;
