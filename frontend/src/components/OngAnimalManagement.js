// src/pages/OngAnimalManagementPage.js - CÓDIGO CORRIGIDO

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { deleteAnimal } from '../api';
import { useAuth } from '../context/AuthContext';

import styles from './OngAnimalManagement.module.css'; 

const OngAnimalManagementPage = () => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const { userToken, isAuthenticated, userRole } = useAuth();

    const fetchAnimals = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!isAuthenticated || userRole !== 'ong_protetor') {
                setError("Acesso negado. Apenas ONGs/Protetores podem gerenciar animais.");
                setLoading(false);
                return;
            }

            const response = await fetch('http://127.0.0.1:5000/api/my-animals', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao buscar seus animais.');
            }

            const data = await response.json();
            setAnimals(data);

        } catch (err) {
            console.error("Erro ao buscar animais:", err);
            setError(err.message || "Erro ao carregar seus animais. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userToken && isAuthenticated && userRole === 'ong_protetor') {
            fetchAnimals();
        } else {
            setLoading(false);
            setError("Você precisa estar logado como uma ONG/Protetor para ver e gerenciar animais.");
        }
    }, [userToken, isAuthenticated, userRole]);

    const handleDelete = async (animalId) => {
        if (window.confirm("Tem certeza que deseja excluir este animal? Esta ação é irreversível.")) {
            try {
                await deleteAnimal(animalId, userToken);
                alert("Animal excluído com sucesso!");
                fetchAnimals();
            } catch (err) {
                console.error("Erro ao excluir animal:", err);
                alert("Erro ao excluir animal: " + (err.message || "Verifique o console."));
            }
        }
    };

    const handleEdit = (animalId) => {
        navigate(`/edit-pet/${animalId}`);
    };

    if (loading) {
        return <div className={styles.loadingMessage}>Carregando seus animais...</div>;
    }

    if (error) {
        return <div className={styles.errorMessage}>Erro: {error}</div>;
    }

    if (animals.length === 0) {
        if (!isAuthenticated || userRole !== 'ong_protetor') {
            return (
                <div className={styles.noAnimalsMessage}>
                    <p>Esta área é exclusiva para ONGs e Protetores cadastrados.</p>
                    <p>Por favor, faça login ou registre-se como ONG/Protetor para gerenciar animais.</p>
                    <Link to="/login" className={styles.loginLink}>Fazer Login</Link>
                    <Link to="/register" className={styles.registerLink}>Registrar</Link>
                </div>
            );
        }
        return (
            <div className={styles.noAnimalsMessage}>
                <p>Você ainda não cadastrou nenhum animal.</p>
                <Link to="/add-pet" className={styles.addPetLink}>Adicionar Novo Pet</Link>
            </div>
        );
    }

    return (
        <div className={styles.ongAnimalManagementContainer}>
            <h1>Meus Animais Cadastrados</h1>
            <Link to="/add-pet" className={styles.addPetButton}>Cadastrar Novo Animal</Link>
            <div className={styles.animalGrid}>
                {animals.map((animal) => (
                    <div key={animal.id} className={styles.animalCard}>
                        {animal.foto_principal_url ? (
                            <img
                                src={animal.foto_principal_url}
                                alt={animal.nome}
                                className={styles.animalCardImage}
                            />
                        ) : (
                            <div className={styles.noImagePlaceholder}>Sem Imagem</div>
                        )}
                        <div className={styles.animalInfo}>
                            {/* Ajustado: Somente nome, espécie e status */}
                            <h3>{animal.nome} ({animal.especie}) <span data-status={animal.status_adocao}>- Status: {animal.status_adocao}</span></h3>
                            {/* REMOVIDO: Raça, Porte, Idade, Sexo, Cores, Saúde, Personalidades, Descrição */}
                        </div>
                        <div className={styles.animalActions}>
                            <button onClick={() => handleEdit(animal.id)} className={styles.editButton}>Editar</button>
                            <button onClick={() => handleDelete(animal.id)} className={styles.deleteButton}>Excluir</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OngAnimalManagementPage;