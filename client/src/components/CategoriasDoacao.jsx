const categorias = [
  ['ALIMENTOS', 'Alimentos'],
  ['VESTUARIO', 'Vestuário / Agasalhos'],
  ['HIGIENE', 'Higiene & Limpeza'],
  ['EDUCACIONAL', 'Material Escolar / Livros'],
  ['BRINQUEDOS', 'Brinquedos'],
  ['OUTROS', 'Outros'],
];

export default function CategoriasDoacao() {
  return categorias.map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>);
}
