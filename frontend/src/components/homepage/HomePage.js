import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import FeaturedPetList from './FeaturedPetList';
import Chatbot from '../chatbot/Chatbot';

import styles from '../homepage/HomePage.module.css'; 

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
      <section className={styles.heroSection}>
      
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Encontre o amigo peludo perfeito para você!</h1>
        
        </div>
        
      </section>
      
      
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
