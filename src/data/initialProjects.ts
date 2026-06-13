import { Project } from '../types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'vid-1',
    title: 'Lumières Urbaines - Court Métrage',
    description: 'Une exploration cinématographique nocturne capturant l\'âme vibrante et solitaire de la métropole moderne.',
    category: 'video',
    mediaUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Standard embed fallback
    thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    tags: ['Réalisation', 'Étalonnage', 'Sony FX3', 'Premiere Pro'],
    date: 'Mai 2026',
    client: 'Production Indépendante',
    role: 'Réalisateur & Chef Opérateur',
    duration: '4:20 min',
    longDescription: 'Ce projet est né du désir d\'immortaliser le rythme nocturne de la ville, entre mélancolie et néons éblouissants. Entièrement tourné en conditions de basse lumière avec une caméra hybride haute sensibilité, le défi résidait dans la préservation des détails dans les ombres tout en créant un contraste de couleurs chaud/froid saisissant.'
  },
  {
    id: 'vid-2',
    title: 'Horizon Électrique - Publicité de Marque',
    description: 'Spot promotionnel dynamique pour la nouvelle gamme de vélos électriques urbains durables.',
    category: 'video',
    mediaUrl: 'https://player.vimeo.com/video/503437142', // Standard public creative common content
    thumbnailUrl: 'https://images.unsplash.com/photo-1507036066871-b7e8032b3dea?auto=format&fit=crop&w=800&q=80',
    tags: ['Motion Design', 'After Effects', 'Sound Design'],
    date: 'Février 2026',
    client: 'Velos Horizon',
    role: 'Directeur Artistique & Monteur',
    duration: '0:45 min',
    longDescription: 'Une publicité courte et énergique alliant des prises de vue réelles rapides et des overlays de motion design minimalistes pour accentuer les caractéristiques technologiques du produit. L\'esthétique générale est épurée, moderne et résolument tournée vers le futur de la mobilité urbaine.'
  },
  {
    id: 'aud-1',
    title: 'Échos Cosmiques - Synthwave Ambient',
    description: 'Une bande originale synthétique inspirée de la science-fiction rétro des années 80, riche en textures analogiques.',
    category: 'audio',
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Playable public MP3 for real audio preview
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    tags: ['Production', 'Syntétiseurs', 'Logic Pro X', 'Bande Originale'],
    date: 'Avril 2026',
    client: 'Projet Personnel',
    role: 'Compositeur & Concepteur Sonore',
    duration: '6:12 min',
    longDescription: 'Bande sonore originale créée pour un projet de jeu vidéo rétro conceptuel. Composée entièrement à l\'aide d\'émulations de synthétiseurs vintage emblématiques (Juno-106, Prophet-5), elle mêle nappes de basse enveloppantes et arpèges scintillants pour évoquer le mystère de l\'espace infini.'
  },
  {
    id: 'aud-2',
    title: 'Fréquences de l\'Ombre - Podcast Audio',
    description: 'Identité sonore complète et mixage pour le podcast d\'investigation criminelle à suspense.',
    category: 'audio',
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
    tags: ['Conception Sonore', 'Mixage', 'Pro Tools', 'Foley'],
    date: 'Janvier 2026',
    client: 'Studios Voix Rouge',
    role: 'Monteur Son & Mixeur',
    duration: '22:40 min',
    longDescription: 'Pour ce podcast haut de gamme, l\'accent a été mis sur l\'immersion psychologique. Chaque silence, chaque bruissement subtil de foley et chaque ambiance sonore de fond ont été sculptés méticuleusement pour maintenir l\'auditeur dans un état de tension narrative constante.'
  },
  {
    id: 'gra-1',
    title: 'Identité Visuelle - Bloom Café Noir',
    description: 'Charte graphique complète et packaging éco-responsable pour un torréfacteur de café de spécialité.',
    category: 'graphisme',
    mediaUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80',
    tags: ['Branding', 'Packaging', 'Illustrator', 'Direction Artistique'],
    date: 'Mars 2026',
    client: 'Bloom Café Noir',
    role: 'Designer Graphique',
    duration: 'Haute Résolution',
    longDescription: 'Conception d\'une identité de marque épurée qui allie le raffinement moderne à la terre organique du café. Le logo s\'inspire des cernes d\'un tronc d\'arbre et des courbes de niveau des collines de torréfaction. Les étiquettes utilisent une typographie à empattement affirmée contrastant avec des textures mates.'
  },
  {
    id: 'gra-2',
    title: 'Affiche "Odyssée Artificielle"',
    description: 'Conception graphique et affiche d\'exposition explorant la convergence de la créativité humaine et du code algorithmique.',
    category: 'graphisme',
    mediaUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80',
    tags: ['Affiche Art', 'Photoshop', 'Composition 3D', 'Typographie'],
    date: 'Décembre 2025',
    client: 'Institut des Arts du Futur',
    role: 'Artiste Numérique',
    duration: 'Format Vectoriel',
    longDescription: 'Visualisation abstraite de la fusion cognitive de l\'esprit humain et de l\'intelligence artificielle. Réalisée en combinant des structures géométriques rigides crémées procéduralement et de fluides tourbillons de poudres métalliques colorées en post-production.'
  }
];

export const MOCK_TESTIMONIALS = [
  {
    id: 't-1',
    name: 'Sonia Rakoto',
    role: 'Directrice Marketing',
    company: 'Bloom Café',
    content: 'Collaborer avec Lanja a transformé radicalement l\'image de notre marque. Sa capacité à comprendre instantanément l\'essence de notre projet et à la retranscrire en designs sublimes est remarquable.',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80'
  },
  {
    id: 't-2',
    name: 'Julien Mercier',
    role: 'Producteur',
    company: 'Studios Voix Rouge',
    content: 'Le travail sonore fourni par Lanja est d\'une précision d\'horloger. Notre podcast a gagné une crédibilité immédiate grâce à sa conception de foley haut de gamme et son mixage enveloppant.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80'
  }
];
