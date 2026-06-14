import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Video, Music, Palette, ArrowRight, Eye, Mail, 
  MessageSquare, Star, ArrowUpRight, Search, FileVideo, 
  Layers, Volume2, LayoutGrid, Heart, Camera
} from 'lucide-react';

import Header from './components/Header';
import ProjectCard from './components/ProjectCard';
import ProjectModal from './components/ProjectModal';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';
import VisitorAuthModal from './components/VisitorAuthModal';

import { Project, ProjectCategory, ContactMessage, Visitor } from './types';
import { INITIAL_PROJECTS, MOCK_TESTIMONIALS } from './data/initialProjects';

// Sleek and modern editorial/creative vector portrait of Lanja as a safe design default fallback
const lanjaPortrait = `data:image/svg+xml;utf8,` + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="70%" fx="30%" fy="30%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <filter id="blurFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" />
    </filter>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="160" fill="none" stroke="url(#glow)" stroke-width="4" stroke-dasharray="10 5" opacity="0.4"/>
  <circle cx="350" cy="180" r="120" fill="url(#glow)" filter="url(#blurFilter)" opacity="0.3"/>
  <circle cx="160" cy="350" r="100" fill="#3b82f6" filter="url(#blurFilter)" opacity="0.15"/>
  <path d="M120,440 C120,380 160,320 256,320 C352,320 392,380 392,440 L392,512 L120,512 Z" fill="url(#bodyGrad)" stroke="#1e293b" stroke-width="2"/>
  <path d="M210,320 L210,360 L240,380 L256,380 L272,380 L302,360 L302,320 Z" fill="#0f172a"/>
  <path d="M210,320 C230,345 282,345 302,320" fill="none" stroke="#22d3ee" stroke-width="2" opacity="0.3"/>
  <rect x="206" y="160" width="100" height="130" rx="50" fill="#1e293b" stroke="#334155" stroke-width="3"/>
  <path d="M206,200 C206,140 306,140 306,200 C306,150 206,150 206,200 Z" fill="#0f172a"/>
  <path d="M206,190 C190,210 200,240 208,230" fill="none" stroke="#334155" stroke-width="2"/>
  <path d="M306,190 C322,210 312,240 304,230" fill="none" stroke="#334155" stroke-width="2"/>
  <rect x="216" y="200" width="34" height="24" rx="6" fill="none" stroke="#22d3ee" stroke-width="3" opacity="0.95"/>
  <rect x="262" y="200" width="34" height="24" rx="6" fill="none" stroke="#22d3ee" stroke-width="3" opacity="0.95"/>
  <line x1="250" y1="210" x2="262" y2="210" stroke="#22d3ee" stroke-width="3" opacity="0.95"/>
  <circle cx="233" cy="212" r="3" fill="#ffffff" opacity="0.8"/>
  <circle cx="279" cy="212" r="3" fill="#ffffff" opacity="0.8"/>
  <text x="40" y="60" fill="#475569" font-family="Courier, monospace" font-size="12" letter-spacing="2">DIR. ARTISTIQUE</text>
  <text x="40" y="80" fill="#22d3ee" font-family="Courier, monospace" font-size="10" opacity="0.8">[LANJA]</text>
