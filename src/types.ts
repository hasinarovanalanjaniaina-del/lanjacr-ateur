export type ProjectCategory = 'video' | 'audio' | 'graphisme';

export interface Project {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  mediaUrl: string; // URL for direct stream, embed, or preview
  thumbnailUrl: string; // Cover image URL
  tags: string[]; // e.g. ["Adobe Premiere", "Logic Pro", "Figma"]
  date: string; // e.g. "Mars 2026"
  client?: string;
  role?: string; // e.g. "Directeur de la photographie", "Compositeur", etc.
  duration?: string; // e.g. "3:45" or "1080p Video"
  longDescription?: string; // Full markdown or detailed story
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatarUrl: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
}

export interface Visitor {
  id: string;
  name: string;
  email: string;
  provider: 'google' | 'apple' | 'email';
  photoUrl?: string;
}


