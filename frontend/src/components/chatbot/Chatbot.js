
import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToChatbot } from '../../services/api';
import { useAuth } from '../../context/AuthContext'; // Importe useAuth para pegar o userId

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';

import styles from './Chatbot.module.css';

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [welcomeMessageSent, setWelcomeMessageSent] = useState(false);

    // Use o useAuth para obter o userId do usuário logado
    const { userId } = useAuth();

    // Gerar um sessionId único para a sessão do chatbot
    // Persiste no localStorage para manter a sessão mesmo se o usuário recarregar a página
    const [currentSessionId, setCurrentSessionId] = useState(() => {
        let storedSessionId = localStorage.getItem('chatbotSessionId');
        if (!storedSessionId) {
            // Gera um novo sessionId se não houver um salvo
            storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem('chatbotSessionId', storedSessionId);
        }
        return storedSessionId;
    });


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // useEffect para lidar com o scroll para o final das mensagens
    useEffect(() => {
        scrollToBottom();
    }, [messages]); // Este useEffect só roda quando 'messages' muda

    // useEffect para enviar a mensagem de boas-vindas e gerenciar o estado do chatbot
    useEffect(() => {
        if (isOpen) {
            if (!welcomeMessageSent) {
                const initialBotMessage = {
                    text: "Bem-vindo(a)! Que tipo de pet você gostaria de adotar? Me conte sobre raça, porte, idade e as características mais importantes para você!",
                    sender: 'bot'
                };
                setMessages((prevMessages) => [...prevMessages, initialBotMessage]);
                setWelcomeMessageSent(true);
            }
        } else {
            // Quando o chatbot é fechado, reseta os estados
            setWelcomeMessageSent(false);
            setMessages([]);
        
        }
    }, [isOpen, welcomeMessageSent]); 

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (input.trim() === '') return;

        const userMessage = input.trim();
        setMessages((prevMessages) => [...prevMessages, { text: userMessage, sender: 'user' }]);
        setInput('');
        setLoading(true);

        try {
            // Envia a mensagem do usuário, o ID da sessão e o ID do usuário (se logado)
            const response = await sendMessageToChatbot(userMessage, currentSessionId, userId);
            setMessages((prevMessages) => [...prevMessages, { text: response.response, sender: 'bot' }]);
            
        } catch (error) {
            console.error("Erro ao enviar mensagem para o chatbot:", error);
            setMessages((prevMessages) => [...prevMessages, { text: "Desculpe, houve um erro ao processar sua solicitação. Tente novamente mais tarde.", sender: 'bot' }]);
        } finally {
            setLoading(false);
        }
    };

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {!isOpen && (
                <button
                    className={styles.chatbotToggleButton}
                    onClick={toggleChatbot}
                    title="Abrir Chatbot PetAmigo"
                >
                
                    <FontAwesomeIcon icon={faComment} className={styles.buttonIcon} />
                    <span className={styles.buttonText}>Pet Match</span>
                </button>
            )}

            {isOpen && (
                <div className={styles.chatbotWidgetContainer}>
                    <div className={styles.chatbotHeader}>
                        <h3>Ache o pet ideal para você!</h3>
                        <button className={styles.closeButton} onClick={toggleChatbot}>
                            X
                        </button>
                    </div>

                    <div className={styles.chatbotMessages}>
                        {messages.map((msg, index) => (
                            <div key={index} className={`${styles.message} ${styles[msg.sender]}`}>
                                {msg.text}
                            </div>
                        ))}
                        {loading && (
                            <div className={`${styles.message} ${styles.bot} ${styles.loading}`}>
                                Digitando...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className={styles.chatbotInputForm}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            disabled={loading}
                            className={styles.inputField}
                        />
                        <button type="submit" disabled={loading} className={styles.sendButton}>
                            Enviar
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default Chatbot;
