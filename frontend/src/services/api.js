
const API_BASE_URL = 'http://127.0.0.1:5000/api'; 

// Função para lidar com erros de requisição
const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `Erro HTTP! Status: ${response.status}`);
    }
    if (response.status === 204) {
        return {};
    }
    return response.json();
};

// Funções de API para Animais
export const getAnimals = async () => {
    const response = await fetch(`${API_BASE_URL}/animals`);
    return handleResponse(response);
};

export const getAnimalById = async (animalId) => {
    const response = await fetch(`${API_BASE_URL}/animals/${animalId}`);
    return handleResponse(response);
};

export const addAnimal = async (animalData, token) => {
    try {
        const response = await fetch('http://localhost:5000/api/animals', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                
            },
            body: animalData, 
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao cadastrar animal.');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro na API ao adicionar animal:', error);
        throw error;
    }
};

export const updateAnimal = async (animalId, animalData, token) => {
    const response = await fetch(`${API_BASE_URL}/animals/${animalId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(animalData)
    });
    return handleResponse(response);
};

export const deleteAnimal = async (animalId, token) => {
    const response = await fetch(`${API_BASE_URL}/animals/${animalId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return handleResponse(response);
};

export const markAsAdopted = async (animalId, token) => {
    const response = await fetch(`${API_BASE_URL}/animals/${animalId}/adotar`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return handleResponse(response);
};

// Funções de API para Autenticação
export const loginUser = async (email, senha) => {
    const response = await fetch(`${API_BASE_URL}/login/usuario`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
    });
    return handleResponse(response);
};

export const registerUser = async (userData) => {
    const response = await fetch(`${API_BASE_URL}/register/usuario`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    });
    return handleResponse(response);
};

// Função de API para o Chatbot
export const sendMessageToChatbot = async (message, sessionId, userId) => { // Adicionar sessionId e userId como parâmetros
    const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        // Enviar sessionId e userId no corpo da requisição
        body: JSON.stringify({ message, sessionId, userId }),
    });
    return handleResponse(response);
}


