import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // Importe 'Link' do react-router-dom
import { useAuth } from '../context/AuthContext'; // <--- Importe useAuth
import styles from './PetDetails.module.css'; // Ou './PetDetails.css' se não usar CSS Modules

function PetDetails() {
    const { id } = useParams();
    const [animal, setAnimal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // <--- Obtenha o userRole e userId do AuthContext
    const { userRole, userId } = useAuth(); 

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

    if (loading) {
        return <div className={styles['animal-detail-container']}>Carregando detalhes do animal...</div>;
    }

    if (error) {
        return <div className={styles['animal-detail-container']} style={{ color: 'red' }}>Erro: {error}</div>;
    }

    if (!animal) {
        return <div className={styles['animal-detail-container']}>Nenhum animal encontrado com este ID.</div>;
    }

    // <--- Lógica para verificar se o usuário logado é o dono do animal
    const canEdit = userRole === 'ong_protetor' && userId === animal.ong_protetor_id;

    return (
        <div className={styles['animal-detail-container']}>
            <h2>{animal.nome}</h2>
            <img 
                src={animal.foto_principal_url || 'https://via.placeholder.com/300?text=Sem+Foto'} 
                alt={animal.nome} 
                className={styles['animal-image']} 
                style={{ maxWidth: '300px', height: 'auto', borderRadius: '8px', marginBottom: '15px' }} 
            />
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

            {/* <--- Botão de Edição Condicional */}
            {canEdit && (
                <Link to={`/edit-pet/${animal.id}`} className={styles['edit-button']}>
                    Editar Animal
                </Link>
            )}
        </div>
    );
}

export default PetDetails;