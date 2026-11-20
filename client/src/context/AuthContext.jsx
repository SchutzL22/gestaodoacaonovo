import { useState } from 'react';
import { AuthContext } from './useAuth';
import { clearSessao, getSessao, logout, setSessao } from '../services/api';

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(getSessao);

  function entrar(user) {
    setSessao(user);
    setUsuario(user);
  }

  async function sair() {
    try {
      await logout();
    } catch {
      clearSessao();
    }
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}
