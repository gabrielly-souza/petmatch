import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import { faPaw } from '@fortawesome/free-solid-svg-icons'; 

const ViewAllPetsCard = ({ petsCount = 0 }) => { 
    const navigate = useNavigate();

    const handleViewAllPets = () => {
        navigate('/animais'); 
    };

    return (
        <div
            className="bg-[#E57373] text-white rounded-xl shadow-lg hover:bg-[#D35F5F] transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-6 md:p-8 text-center min-h-[300px]" // Fundo com a cor principal (vermelho mais claro)
            onClick={handleViewAllPets}
        >

            <FontAwesomeIcon
                icon={faPaw}
                className="w-20 h-20 mb-4 opacity-100"
            />
            <h3 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
                Pets Disponíveis 
            </h3>
            <p className="text-lg md:text-xl mb-6 opacity-90">
                Encontre o seu par perfeito!
            </p>
    
            <button
                onClick={handleViewAllPets}
                className="bg-white text-[#E57373] font-bold py-3 px-8 rounded-full shadow-xl hover:bg-gray-100 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50"
            >
                Ver Todos
            </button>
        </div>
    );
};

export default ViewAllPetsCard;
