// src/pages/HomePage.js
import React, { useEffect, useRef } from 'react'; // Importe useEffect e useRef
import { useLocation } from 'react-router-dom'; // Importe useLocation

import PetList from '../components/PetList';
import Chatbot from '../components/Chatbot';

const HomePage = () => {
  const location = useLocation(); // Obtém o objeto de localização da URL
  const petListRef = useRef(null); // Cria uma referência para o elemento da lista de pets

  // Este useEffect vai rolar para a seção de pets quando o hash na URL mudar
  useEffect(() => {
    if (location.hash === '#animais-disponiveis' && petListRef.current) {
      // Usa requestAnimationFrame para garantir que a DOM esteja atualizada
      // antes de tentar rolar
      requestAnimationFrame(() => {
        petListRef.current.scrollIntoView({
          behavior: 'smooth', // Rola suavemente
          block: 'start',     // Alinha o topo do elemento com o topo da viewport
        });
      });
    }
  }, [location.hash]); // Dependência: executa quando o hash da URL muda

  return (
    <div>
      <h1>Bem-vindo ao PetMatch!</h1>
      <p>Encontre o amigo peludo perfeito para você</p>
      
      <Chatbot /> 

      {/* *** ADICIONE A REF AQUI NA DIV COM O ID *** */}
      {/* O useRef vai nos dar acesso direto a este elemento DOM */}
      <div id="animais-disponiveis" ref={petListRef}> 
        <h2>Animais Disponíveis para Adoção</h2> {/* Mantenha este título aqui ou em PetList */}
        <PetList /> 
      </div>
      
    </div>
  );
};

export default HomePage;