</svg>`);

// Helper to write to localStorage safely without crashing when limits (like 5MB) are reached
const safeSetLocalStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`SafeStorage: Could not write key "${key}" to localStorage. This is expected if the content is too large (like a high-res base64 image).`, e);
  }
};

const handleJsonResponse = (res: Response) => {
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  throw new Error("Received non-JSON response from server");
};

export default function App() {
  // Core datasets
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  // Visitor Authentication State
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [isVisitorAuthOpen, setIsVisitorAuthOpen] = useState(false);

  // Selection & UI status states
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);

  // Profile Portrait state & uploader
  const [appPortrait, setAppPortrait] = useState<string>(() => {
    return localStorage.getItem('lanja_custom_portrait') || lanjaPortrait;
  });
  const [allPortraits, setAllPortraits] = useState<string[]>(() => {
    try {
      const val = localStorage.getItem('lanja_portraits_list');
      if (val) {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    const cached = localStorage.getItem('lanja_custom_portrait');
    return cached ? [cached] : [lanjaPortrait];
  });
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [isUploadingPortrait, setIsUploadingPortrait] = useState<boolean>(false);

  const handlePortraitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPortrait(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      
      // Save locally immediately for instant responsive feedback
      setAppPortrait(base64);
      safeSetLocalStorage('lanja_custom_portrait', base64);

      fetch('/api/database/portraits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      })
      .then(res => {
        if (!res.ok) throw new Error("Upload failed");
        return res.json();
      })
      .then((data) => {
        if (data.portraits) {
          setAllPortraits(data.portraits);
          safeSetLocalStorage('lanja_portraits_list', JSON.stringify(data.portraits));
        }
        window.dispatchEvent(new Event('lanja_portrait_updated'));
      })
      .catch(err => {
        console.error("Upload error cascade:", err);
        setAllPortraits(prev => {
          const updated = [...prev.filter(x => x !== base64), base64];
          safeSetLocalStorage('lanja_portraits_list', JSON.stringify(updated));
          return updated;
        });
        window.dispatchEvent(new Event('lanja_portrait_updated'));
      })
      .finally(() => {
        setIsUploadingPortrait(false);
      });
    };
    reader.readAsDataURL(file);
  };

  // Load and sync from LocalStorage
  useEffect(() => {
    // 0. Visitor Authentication Restore
    const savedVisitor = localStorage.getItem('lanja_visitor_auth');
    if (savedVisitor) {
      try {
        setVisitor(JSON.parse(savedVisitor));
      } catch (err) {
        setVisitor(null);
      }
    }

    // 1. Projects
    fetch('/api/database/projects')
      .then(handleJsonResponse)
      .then((data) => {
        if (data.success && data.projects) {
          setProjects(data.projects);
          try {
            localStorage.setItem('lanja_projects', JSON.stringify(data.projects));
          } catch (e) {
            console.warn("Unable to cache projects to localStorage.", e);
          }
        }
      })
      .catch(() => {
        const localProjects = localStorage.getItem('lanja_projects');
        if (localProjects) {
          try {
            setProjects(JSON.parse(localProjects));
          } catch (e) {
            setProjects(INITIAL_PROJECTS);
          }
        } else {
          setProjects(INITIAL_PROJECTS);
          try {
            localStorage.setItem('lanja_projects', JSON.stringify(INITIAL_PROJECTS));
          } catch (e) {
            // Silently ignore if initial defaults cannot be cached
          }
        }
      });

    // 2. Messages from database (fallback to local storage)
    fetch('/api/database/messages')
      .then(handleJsonResponse)
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages);
          localStorage.setItem('lanja_messages', JSON.stringify(data.messages));
        }
      })
      .catch(() => {
        const localMessages = localStorage.getItem('lanja_messages');
        if (localMessages) {
          try {
            setMessages(JSON.parse(localMessages));
          } catch (e) {
            setMessages([]);
          }
        }
      });
  }, []);

  // Load and sync portraits from backend
  const loadPortraits = () => {
    fetch('/api/database/portraits')
      .then(handleJsonResponse)
      .then((data) => {
        if (data.success) {
          const rawPortraits = data.portraits || [];
          if (rawPortraits.length > 0) {
            setAllPortraits(rawPortraits);
            safeSetLocalStorage('lanja_portraits_list', JSON.stringify(rawPortraits));
            
            const activeRaw = data.activePortrait;
            if (activeRaw) {
              setAppPortrait(activeRaw);
              safeSetLocalStorage('lanja_custom_portrait', activeRaw);
            } else {
              setAppPortrait(rawPortraits[0]);
              safeSetLocalStorage('lanja_custom_portrait', rawPortraits[0]);
            }
          } else {
            // Server returned empty, auto-restore if we have local custom backup
            const savedCustom = localStorage.getItem('lanja_custom_portrait');
            if (savedCustom && savedCustom !== lanjaPortrait && !savedCustom.startsWith('http')) {
              console.log("Empty server portraits, auto-restoring from localStorage...");
              fetch('/api/database/portraits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: savedCustom })
              })
              .then(handleJsonResponse)
              .then(restoreData => {
                if (restoreData.success && restoreData.portraits) {
                  setAllPortraits(restoreData.portraits);
                  safeSetLocalStorage('lanja_portraits_list', JSON.stringify(restoreData.portraits));
                }
              })
              .catch(err => console.error("Auto-restore portrait failed:", err));
            } else {
              setAllPortraits([lanjaPortrait]);
              setAppPortrait(lanjaPortrait);
              try {
                localStorage.removeItem('lanja_custom_portrait');
                localStorage.removeItem('lanja_portraits_list');
              } catch (e) {}
            }
          }
        }
      })
      .catch((err) => {
        console.warn("Failed to load portraits from server, using local fallback:", err);
        const custom = localStorage.getItem('lanja_custom_portrait');
        const customListStr = localStorage.getItem('lanja_portraits_list');
        if (custom) {
          setAppPortrait(custom);
          if (customListStr) {
            try {
              const parsed = JSON.parse(customListStr);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setAllPortraits(parsed);
              } else {
                setAllPortraits([custom]);
              }
            } catch (e) {
              setAllPortraits([custom]);
            }
          } else {
            setAllPortraits([custom]);
          }
        } else {
          setAppPortrait(lanjaPortrait);
          setAllPortraits([lanjaPortrait]);
        }
      });
  };

  useEffect(() => {
    loadPortraits();

    const handleSync = () => {
      loadPortraits();
    };

    window.addEventListener('lanja_portrait_updated', handleSync);
    return () => {
      window.removeEventListener('lanja_portrait_updated', handleSync);
    };
  }, []);

  // Sync carousel index with active portrait initially or on updates
  useEffect(() => {
    if (allPortraits.length > 0) {
      const idx = allPortraits.indexOf(appPortrait);
      if (idx !== -1) {
        setCarouselIndex(idx);
      } else {
        setCarouselIndex(0);
      }
    }
  }, [appPortrait, allPortraits]);

  // Autoplay slideshow for profile portraits if there are multiple images
  useEffect(() => {
    if (allPortraits.length <= 1) return;

    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % allPortraits.length);
    }, 4005); // cycle photo focus every 4 seconds

    return () => clearInterval(timer);
  }, [allPortraits]);

  // Sync state mutation assistants
  const handleAddNewMessage = (newMessage: ContactMessage) => {
    // Optimistic UI state update
    const updatedMessages = [newMessage, ...messages];
    setMessages(updatedMessages);
    localStorage.setItem('lanja_messages', JSON.stringify(updatedMessages));

    // Persist real-time to SQLite-like backend
    fetch('/api/database/messages/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newMessage.name,
        email: newMessage.email,
        subject: newMessage.subject,
        message: newMessage.message
      })
    })
    .then((res) => {
      if (res.ok) {
        return fetch('/api/database/messages')
          .then((r) => r.json())
          .then((data) => {
            if (data.messages) {
              setMessages(data.messages);
              localStorage.setItem('lanja_messages', JSON.stringify(data.messages));
            }
          });
      }
    })
    .catch((err) => console.error("Failed to persist message to base:", err));
  };

  const handleUpdateProjects = (newProjects: Project[]) => {
    setProjects(newProjects);
    try {
      localStorage.setItem('lanja_projects', JSON.stringify(newProjects));
    } catch (e) {
      console.warn("Storage quota limit reached for local cache. Entirely stored on the server database instead.", e);
    }
    fetch('/api/database/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects: newProjects })
    })
    .catch((err) => console.error("Failed to sync projects count with backend server:", err));
  };

  const handleRefreshDemos = () => {
    handleUpdateProjects(INITIAL_PROJECTS);
  };

  const handleVisitorLogin = (newVisitor: Visitor) => {
    setVisitor(newVisitor);
    localStorage.setItem('lanja_visitor_auth', JSON.stringify(newVisitor));
  };

  const handleVisitorLogout = () => {
    if (visitor) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: visitor.email, name: visitor.name })
      }).catch(err => console.error("Logout trace failed:", err));
    }
    setVisitor(null);
    localStorage.removeItem('lanja_visitor_auth');
  };

  // Helper edit project click from cards inside admin session
  const handleEditProjectFromCard = (project: Project) => {
    setIsAdminView(true);
    // Find admin section after rendering
    setTimeout(() => {
      const el = document.getElementById('admin-toggle-desktop');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  // Filter projects depending on Search bar input and category filters
  const filteredProjects = projects.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  // Calculate generic counts
  const videoCount = projects.filter((p) => p.category === 'video').length;
  const audioCount = projects.filter((p) => p.category === 'audio').length;
  const graphismeCount = projects.filter((p) => p.category === 'graphisme').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-900 leading-normal scroll-smooth">
      
      {/* Dynamic Navigation Top Area */}
      <Header
        activeCategory={activeCategory}
        setActiveCategory={(cat) => {
          setActiveCategory(cat);
          // If in admin mode, take them out to appreciate the real list
          if (isAdminView) setIsAdminView(false);
        }}
        isAdmin={isAdminView}
        onToggleAdmin={() => setIsAdminView(!isAdminView)}
        visitor={visitor}
        onLogoutVisitor={handleVisitorLogout}
        onOpenLogin={() => setIsVisitorAuthOpen(true)}
        activePortrait={appPortrait}
      />

      {/* Conditionally Render Custom Admin Panel as full screen display or back office */}
      {isAdminView ? (
        <AdminPanel
          onClose={() => setIsAdminView(false)}
          projects={projects}
          setProjects={handleUpdateProjects}
          onRefreshDemos={handleRefreshDemos}
          messages={messages}
          setMessages={setMessages}
          visitor={visitor}
        />
      ) : (
        /* MAIN VISITOR PORTFOLIO SHOWCASE SCREEN */
        <main className="flex-grow">
          
          {/* HERO SECTION DE LANJA */}
          <section id="hero" className="relative overflow-hidden pt-20 pb-20 md:pt-28 md:pb-32 bg-slate-950">
            {/* Ambient Background decoration colors and grids */}
            <div className="absolute inset-0 z-0">
              <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[130px] animate-pulse pointer-events-none" />
              <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Left bio details context column : 7/12 */}
                <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                  
                  {/* Floating welcome signature brand */}
                  <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 text-xs font-semibold uppercase tracking-wider shadow">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    <span>Créateur de Contenu Numérique</span>
                  </div>

                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-sans font-black tracking-tight leading-none text-white">
                    Façonner l'image,<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500">
                      sculpter le son.
                    </span>
                  </h2>

                  <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed whitespace-pre-line">
                    {`Bonjour et bienvenue sur mon portfolio.

