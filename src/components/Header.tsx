import { useState, useEffect } from 'react';
import { 
  Sparkles, Lock, Code, Video, Music, Palette, FolderHeart, 
  Menu, X, LogIn, LogOut, UserCheck 
} from 'lucide-react';
import { ProjectCategory, Visitor } from '../types';
const lanjaPortrait = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&auto=format&fit=crop";

interface HeaderProps {
  activeCategory: ProjectCategory | 'all';
  setActiveCategory: (category: ProjectCategory | 'all') => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  visitor: Visitor | null;
  onLogoutVisitor: () => void;
  onOpenLogin: () => void;
  activePortrait?: string;
}

export default function Header({
  activeCategory,
  setActiveCategory,
  isAdmin,
  onToggleAdmin,
  visitor,
  onLogoutVisitor,
  onOpenLogin,
  activePortrait = lanjaPortrait
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories: { value: ProjectCategory | 'all'; label: string; icon: any }[] = [
    { value: 'all', label: 'Toutes les créations', icon: FolderHeart },
    { value: 'video', label: 'Réalisation Vidéo', icon: Video },
    { value: 'audio', label: 'Bande Son & Audio', icon: Music },
    { value: 'graphisme', label: 'Graphisme & Design', icon: Palette },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Brand / Identity */}
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => setActiveCategory('all')}>
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg overflow-hidden group-hover:scale-105 transition-transform duration-300">
              <span className="font-sans font-black text-xl italic tracking-wider">LC</span>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div>
              <h1 className="font-sans font-bold text-xl tracking-wide text-white group-hover:text-cyan-400 transition-colors duration-300">
                Lanja Créateur
              </h1>
              <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                Studio Multimédia
              </p>
            </div>
          </div>

          {/* Desktop Filter Navigation */}
          <nav className="hidden md:flex space-x-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  id={`filter-btn-${cat.value}`}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Admin Toggle Button & Visitor Session Status */}
          <div className="hidden md:flex items-center space-x-3">
            {visitor ? (
              <div className="flex items-center space-x-2.5 bg-slate-950/70 pl-2 px-3 py-1.5 rounded-xl border border-slate-850 shadow-sm animate-fadeIn">
                {visitor.email?.toLowerCase() === 'hasinarovanalanjaniaina@gmail.com' ? (
                  <img 
                    src={activePortrait} 
                    alt="Lanja" 
                    className="w-6 h-6 rounded-full object-cover border border-cyan-500/30"
                    referrerPolicy="no-referrer"
                  />
                ) : visitor.photoUrl ? (
                  <img 
                    src={visitor.photoUrl} 
                    alt={visitor.name} 
                    className="w-6 h-6 rounded-full object-cover border border-slate-850"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400/20 to-blue-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs select-none">
                    {visitor.name.substring(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="text-left leading-none">
                  <div className="text-[11px] font-bold text-slate-100 max-w-[95px] truncate">{visitor.name}</div>
                  <div className="text-[8.5px] font-mono text-slate-500 mt-0.5 capitalize flex items-center gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                    <span>{visitor.provider}</span>
                  </div>
                </div>
                <button 
                  onClick={onLogoutVisitor}
                  title="Se déconnecter (Espace Visiteur)"
                  className="ml-1 p-1 text-slate-500 hover:text-rose-450 rounded hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-950 border border-slate-805 text-slate-350 hover:text-white hover:border-slate-700 hover:bg-slate-900/60 rounded-xl text-xs font-semibold cursor-pointer transition-all animate-fadeIn"
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Se connecter / S'inscrire</span>
              </button>
            )}

            {visitor?.email?.toLowerCase() === 'hasinarovanalanjaniaina@gmail.com' && (
              <button
                id="admin-toggle-desktop"
                onClick={onToggleAdmin}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-300 ${
                  isAdmin
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                    : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-100 bg-slate-900/40 hover:bg-slate-850/50'
                }`}
              >
                <Lock className={`w-3.5 h-3.5 ${isAdmin ? 'text-cyan-400 animate-pulse' : 'text-slate-550'}`} />
                <span>{isAdmin ? 'Console' : 'Admin'}</span>
              </button>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="md:hidden flex items-center">
            <button
              id="mobile-menu-trigger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-400 hover:text-white focus:outline-none p-2 rounded-lg bg-slate-800/40 border border-slate-700/50"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-lg px-4 py-6 space-y-6 animate-fadeIn duration-200">
          <div className="space-y-2">
            <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase px-2 mb-3">
              Filtrer par Catégorie
            </p>
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  id={`mobile-filter-btn-${cat.value}`}
                  onClick={() => {
                    setActiveCategory(cat.value);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5 text-slate-400" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-850 space-y-3">
            {visitor ? (
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2.5">
                  {visitor.email?.toLowerCase() === 'hasinarovanalanjaniaina@gmail.com' ? (
                    <img 
                      src={activePortrait} 
                      alt="Lanja" 
                      className="w-8 h-8 rounded-full object-cover border border-cyan-500/30" 
                      referrerPolicy="no-referrer"
                    />
                  ) : visitor.photoUrl ? (
                    <img 
                      src={visitor.photoUrl} 
                      alt={visitor.name} 
                      className="w-8 h-8 rounded-full object-cover border border-slate-700" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xs">
                      {visitor.name.substring(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h5 className="text-xs font-bold text-white">{visitor.name}</h5>
                    <p className="text-[10px] text-slate-500 font-mono capitalize">{visitor.provider} connecté</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onLogoutVisitor();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onOpenLogin();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/25 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Se connecter / S'inscrire</span>
              </button>
            )}

            {visitor?.email?.toLowerCase() === 'hasinarovanalanjaniaina@gmail.com' && (
              <button
                id="admin-toggle-mobile"
                onClick={() => {
                  onToggleAdmin();
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3.5 rounded-xl border text-sm font-semibold transition-all ${
                  isAdmin
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                    : 'border-slate-800 text-slate-300 bg-slate-900/60'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>{isAdmin ? 'Quitter Console Admin' : 'Accéder à l\'Espace Admin'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
