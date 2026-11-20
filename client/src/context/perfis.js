export function perfil(usuario) {
  const role = (usuario?.role || usuario?.tipo || '').toUpperCase();
  return role === 'ADMIN' ? 'COPER' : role;
}

export function paginaInicial(usuario) {
  return {
    COPER: '/dashboard',
    PROFESSOR: '/diario-classe',
    EMPRESARIO: '/painel-impacto',
    ALUNO: '/meu-painel',
    CIVIL: '/validar',
  }[perfil(usuario)] || '/';
}
