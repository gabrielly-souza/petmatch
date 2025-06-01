import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Mantém os estilos globais
import App from './App';
import { AuthProvider } from './context/AuthContext'; // Importe o AuthProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider> {/* Envolva o App com o AuthProvider */}
      <App />
    </AuthProvider>
  </React.StrictMode>
);