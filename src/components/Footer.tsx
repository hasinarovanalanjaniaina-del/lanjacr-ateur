import React, { useState, useEffect } from 'react';
import { 
  Send, Mail, Phone, MapPin, Youtube, Music, Palette, 
  Linkedin, Github, CheckCircle, Flame, Server, Lock, UserCheck, Chrome, Apple, Facebook
} from 'lucide-react';
import { ContactMessage, Visitor } from '../types';

interface FooterProps {
  onMessageAdded: (message: ContactMessage) => void;
  visitor: Visitor | null;
  onOpenLogin: () => void;
}

export default function Footer({ onMessageAdded, visitor, onOpenLogin }: FooterProps) {
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Interaction states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Dynamically sync visitor details when authenticated
  useEffect(() => {
    if (visitor) {
      setName(visitor.name);
      setEmail(visitor.email);
    } else {
      setName('');
      setEmail('');
    }
  }, [visitor]);

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMsg('Veuillez remplir tous les champs du formulaire.');
      return;
    }

    setIsSubmitting(true);

    // Simulate small latency to feel real & high-quality
    setTimeout(() => {
      const newMessage: ContactMessage = {
        id: `msg-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        date: new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        read: false
      };

      // Call handler to update App State and LocalStorage
      onMessageAdded(newMessage);

      // Clean inputs
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setIsSubmitting(false);
      setSuccess(true);

      // Dismiss success alert in 6 sec
      setTimeout(() => setSuccess(false), 6000);
    }, 900);
  };

  return (
    <footer id="contact-footer" className="bg-slate-950 text-white pt-16 pb-10 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
          
          {/* Column 1: Brand & Bio: 4/12 */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-sans font-black tracking-wider shadow">
                LC
              </div>
              <h3 className="font-sans font-bold text-lg text-white">Lanja Créateur</h3>
            </div>
            
            <p className="text-slate-400 text-sm leading-relaxed">
              Créateur multimédia multidisciplinaire. Spécialisé dans la réalisation vidéo, la composition de bandes sonores et la conception d'identités graphiques percutantes. À l'écoute de nouveaux projets d'envergure.
            </p>

            <div className="space-y-3.5 pt-2 text-xs text-slate-400">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <a href="mailto:hasinarovanalanjaniaina@gmail.com" className="hover:text-cyan-400 transition-colors">
                  hasinarovanalanjaniaina@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <a href="https://wa.me/261336799461" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">
                  WhatsApp : +261 33 67 994 61
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Facebook className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span className="hover:text-cyan-400 transition-colors cursor-pointer">
                  Facebook : Lanjaniaina
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Antananarivo, Madagascar / Freelance à distance</span>
              </div>
            </div>

            {/* Social Network badges */}
            <div className="pt-4 flex items-center space-x-3 bg-slate-950">
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-rose-600 hover:text-white text-slate-400 flex items-center justify-center border border-slate-800 transition-colors"
                title="Mon YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a 
                href="https://soundcloud.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-orange-500 hover:text-white text-slate-400 flex items-center justify-center border border-slate-800 transition-colors"
                title="Mon SoundCloud/Audio"
              >
                <Music className="w-4 h-4" />
              </a>
              <a 
                href="https://behance.net" 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-blue-600 hover:text-white text-slate-400 flex items-center justify-center border border-slate-800 transition-colors"
                title="Behance Graphisme"
              >
                <Palette className="w-4 h-4" />
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-400 flex items-center justify-center border border-slate-800 transition-colors"
                title="Mon GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: The Action Form: 8/12 */}
          <div className="lg:col-span-8 bg-slate-900/40 p-6 sm:p-8 rounded-2xl border border-slate-900 shadow-xl relative overflow-hidden">
            
            {/* Blurry Overlay Lock for Non-Authenticated Visitors */}
            {!visitor && (
              <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-center items-center p-6 text-center animate-fadeIn select-none">
                <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 text-cyan-400 border border-cyan-500/15 rounded-2xl flex items-center justify-center mb-4 shadow animate-pulse">
                  <Lock className="w-6 h-6 animate-pulse" />
                </div>
                
                <h5 className="text-base sm:text-lg font-bold text-white font-sans max-w-sm">
                  Identification requise pour envoyer un message
                </h5>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-2 max-w-xs leading-relaxed mb-6">
                  Vous pouvez naviguer librement sur le site. Cependant, pour contacter Lanja et soumettre ce formulaire, veillez d'abord à vous connecter.
                </p>

                <div className="flex flex-col gap-3.5 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/10 cursor-pointer hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center space-x-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Se connecter / Créer un compte</span>
                  </button>

                  <div className="flex items-center justify-center space-x-4 pt-1.5 text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Chrome className="w-3.5 h-3.5 text-neutral-400" /> Google
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Apple className="w-3.5 h-3.5 text-neutral-400" /> Apple ID
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-neutral-400" /> E-mail
                    </span>
                  </div>
                </div>
              </div>
            )}

            <h4 id="form-contact-title" className="text-xl font-bold font-sans text-white mb-2">Démarrons une collaboration</h4>
            <p className="text-xs text-slate-400 mb-6">
              Laissez-moi un message pour une demande de devis, de partenariat ou simplement pour échanger sur vos projets de vidéo, d'audio ou de design. Vos informations seront conservées dans la boîte de réception privée.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Votre Nom / Entreprise *</span>
                    {visitor && (
                      <span className="text-[9px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/30 font-mono flex items-center gap-0.5 select-none animate-fadeIn">
                        <CheckCircle className="w-2.5 h-2.5" /> Compte lié
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!visitor}
                    placeholder="Ex: Sophie de Bloom SAS"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-cyan-500 text-sm text-white focus:outline-none disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Adresse Email *</span>
                    {visitor && (
                      <span className="text-[9px] text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/30 font-mono capitalize select-none animate-fadeIn">
                        Via {visitor.provider}
                      </span>
                    )}
                  </label>
                  <input
                    type="email"
                    required
                    disabled={!!visitor}
                    placeholder="Ex: sophie@entreprise.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-cyan-500 text-sm text-white focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Objet du message *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Demande de Sound Design pour un jeu vidéo"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-cyan-500 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Votre Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Veuillez décrire en détail les détails de votre besoin (durée du média, budget estimé, univers artistique recherché...)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl focus:border-cyan-500 text-sm text-white focus:outline-none resize-none"
                />
              </div>

              {/* Success Alert Banner inside Card */}
              {success && (
                <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-4 rounded-xl text-xs sm:text-sm animate-fadeIn">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500" />
                  <div>
                    <span className="font-bold block">Message envoyé avec succès !</span>
                    <span>Lanja pourra voir votre message en temps réel dans sa boîte admin.</span>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="text-xs text-rose-400 font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 italic">
                  * Champs obligatoires
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center space-x-2 shadow-lg cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isSubmitting ? 'Envoi...' : 'Envoyer le Message'}</span>
                </button>
              </div>

            </form>

          </div>

        </div>

        {/* Outer credit lines */}
        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            <p>© {new Date().getFullYear()} Lanja Créateur. Tous droits réservés.</p>
            <p className="mt-0.5 text-[10px] text-slate-650 font-mono">
              Imaginé et façonné pour un portfolio d'art numérique premium.
            </p>
          </div>
          
          <div className="flex items-center space-x-1.5 bg-slate-950">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400 font-mono text-[10px]">Espace Client Hébergé en Cloud Run</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
