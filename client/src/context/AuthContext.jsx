import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const raw = localStorage.getItem('coper_sessao');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  function entrar(user) {
    localStorage.setItem('coper_sessao', JSON.stringify(user));
    setUsuario(user);
  }

  function sair() {
    localStorage.removeItem('coper_sessao');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
