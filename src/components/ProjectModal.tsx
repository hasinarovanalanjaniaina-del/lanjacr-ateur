import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Video, Music, Palette, Calendar, User, Clock, 
  ExternalLink, Play, Pause, Volume2, VolumeX, Sparkles 
} from 'lucide-react';
import { Project } from '../types';

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  // Audio Player States
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [waveHeights, setWaveHeights] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Close with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Generate random static wave heights once on launch
  useEffect(() => {
    const barsCount = 38;
    const heights = Array.from({ length: barsCount }, () => Math.floor(Math.random() * 60) + 10);
    setWaveHeights(heights);
  }, [project]);

  // Handle wave simulation animation when playing audio
  useEffect(() => {
    if (isPlaying) {
      const animateWave = () => {
        setWaveHeights((prev) =>
          prev.map((h) => {
            // Random jitter around existing values to look like active audio
            const change = Math.floor(Math.random() * 25) - 12;
            const newVal = Math.max(10, Math.min(80, h + change));
            return newVal;
          })
        );
        animationRef.current = requestAnimationFrame(animateWave);
      };
      animationRef.current = requestAnimationFrame(animateWave);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  // Audio Playback controllers
  useEffect(() => {
    if (project.category === 'audio' && project.mediaUrl) {
      audioRef.current = new Audio(project.mediaUrl);
      
      const updateProgress = () => {
        if (audioRef.current) {
          const current = audioRef.current.currentTime;
          const total = audioRef.current.duration || 1;
          setAudioProgress((current / total) * 100);
          if (audioRef.current.ended) {
            setIsPlaying(false);
            setAudioProgress(0);
          }
        }
      };

      audioRef.current.addEventListener('timeupdate', updateProgress);
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeEventListener('timeupdate', updateProgress);
        }
      };
    }
  }, [project, project.mediaUrl]);

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.log('Audio playback error', err));
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMuteAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekPercentage = parseFloat(e.target.value);
    const totalDuration = audioRef.current.duration || 0;
    audioRef.current.currentTime = (seekPercentage / 100) * totalDuration;
    setAudioProgress(seekPercentage);
  };

  // Check if standard YouTube or Vimeo url to return appropriate embedded iframe
  const renderVideoPlayer = () => {
    const url = project.mediaUrl;
    
    // Check if it's a direct browser-playable video! (Base64 mp4/webm or url ending with .mp4 etc.)
    const isDirectVideo = url.startsWith('data:video/') || 
                          url.endsWith('.mp4') || 
                          url.endsWith('.webm') || 
                          url.endsWith('.mov') || 
                          url.endsWith('.ogv');

    if (isDirectVideo) {
      return (
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
          <video 
            src={url} 
            controls 
            autoPlay 
            loop 
            className="w-full h-full object-contain bg-black"
          />
        </div>
      );
    }

    // Check if it's an uploaded PDF document
    const isPdf = url.startsWith('data:application/pdf') || url.endsWith('.pdf');
    if (isPdf) {
      return (
        <div className="relative w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex flex-col p-1.5 animate-slideUp">
          <object 
            data={url} 
            type="application/pdf" 
            className="w-full h-[500px] rounded-lg"
          >
            <embed src={url} type="application/pdf" />
          </object>
          <div className="flex justify-between items-center px-4 py-3 bg-slate-950 text-xs text-slate-450 border-t border-slate-800 mt-1.5 rounded-b-lg font-mono">
            <span>Visualisation de document PDF interactif</span>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/30 rounded flex items-center space-x-1.5 text-xs transition-colors"
            >
              <span>Ouvrir en plein écran</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      );
    }

    let isEmbeddable = false;
    let embedUrl = url;

    if (url.includes('youtube.com/embed/') || url.includes('player.vimeo.com/video/')) {
      isEmbeddable = true;
    } else if (url.includes('youtube.com/watch?v=')) {
      const vid = url.split('v=')[1]?.split('&')[0];
      if (vid) {
        embedUrl = `https://www.youtube.com/embed/${vid}`;
        isEmbeddable = true;
      }
    } else if (url.includes('youtu.be/')) {
      const vid = url.split('youtu.be/')[1]?.split('?')[0];
      if (vid) {
        embedUrl = `https://www.youtube.com/embed/${vid}`;
        isEmbeddable = true;
      }
    }

    if (isEmbeddable) {
      return (
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
          <iframe
            src={embedUrl}
            title={project.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    }

    // Check if simple offline physical image/gif URL was passed under category video
    const isImage = url.startsWith('data:image/') || url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.gif') || url.endsWith('.webp');
    if (isImage) {
      return (
        <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl p-2 select-none">
          <img
            src={url}
            alt={project.title}
            referrerPolicy="no-referrer"
            className="w-full h-auto max-h-[500px] object-contain rounded-lg mx-auto"
          />
        </div>
      );
    }

    // Gorgeous fallback cinematic preview player setup
    return (
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col justify-center items-center p-6 text-center group">
        <img
          src={project.thumbnailUrl}
          alt={project.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-30 blurring-card"
        />
        <div className="absolute inset-0 bg-blue-950/20" />
        <div className="relative z-10 space-y-4 max-w-sm">
          <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 group-hover:scale-110 transition-transform">
            <Video className="w-7 h-7" />
          </div>
          <p className="text-white font-bold text-sm">Prêt pour lecture externe (Iframe/Liaison)</p>
          <a
            href={project.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-lg text-xs font-semibold text-white shadow-lg hover:from-cyan-400 hover:to-indigo-500"
          >
            <span>Ouvrir dans un nouvel onglet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      
      {/* Container Box */}
      <div 
        id="project-detail-modal"
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-zoomIn max-h-[90vh] flex flex-col"
      >
        
        {/* Header bar / Close button */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-lg bg-slate-800 text-cyan-400">
              {project.category === 'video' && <Video className="w-5 h-5" />}
              {project.category === 'audio' && <Music className="w-5 h-5" />}
              {project.category === 'graphisme' && <Palette className="w-5 h-5" />}
            </span>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                PROJET DE LANJA CREATOR
              </span>
              <h2 className="text-lg font-bold text-white line-clamp-1">{project.title}</h2>
            </div>
          </div>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow custom-scrollbar">
          
          {/* MEDIA DEMONSTRATION BOX */}
          <div className="w-full">
            {project.category === 'video' && renderVideoPlayer()}

            {project.category === 'audio' && (
              <div className="w-full rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-inner flex flex-col items-center">
                
                {/* Simulated disc track representation */}
                <div className="relative w-28 h-28 rounded-full mb-6 overflow-hidden bg-slate-800 border-4 border-slate-700/50 flex items-center justify-center shadow-lg group">
                  <img
                    src={project.thumbnailUrl}
                    alt={project.title}
                    referrerPolicy="no-referrer"
                    className={`absolute inset-0 w-full h-full object-cover opacity-60 ${isPlaying ? 'animate-spin' : ''}`}
                    style={{ animationDuration: '8s' }}
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative z-10 w-9 h-9 rounded-full bg-slate-950 flex items-center justify-center border-2 border-slate-700">
                    <Music className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>

                {/* Simulated audio waveform visualizer */}
                <div className="w-full h-20 flex items-end justify-center gap-[4px] mb-8 px-4 max-w-md">
                  {waveHeights.map((h, index) => (
                    <div
                      key={index}
                      className="w-[6px] rounded-t-full transition-all duration-150"
                      style={{
                        height: `${h}%`,
                        backgroundColor: isPlaying 
                          ? `rgba(34, 211, 238, ${0.4 + (h / 120)})` // Cybercyan pulse variable
                          : 'rgba(71, 85, 105, 0.5)' // Dim state
                      }}
                    />
                  ))}
                </div>

                {/* Progress Sliders */}
                <div className="w-full max-w-md space-y-2 mb-6">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={audioProgress}
                    onChange={handleAudioSeek}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>Active Audio Feed</span>
                    <span>{project.duration || 'Fichier MP3'}</span>
                  </div>
                </div>

                {/* Controller Action Row */}
                <div className="flex items-center justify-center space-x-6">
                  {/* Mute Button */}
                  <button
                    onClick={toggleMuteAudio}
                    className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title={isMuted ? 'Rétablir le son' : 'Couper le son'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  {/* Play Button */}
                  <button
                    onClick={togglePlayAudio}
                    className="w-14 h-14 rounded-full flex items-center justify-center bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-400/20 transform hover:scale-105 transition-all"
                    title={isPlaying ? 'Pause' : 'Lecture'}
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-slate-950" /> : <Play className="w-6 h-6 fill-slate-950 ml-1" />}
                  </button>

                  <a 
                    href={project.mediaUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="Ouvrir fichier source"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

              </div>
            )}

            {project.category === 'graphisme' && (
              (() => {
                const isPdf = project.mediaUrl.startsWith('data:application/pdf') || project.mediaUrl.endsWith('.pdf');
                if (isPdf) {
                  return (
                    <div className="relative w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex flex-col p-1.5 animate-slideUp">
                      <object 
                        data={project.mediaUrl} 
                        type="application/pdf" 
                        className="w-full h-[500px] rounded-lg"
                      >
                        <embed src={project.mediaUrl} type="application/pdf" />
                      </object>
                      <div className="flex justify-between items-center px-4 py-3 bg-slate-950 text-xs text-slate-400 border-t border-slate-800 mt-1.5 rounded-b-lg font-mono">
                        <span>Visualisation de document PDF interactif</span>
                        <a 
                          href={project.mediaUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/30 rounded flex items-center space-x-1.5 text-xs transition-colors"
                        >
                          <span>Ouvrir en plein écran</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl p-2 select-none">
                    <img
                      src={project.mediaUrl || project.thumbnailUrl}
                      alt={project.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-auto max-h-[500px] object-contain rounded-lg mx-auto"
                    />
                    <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-md px-4 py-3 rounded-lg border border-slate-800/80 text-xs text-slate-450 flex items-center justify-between">
                      <span>Visualisation d'oeuvre haute définition</span>
                      <a
                        href={project.mediaUrl || project.thumbnailUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 hover:text-cyan-400 font-bold text-cyan-500 transition-colors"
                      >
                        <span>Ouvrir en plein écran</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* PROJECT METADATA & STORY SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left/Metadata block */}
            <div className="md:col-span-1 space-y-4 rounded-xl bg-slate-950/40 p-5 border border-slate-850">
              <h4 className="text-xs font-mono tracking-widest text-slate-400 uppercase border-b border-slate-800 pb-2">
                Fiche Technique
              </h4>
              
              <div className="space-y-3 text-xs">
                {project.date && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-900/50">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Date
                    </span>
                    <span className="text-slate-300 font-medium">{project.date}</span>
                  </div>
                )}
                {project.client && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-900/50">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Client
                    </span>
                    <span className="text-slate-300 font-medium">{project.client}</span>
                  </div>
                )}
                {project.role && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-900/50">
                    <span className="text-slate-500 flex items-center gap-1.5 text-left">
                      <Sparkles className="w-3.5 h-3.5" /> Rôle
                    </span>
                    <span className="text-cyan-400 font-medium text-right max-w-[140px] truncate" title={project.role}>
                      {project.role}
                    </span>
                  </div>
                )}
                {project.duration && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-900/50">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Format
                    </span>
                    <span className="text-slate-300 font-mono font-medium">{project.duration}</span>
                  </div>
                )}
              </div>

              {/* Tags list */}
              <div className="pt-3">
                <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase block mb-2">
                  Tags & Outils:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded bg-slate-800/80 text-[10px] text-slate-300 font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right/Description story block */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="font-sans font-bold text-xl text-white">Le Brief & Création</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {project.description}
              </p>
              
              {project.longDescription && (
                <div className="space-y-3 pt-2 text-slate-400 text-xs sm:text-sm leading-relaxed border-t border-slate-800/60">
                  <h4 className="text-sm font-semibold text-slate-200">Processus Créatif :</h4>
                  <p className="whitespace-pre-line">{project.longDescription}</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
