// src/pages/HomePage.js
import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import FeaturedPetList from './FeaturedPetList';
import Chatbot from '../components/Chatbot';

import styles from '../components/HomePage.module.css'; // Importe o CSS Module

const HomePage = () => {
  const location = useLocation();
  const petListRef = useRef(null);

  useEffect(() => {
    if (location.hash === '#animais-disponiveis' && petListRef.current) {
      requestAnimationFrame(() => {
        petListRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    }
  }, [location.hash]);

  return (
    <div className={styles.homePageContainer}>
      {/* Seção Hero - Estilo Landing Page com Imagem de Fundo */}
      <section className={styles.heroSection}>
        {/* O conteúdo do texto agora estará diretamente dentro da heroSection */}
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Encontre o amigo peludo perfeito para você!</h1>
          {/* Você pode adicionar um botão de CTA aqui se desejar, como "Começar a Adotar" */}
          {/* <button className={styles.heroCtaButton}>Começar a Adotar</button> */}
        </div>
        {/* A imagem agora será definida como background no CSS */}
      </section>
      
      {/* Seção de Introdução ao Chatbot (separada) */}
      <section className={styles.introSection}>
        <h2 className={styles.introTitle}>Recomendação Inteligente</h2>
        <p className={styles.introText}>
          Para tornar sua busca ainda mais fácil e personalizada, apresentamos nossa funcionalidade de recomendação inteligente!
          Basta clicar no botão do nosso chatbot no canto inferior direito da tela e contar a ele sobre o tipo de pet que você procura. 
          Comece sua jornada de adoção hoje mesmo e descubra a alegria de dar um novo começo a um pet!
        </p>
      </section>

      <Chatbot /> 

      {/* Seção de Animais Disponíveis para Adoção */}
      <section id="animais-disponiveis" ref={petListRef} className={styles.featuredPetsSection}>
        <h2 className={styles.featuredPetsTitle}>Animais Disponíveis para Adoção</h2>
        <FeaturedPetList /> 
      </section>
    </div>
  );
};

export default HomePage;
