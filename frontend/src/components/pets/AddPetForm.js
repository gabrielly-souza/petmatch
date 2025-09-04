import React, { useState } from 'react';
import { addAnimal } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './AddPetForm.module.css'; 

function AddPetForm() {
    const { getToken } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nome: '',
        especie: '',
        raca: '',
        porte: '',
        idade_texto: '',
        sexo: '',
        cores: '',
        saude: '',
        personalidades: [],
        descricao: '',
    });
    const [fotoPrincipal, setFotoPrincipal] = useState(null);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const especies = ['Cachorro', 'Gato', 'Outro'];
    const portes = ['Pequeno', 'Médio', 'Grande'];
    const sexos = ['Macho', 'Fêmea'];
    const personalidadesOptions = [
        'Brincalhão', 'Calmo', 'Dócil', 'Energético', 'Gentil',
        'Curioso', 'Protetor', 'Independente', 'Sociável', 'Inteligente'
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                personalidades: checked
                    ? [...prev.personalidades, value]
                    : prev.personalidades.filter(p => p !== value)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleFileChange = (e) => {
        setFotoPrincipal(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        try {
            const token = getToken();
            if (!token) {
                setError("Você precisa estar logado para cadastrar um animal.");
                navigate('/login');
                return;
            }

            const formPayload = new FormData();
            for (const key in formData) {
                if (key === 'personalidades') {
                    formData[key].forEach(p => formPayload.append(key, p));
                } else {
                    formPayload.append(key, formData[key]);
                }
            }
            if (fotoPrincipal) {
                formPayload.append('foto_principal', fotoPrincipal);
            } else {
                setError("Por favor, selecione uma foto principal para o animal.");
                return;
            }

            const response = await addAnimal(formPayload, token);

            setSuccessMessage("Animal cadastrado com sucesso!");
            console.log("Animal cadastrado:", response);
            setFormData({
                nome: '', especie: '', raca: '', porte: '', idade_texto: '',
                sexo: '', cores: '', saude: '', personalidades: [], descricao: '',
            });
            setFotoPrincipal(null);
            setTimeout(() => {
                navigate('/my-animals');
            }, 1500);

        } catch (err) {
            console.error("Erro ao cadastrar animal:", err);
            setError(err.message || "Ocorreu um erro ao cadastrar o animal.");
        }
    };

    return (
        <div className={styles.addPetFormContainer}>
            <h2>Cadastrar Novo Animal para Adoção</h2>
            {error && <p className={styles.errorMessage}>{error}</p>}
            {successMessage && <p style={{ color: 'green', textAlign: 'center' }}>{successMessage}</p>}

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

                         {/* CAMPO PARA UPLOAD DE FOTO - MANTIDO NA SEGUNDA COLUNA */}
                        <div className={styles.formGroup}>
                            <label htmlFor="foto_principal">Foto:</label>
                            <input
                                type="file"
                                id="foto_principal"
                                name="foto_principal"
                                accept="image/*"
                                onChange={handleFileChange}
                                required
                            />
                        </div>
                    </div>
                </div> 

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
                        {personalidadesOptions.map(p => (
                            <label key={p} className={styles.checkboxItem}>
                                <input
                                    type="checkbox"
                                    name="personalidades"
                                    value={p}
                                    checked={formData.personalidades.includes(p)}
                                    onChange={handleChange}
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

                <button type="submit" className={styles.submitButton}>
                    Cadastrar Animal
                </button>
            </form>
        </div>
    );
}

export default AddPetForm;