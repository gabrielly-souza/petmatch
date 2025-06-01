// src/pages/EditPetForm.js - REVISE ESTE ARQUIVO COM BASE NO SEU NOVO AuthContext
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAnimalById, updateAnimal } from '../api';
import { useAuth } from '../context/AuthContext'; // Importe o useAuth

const EditPetForm = () => {
    const { id } = useParams(); // Pega o ID do animal da URL
    const navigate = useNavigate();
    const { userToken, isOngProtetor } = useAuth(); // Obtenha o userToken e isOngProtetor do contexto

    const [formData, setFormData] = useState({
        nome: '',
        especie: '',
        raca: '',
        porte: '',
        idade_texto: '',
        sexo: '',
        cores: '',
        saude: '',
        descricao: '',
        foto_principal_url: '',
        status_adocao: 'Disponível',
        personalidades: [], // Array de strings para personalidades
    });
    const [personalitiesOptions] = useState([ // As personalidades que você populou no backend
        "Brincalhão", "Calmo", "Energia Alta", "Social", "Dócil",
        "Independente", "Curioso", "Preguiçoso", "Companheiro",
        "Paciente", "Extrovertido", "Medroso", "Territorial"
    ]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        const fetchAnimalData = async () => {
            if (!isOngProtetor()) {
                setError("Acesso negado. Apenas ONGs/Protetores podem editar animais.");
                setLoading(false);
                return;
            }

            try {
                const animalData = await getAnimalById(id);
                setFormData({
                    nome: animalData.nome || '',
                    especie: animalData.especie || '',
                    raca: animalData.raca || '',
                    porte: animalData.porte || '',
                    idade_texto: animalData.idade_texto || '',
                    sexo: animalData.sexo || '',
                    cores: animalData.cores || '',
                    saude: animalData.saude || '',
                    descricao: animalData.descricao || '',
                    foto_principal_url: animalData.foto_principal_url || '',
                    status_adocao: animalData.status_adocao || 'Disponível',
                    personalidades: animalData.personalidades || [],
                });
            } catch (err) {
                console.error("Erro ao carregar dados do animal:", err);
                setError("Erro ao carregar dados do animal para edição.");
            } finally {
                setLoading(false);
            }
        };

        fetchAnimalData();
    }, [id, userToken, isOngProtetor]); // Dependências atualizadas

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePersonalityChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const newPersonalities = checked
                ? [...prev.personalidades, value]
                : prev.personalidades.filter(p => p !== value);
            return { ...prev, personalidades: newPersonalities };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage(null);
        setError(null);
        try {
            await updateAnimal(id, formData, userToken); // Passa o token
            setSuccessMessage("Animal atualizado com sucesso!");
            setTimeout(() => navigate('/my-animals'), 2000); // Redireciona após 2 segundos
        } catch (err) {
            console.error("Erro ao atualizar animal:", err);
            setError(err.message || "Erro ao atualizar animal. Tente novamente.");
        }
    };

    if (loading) return <p>Carregando dados do animal para edição...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="edit-pet-form-container">
            <h1>Editar Animal: {formData.nome}</h1>
            {successMessage && <p className="success-message">{successMessage}</p>}
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <label>
                    Nome:
                    <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
                </label>
                <label>
                    Espécie:
                    <input type="text" name="especie" value={formData.especie} onChange={handleChange} required />
                </label>
                <label>
                    Raça:
                    <input type="text" name="raca" value={formData.raca} onChange={handleChange} />
                </label>
                <label>
                    Porte:
                    <input type="text" name="porte" value={formData.porte} onChange={handleChange} required />
                </label>
                <label>
                    Idade (ex: 2 anos, 3 meses):
                    <input type="text" name="idade_texto" value={formData.idade_texto} onChange={handleChange} required />
                </label>
                <label>
                    Sexo:
                    <select name="sexo" value={formData.sexo} onChange={handleChange} required>
                        <option value="">Selecione</option>
                        <option value="Macho">Macho</option>
                        <option value="Fêmea">Fêmea</option>
                    </select>
                </label>
                 <label>
                    Cores:
                    <input type="text" name="cores" value={formData.cores} onChange={handleChange} />
                </label>
                <label>
                    Saúde:
                    <input type="text" name="saude" value={formData.saude} onChange={handleChange} />
                </label>
                <label>
                    Descrição:
                    <textarea name="descricao" value={formData.descricao} onChange={handleChange} required></textarea>
                </label>
                <label>
                    URL da Foto Principal:
                    <input type="text" name="foto_principal_url" value={formData.foto_principal_url} onChange={handleChange} />
                </label>
                
                <fieldset>
                    <legend>Personalidades:</legend>
                    {personalitiesOptions.map((p) => (
                        <label key={p}>
                            <input
                                type="checkbox"
                                value={p}
                                checked={formData.personalidades.includes(p)}
                                onChange={handlePersonalityChange}
                            />
                            {p}
                        </label>
                    ))}
                </fieldset>

                <label>
                    Status de Adoção:
                    <select name="status_adocao" value={formData.status_adocao} onChange={handleChange} required>
                        <option value="Disponível">Disponível</option>
                        <option value="Adotado">Adotado</option>
                        <option value="Em Processo">Em Processo</option>
                    </select>
                </label>

                <button type="submit">Salvar Alterações</button>
            </form>
        </div>
    );
};

export default EditPetForm;