import React, { useState, useEffect } from 'react';
import { 
  Lock, Unlock, Sliders, Plus, Trash2, Edit, Save, 
  X, Mail, RefreshCw, Layers, Check, MessageSquare, AlertCircle, FileText,
  Upload, FileJson, Camera, Image, Sparkles
} from 'lucide-react';
import { Project, ContactMessage, Visitor } from '../types';

interface AdminPanelProps {
  onClose: () => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  onRefreshDemos: () => void;
  messages: ContactMessage[];
  setMessages: (messages: ContactMessage[]) => void;
  visitor?: Visitor | null;
}

export default function AdminPanel({
  onClose,
  projects,
  setProjects,
  onRefreshDemos,
  messages,
  setMessages,
  visitor
}: AdminPanelProps) {
  // Authentication states
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'projets' | 'messages' | 'database' | 'portraits'>('projets');

  // Portraits-related states
  const [portraits, setPortraits] = useState<string[]>([]);
  const [activePortrait, setActivePortrait] = useState<string>('');
  const [isUploadingCustomPortrait, setIsUploadingCustomPortrait] = useState(false);
  const [portraitError, setPortraitError] = useState('');
  const [portraitSuccess, setPortraitSuccess] = useState('');

  const fetchPortraits = async () => {
    try {
      const res = await fetch('/api/database/portraits');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setPortraits(data.portraits || []);
          setActivePortrait(data.activePortrait || '');
        }
      }
    } catch (err) {
      console.error("Failed to load portraits collection:", err);
    }
  };

  const handleAddPortrait = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCustomPortrait(true);
    setPortraitError('');
    setPortraitSuccess('');

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/database/portraits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        });
        
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success) {
            setPortraits(data.portraits || []);
            setActivePortrait(data.activePortrait || '');
            setPortraitSuccess("Portrait ajouté avec succès !");
            window.dispatchEvent(new Event('lanja_portrait_updated'));
          } else {
            setPortraitError("Erreur lors de l'enregistrement du portrait.");
          }
        } else {
          setPortraitError("Erreur serveur lors de l'envoi.");
        }
      } catch (err) {
        setPortraitError("Erreur de connexion.");
      } finally {
        setIsUploadingCustomPortrait(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleActivatePortrait = async (img: string) => {
    try {
      setPortraitError('');
      setPortraitSuccess('');
      const res = await fetch('/api/database/portraits/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: img })
      });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setActivePortrait(data.activePortrait || '');
          setPortraitSuccess("L'image active d'illustration a été mise à jour.");
          window.dispatchEvent(new Event('lanja_portrait_updated'));
        }
      }
    } catch (err) {
      console.error("Failed to activate portrait:", err);
    }
  };

  const [portraitToDelete, setPortraitToDelete] = useState<string | null>(null);

  const handleDeletePortrait = async (img: string) => {
    try {
      setPortraitError('');
      setPortraitSuccess('');
      const res = await fetch('/api/database/portraits/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: img })
      });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setPortraits(data.portraits || []);
          setActivePortrait(data.activePortrait || '');
          setPortraitSuccess("Photo de profil retirée.");
          window.dispatchEvent(new Event('lanja_portrait_updated'));
        }
      }
    } catch (err) {
      console.error("Failed to delete portrait:", err);
    }
  };

  // Database audit logs states
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbConnections, setDbConnections] = useState<any[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(false);

  const fetchDatabaseLogs = async () => {
    setIsLoadingDB(true);
    try {
      const [resUsers, resConns] = await Promise.all([
        fetch('/api/database/users'),
        fetch('/api/database/connections')
      ]);
      if (resUsers.ok) {
        const d1 = await resUsers.json();
        setDbUsers(d1.users || []);
      }
      if (resConns.ok) {
        const d2 = await resConns.json();
        setDbConnections(d2.connections || []);
      }
    } catch (err) {
      console.error("Failed to load db records:", err);
    } finally {
      setIsLoadingDB(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'database') {
      fetchDatabaseLogs();
    }
  }, [isAuthenticated, activeTab]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPortraits();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'portraits') {
      fetchPortraits();
    }
  }, [isAuthenticated, activeTab]);

  const handleClearConnections = async () => {
    try {
      const res = await fetch('/api/database/connections/clear', { method: 'POST' });
      if (res.ok) {
        setDbConnections([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Form states
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formError, setFormError] = useState('');
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);
  const [isConfirmingClearLogs, setIsConfirmingClearLogs] = useState(false);
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);

  // Form Field states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'video' | 'audio' | 'graphisme'>('video');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [client, setClient] = useState('');
  const [role, setRole] = useState('');
  const [duration, setDuration] = useState('');

  // Import states
  const [showImportZone, setShowImportZone] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [importTextarea, setImportTextarea] = useState('');

  // Local physical file upload states
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const [isLocalLoggedOut, setIsLocalLoggedOut] = useState(false);

  // Handle default auto-login in case password exists in local storage or the admin visitor email is signed in
  useEffect(() => {
    const isAuthed = localStorage.getItem('lanja_admin_logged') === 'true';
    const isSpecialAdmin = visitor?.email?.toLowerCase() === 'hasinarovanalanjaniaina@gmail.com';
    if (!isLocalLoggedOut && (isAuthed || isSpecialAdmin)) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [visitor, isLocalLoggedOut]);

  // When visitor email changes, reset manual log out override
  useEffect(() => {
    setIsLocalLoggedOut(false);
  }, [visitor?.email]);

  // Submit Password Gate
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123' || password === 'admin') {
      setIsLocalLoggedOut(false);
      setIsAuthenticated(true);
      setAuthError('');
      localStorage.setItem('lanja_admin_logged', 'true');
    } else {
      setAuthError('Mot de passe incorrect. Indice : le mot de passe par défaut est "admin123"');
    }
  };

  const handleLogout = () => {
    setIsLocalLoggedOut(true);
    setIsAuthenticated(false);
    localStorage.removeItem('lanja_admin_logged');
  };

  // Populate form with current projects data for editing
  const startEdit = (project: Project) => {
    setEditingProject(project);
    setIsAddingNew(false);
    setTitle(project.title);
    setCategory(project.category);
    setDescription(project.description);
    setLongDescription(project.longDescription || '');
    setThumbnailUrl(project.thumbnailUrl);
    setMediaUrl(project.mediaUrl);
    setTagsInput(project.tags.join(', '));
    setClient(project.client || '');
    setRole(project.role || '');
    setDuration(project.duration || '');
    setFormError('');
  };

  // Setup empty form for adding new
  const startAdd = () => {
    setEditingProject(null);
    setIsAddingNew(true);
    setTitle('');
    setCategory('video');
    setDescription('');
    setLongDescription('');
    setThumbnailUrl('https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80'); // Generic placeholder
    setMediaUrl('');
    setTagsInput('');
    setClient('');
    setRole('');
    setDuration('');
    setFormError('');
  };

  // Cancel edit modal
  const resetForm = () => {
    setEditingProject(null);
    setIsAddingNew(false);
    setFormError('');
  };

  // Handle local physical file uploads (for media and thumbnail inputs)
  const handleLocalFileUpload = (file: File, target: 'thumbnail' | 'media') => {
    if (target === 'thumbnail') {
      setIsUploadingThumbnail(true);
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const isImg = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileExt);
      if (!isImg) {
        setFormError("La miniature d'illustration doit être une image ou un GIF (.png, .jpg, .gif, .webp)");
        setIsUploadingThumbnail(false);
        return;
      }
    } else {
      setIsUploadingMedia(true);
    }

    setUploadMessage("Démarrage du téléversement sur le serveur...");

    const formData = new FormData();
    formData.append("file", file);

    const applyUploadConfig = (url: string) => {
      if (target === 'thumbnail') {
        setThumbnailUrl(url);
        setIsUploadingThumbnail(false);
        setUploadMessage('');
      } else {
        setMediaUrl(url);
        setIsUploadingMedia(false);
        setUploadMessage('');
        
        const formatSize = (file.size / (1024 * 1024)).toFixed(2);
        
        // Auto-adjust categories depending on the selected file mime-type!
        if (file.type.startsWith('video/')) {
          setCategory('video');
          setDuration(prev => prev || `Vidéo MP4 (${formatSize} Mo)`);
        } else if (file.type.startsWith('audio/')) {
          setCategory('audio');
          setDuration(prev => prev || `Bande son MP3 (${formatSize} Mo)`);
        } else if (file.type === 'application/pdf') {
          // PDF documents fit best under "graphisme" (portfolios)
          setCategory('graphisme');
          setDuration(prev => prev || `Document PDF (${formatSize} Mo)`);
        } else if (file.type.startsWith('image/')) {
          setCategory('graphisme');
          setDuration(prev => prev || `Design HD ${file.name.substring(file.name.lastIndexOf('.')).toUpperCase()}`);
        }
      }
    };

    // Primary Transfer Pattern: Multipart Form stream (Memory efficient, supports infinite file size)
    fetch("/api/upload", {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("L'envoi standard par flux a échoué.");
      })
      .then((data) => {
        if (data.success && data.url) {
          applyUploadConfig(data.url);
        } else {
          throw new Error(data.error || "Données invalides retournées par le serveur.");
        }
      })
      .catch((primaryError) => {
        console.warn("[Upload Channel Primary] Standard multi-part failed, trying fallback...", primaryError);
        setUploadMessage("Canal alternatif : Encodage et transmission Base64...");

        // Secondary Transfer Pattern: Read as base64 URL and post as JSON.
        // Extremely bulletproof fallback that bypasses specific reverse proxy multipart inspection rules!
        const reader = new FileReader();
        reader.onload = () => {
          const base64Content = reader.result as string;
          if (!base64Content) {
            setFormError("Téléversement impossible : Échec d'encodage du fichier local.");
            setIsUploadingThumbnail(false);
            setIsUploadingMedia(false);
            setUploadMessage('');
            return;
          }

          fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              filename: file.name,
              fileData: base64Content
            })
          })
            .then((res) => {
              if (res.ok) return res.json();
              throw new Error("Le serveur a refusé la transmission de secours.");
            })
            .then((data) => {
              if (data.success && data.url) {
                applyUploadConfig(data.url);
              } else {
                throw new Error(data.error || "Le stockage de secours a échoué.");
              }
            })
            .catch((fallbackError) => {
              setFormError(`Téléversement impossible : ${fallbackError.message || fallbackError}`);
              setIsUploadingThumbnail(false);
              setIsUploadingMedia(false);
              setUploadMessage('');
            });
        };

        reader.onerror = () => {
          setFormError("Téléversement impossible : Impossible de lire l'extension locale.");
          setIsUploadingThumbnail(false);
          setIsUploadingMedia(false);
          setUploadMessage('');
        };

        reader.readAsDataURL(file);
      });
  };

  // Handle parsing and importing of JSON project contents
  const handleImportJSONContent = (content: string) => {
    try {
      setImportError('');
      setImportSuccess('');
      const parsed = JSON.parse(content);
      
      const rawProjects = Array.isArray(parsed) ? parsed : [parsed];
      
      if (rawProjects.length === 0) {
        setImportError("Le fichier JSON ne contient aucun projet.");
        return;
      }

      const importedList: Project[] = [];
      
      for (const item of rawProjects) {
        if (!item.title && !item.titre) {
          setImportError("Format incorrect : Chaque projet doit avoir au moins un 'title' (titre) ou 'titre'.");
          return;
        }
        
        // Comprehensive key mappings to support both French and English schemas gracefully
        const resolvedTitle = String(item.title || item.titre || "Projet Sans Titre").trim();
        const resolvedCategory = (item.category && ['video', 'audio', 'graphisme'].includes(item.category))
          ? item.category
          : (item.categorie && ['video', 'audio', 'graphisme'].includes(item.categorie))
            ? item.categorie
            : 'video';
            
        const resolvedDescription = item.description 
          ? String(item.description).trim() 
          : item.details 
            ? String(item.details).trim() 
            : 'Projet sans description';
            
        const resolvedLongDesc = item.longDescription 
          ? String(item.longDescription).trim() 
          : item.descriptionLongue 
            ? String(item.descriptionLongue).trim() 
            : item.longueDescription 
              ? String(item.longueDescription).trim() 
              : undefined;

        // Custom illustration/miniature mappings (supports illustration, miniature, image, etc.)
        const resolvedThumbnail = item.thumbnailUrl 
          ? String(item.thumbnailUrl).trim() 
          : item.illustration 
            ? String(item.illustration).trim() 
            : item.miniature 
              ? String(item.miniature).trim() 
              : item.thumbnail 
                ? String(item.thumbnail).trim() 
                : item.image 
                  ? String(item.image).trim() 
                  : 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80';

        // Custom direct media mappings (supports mediaUrl, mediaDirect, media, video, audio, link, lien, etc.)
        const resolvedMedia = item.mediaUrl 
          ? String(item.mediaUrl).trim() 
          : item.mediaDirect 
            ? String(item.mediaDirect).trim() 
            : item.media_direct 
              ? String(item.media_direct).trim() 
              : item.media 
                ? String(item.media).trim() 
                : item.video 
                  ? String(item.video).trim() 
                  : item.audio 
                    ? String(item.audio).trim() 
                    : item.lien 
                      ? String(item.lien).trim() 
                      : item.link 
                        ? String(item.link).trim() 
                        : 'https://www.youtube.com/embed/dQw4w9WgXcQ';

        const resolvedTags = Array.isArray(item.tags)
          ? item.tags.map((t: any) => String(t).trim())
          : item.tags
            ? String(item.tags).split(',').map((t: any) => t.trim())
            : item.motsCles
              ? Array.isArray(item.motsCles)
                ? item.motsCles.map((t: any) => String(t).trim())
                : String(item.motsCles).split(',').map((t: any) => t.trim())
              : ['Importé'];

        const resolvedDate = item.date 
          ? String(item.date).trim() 
          : new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

        const resolvedDuration = item.duration 
          ? String(item.duration).trim() 
          : item.duree 
            ? String(item.duree).trim() 
            : undefined;

        const validated: Project = {
          id: item.id || `imported-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: resolvedTitle,
          category: resolvedCategory as 'video' | 'audio' | 'graphisme',
          description: resolvedDescription,
          longDescription: resolvedLongDesc,
          thumbnailUrl: resolvedThumbnail,
          mediaUrl: resolvedMedia,
          tags: resolvedTags,
          date: resolvedDate,
          client: item.client ? String(item.client).trim() : undefined,
          role: item.role ? String(item.role).trim() : undefined,
          duration: resolvedDuration
        };
        importedList.push(validated);
      }

      const mergedProjects = [...importedList, ...projects];
      setProjects(mergedProjects);
      
      setImportSuccess(`Félicitations ! ${importedList.length} projet(s) ont été importés avec succès.`);
      setImportTextarea('');
      
      // Close the import layout after a brief message delay
      setTimeout(() => {
        setShowImportZone(false);
        setImportSuccess('');
      }, 2500);

    } catch (e: any) {
      setImportError(`Erreur de syntaxe JSON : ${e.message || "Fichier invalide"}`);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type !== "application/json" && !file.name.endsWith('.json')) {
        setImportError("Veuillez sélectionner uniquement un fichier au format .json");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          handleImportJSONContent(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          handleImportJSONContent(text);
        }
      };
      reader.readAsText(file);
    }
  };

  // Save Project Action (Create or Update)
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !thumbnailUrl.trim() || !mediaUrl.trim()) {
      setFormError('Veuillez remplir au moins le Titre, la Description courte, la Miniature et l\'URL du Média.');
      return;
    }

    const processedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (processedTags.length === 0) {
      setFormError('Veuillez ajouter au moins un mot-clé (tag).');
      return;
    }

    const savedProject: Project = {
      id: editingProject ? editingProject.id : `custom-${Date.now()}`,
      title: title.trim(),
      category: category,
      description: description.trim(),
      longDescription: longDescription.trim() || undefined,
      thumbnailUrl: thumbnailUrl.trim(),
      mediaUrl: mediaUrl.trim(),
      tags: processedTags,
      date: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      client: client.trim() || undefined,
      role: role.trim() || undefined,
      duration: duration.trim() || undefined
    };

    let updatedProjects: Project[];
    if (editingProject) {
      updatedProjects = projects.map((p) => (p.id === editingProject.id ? savedProject : p));
    } else {
      updatedProjects = [savedProject, ...projects];
    }

    setProjects(updatedProjects);
    resetForm();
  };

  // Delete Project from list
  const handleDeleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
  };

  // Delete message
  const handleDeleteMessage = (id: string) => {
    const updated = messages.filter((m) => m.id !== id);
    setMessages(updated);
    localStorage.setItem('lanja_messages', JSON.stringify(updated));
  };

  // Toggle Read flag
  const toggleMessageRead = (id: string) => {
    const updated = messages.map((m) => m.id === id ? { ...m, read: !m.read } : m);
    setMessages(updated);
    localStorage.setItem('lanja_messages', JSON.stringify(updated));
  };

  // Count unread
  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TOP BAR / NAVIGATION ACTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-sm font-mono mb-1">
              <Sliders className="w-4 h-4" />
              <span>Backoffice d\'Administration</span>
            </div>
            <h2 className="text-3xl font-sans font-black tracking-tight">Console Créateur</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-sm font-semibold transition-all"
            >
              Retour au Portfolio
            </button>
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 bg-slate-900 hover:bg-rose-950/40 text-rose-400 border border-slate-800 rounded-xl text-xs font-semibold transition-all"
              >
                Déconnexion
              </button>
            )}
          </div>
        </div>

        {/* PASSWORD PROTECTION GATE */}
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto my-16 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Lock className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold">Zone d\'Administration réservée</h3>
              <p className="text-xs text-slate-400">
                Lanja, veuillez introduire votre code d\'accès pour publier, éditer vos créations ou voir les prospects.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Mot de passe de session</label>
                <input
                  type="password"
                  placeholder="admin123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              {authError && (
                <div className="flex items-start space-x-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 p-3 rounded-xl text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 font-bold hover:opacity-90 flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Déverrouiller la Console</span>
              </button>
            </form>

            <div className="text-center pt-2 text-[11px] text-slate-500 font-mono">
              Indice par défaut: <span className="text-cyan-600/90 font-bold">admin123</span>
            </div>
          </div>
        ) : (
          /* MAIN AUTHORIZED APPLICATION */
          <div className="space-y-6">
            
            {/* TAB SELECTORS AND DEMO RESET */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800/80 p-3 rounded-2xl">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('projets')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === 'projets'
                      ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Mes Réalisations ({projects.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold relative transition-all ${
                    activeTab === 'messages'
                      ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Boîte de Réception</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold flex items-center justify-center border-2 border-slate-900">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('database')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold relative transition-all ${
                    activeTab === 'database'
                      ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileJson className="w-4 h-4" />
                  <span>Base de Données</span>
                </button>
                <button
                  onClick={() => setActiveTab('portraits')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold relative transition-all ${
                    activeTab === 'portraits'
                      ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Portraits Directeur ({portraits.length})</span>
                </button>
              </div>

              {/* Reset to defaults helper button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isConfirmingRestore) {
                      setIsConfirmingRestore(true);
                    } else {
                      onRefreshDemos();
                      setIsConfirmingRestore(false);
                    }
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 border rounded-xl text-xs transition-all self-start sm:self-auto cursor-pointer ${
                    isConfirmingRestore
                      ? "bg-rose-600 text-white border-rose-500 animate-pulse font-bold"
                      : "border-slate-700 hover:border-cyan-500/50 hover:bg-slate-850/50 text-slate-400 hover:text-cyan-400"
                  }`}
                  title={isConfirmingRestore ? "Confirmer la restauration" : "Restaurer les Démos"}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isConfirmingRestore ? 'animate-spin' : ''}`} />
                  <span>{isConfirmingRestore ? "Cliquer à nouveau pour réinitialiser" : "Restaurer les Démos"}</span>
                </button>
                {isConfirmingRestore && (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingRestore(false)}
                    className="px-2.5 py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs border border-slate-700 cursor-pointer transition-all"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>


            {/* TAB CONTENT: PROJECTS MANAGER */}
            {activeTab === 'projets' && (
              <div className="space-y-6">
                
                {/* Form Wrapper Container if active */}
                {(isAddingNew || editingProject) && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-slideUp">
                    <button
                      onClick={resetForm}
                      className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 z-10"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    
                    <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 pr-10">
                      <h3 className="text-lg font-bold flex items-center space-x-2 text-cyan-400">
                        {editingProject ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        <span>{editingProject ? 'Modifier une Réalisation' : 'Ajouter une Nouvelle Réalisation'}</span>
                      </h3>
                      
                      <div className="flex items-center space-x-2">
                        <label 
                          htmlFor="import-prefill-input" 
                          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 text-[11px] font-semibold cursor-pointer transition-colors flex items-center space-x-1.5 hover:bg-slate-900"
                          title="Sélectionner un fichier JSON exporté pour remplir instantanément cette réalisation"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Préremplir via JSON de réalisation</span>
                        </label>
                        <input 
                          id="import-prefill-input"
                          type="file" 
                          accept=".json" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const r = new FileReader();
                              r.onload = (event) => {
                                const contents = event.target?.result as string;
                                if (contents) {
                                  try {
                                    const parsed = JSON.parse(contents);
                                    const data = Array.isArray(parsed) ? parsed[0] : parsed;
                                    
                                    if (data) {
                                      if (data.title) setTitle(data.title);
                                      if (data.category && ['video', 'audio', 'graphisme'].includes(data.category)) {
                                        setCategory(data.category);
                                      }
                                      if (data.description) setDescription(data.description);
                                      if (data.longDescription) setLongDescription(data.longDescription);
                                      if (data.thumbnailUrl) setThumbnailUrl(data.thumbnailUrl);
                                      if (data.mediaUrl) setMediaUrl(data.mediaUrl);
                                      if (data.client) setClient(data.client);
                                      if (data.role) setRole(data.role);
                                      if (data.duration) setDuration(data.duration);
                                      if (data.tags) {
                                        if (Array.isArray(data.tags)) setTagsInput(data.tags.join(', '));
                                        else setTagsInput(String(data.tags));
                                      }
                                      setFormError('');
                                    }
                                  } catch(err: any) {
                                    setFormError("Échec du pré-remplissage : le fichier n'est pas un JSON valide.");
                                  }
                                }
                              };
                              r.readAsText(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <form onSubmit={handleSaveProject} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* Left stack */}
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs text-slate-400 block font-medium">Titre du chef-d\'oeuvre *</label>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Court-métrage Nature Sauvage"
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-cyan-500 focus:outline-none"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-slate-400 block font-medium">Catégorie Créative *</label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as any)}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-cyan-500 focus:outline-none text-slate-300"
                          >
                            <option value="video">🎥 Vidéo / Court-métrage</option>
                            <option value="audio">🎵 Audio / Bande sonore / FX</option>
                            <option value="graphisme">🎨 Graphisme / Illustration / Branding</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs text-slate-400 block font-medium flex items-center justify-between">
                            <span>Illustration / Miniature de Couverture *</span>
                            {thumbnailUrl && (thumbnailUrl.startsWith('data:') || thumbnailUrl.startsWith('/uploads/')) && (
                              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                                <Check className="w-3 h-3" /> Fichier importé
                              </span>
                            )}
                          </label>
                          <div className="flex flex-col gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
                            {/* URL input field */}
                            <input
                              type="text"
                              value={thumbnailUrl}
                              onChange={(e) => setThumbnailUrl(e.target.value)}
                              placeholder="Faites glisser un fichier ou collez une URL (https://...)"
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg focus:border-cyan-500 focus:outline-none font-mono text-xs text-slate-300"
                              required
                            />
                            
                            {/* File Upload Trigger */}
                            <div className="flex gap-2 items-center">
                              <label 
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                    handleLocalFileUpload(e.dataTransfer.files[0], 'thumbnail');
                                  }
                                }}
                                className="flex-1 py-1.5 px-3 border border-dashed border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/40 rounded-lg text-center cursor-pointer transition-all flex items-center justify-center space-x-1.5 text-xs text-slate-400 hover:text-cyan-400"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>{isUploadingThumbnail ? (uploadMessage || 'Encodage...') : 'Glisser ou Choisir un fichier (.png, .jpg, .gif, .webp)'}</span>
                                <input
                                  type="file"
                                  accept="image/png, image/jpeg, image/jpg, image/gif, image/webp, image/*"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleLocalFileUpload(e.target.files[0], 'thumbnail');
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                              
                              {thumbnailUrl && (
                                <div className="relative group w-12 h-10 border border-slate-800 rounded overflow-hidden flex-shrink-0 bg-slate-900">
                                  <img 
                                    src={thumbnailUrl} 
                                    alt="Prévisualisation" 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                  {(thumbnailUrl.startsWith('data:') || thumbnailUrl.startsWith('/uploads/')) && (
                                    <button
                                      type="button"
                                      onClick={() => setThumbnailUrl('https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80')}
                                      className="absolute inset-0 bg-rose-950/80 hover:bg-rose-900/90 text-white font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] transition-opacity"
                                      title="Supprimer le fichier"
                                    >
                                      Retirer
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs text-slate-400 block font-medium flex items-center justify-between">
                            <span>Média Direct (Fichier Physique ou URL Web) *</span>
                            {mediaUrl && (mediaUrl.startsWith('data:') || mediaUrl.startsWith('/uploads/')) && (
                              <span className="text-[10px] text-cyan-400 flex items-center gap-1 font-mono bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/30">
                                <Check className="w-3 h-3" /> Fichier importé
                              </span>
                            )}
                          </label>
                          <div className="flex flex-col gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
                            {/* URL input field */}
                            <input
                              type="text"
                              value={mediaUrl}
                              onChange={(e) => setMediaUrl(e.target.value)}
                              placeholder="URL YouTube, lien direct MP3/MP4, HD URL, ou attachement local"
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-850 rounded-lg focus:border-cyan-500 focus:outline-none font-mono text-xs text-slate-300"
                              required
                            />
                            
                            {/* File Upload Trigger */}
                            <div className="flex flex-col gap-1.5">
                              <label 
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                    handleLocalFileUpload(e.dataTransfer.files[0], 'media');
                                  }
                                }}
                                className="py-2 px-3 border border-dashed border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/40 rounded-lg text-center cursor-pointer transition-all flex items-center justify-center space-x-1.5 text-xs text-slate-400 hover:text-cyan-400"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>{isUploadingMedia ? uploadMessage : 'Glisser ou Choisir un fichier (Photo, MP4, MP3, GIF, PDF...)'}</span>
                                <input
                                  type="file"
                                  accept="image/*,video/*,audio/*,application/pdf"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleLocalFileUpload(e.target.files[0], 'media');
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                              
                              {(mediaUrl.startsWith('data:') || mediaUrl.startsWith('/uploads/')) && (
                                <div className="flex items-center justify-between px-2.5 py-1 bg-slate-900/80 rounded border border-slate-850/85">
                                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[190px]">
                                    Attachement : {mediaUrl.substring(mediaUrl.lastIndexOf('/') + 1)}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMediaUrl('');
                                      setDuration('');
                                    }}
                                    className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline font-medium cursor-pointer"
                                  >
                                    Retirer le fichier
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            <strong>Remarque :</strong> Pour l'audio (MP3, WAV), la vidéo (MP4, WEBM), ou les fichiers PDF et images (JPG, PNG, GIF), vous pouvez soit coller une URL, soit l'importer directement d'ici.
                          </p>
                        </div>
                      </div>

                      {/* Right stack */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400 block font-medium">Client / Éditeur</label>
                            <input
                              type="text"
                              value={client}
                              onChange={(e) => setClient(e.target.value)}
                              placeholder="Ex: France Télévison"
                              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-cyan-500 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400 block font-medium">Mon Rôle</label>
                            <input
                              type="text"
                              value={role}
                              onChange={(e) => setRole(e.target.value)}
                              placeholder="Ex: Sound Designer"
                              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-cyan-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400 block font-medium">Tags (Séparés par virgule) *</label>
                            <input
                              type="text"
                              value={tagsInput}
                              onChange={(e) => setTagsInput(e.target.value)}
                              placeholder="Branding, Photoshop, Sony FX"
                              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-cyan-500 focus:outline-none text-slate-300"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400 block font-medium">Format / Durée</label>
                            <input
                              type="text"
                              value={duration}
                              onChange={(e) => setDuration(e.target.value)}
                              placeholder="Ex: 5:42 min, Vectoriel"
                              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-cyan-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-slate-400 block font-medium">Courte Description *</label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description en 2 lignes pour la carte..."
                            rows={2}
                            maxLength={160}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-cyan-500 focus:outline-none resize-none text-slate-300"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-slate-400 block font-medium">Analyse / Story complète</label>
                          <textarea
                            value={longDescription}
                            onChange={(e) => setLongDescription(e.target.value)}
                            placeholder="Description complète pour le modal (brief client, choix artistiques, outils...)"
                            rows={3}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-cyan-500 focus:outline-none text-slate-300"
                          />
                        </div>
                      </div>

                      {/* Form footer */}
                      <div className="md:col-span-2 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800/80">
                        {formError && (
                          <div className="text-xs text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                            <span>{formError}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-3 self-end">
                          <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl text-xs sm:text-sm"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-lg shadow-cyan-400/10 cursor-pointer"
                          >
                            <Save className="w-4 h-4" />
                            <span>Sauvegarder Réalisation</span>
                          </button>
                        </div>
                      </div>

                    </form>
                  </div>
                )}

                {/* PROJECT LIST TABLE */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-slate-900/60">
                    <div>
                      <h4 className="font-bold text-base text-white">Vos Créations Portfolio</h4>
                      <p className="text-xs text-slate-400">Total: {projects.length} projets répertoriés</p>
                    </div>
                    {!isAddingNew && !editingProject && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setShowImportZone(!showImportZone)}
                          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                            showImportZone 
                              ? 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-400/30' 
                              : 'bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800'
                          }`}
                        >
                          <Upload className="w-4 h-4" />
                          <span>Importer (.json)</span>
                        </button>
                        <button
                          onClick={startAdd}
                          className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-md shadow-cyan-400/10 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Ajouter une réalisation</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* IMPORT ZONE WITH DRAG-AND-DROP */}
                  {showImportZone && !isAddingNew && !editingProject && (
                    <div className="p-5 border-b border-slate-800 bg-slate-950/40 space-y-4 animate-slideDown">
                      <div className="flex justify-between items-center">
                        <h5 className="font-bold text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                          <FileJson className="w-4 h-4" />
                          Importer des réalisations en format JSON
                        </h5>
                        <button 
                          onClick={() => {
                            setShowImportZone(false);
                            setImportError('');
                            setImportSuccess('');
                          }}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        
                        {/* Drag and Drop Zone */}
                        <div 
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                            dragActive 
                              ? 'border-cyan-400 bg-cyan-500/5' 
                              : 'border-slate-800 hover:border-slate-700 bg-slate-950'
                          }`}
                          onClick={() => document.getElementById('file-import-input')?.click()}
                        >
                          <input 
                            id="file-import-input"
                            type="file" 
                            accept=".json"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <Upload className={`w-10 h-10 mb-2 transition-transform ${dragActive ? 'scale-110 text-cyan-400' : 'text-slate-500'}`} />
                          
                          <p className="text-sm font-medium text-slate-200">
                            Faites glisser votre fichier <span className="text-cyan-400">.json</span> ici
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            ou cliquez pour parcourir vos fichiers
                          </p>
                        </div>

                        {/* Paste area & manual entry info */}
                        <div className="flex flex-col space-y-2">
                          <label className="text-xs text-slate-400 font-mono">Coller directement le code JSON :</label>
                          <textarea
                            value={importTextarea}
                            onChange={(e) => setImportTextarea(e.target.value)}
                            placeholder='Ex: { "title": "Bande Sonore Film", "category": "audio", "description": "Ma superbe réalisation..." }'
                            rows={3}
                            className="w-full text-xs font-mono p-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-cyan-500 focus:outline-none text-slate-300 resize-none flex-grow"
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-500">Accepte un objet unique ou un tableau d&apos;objets.</span>
                            <button
                              onClick={() => {
                                if (importTextarea.trim()) {
                                  handleImportJSONContent(importTextarea);
                                } else {
                                  setImportError("Veuillez coller du code JSON valide avant d'importer.");
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-300 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Valider & Importer
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Import feedback signals */}
                      {importError && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                          <span>{importError}</span>
                        </div>
                      )}
                      {importSuccess && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center space-x-2">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>{importSuccess}</span>
                        </div>
                      )}

                      {/* Sample format helper hint */}
                      <details className="text-[11px] text-slate-500 bg-slate-950 border border-slate-900 rounded-xl p-3 cursor-pointer select-none">
                        <summary className="font-medium text-slate-400">Voir le format JSON requis</summary>
                        <pre className="mt-2 text-[10px] text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-850 overflow-x-auto text-left leading-relaxed">
{`[
  {
    "title": "Titre du projet",
    "category": "video", // "video" | "audio" | "graphisme"
    "description": "Une description de votre réalisation",
    "longDescription": "Description complète optionnelle...",
    "thumbnailUrl": "https://lien-image.com/img.jpg",
    "mediaUrl": "https://youtube.com/embed/...",
    "tags": ["Illustration", "Branding"],
    "client": "Client Optionnel",
    "role": "Directeur Artistique",
    "duration": "1:20"
  }
]`}
                        </pre>
                      </details>
                    </div>
                  )}

                  {projects.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 space-y-2">
                      <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                      <p className="text-sm">Aucun projet répertorié. Cliquez sur le bouton pour en ajouter un.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-950 border-b border-slate-850 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                            <th className="p-4">Info Réalisation</th>
                            <th className="p-4">Catégorie</th>
                            <th className="p-4">Client / Role</th>
                            <th className="p-4">Tags</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {projects.map((proj) => (
                            <tr key={proj.id} className="hover:bg-slate-850/40 group transition-colors">
                              <td className="p-4 flex items-center space-x-3 min-w-[280px]">
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800">
                                  <img 
                                    src={proj.thumbnailUrl} 
                                    alt={proj.title} 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <div>
                                  <span className="text-white font-bold text-xs sm:text-sm block line-clamp-1">{proj.title}</span>
                                  <span className="text-slate-500 font-mono text-[11px] block">{proj.date}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  proj.category === 'video' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                  proj.category === 'audio' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {proj.category}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="text-slate-400 block text-xs truncate max-w-[150px]">{proj.client || 'Projet Perso'}</span>
                                <span className="text-slate-500 block text-[11px] font-mono truncate max-w-[150px]">{proj.role || '-'}</span>
                              </td>
                              <td className="p-4 max-w-[160px]">
                                <div className="flex flex-wrap gap-1">
                                  {proj.tags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-slate-800 text-[9px] rounded font-mono text-slate-350">{tag}</span>
                                  ))}
                                  {proj.tags.length > 3 && <span className="text-[9px] text-slate-500 font-mono">+{proj.tags.length - 3}</span>}
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                {projectToDeleteId === proj.id ? (
                                  <div className="flex items-center gap-1.5 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDeleteProject(proj.id);
                                        setProjectToDeleteId(null);
                                      }}
                                      className="px-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors animate-pulse"
                                      title="Confirmer la suppression définitive"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Sûr ?</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setProjectToDeleteId(null)}
                                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                                      title="Annuler"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end space-x-2">
                                    <button
                                      onClick={() => startEdit(proj)}
                                      className="p-2 bg-slate-800 hover:bg-cyan-900/50 hover:text-cyan-400 rounded-lg text-slate-400 transition-colors"
                                      title="Éditer"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setProjectToDeleteId(proj.id)}
                                      className="p-2 bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 rounded-lg text-slate-400 transition-colors"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>

              </div>
            )}


            {/* TAB CONTENT: BOÎTE DE RÉCEPTION (INBOX MESSAGES) */}
            {activeTab === 'messages' && (
              <div className="space-y-6">
                
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="p-5 border-b border-slate-800 bg-slate-900/60">
                    <h4 className="font-bold text-base">Messages des recruteurs et clients</h4>
                    <p className="text-xs text-slate-400">
                      Chaque soumission de formulaire de contact sur le site est instantanément stockée ici en local.
                    </p>
                  </div>

                  {messages.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 space-y-2">
                      <Mail className="w-12 h-12 text-slate-600 mx-auto" />
                      <p className="text-sm">Votre boîte de réception est complètement vide.</p>
                      <p className="text-xs text-slate-500">
                        Testez le formulaire de contact en pied de page pour voir les messages s\'enregistrer en temps réel !
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {messages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`p-5 transition-colors duration-200 ${
                            msg.read ? 'bg-slate-900/40 opacity-75' : 'bg-slate-850/30 font-semibold border-l-2 border-cyan-400'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center space-x-2 mb-1.5 flex-wrap">
                                <span className="font-sans text-sm text-slate-200 font-bold">{msg.name}</span>
                                <span className="text-slate-500 text-xs font-mono">• &lt;{msg.email}&gt;</span>
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{msg.date}</span>
                              </div>
                              <h5 className="text-sm font-sans font-bold text-cyan-400 mb-2">{msg.subject}</h5>
                              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl font-normal whitespace-pre-line bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                                {msg.message}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">
                              <button
                                onClick={() => toggleMessageRead(msg.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 border transition-all ${
                                  msg.read 
                                    ? 'border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-400' 
                                    : 'border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400'
                                }`}
                              >
                                {msg.read ? 'Marquer Non Lu' : 'Marquer Lu'}
                              </button>
                              
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-2 bg-slate-850 text-rose-400 hover:text-white hover:bg-rose-950/50 border border-slate-800 rounded-lg"
                                title="Supprimer définitivement"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* TAB CONTENT: BASE DE DONNEES (USERS AND AUDIT LOGS) */}
            {activeTab === 'database' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
                  
                  {/* Title & Actions inside database pane */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div>
                      <h4 className="font-bold text-lg text-white">Base de Données Centrale</h4>
                      <p className="text-xs text-slate-450 font-mono mt-0.5">
                        Emplacement physique sur le serveur : portfolio/database.json
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={fetchDatabaseLogs}
                        disabled={isLoadingDB}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-cyan-400 hover:text-cyan-300 rounded-xl text-xs font-bold border border-slate-750 flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDB ? 'animate-spin' : ''}`} />
                        <span>Actualiser</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!isConfirmingClearLogs) {
                              setIsConfirmingClearLogs(true);
                            } else {
                              handleClearConnections();
                              setIsConfirmingClearLogs(false);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isConfirmingClearLogs 
                              ? "bg-rose-650 text-white border-rose-500 animate-pulse font-semibold"
                              : "bg-slate-950 hover:bg-rose-950/30 text-rose-450 hover:text-rose-400 border-rose-950/20"
                          }`}
                          title={isConfirmingClearLogs ? "Confirmer la vidange" : "Vider les logs"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isConfirmingClearLogs ? "Cliquer à nouveau pour vider" : "Vider les logs"}</span>
                        </button>
                        {isConfirmingClearLogs && (
                          <button
                            type="button"
                            onClick={() => setIsConfirmingClearLogs(false)}
                            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary metric cells */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-950/50 text-cyan-400 border border-cyan-500/10 rounded-lg flex items-center justify-center font-mono font-bold text-xl">
                        {dbUsers.length}
                      </div>
                      <div>
                        <h5 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Membres Visiteurs</h5>
                        <p className="text-[11px] text-slate-500">Enregistrés dans database.json avec mot de passe</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-950/50 text-indigo-400 border border-indigo-500/10 rounded-lg flex items-center justify-center font-mono font-bold text-xl">
                        {dbConnections.length}
                      </div>
                      <div>
                        <h5 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Traces de Connexion</h5>
                        <p className="text-[11px] text-slate-500">Inscriptions, connexions et déconnexions tracées</p>
                      </div>
                    </div>
                  </div>

                  {/* Two-Column split structure */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                    
                    {/* Left Column: Registered Subscribers list */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-350 font-bold uppercase font-mono tracking-wider">
                        <span>👥 Comptes Utilisateurs</span>
                        <span className="text-[11px] text-slate-500 font-normal lowercase">{dbUsers.length} comptes</span>
                      </div>
                      <div className="bg-slate-950 rounded-xl border border-slate-850 divide-y divide-slate-850 max-h-[365px] overflow-y-auto">
                        {dbUsers.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 text-xs italic">
                            Aucun compte visiteur enregistré dans la base de données.
                          </div>
                        ) : (
                          dbUsers.map((user: any) => (
                            <div key={user.id} className="p-3.5 hover:bg-slate-900/40 transition-colors flex items-center justify-between">
                              <div className="space-y-0.5 min-w-0">
                                <span className="font-sans text-sm font-bold text-slate-200 block truncate">{user.name}</span>
                                <span className="text-xs font-mono text-cyan-400 block truncate">{user.email}</span>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-[10px] font-mono text-slate-450 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded block">
                                  {user.id}
                                </span>
                                <span className="text-[9px] text-slate-500 block mt-1">
                                  Inscrit: {new Date(user.registeredAt).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Right Column: Connection audits list */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-350 font-bold uppercase font-mono tracking-wider">
                        <span>📜 Logs de Connexion</span>
                        <span className="text-[11px] text-slate-500 font-normal lowercase">{dbConnections.length} évènements</span>
                      </div>
                      <div className="bg-slate-950 rounded-xl border border-slate-850 divide-y divide-slate-850 max-h-[365px] overflow-y-auto">
                        {dbConnections.length === 0 ? (
                          <div className="p-8 text-center text-slate-500 text-xs italic">
                            Aucun évènement enregistré pour le moment.
                          </div>
                        ) : (
                          dbConnections.map((conn: any) => (
                            <div key={conn.id} className="p-3.5 hover:bg-slate-900/40 transition-colors flex items-center justify-between text-xs gap-3">
                              <div className="space-y-0.5 min-w-0 font-normal">
                                <span className="font-sans text-xs font-bold text-slate-300 block truncate">{conn.name}</span>
                                <span className="text-[11px] font-mono text-slate-505 block truncate">{conn.email}</span>
                              </div>
                              <div className="flex flex-col items-end flex-shrink-0">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wide ${
                                  conn.event === 'Inscription' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' :
                                  conn.event === 'Connexion' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15' :
                                  'bg-slate-804 text-slate-450 border border-slate-750'
                                }`}>
                                  {conn.event}
                                </span>
                                <span className="text-[9px] text-slate-500 block mt-1 font-mono">
                                  {new Date(conn.timestamp).toLocaleTimeString('fr-FR')}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* TAB CONTENT: GESTION DES PORTRAITS DU PRESTATAIRE */}
            {activeTab === 'portraits' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
                  
                  {/* Title Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div>
                      <h4 className="font-bold text-lg text-white">Galerie des Portraits d'Illustration</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Gérez les différentes photographies présentant votre profil de Directeur Artistique.
                      </p>
                    </div>
                  </div>

                  {/* Feedback Messages */}
                  {portraitError && (
                    <div className="p-4 bg-rose-500/10 text-rose-400 border border-rose-500/15 rounded-xl text-xs sm:text-sm flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{portraitError}</span>
                    </div>
                  )}

                  {portraitSuccess && (
                    <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded-xl text-xs sm:text-sm flex items-center gap-2">
                      <Check className="w-5 h-5 flex-shrink-0" />
                      <span>{portraitSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column: Upload New & Info (col-span-4) */}
                    <div className="lg:col-span-4 space-y-6">
                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
                        <h5 className="text-sm font-bold text-slate-200 uppercase tracking-wide font-mono">Ajouter un nouveau Portrait</h5>
                        <p className="text-xs text-slate-450 leading-relaxed">
                          La photo importée sera enregistrée dans la base centrale. Si vous importez plusieurs photos, les visiteurs pourront faire défiler vos photos directement sur la carte de présentation principale !
                        </p>

                        <div className="pt-2">
                          <label 
                            htmlFor="portrait-upload-panel-input" 
                            className={`w-full py-4 px-3 rounded-xl border border-dashed border-slate-700 hover:border-cyan-500/50 bg-slate-900/40 hover:bg-slate-900 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                              isUploadingCustomPortrait ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                            }`}
                          >
                            <Camera className="w-6 h-6 text-cyan-400 animate-pulse" />
                            <span className="text-xs font-semibold text-slate-305 text-center">
                              {isUploadingCustomPortrait ? "Envoi en cours..." : "Sélectionner un fichier image"}
                            </span>
                            <span className="text-[10px] text-slate-500">Formats supportés : PNG, JPG, JPEG, WEBP, GIF, SVG</span>
                          </label>
                          <input 
                            id="portrait-upload-panel-input"
                            type="file"
                            accept="image/*"
                            disabled={isUploadingCustomPortrait}
                            onChange={handleAddPortrait}
                            className="hidden"
                          />
                        </div>

                        <div className="border-t border-slate-850 pt-4 space-y-2">
                          <span className="text-[11px] font-mono font-bold text-slate-400 block uppercase font-sans">💡 Astuces de présentation</span>
                          <ul className="text-[10px] text-slate-500 space-y-1.5 list-disc pl-3">
                            <li>Préférez des images au format portrait (ratio 3:4 ou 2:3).</li>
                            <li>Évitez les images lourdes non compressées pour un chargement rapide.</li>
                            <li>La première image ajoutée est automatiquement définie comme principale.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Library List (col-span-8) */}
                    <div className="lg:col-span-8 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">Bibliothèque de Portraits ({portraits.length})</span>
                      </div>

                      {portraits.length === 0 ? (
                        <div className="bg-slate-950 p-12 rounded-2xl border border-slate-850 text-center space-y-3">
                          <Image className="w-12 h-12 text-slate-700 mx-auto" />
                          <h6 className="text-sm font-bold text-slate-300">Aucun portrait personnalisé</h6>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Vous utilisez actuellement le portrait par défaut de Lanja préinstallé sur le serveur. Importez un ou plusieurs portraits pour personnaliser l'illustration de votre profil de Directeur Artistique.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {portraits.map((img, idx) => {
                            const isActive = img === activePortrait;
                            return (
                              <div 
                                key={idx} 
                                className={`group relative rounded-xl overflow-hidden border bg-slate-950 h-56 flex flex-col justify-between transition-all duration-300 ${
                                  isActive ? 'border-cyan-500 shadow-lg shadow-cyan-950/20 scale-[1.01]' : 'border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                {/* Media Thumbnail */}
                                <div className="h-40 w-full relative overflow-hidden bg-slate-900 border-b border-slate-800/80">
                                  <img 
                                    src={img} 
                                    alt={`Portrait ${idx + 1}`} 
                                    className="w-full h-full object-cover object-top"
                                    referrerPolicy="no-referrer"
                                  />

                                  {/* Active Badge pill in corner */}
                                  {isActive && (
                                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-cyan-400 text-slate-950 text-[9px] font-mono font-bold uppercase rounded-md tracking-wider flex items-center gap-1 shadow-md">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" /> Actif
                                    </span>
                                  )}

                                  {/* Counter badge */}
                                  <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-slate-950/80 text-slate-400 border border-slate-800 text-[10px] font-mono rounded tracking-wider">
                                    #{idx + 1}
                                  </span>
                                </div>

                                {/* Actions row */}
                                <div className="p-2.5 bg-slate-900/60 flex items-center justify-between gap-2 flex-shrink-0">
                                  {!isActive ? (
                                    <button
                                      type="button"
                                      onClick={() => handleActivatePortrait(img)}
                                      className="text-xs text-sky-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
                                    >
                                      Activer
                                    </button>
                                  ) : (
                                    <span className="text-[11px] text-cyan-400 font-bold">Actif</span>
                                  )}

                                  {portraitToDelete === img ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDeletePortrait(img);
                                          setPortraitToDelete(null);
                                        }}
                                        className="px-2 py-1 text-[10px] uppercase font-bold bg-rose-500 hover:bg-rose-600 text-white rounded cursor-pointer transition-colors"
                                        title="Confirmer la suppression"
                                      >
                                        Sûr ?
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPortraitToDelete(null)}
                                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer transition-colors"
                                        title="Annuler"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setPortraitToDelete(img)}
                                      className="p-1.5 bg-slate-950 hover:bg-rose-950/50 text-slate-400 hover:text-rose-450 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                                      title="Supprimer cette photo"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
