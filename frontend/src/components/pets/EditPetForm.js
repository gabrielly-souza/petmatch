import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAnimalById, updateAnimal } from '../../services/api'; // Importe getAnimalById e updateAnimal
import { useAuth } from '../../context/AuthContext';

import styles from '../pets/EditPetForm.module.css';

const EditPetForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userToken, isOngProtetor } = useAuth(); // Obtenha userToken e isOngProtetor do contexto

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
    const [currentImageUrl, setCurrentImageUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    const [personalitiesOptions] = useState([
        "Brincalhão", "Calmo", "Energia Alta", "Social", "Dócil",
        "Independente", "Curioso", "Preguiçoso", "Companheiro",
        "Paciente", "Extrovertido", "Medroso", "Territorial"
    ]);

    const especies = ['Cachorro', 'Gato', 'Outro'];
    const portes = ['Pequeno', 'Médio', 'Grande'];
    const sexos = ['Macho', 'Fêmea'];
    const statusAdocaoOptions = ['Disponível', 'Adotado', 'Em Processo'];

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
            if (!userToken) { // Adiciona verificação se o token ainda não está disponível
                setError("Token de autenticação não encontrado. Faça login novamente.");
                setLoading(false);
                return;
            }

            try {
                const animalData = await getAnimalById(id, userToken);
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
                setCurrentImageUrl(animalData.foto_principal_url || '');
            } catch (err) {
                console.error("Erro ao carregar dados do animal:", err);
                setError(`Erro ao carregar dados do animal para edição. Detalhes: ${err.response?.data?.message || err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchAnimalData();
    }, [id, userToken, isOngProtetor]); // userToken na lista de dependências para re-executar se mudar

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
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

        if (!userToken) {
            setError("Token de autenticação ausente. Faça login novamente.");
            return;
        }

        const dataToSend = new FormData();

        for (const key in formData) {
            if (key === 'personalidades') {
                dataToSend.append(key, JSON.stringify(formData[key]));
            } else {
                dataToSend.append(key, formData[key]);
            }
        }

        if (selectedFile) {
            dataToSend.append('foto_principal', selectedFile);
        }

        try {
            await updateAnimal(id, dataToSend, userToken);
            setSuccessMessage("Animal atualizado com sucesso!");
            setTimeout(() => navigate('/my-animals'), 2000);
        } catch (err) {
            console.error("Erro ao atualizar animal:", err);
            setError(err.message || "Erro ao atualizar animal. Tente novamente.");
        }
    };

    if (loading) return <p className={styles.loadingMessage}>Carregando dados do animal para edição...</p>;
    // Se há um erro e não está carregando, exibe a mensagem de erro.
    if (error && !loading) return <p className={styles.errorMessage}>{error}</p>;

    return (
        <div className={styles.editPetFormContainer}>
            <h1>Editar Animal: {formData.nome}</h1>
            {successMessage && <p className={styles.successMessage}>{successMessage}</p>}

            <form onSubmit={handleSubmit} className={styles.petForm}>
                <div className={styles.formColumns}>
                    <div className={styles.column}>
                        <div className={styles.formGroup}>
                            <label htmlFor="nome">Nome:</label>
                            <input
                                type="text"
                                id="nome"
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="especie">Espécie:</label>
                            <select
                                id="especie"
                                name="especie"
                                value={formData.especie}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Selecione a espécie</option>
                                {especies.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="raca">Raça:</label>
                            <input
                                type="text"
                                id="raca"
                                name="raca"
                                value={formData.raca}
                                onChange={handleChange}
                                placeholder="Ex: Golden Retriever, SRD"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="idade_texto">Idade (ex: 2 anos, filhote):</label>
                            <input
                                type="text"
                                id="idade_texto"
                                name="idade_texto"
                                value={formData.idade_texto}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.column}>
                        <div className={styles.formGroup}>
                            <label htmlFor="porte">Porte:</label>
                            <select
                                id="porte"
                                name="porte"
                                value={formData.porte}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Selecione o porte</option>
                                {portes.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="sexo">Sexo:</label>
                            <select
                                id="sexo"
                                name="sexo"
                                value={formData.sexo}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Selecione o sexo</option>
                                {sexos.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="cores">Cores:</label>
                            <input
                                type="text"
                                id="cores"
                                name="cores"
                                value={formData.cores}
                                onChange={handleChange}
                                placeholder="Ex: Branco e preto, Tricolor"
                            />
                        </div>

                        {/* SEÇÃO DE UPLOAD DE IMAGEM - INPUT NATIVO */}
                        <div className={styles.formGroup}>
                            <div className={styles.currentImageContainer}>
                                <label>Foto Principal Atual:</label>
                                {currentImageUrl ? (
                                    <img src={currentImageUrl} alt="Foto atual do pet" className={styles.currentPetImage} />
                                ) : (
                                    <div className={styles.noImagePreview}>Nenhuma imagem atual</div>
                                )}
                            </div>
                            <input
                                type="file"
                                name="foto_principal"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            {selectedFile && <p className={styles.selectedFileName}>Arquivo selecionado: {selectedFile.name}</p>}
                        </div>
                    </div>
                </div> {/* FIM DO formColumns */}

                <div className={styles.formGroup}>
                    <label htmlFor="saude">Informações de Saúde:</label>
                    <textarea
                        id="saude"
                        name="saude"
                        value={formData.saude}
                        onChange={handleChange}
                        placeholder="Ex: Vacinado, vermifugado, castrado, possui alergia a..."
                    ></textarea>
                </div>

                <div className={styles.formGroup}>
                    <label>Personalidades:</label>
                    <div className={styles.checkboxGroup}>
                        {personalitiesOptions.map((p) => (
                            <label key={p} className={styles.checkboxItem}>
                                <input
                                    type="checkbox"
                                    value={p}
                                    checked={formData.personalidades.includes(p)}
                                    onChange={handlePersonalityChange}
                                />
                                {p}
                            </label>
                        ))}
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="descricao">Descrição:</label>
                    <textarea
                        id="descricao"
                        name="descricao"
                        value={formData.descricao}
                        onChange={handleChange}
                        required
                        placeholder="Conte um pouco sobre o animal..."
                    ></textarea>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="status_adocao">Status de Adoção:</label>
                    <select
                        id="status_adocao"
                        name="status_adocao"
                        value={formData.status_adocao}
                        onChange={handleChange}
                        required
                    >
                        {statusAdocaoOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>

                <button type="submit" className={styles.submitButton}>
                    Salvar Alterações
                </button>
            </form>
        </div>
    );
};

export default EditPetForm;