Je m'appelle Lanjaniaina Hasinarovana, Monteur Vidéo, Éditeur Audio et Graphiste depuis octobre 2023. Passionné par la création numérique, je mets mon savoir-faire au service des créateurs, entrepreneurs et entreprises afin de concevoir des contenus visuels et audiovisuels professionnels, modernes et impactants.

À travers chaque projet, je privilégie la créativité, la qualité et le souci du détail afin de répondre au mieux aux attentes de mes clients. Mon objectif est de transformer chaque idée en une réalisation unique qui valorise l'image de marque et capte l'attention du public.

Je suis toujours motivé à relever de nouveaux défis et à participer à des projets ambitieux en apportant des solutions créatives adaptées à chaque besoin.

Lanjaniaina Hasinarovana
Monteur Vidéo • Éditeur Audio • Graphiste
Depuis oct`}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                    <a
                      href="#realisations-section"
                      className="w-full sm:w-auto text-center px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/10 flex items-center justify-center space-x-2 cursor-pointer transition-all hover:scale-105"
                    >
                      <span>Découvrir mes Réalisations</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </a>
                    
                    <a
                      href="#contact-footer"
                      className="w-full sm:w-auto text-center px-6 py-3.5 bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 text-slate-300 font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all hover:border-slate-600"
                    >
                      <span>Démarrons un Projet</span>
                    </a>
                  </div>
                  
                </div>

                {/* Right Interactive Bento illustration column: 5/12 */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                  
                  {/* Portrait Photo de Lanja (Top Card) */}
                  <div className="p-0.5 rounded-2xl bg-gradient-to-br from-cyan-400/20 via-indigo-500/20 to-purple-500/20 border border-slate-800 shadow-xl overflow-hidden hover:border-cyan-400/50 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 col-span-2 relative group select-none">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent z-10 pointer-events-none" />
                    
                    <div className="relative w-full h-80 overflow-hidden rounded-xl bg-slate-950">
                      <AnimatePresence mode="popLayout">
                        <motion.img 
                          key={allPortraits[carouselIndex] || appPortrait}
                          src={allPortraits[carouselIndex] || appPortrait} 
                          alt="Lanja - Créateur de Contenu" 
                          referrerPolicy="no-referrer"
                          initial={{ opacity: 0, scale: 1.02 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                          className="absolute inset-0 w-full h-full object-cover object-top"
                        />
                      </AnimatePresence>
                    </div>
                    
                    {/* Carousel Navigation Arrows */}
                    {allPortraits.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCarouselIndex((prev) => (prev === 0 ? allPortraits.length - 1 : prev - 1));
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 flex items-center justify-center transition-all duration-300 shadow-md opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
                          title="Image précédente"
                        >
                          <span className="text-sm font-bold">←</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCarouselIndex((prev) => (prev + 1) % allPortraits.length);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 flex items-center justify-center transition-all duration-300 shadow-md opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
                          title="Image suivante"
                        >
                          <span className="text-sm font-bold">→</span>
                        </button>

                        {/* Pagination Dots indicator */}
                        <div className="absolute top-4 left-4 z-20 flex space-x-1 px-2 py-1 rounded-full bg-slate-950/60 backdrop-blur-md border border-slate-800/40">
                          {allPortraits.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCarouselIndex(i);
                              }}
                              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                i === carouselIndex ? 'bg-cyan-400 w-3.5' : 'bg-slate-600 hover:bg-slate-400'
                              }`}
                              title={`Aller à l'image ${i + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    {/* Portrait upload interactive button */}
                    <button
                      type="button"
                      onClick={() => document.getElementById('portrait-real-root-file-upload')?.click()}
                      disabled={isUploadingPortrait}
                      className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800/85 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 flex items-center justify-center transition-all duration-300 shadow-xl opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer"
                      title="Changer de photo (png, jpg, etc.)"
                    >
                      {isUploadingPortrait ? (
                        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </button>
                    <input 
                      type="file" 
                      id="portrait-real-root-file-upload" 
                      accept="image/*" 
                      onChange={handlePortraitUpload} 
                      className="hidden" 
                    />

                    <div className="absolute bottom-4 left-4 right-4 z-20">
                      <span className="px-2.5 py-0.5 bg-cyan-400 text-slate-950 text-[10px] font-mono font-bold uppercase rounded-md tracking-wider mb-1.5 inline-block">
                        Directeur Artistique
                      </span>
                      <h4 className="font-sans text-xl font-black text-white">Lanja</h4>
                      <p className="text-xs text-slate-300/90 font-medium">Spécialiste de l'interdépendance du son, de la vidéo et du graphisme.</p>
                    </div>
                  </div>

                  {/* Card 1: Video badge */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-850 shadow-lg space-y-3 hover:border-rose-500/30 transition-transform duration-300 hover:-translate-y-1">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 flex items-center justify-center">
                      <Video className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Vidéo & Cinéma</h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{videoCount} Projets Rentrés</p>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">Courts-métrages, étalonnage couleur, montages et clips de marque.</p>
                  </div>

                  {/* Card 2: Audio/Music badge */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-850 shadow-lg space-y-3 hover:border-purple-500/30 transition-transform duration-300 hover:-translate-y-1">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-450 flex items-center justify-center">
                      <Music className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Création Audio</h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{audioCount} Compositions</p>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">Sound design, Foley, musiques rétro & modernes, mixage de podcasts.</p>
                  </div>

                  {/* Card 3: Graphics designs badge */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-850 shadow-lg space-y-3 hover:border-emerald-500/30 transition-transform duration-300 hover:-translate-y-1 col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 flex items-center justify-center">
                          <Palette className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">Identité Visuelle & Dessin</h4>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{graphismeCount} Dossiers Graphiques</p>
                        </div>
                      </div>
                      <span className="hidden sm:inline-block px-2.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/30">vector & mat-textures</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Créations vectorielles durables, packagings éco-responsables, bannières d’exposition, interfaces applicatives et chartes de style complètes.
                    </p>
                  </div>

                </div>

              </div>
            </div>
          </section>

          {/* DYNAMIC BIO STATS BAR */}
          <section className="bg-slate-950/60 border-t border-b border-slate-900 py-8 select-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="space-y-1 border-r border-slate-800/60 last:border-0">
                  <div className="text-3xl font-mono font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                    {projects.length}+
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono uppercase tracking-widest">PROJETS DE CATALOGUE</p>
                </div>
                <div className="space-y-1 md:border-r border-slate-800/60">
                  <div className="text-3xl font-mono font-bold text-white">100%</div>
                  <p className="text-[11px] text-slate-500 font-mono uppercase tracking-widest">Satisfaction client</p>
                </div>
                <div className="space-y-1 border-r border-slate-800/60 last:border-0 pt-4 sm:pt-0">
                  <div className="text-3xl font-mono font-bold text-white">3</div>
                  <p className="text-[11px] text-slate-500 font-mono uppercase tracking-widest">MÉTIERS MULTIMÉDIA</p>
                </div>
                <div className="space-y-1 pt-4 sm:pt-0">
                  <div className="text-3xl font-mono font-bold text-cyan-400">24/7</div>
                  <p className="text-[11px] text-slate-500 font-mono uppercase tracking-widest">Support &amp; Conseil</p>
                </div>
              </div>
            </div>
          </section>


          {/* THE CATALOGUE GALLERY SECTION */}
          <section id="realisations-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-10">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-900 pb-6">
              <div>
                <span className="text-cyan-400 font-mono text-xs uppercase tracking-widest block mb-1">
                  Catalogue officiel de Lanja Créateur
                </span>
                <h3 className="text-2xl sm:text-3xl font-sans font-black text-white">
                  Mes Réalisations Marquantes
                </h3>
              </div>
              
              {/* Dynamic search bar inside container */}
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher par outil, tag ou titre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:border-cyan-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-xs font-bold"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>

            {/* List count statement */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono select-none">
              <span>Filtre courant : <strong>{activeCategory === 'all' ? 'Toutes les catégories' : activeCategory}</strong></span>
              <span>{filteredProjects.length} résultat(s) trouvé(s)</span>
            </div>

            {/* Empty result indicator fallback */}
            {filteredProjects.length === 0 ? (
              <div className="text-center p-16 bg-slate-900/30 border border-dashed border-slate-850 rounded-2xl max-w-lg mx-auto space-y-4">
                <LayoutGrid className="w-10 h-10 text-slate-650 mx-auto" />
                <h5 className="font-bold text-white text-base">Aucune réalisation ne correspond à votre recherche</h5>
                <p className="text-slate-400 text-xs">
                  Essayez de rechercher d'autres mots-clés ou modifiez votre filtre de catégories ci-dessus.
                </p>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 font-bold"
                >
                  Réinitialiser la galerie
                </button>
              </div>
            ) : (
              /* Bento or Grid listing of projects */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((proj) => (
                  <ProjectCard
                    key={proj.id}
                    project={proj}
                    onView={(p) => setSelectedProject(p)}
                    isAdmin={visitor?.email?.toLowerCase() === 'hasinarovanalanjaniaina@gmail.com'}
                    onEdit={handleEditProjectFromCard}
                    onDelete={(id) => {
                      const updated = projects.filter((p) => p.id !== id);
                      handleUpdateProjects(updated);
                    }}
                  />
                ))}
              </div>
            )}

          </section>


          {/* TESTIMONIALS SECTION */}
          <section className="bg-slate-950/40 border-t border-b border-slate-900 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              
              <div className="text-center max-w-lg mx-auto space-y-2">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">TEMOIGNAGES CLIENTS</span>
                <h3 className="text-2xl font-sans font-black text-white">Ce qu'ils disent de ma rigueur</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {MOCK_TESTIMONIALS.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-6 rounded-2xl bg-slate-900/80 border border-slate-850 shadow-md space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex text-amber-500 gap-0.5">
                        <Star className="w-4 h-4 fill-amber-500" />
                        <Star className="w-4 h-4 fill-amber-500" />
                        <Star className="w-4 h-4 fill-amber-500" />
                        <Star className="w-4 h-4 fill-amber-500" />
                        <Star className="w-4 h-4 fill-amber-500" />
                      </div>
                      <p className="text-slate-300 text-xs italic sm:text-sm leading-relaxed">
                        "{item.content}"
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 pt-4 border-t border-slate-800/50">
                      <img 
                        src={item.avatarUrl} 
                        alt={item.name} 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-slate-700" 
                      />
                      <div>
                        <h5 className="text-xs sm:text-sm font-bold text-white">{item.name}</h5>
                        <p className="text-[11px] text-slate-500">{item.role} • <span className="text-cyan-600 font-mono font-medium">{item.company}</span></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>

        </main>
      )}

      {/* FOOTER & CONTACT SUBMISSION LOGIC */}
      <Footer 
        onMessageAdded={handleAddNewMessage}
        visitor={visitor}
        onOpenLogin={() => setIsVisitorAuthOpen(true)}
      />

      {/* POPUP DETAIL MODAL IF SELECTED */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* VISITOR AUTH MODAL CONTROL */}
      {isVisitorAuthOpen && (
        <VisitorAuthModal
          onClose={() => setIsVisitorAuthOpen(false)}
          onLoginSuccess={handleVisitorLogin}
        />
      )}

    </div>
  );
}
