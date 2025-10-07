import React, { useState } from 'react';
import Login from './Login';
import { getCurrentUser } from '../../utils/auth';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLoginSuccess = () => {
    const user = getCurrentUser();
    if (user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
    }
  };

  // Se não estiver autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Se estiver autenticado, mostrar o conteúdo protegido e passar o usuário atual
  return React.cloneElement(children, { currentUser });
};

export default ProtectedRoute;