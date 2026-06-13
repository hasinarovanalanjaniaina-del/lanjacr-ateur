import React, { useState, useEffect } from 'react';
import { 
  X, Mail, Lock, User, Check, AlertCircle, Sparkles, 
  ArrowRight, ShieldCheck, KeyRound, Inbox
} from 'lucide-react';
import { Visitor } from '../types';

interface VisitorAuthModalProps {
  onClose: () => void;
  onLoginSuccess: (visitor: Visitor) => void;
}

interface OutboxMail {
  id: string;
  email: string;
  name: string;
  timestamp: string;
  subject: string;
  body: string;
}

export default function VisitorAuthModal({ onClose, onLoginSuccess }: VisitorAuthModalProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Input states
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  // Notifications and feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Outbox list for sandbox email retrieval
  const [outboxMails, setOutboxMails] = useState<OutboxMail[]>([]);

  // Polling for local simulation outbox (allows testing on the fly inside AI Studio)
  useEffect(() => {
    const fetchOutbox = async () => {
      try {
        const res = await fetch('/api/auth/outbox');
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setOutboxMails(data.mails || []);
        }
      } catch (err) {
        console.error("Simulation outbox polling failed:", err);
      }
    };

    fetchOutbox();
    const interval = setInterval(fetchOutbox, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle Sign In (Se connecter) or Sign Up (Créer un compte)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Veuillez renseigner votre e-mail et un mot de passe.");
      return;
    }

    if (activeTab === 'signup' && !name.trim()) {
      setErrorMsg("Veuillez inscrire votre nom complet.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = activeTab === 'signup' ? '/api/auth/register' : '/api/auth/login';
      const bodyPayload = activeTab === 'signup' 
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Le serveur a renvoyé un format de données invalide (HTML). Veuillez réessayer.");
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "L'authentification a échoué.");
      }

      setSuccessMsg(activeTab === 'signup' 
        ? `Votre compte a été enregistré avec succès ! Bienvenue ${data.visitor.name}.`
        : `Ravi de vous revoir, ${data.visitor.name} ! Connexion autorisée.`
      );

      // Save user to local storage visitors copy
      const usersStr = localStorage.getItem('lanja_registered_visitors') || '[]';
      let users = [];
      try {
        users = JSON.parse(usersStr);
      } catch (err) { users = []; }

      if (!users.some((u: any) => u.email.toLowerCase() === email.trim().toLowerCase())) {
        users.push({
          id: data.visitor.id,
          name: data.visitor.name,
          email: data.visitor.email,
          provider: 'email'
        });
        localStorage.setItem('lanja_registered_visitors', JSON.stringify(users));
      }

      setTimeout(() => {
        onLoginSuccess(data.visitor);
        onClose();
      }, 1200);

    } catch (err: any) {
      setErrorMsg(err.message || "Impossible de s'authentifier. Veuillez réssayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="visitor-auth-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp">
        
        {/* Header Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-850 text-slate-400 hover:text-white transition-all z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* tab pane container */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Header branding */}
          <div className="text-center">
            <span className="px-3 py-1 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 text-cyan-400 text-[10px] font-mono tracking-widest uppercase rounded-full border border-cyan-500/15 inline-block mb-2">
              Espace Visiteur de l'App
            </span>
            <h4 className="text-white text-xl font-bold tracking-tight">Accès Communauté</h4>
            <p className="text-slate-450 text-xs mt-1">
              Connectez-vous par e-mail et mot de passe pour envoyer un message à Lanja
            </p>
          </div>

          {/* Tab Swappers */}
          <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'signin' 
                  ? 'bg-slate-900 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'signup' 
                  ? 'bg-slate-900 text-white shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Créer un compte
            </button>
          </div>

          {/* Core Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {activeTab === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Votre nom complet *</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Clara Dupont"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:border-cyan-500 focus:outline-none font-sans text-white focus:ring-1 focus:ring-cyan-500/50"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Adresse Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:border-cyan-500 focus:outline-none font-sans text-white focus:ring-1 focus:ring-cyan-500/50"
                />
              </div>

            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Mot de passe *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={4}
                  placeholder="Minimum 4 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm focus:border-cyan-500 focus:outline-none font-sans text-white focus:ring-1 focus:ring-cyan-500/50"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-950/70 text-rose-400 text-xs rounded-xl flex items-start space-x-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-950/70 text-emerald-400 text-xs rounded-xl flex items-start space-x-2 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center space-x-2 hover:scale-[1.01] active:scale-95 shadow-md shadow-cyan-400/10"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>{activeTab === 'signup' ? "Créer mon Compte" : "Se Connecter"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>



          {/* Simulated Email outbox inspector for sign up notifications */}
          {outboxMails.length > 0 && (
            <div className="pt-3 border-t border-slate-850 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                <Inbox className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Notifications Email de Bienvenue (Simulé)</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-[10px] max-h-24 overflow-y-auto space-y-1.5 font-mono">
                {outboxMails
                  .filter(m => m.email.toLowerCase() === email.toLowerCase().trim())
                  .slice(0, 1)
                  .map((mail) => (
                    <div key={mail.id} className="space-y-0.5 text-slate-400">
                      <div className="flex justify-between text-[8px] text-slate-500">
                        <span>Lanté à {mail.timestamp}</span>
                        <span>SMTP logs</span>
                      </div>
                      <div className="text-white font-semibold">
                        Sujet : {mail.subject}
                      </div>
                      <p className="text-[9px] text-slate-500">
                        Compte de {mail.name} enregistré avec succès via base de données !
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
