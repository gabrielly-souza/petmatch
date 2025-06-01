import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteAnimal, markAsAdopted } from '../api'; // Mantenha apenas o que você usa para ações específicas
import { useAuth } from '../context/AuthContext';

// Importe o CSS que você criou ou o que eu sugeri
import './OngAnimalManagement.module.css'; 

const OngAnimalManagementPage = () => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const { userToken, isAuthenticated, userRole } = useAuth(); // Use isAuthenticated e userRole diretamente

    const fetchAnimals = async () => {
        setLoading(true);
        setError(null);
        try {
            // A ProtectedOngRoute já faz a verificação inicial, mas é bom ter uma redundância aqui
            if (!isAuthenticated || userRole !== 'ong_protetor') {
                setError("Acesso negado. Apenas ONGs/Protetores podem gerenciar animais.");
                setLoading(false);
                return;
            }

            // --- AQUI ESTÁ A MUDANÇA CRÍTICA ---
            // Chamamos diretamente a rota de backend que retorna os animais DA ONG LOGADA
            const response = await fetch('http://127.0.0.1:5000/api/my-animals', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`, // O token é ESSENCIAL
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao buscar seus animais.');
            }

            const data = await response.json();
            setAnimals(data); // Define os animais diretamente com o que veio do backend
            // --- FIM DA MUDANÇA CRÍTICA ---

        } catch (err) {
            console.error("Erro ao buscar animais:", err);
            setError(err.message || "Erro ao carregar seus animais. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Apenas busca se o token existir e o usuário for uma ONG/Protetor
        if (userToken && isAuthenticated && userRole === 'ong_protetor') {
            fetchAnimals();
        } else {
            // Se as condições não forem atendidas, paramos o loading e definimos o erro
            setLoading(false);
            setError("Você precisa estar logado como uma ONG/Protetor para ver e gerenciar animais.");
        }
    }, [userToken, isAuthenticated, userRole]); // Dependências do useEffect

    const handleDelete = async (animalId) => {
        if (window.confirm("Tem certeza que deseja excluir este animal? Esta ação é irreversível.")) {
            try {
                await deleteAnimal(animalId, userToken);
                alert("Animal excluído com sucesso!");
                fetchAnimals(); // Recarrega a lista de animais após a exclusão
            } catch (err) {
                console.error("Erro ao excluir animal:", err);
                alert("Erro ao excluir animal: " + (err.message || "Verifique o console."));
            }
        }
    };

    const handleMarkAdopted = async (animalId) => {
        if (window.confirm("Tem certeza que deseja marcar este animal como 'Adotado'?")) {
            try {
                await markAsAdopted(animalId, userToken);
                alert("Animal marcado como 'Adotado'!");
                fetchAnimals(); // Recarrega a lista de animais após a atualização
            } catch (err) {
                console.error("Erro ao marcar como adotado:", err);
                alert("Erro ao marcar animal como adotado: " + (err.message || "Verifique o console."));
            }
        }
    };

    const handleEdit = (animalId) => {
        navigate(`/edit-pet/${animalId}`);
    };

    // --- Renderização condicional (com base no meu exemplo anterior, mas adaptado) ---
    if (loading) {
        return <div className="loading-message">Carregando seus animais...</div>;
    }

    if (error) {
        return <div className="error-message">Erro: {error}</div>;
    }

    if (animals.length === 0) {
        // Mensagens mais específicas para a ausência de animais
        if (!isAuthenticated || userRole !== 'ong_protetor') {
            return (
                <div className="no-animals-message">
                    <p>Esta área é exclusiva para ONGs e Protetores cadastrados.</p>
                    <p>Por favor, faça login ou registre-se como ONG/Protetor para gerenciar animais.</p>
                    <Link to="/login" className="login-link">Fazer Login</Link>
                    <Link to="/register" className="register-link">Registrar</Link>
                </div>
            );
        }
        return (
            <div className="no-animals-message">
                <p>Você ainda não cadastrou nenhum animal.</p>
                <Link to="/add-pet" className="add-pet-link">Adicionar Novo Pet</Link>
            </div>
        );
    }

    return (
        <div className="ong-animal-management-container">
            <h1>Meus Animais Cadastrados</h1>
            <Link to="/add-pet" className="add-pet-button">Cadastrar Novo Animal</Link>
            <div className="animal-grid">
                {animals.map((animal) => (
                    <div key={animal.id} className="animal-card">
                        {animal.foto_principal_url ? (
                            <img
                                src={animal.foto_principal_url}
                                alt={animal.nome}
                                className="animal-card-image"
                            />
                        ) : (
                            <div className="no-image-placeholder">Sem Imagem</div>
                        )}
                        <div className="animal-info">
                            <h3>{animal.nome} ({animal.especie}) - Status: {animal.status_adocao}</h3>
                            <p>**Raça:** {animal.raca || 'Não informado'}</p>
                            <p>**Porte:** {animal.porte || 'Não informado'}</p>
                            <p>**Idade:** {animal.idade_texto || 'Não informado'}</p>
                            <p>**Sexo:** {animal.sexo || 'Não informado'}</p>
                            <p>**Cores:** {animal.cores || 'Não informado'}</p>
                            <p>**Saúde:** {animal.saude || 'Não informado'}</p>
                            <p>**Personalidades:** {animal.personalidades && animal.personalidades.length > 0 ? animal.personalidades.join(', ') : 'N/A'}</p>
                            <p>**Descrição:** {animal.descricao || 'N/A'}</p>
                        </div>
                        <div className="animal-actions">
                            <button onClick={() => handleEdit(animal.id)} className="edit-button">Editar</button>
                            <button onClick={() => handleDelete(animal.id)} className="delete-button">Excluir</button>
                            {animal.status_adocao === 'Disponível' && (
                                <button onClick={() => handleMarkAdopted(animal.id)} className="mark-adopted-button">Marcar como Adotado</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OngAnimalManagementPage;