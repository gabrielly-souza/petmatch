// src/pages/EditPetForm.js - CÓDIGO COMPLETO E CORRIGIDO

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAnimalById, updateAnimal } from '../api'; // updateAnimal precisará ser ajustado na API para aceitar FormData
import { useAuth } from '../context/AuthContext';

// Importação do CSS Modules.
// Se seu arquivo CSS está em src/components/, este caminho está correto.
// Se está em src/pages/, mude para './EditPetForm.module.css'
import styles from '../components/EditPetForm.module.css';

const EditPetForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userToken, isOngProtetor } = useAuth();

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
        status_adocao: 'Disponível',
        personalidades: [],
    });
    const [currentImageUrl, setCurrentImageUrl] = useState(''); // Estado para a URL da imagem atual
    const [selectedFile, setSelectedFile] = useState(null); // Estado para o novo arquivo selecionado

    const [personalitiesOptions] = useState([
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
                    status_adocao: animalData.status_adocao || 'Disponível',
                    personalidades: animalData.personalidades || [],
                });
                setCurrentImageUrl(animalData.foto_principal_url || ''); // Define a URL da imagem atual
            } catch (err) {
                console.error("Erro ao carregar dados do animal:", err);
                setError("Erro ao carregar dados do animal para edição.");
            } finally {
                setLoading(false);
            }
        };

        fetchAnimalData();
    }, [id, userToken, isOngProtetor]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]); // Pega o primeiro arquivo selecionado
    };

    const handlePersonalityChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const newPersonalities = checked
                ? [...prev.personalities, value]
                : prev.personalities.filter(p => p !== value);
            return { ...prev, personalidades: newPersonalities };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage(null);
        setError(null);

        const dataToSend = new FormData(); // Usaremos FormData para enviar arquivos

        // Adiciona todos os campos do formData
        for (const key in formData) {
            if (key === 'personalidades') {
                // Personalidades precisam ser stringificadas para FormData
                dataToSend.append(key, JSON.stringify(formData[key]));
            } else {
                dataToSend.append(key, formData[key]);
            }
        }

        // Adiciona a nova imagem, se selecionada
        if (selectedFile) {
            dataToSend.append('foto_principal', selectedFile); // 'foto_principal' é o nome do campo que seu backend espera
        } else {
            // Se nenhum novo arquivo for selecionado, podemos opcionalmente enviar a URL existente
            // de volta para o backend, se necessário.
            // Isso depende de como seu backend lida com atualizações de imagem (se ele apaga se não receber).
            // Geralmente, se não enviou um arquivo, o backend assume que a imagem anterior deve ser mantida.
            // dataToSend.append('foto_principal_url', currentImageUrl); // Descomente se seu backend precisa disso
        }

        try {
            await updateAnimal(id, dataToSend, userToken); // updateAnimal precisa aceitar FormData
            setSuccessMessage("Animal atualizado com sucesso!");
            setTimeout(() => navigate('/my-animals'), 2000);
        } catch (err) {
            console.error("Erro ao atualizar animal:", err);
            setError(err.message || "Erro ao atualizar animal. Tente novamente.");
        }
    };

    if (loading) return <p>Carregando dados do animal para edição...</p>;
    if (error) return <p className={styles.errorMessage}>{error}</p>;

    return (
        <div className={styles.editPetFormContainer}>
            <h1>Editar Animal: {formData.nome}</h1>
            {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
            {error && <p className={styles.errorMessage}>{error}</p>}
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

                {/* SEÇÃO DE UPLOAD DE IMAGEM (CORRIGIDA) */}
                <div className={styles.imageUploadSection}>
                    {/* Este label é APENAS para o texto "Foto Principal Atual:" e a imagem */}
                    <label>
                        Foto Principal Atual:
                        {currentImageUrl ? (
                            <img src={currentImageUrl} alt="Foto atual do pet" className={styles.currentPetImage} />
                        ) : (
                            <div className={styles.noImagePreview}>Nenhuma imagem atual</div>
                        )}
                    </label>

                    {/* ESTE É O LABEL QUE SERÁ SEU BOTÃO ESTILIZADO E ATIVARÁ O INPUT DE ARQUIVO */}
                    {/* ATENÇÃO: `htmlFor` e `id` devem ser iguais. `className` aplica o estilo de botão. */}
                    <label htmlFor="file-upload-input" className={styles.uploadButtonLabel}>
                        <input
                            id="file-upload-input" // ID ÚNICO que corresponde ao htmlFor do label
                            type="file"
                            name="foto_principal"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        Selecionar Nova Foto {/* Texto visível do botão */}
                    </label>
                    {selectedFile && <p className={styles.selectedFileName}>Arquivo selecionado: {selectedFile.name}</p>}
                </div>
                
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