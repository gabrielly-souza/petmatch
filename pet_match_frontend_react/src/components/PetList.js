// src/components/PetList.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

import styles from './PetList.module.css'; 

const PetList = () => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userToken, isAuthenticated } = useAuth();

    useEffect(() => {
        const fetchAnimals = async () => {
            try {
                const headers = {
                    'Content-Type': 'application/json',
                };
                const response = await fetch('http://127.00.1:5000/api/animals', {
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
        };

        fetchAnimals();
    }, [userToken, isAuthenticated]);

    if (loading) {
        return <p>Carregando animais...</p>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>Erro: {error}</p>;
    }

    if (animals.length === 0) {
        return <p>Nenhum animal disponível para adoção no momento.</p>;
    }

    return (
        <div className={styles.petListContainer}>
            {animals.map((animal) => (
                <div key={animal.id} className={styles.petCard}>
                    {animal.foto_principal_url && (
                        <img
                            src={animal.foto_principal_url}
                            alt={animal.nome}
                            className={styles.petCardImage}
                        />
                    )}
                    <div className={styles.petInfo}>
                        {/* *** MUDANÇA AQUI: Removendo espécie do título e adicionando idade ao lado *** */}
                        <h3>
                            {animal.nome} {animal.idade_texto ? `(${animal.idade_texto})` : ''}
                        </h3>
                        {/* *** NOVA LINHA: Raça e Porte *** */}
                        <p className={styles.basicDetail}>
                            {animal.raca || 'Raça não informada'}, {animal.porte || 'Porte não informado'}
                        </p>
                    </div>
                    
                    <Link to={`/pet/${animal.id}`} className={styles.detailsButton}>
                        Ver Detalhes
                    </Link>
                </div>
            ))}
        </div>
    );
};

export default PetList;