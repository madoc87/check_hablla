// utils/auth.js
import { jwtDecode } from 'jwt-decode';

// Função para obter todos os usuários das variáveis de ambiente
export const getAllUsers = () => {
  const users = [];
  const envVars = import.meta.env;
  
  // Procurar por variáveis de ambiente que seguem o padrão VITE_USER_[NOME]
  Object.keys(envVars).forEach(key => {
    if (key.startsWith('VITE_USER_') && key.endsWith('_PASSWORD')) {
      const username = key.replace('VITE_USER_', '').replace('_PASSWORD', '').toLowerCase();
      const password = envVars[key];
      const displayName = envVars[`VITE_USER_${username.toUpperCase()}_NAME`] || username;
      const theme = envVars[`VITE_USER_${username.toUpperCase()}_THEME`] || 'dark';
      
      users.push({
        username,
        password,
        displayName,
        theme
      });
    }
  });
  
  return users;
};

// Função para validar credenciais de um usuário
export const validateUser = (username, password) => {
  const users = getAllUsers();
  const user = users.find(u => u.username === username && u.password === password);
  return user || null;
};

// Função para gerar um token JWT
export const generateToken = (user) => {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    username: user.username,
    displayName: user.displayName,
    theme: user.theme,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 8) // 8 horas
  }));
  return `${header}.${payload}.`;
};

// Função para verificar se um token é válido
export const verifyToken = (token) => {
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp * 1000 > Date.now()) {
      return decoded;
    }
  } catch (error) {
    // Token inválido
    console.error('Erro ao decodificar token:', error.message);
  }
  return null;
};

// Função para obter o usuário logado
export const getCurrentUser = () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    const userData = verifyToken(token);
    if (userData) {
      return userData;
    }
  }
  return null;
};