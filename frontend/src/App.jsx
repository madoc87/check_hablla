import React from 'react';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainApp from './MainApp';

const App = () => {
  return (
    <ProtectedRoute>
      <MainApp />
    </ProtectedRoute>
  );
};

export default App;