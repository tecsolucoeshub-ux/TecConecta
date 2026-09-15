export interface CategoryMeta {
  id: string;
  name: string;
  color: string;
  accent: string;
  tag: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'all', name: 'Todas as Categorias', color: '#00E5FF', accent: '#0B132B', tag: 'Todos' },
  { id: 'solucoes-ia', name: 'Soluções com IA', color: '#00E5FF', accent: '#FF6B00', tag: 'IA & Tech' },
  { id: 'diarista', name: 'Diarista & Limpeza', color: '#00E5FF', accent: '#00B4D8', tag: 'Diarista' },
  { id: 'eletricista', name: 'Eletricista', color: '#FFB703', accent: '#FF6B00', tag: 'Eletricista' },
  { id: 'pintor', name: 'Pintor & Acabamentos', color: '#FF6B00', accent: '#E63946', tag: 'Pintor' },
  { id: 'encanador', name: 'Encanador & Hidráulica', color: '#48CAE4', accent: '#0077B6', tag: 'Encanador' },
  { id: 'reformas', name: 'Pedreiro & Reformas', color: '#FB8500', accent: '#D90429', tag: 'Reformas' },
  { id: 'loja', name: 'Loja de Bairro & Comércio', color: '#2EC4B6', accent: '#00F5D4', tag: 'Comércio' },
  { id: 'mecanica', name: 'Mecânica & Auto Socorro', color: '#F77F00', accent: '#D62828', tag: 'Mecânica' },
  { id: 'beleza', name: 'Beleza & Barbearia', color: '#F72585', accent: '#B5179E', tag: 'Beleza' },
  { id: 'tecnologia', name: 'Celulares & Informática', color: '#00E5FF', accent: '#7209B7', tag: 'Tecnologia' },
  { id: 'fretes', name: 'Fretes & Carretos', color: '#FF9E00', accent: '#9D0208', tag: 'Fretes' },
  { id: 'alimentacao', name: 'Alimentação & Confeitaria', color: '#FF5400', accent: '#F72585', tag: 'Alimentação' },
  { id: 'aulas', name: 'Aulas & Suporte', color: '#4CC9F0', accent: '#4361EE', tag: 'Aulas' }
];

export const POPULAR_CITIES = [
  { name: 'Rio Verde - GO', lat: -17.7915, lng: -50.9201 },
  { name: 'São Paulo - SP', lat: -23.55052, lng: -46.633308 },
  { name: 'Rio de Janeiro - RJ', lat: -22.906847, lng: -43.172896 },
  { name: 'Belo Horizonte - MG', lat: -19.916681, lng: -43.934493 },
  { name: 'Curitiba - PR', lat: -25.428954, lng: -49.267137 },
  { name: 'Salvador - BA', lat: -12.971599, lng: -38.501594 },
  { name: 'Campinas - SP', lat: -22.90556, lng: -47.06083 }
];
