import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, Sun, Moon } from 'lucide-react';
import { validateUser, generateToken } from '../../utils/auth';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState('dark');

  // Verificar se há um tema padrão nas variáveis de ambiente
  useEffect(() => {
    const defaultTheme = import.meta.env.VITE_DEFAULT_THEME || 'dark';
    setTheme(defaultTheme);
    document.documentElement.classList.toggle('dark', defaultTheme === 'dark');
  }, []);

  // Verificar se o usuário já está logado
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          onLoginSuccess();
        } else {
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        console.error('Erro ao verificar token:', error.message);
        localStorage.removeItem('authToken');
      }
    }
  }, [onLoginSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = validateUser(username, password);

      if (user) {
        const token = generateToken(user);
        localStorage.setItem('authToken', token);
        // Aplicar o tema do usuário
        document.documentElement.classList.toggle('dark', user.theme === 'dark');
        onLoginSuccess();
      } else {
        setError('Nome de usuário ou senha inválidos');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
      console.error('Erro de login:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animação de ondas */}
      <div className="waves absolute bottom-0 left-0 w-full h-32 md:h-40">
        <svg className="w-full h-full" preserveAspectRatio="none" shapeRendering="auto" viewBox="0 24 150 28" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <path d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" id="gentle-wave"></path>
          </defs>
          <g className="parallax">
            <use fill="rgba(110, 12, 29, 0.7)" x="48" href="#gentle-wave" y="0"></use>
            <use fill="rgba(56, 180, 238, 0.7)" x="48" href="#gentle-wave" y="3"></use>
            <use fill="rgba(196, 93, 255, 0.5)" x="48" href="#gentle-wave" y="5"></use>
            <use fill="#de2435" x="48" href="#gentle-wave" y="7"></use>
            <use fill="#232259" x="48" href="#gentle-wave" y="9"></use>
            <use fill="#323171" x="48" href="#gentle-wave" y="11"></use>
            <use fill="#2d2c6c" x="48" href="#gentle-wave" y="13"></use>
          </g>
        </svg>
      </div>


      <div className="w-full max-w-md z-10">
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <div className="flex justify-between items-center mb-4">
                <div></div> {/* Espaço vazio para balancear */}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Hablla <span className="text-violet-600">Sync</span> & Tools
                </h1>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Faça login para acessar as ferramentas
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome de usuário
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    placeholder="Digite seu nome de usuário"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    placeholder="Digite sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Autenticando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/30 px-6 py-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              Sistema de verificação de disparos Hablla
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;