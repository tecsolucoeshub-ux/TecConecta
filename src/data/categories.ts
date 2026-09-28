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

export const DEFAULT_BASE_CITY = { name: 'Rio Verde - GO', lat: -17.7915, lng: -50.9201 };

export const POPULAR_CITIES = [
  DEFAULT_BASE_CITY
];
