import React from 'react';
import { Video, Music, Palette, Eye, Trash, Edit2 } from 'lucide-react';
import { Project } from '../types';

interface ProjectCardProps {
  key?: React.Key;
  project: Project;
  onView: (project: Project) => void;
  isAdmin: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
}

export default function ProjectCard({
  project,
  onView,
  isAdmin,
  onEdit,
  onDelete
}: ProjectCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);

  React.useEffect(() => {
    if (isConfirmingDelete) {
      const timer = setTimeout(() => setIsConfirmingDelete(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmingDelete]);
  
  // Icon and Style mapping per Category
  const categoryConfig = {
    video: {
      label: 'Vidéo',
      icon: Video,
      color: 'from-rose-500 to-orange-500',
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
    audio: {
      label: 'Audio/Musique',
      icon: Music,
      color: 'from-purple-500 to-indigo-500',
      badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    graphisme: {
      label: 'Graphisme',
      icon: Palette,
      color: 'from-emerald-500 to-teal-500',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
  };

  const config = categoryConfig[project.category] || categoryConfig.graphisme;
  const CategoryIcon = config.icon;

  return (
    <div 
      id={`project-card-${project.id}`}
      className="group relative flex flex-col h-full rounded-2xl bg-slate-900 border border-slate-800/80 overflow-hidden hover:border-slate-700 hover:shadow-xl hover:shadow-slate-950/40 transition-all duration-300"
    >
      {/* Thumbnail Aspect Ratio Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
        <img
          src={project.thumbnailUrl}
          alt={project.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-85 group-hover:opacity-60 transition-opacity duration-300" />
        
        {/* Category Floating Badge */}
        <div className="absolute top-3 left-3 flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border uppercase tracking-wider shadow-sm z-10 select-none bg-slate-950/80 text-white border-slate-800">
          <CategoryIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>{config.label}</span>
        </div>

        {/* Duration floating tag if exists */}
        {project.duration && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-sm border border-slate-800/60 text-[11px] font-mono text-slate-300">
            {project.duration}
          </div>
        )}

        {/* Hover View Project Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <button
            id={`view-overlay-btn-${project.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onView(project);
            }}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-slate-950 text-sm font-bold shadow-2xl scale-95 group-hover:scale-100 transition-all duration-300 hover:bg-cyan-100 hover:scale-105"
          >
            <Eye className="w-4 h-4 text-slate-950" />
            <span>Découvrir</span>
          </button>
        </div>
      </div>

      {/* Card Information */}
      <div className="flex flex-col flex-grow p-5 justify-between">
        <div className="space-y-2">
          {/* Release Date */}
          <div className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
            {project.date} {project.client ? `• ${project.client}` : ''}
          </div>

          {/* Title */}
          <h3 
            onClick={() => onView(project)}
            className="font-sans font-bold text-lg text-white group-hover:text-cyan-400 transition-colors duration-200 line-clamp-1 cursor-pointer"
          >
            {project.title}
          </h3>

          {/* Description */}
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
            {project.description}
          </p>
        </div>

        {/* Card Footer tags and Actions */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 overflow-hidden">
          {/* Tags preview */}
          <div className="flex flex-wrap gap-1 max-h-[22px] overflow-hidden">
            {project.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 uppercase tracking-wide border border-slate-700/30"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="text-[10px] text-slate-500 font-mono py-0.5">+{project.tags.length - 3}</span>
            )}
          </div>

          {/* Standard detail click button */}
          <button
            id={`card-view-btn-${project.id}`}
            onClick={() => onView(project)}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-400 transition-all duration-200 flex-shrink-0"
            title="Détails du projet"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
        
        {/* Admin overlays if in Admin View */}
        {isAdmin && (
          <div className="mt-4 pt-3.5 border-t border-dashed border-cyan-900/40 flex items-center justify-between gap-2 bg-cyan-950/15 p-2 rounded-xl">
            <span className="text-[11px] font-mono font-bold text-cyan-400">ADMIN:</span>
            <div className="flex gap-1.5">
              <button
                id={`admin-edit-btn-${project.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEdit) onEdit(project);
                }}
                className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold rounded-md bg-slate-800 text-slate-200 hover:bg-cyan-900 hover:text-cyan-100 transition-colors"
                title="Modifier"
              >
                <Edit2 className="w-3 h-3" />
                <span>Modifier</span>
              </button>
              <button
                id={`admin-delete-btn-${project.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isConfirmingDelete) {
                    setIsConfirmingDelete(true);
                  } else {
                    if (onDelete) {
                      onDelete(project.id);
                    }
                    setIsConfirmingDelete(false);
                  }
                }}
                className={`flex items-center space-x-1 px-2 py-1 text-[11px] font-bold rounded-md transition-colors border ${
                  isConfirmingDelete
                    ? "bg-rose-600 text-white animate-pulse border-rose-500 hover:bg-rose-700"
                    : "bg-rose-950/50 text-rose-400 hover:bg-rose-900 hover:text-rose-100 border-rose-900/30"
                }`}
                title={isConfirmingDelete ? "Cliquer à nouveau pour confirmer" : "Supprimer"}
              >
                <Trash className="w-3 h-3" />
                <span>{isConfirmingDelete ? "Supprimer ?" : "Sup."}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
