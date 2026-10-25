export type ChallengeCategory = 'Cities' | 'Countries' | 'Seas & oceans' | 'Random places';

export type Question = {
  id: string;
  category: ChallengeCategory;
  clue: string;
  answer: string;
  region: string;
  lore: string;
  lat: number;
  lng: number;
  difficulty: 'Open' | 'Signal' | 'Wild';
  scoreCapKm: number;
};

export const DAILY_QUESTIONS: Question[] = [
  {
    id: 'silence-at-64',
    category: 'Random places',
    clue: 'This island has no native land mammals beyond the Arctic fox. Drop your pin.',
    answer: 'Iceland',
    region: 'North Atlantic',
    lore: 'The Arctic fox crossed the sea ice before people arrived. Iceland has no native terrestrial mammals besides it.',
    lat: 64.9631,
    lng: -19.0208,
    difficulty: 'Signal',
    scoreCapKm: 10000,
  },
  {
    id: 'two-wheel-capital',
    category: 'Cities',
    clue: 'More bicycles than residents. A city built for the quiet lane.',
    answer: 'Copenhagen',
    region: 'Northern Europe',
    lore: 'Copenhagen has more bicycles than residents and a cycling network that runs for hundreds of kilometres.',
    lat: 55.6761,
    lng: 12.5683,
    difficulty: 'Open',
    scoreCapKm: 2500,
  },
  {
    id: 'old-water',
    category: 'Seas & oceans',
    clue: 'The deepest lake on Earth is hidden in a crescent of Siberian forest.',
    answer: 'Lake Baikal',
    region: 'Siberia, Russia',
    lore: 'Lake Baikal reaches 1,642 metres and contains roughly a fifth of the world’s unfrozen fresh surface water.',
    lat: 53.5,
    lng: 108.165,
    difficulty: 'Signal',
    scoreCapKm: 14000,
  },
  {
    id: 'mountain-kingdom',
    category: 'Countries',
    clue: 'This mountain kingdom is entirely surrounded by one other country.',
    answer: 'Lesotho',
    region: 'Southern Africa',
    lore: 'Lesotho is the only independent state in the world that lies entirely above 1,000 metres in elevation.',
    lat: -29.61,
    lng: 28.23,
    difficulty: 'Open',
    scoreCapKm: 8000,
  },
  {
    id: 'fog-desert',
    category: 'Random places',
    clue: 'The driest non-polar desert begins here, where fog keeps life moving.',
    answer: 'Atacama Desert',
    region: 'Northern Chile',
    lore: 'Some parts of the Atacama can go years without measurable rain, yet coastal fog sustains a narrow band of life.',
    lat: -24.5,
    lng: -69.25,
    difficulty: 'Wild',
    scoreCapKm: 10000,
  },
];

export const CATEGORY_DESCRIPTIONS: Record<ChallengeCategory, string> = {
  Cities: 'Precision at street level.',
  Countries: 'Read the borders.',
  'Seas & oceans': 'Trust the vastness.',
  'Random places': 'Follow the strange clue.',
};

export function scoreGuess(guess: { lat: number; lng: number }, target: Question, questionIndex: number) {
  const earthRadiusKm = 6371;
  const lat1 = (guess.lat * Math.PI) / 180;
  const lat2 = (target.lat * Math.PI) / 180;
  const deltaLat = ((target.lat - guess.lat) * Math.PI) / 180;
  const deltaLng = ((target.lng - guess.lng) * Math.PI) / 180;
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const distanceKm = earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const accuracy = Math.max(0, 1 - Math.log10(distanceKm + 1) / Math.log10(target.scoreCapKm + 1));
  const precisionScore = Math.round(accuracy ** 1.18 * 900);
  const speedBonus = 45 + Math.max(0, 45 - questionIndex * 3);
  const difficultyBonus = target.difficulty === 'Wild' ? 100 : target.difficulty === 'Signal' ? 60 : 25;
  const points = Math.max(0, Math.min(1000, precisionScore + speedBonus + difficultyBonus));
  const feeling = distanceKm <= 25 ? 'Bullseye' : distanceKm <= 150 ? 'So close' : distanceKm <= 800 ? 'Good read' : distanceKm <= 3000 ? 'Right region' : 'New territory';
  return { distanceKm: Math.round(distanceKm), points, feeling };
}
