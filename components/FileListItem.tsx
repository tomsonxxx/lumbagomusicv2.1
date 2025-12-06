
import React, { useEffect, useRef, useState, Suspense } from 'react';
import { AudioFile, ProcessingState } from '../types';
import { StatusIcon } from './StatusIcon';
import AlbumCover from './AlbumCover';
import MiniAudioVisualizer from './MiniAudioVisualizer';

const TagPreviewTooltip = React.lazy(() => import('./TagPreviewTooltip'));

interface FileListItemProps {
  file: AudioFile;
  onEdit: (file: AudioFile) => void;
  onProcess: (file: AudioFile) => void;
  onDelete: (fileId: string) => void;
  onSelectionChange: (fileId: string, isSelected: boolean) => void;
  // Player Props
  isPlaying?: boolean;
  onPlayPause?: () => void;
  isActive?: boolean;
  // Inspect Prop
  onInspect: () => void;
  // Playlist & Favs
  onToggleFavorite: (fileId: string) => void;
  onAddToPlaylist: (fileId: string) => void;
  // Layout Prop
  gridClass?: string; 
}

const usePrevious = <T,>(value: T): T | undefined => {
    const ref = useRef<T | undefined>(undefined);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};


const FileListItem: React.FC<FileListItemProps> = ({
  file,
  onEdit,
  onProcess,
  onDelete,
  onSelectionChange,
  isPlaying,
  onPlayPause,
  isActive,
  onInspect,
  onToggleFavorite,
  onAddToPlaylist,
  gridClass
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<any>(null);

  const itemRef = useRef<HTMLDivElement>(null);
  const prevState = usePrevious(file.state);

  const isProcessing = file.state === ProcessingState.PROCESSING || file.state === ProcessingState.DOWNLOADING;
  const hasFetchedTags = file.fetchedTags && Object.keys(file.fetchedTags).length > 0;
  
  const displayTags = file.fetchedTags || file.originalTags;
  const displayName = file.newName || file.file.name;
  
  useEffect(() => {
    const element = itemRef.current;
    if (!element) return;
    
    if (prevState === ProcessingState.PROCESSING) {
      if (file.state === ProcessingState.SUCCESS) {
        element.classList.add('animate-flash-success');
      } else if (file.state === ProcessingState.ERROR) {
        element.classList.add('animate-flash-error');
      }
       element.addEventListener('animationend', () => {
            element.classList.remove('animate-flash-success', 'animate-flash-error');
       }, { once: true });
    }
  }, [file.state, prevState]);
  
  const handleDelete = () => {
    setIsExiting(true);
    setTimeout(() => {
        onDelete(file.id);
    }, 300);
  };

  const handleMouseEnter = () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (hasFetchedTags) {
          hoverTimeoutRef.current = setTimeout(() => {
              setIsHovered(true);
          }, 300);
      }
  };

  const handleMouseLeave = () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      setIsHovered(false);
  };

  // Base backgrounds handled by zebra striping in parent, override for states
  let stateClasses = "hover:bg-lumbago-light/50";

  if (isProcessing) {
    stateClasses = "bg-gradient-to-r from-transparent via-indigo-900/10 to-transparent animate-gradient-loading border-b border-indigo-500/20";
  } else if (isActive) {
      stateClasses = "!bg-lumbago-primary/5 border-l-2 border-l-lumbago-primary";
  } else if (file.isSelected) {
    stateClasses = "!bg-lumbago-secondary/10";
  }

  const containerClasses = [
      "transition-all duration-200 relative group text-sm",
      stateClasses,
      isExiting ? 'animate-fade-out' : '',
      gridClass ? `${gridClass} md:gap-2 md:items-center py-1 px-2` : "flex items-center p-2"
  ].join(' ');

  return (
    <div ref={itemRef} className={containerClasses} draggable onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify([file.id]));
        e.dataTransfer.effectAllowed = 'copyMove';
    }}>
      
      {/* Progress Bar for Processing (Mobile / Bottom overlay) */}
      {isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-indigo-900/50 z-20">
           <div className="h-full bg-lumbago-primary animate-indeterminate-bar"></div>
        </div>
      )}

      {/* --- Checkbox Column --- */}
      <div className={`flex items-center justify-center ${gridClass ? '' : ''}`}>
          <input 
            type="checkbox"
            checked={!!file.isSelected}
            onChange={(e) => onSelectionChange(file.id, e.target.checked)}
            className="h-3.5 w-3.5 rounded bg-slate-800 border-slate-600 text-lumbago-secondary focus:ring-0 cursor-pointer z-10 opacity-60 group-hover:opacity-100 transition-opacity"
          />
      </div>

      {/* --- Status Column --- */}
      <div className="hidden md:flex justify-center items-center w-8">
         {isProcessing ? (
             <div className="flex gap-[2px] items-center justify-center h-3 w-4" title="Przetwarzanie...">
                <div className="w-[2px] bg-lumbago-primary rounded-full animate-[loading-bar_0.8s_ease-in-out_infinite]" style={{ height: '40%', animationDelay: '0s' }}></div>
                <div className="w-[2px] bg-lumbago-secondary rounded-full animate-[loading-bar_0.8s_ease-in-out_infinite]" style={{ height: '70%', animationDelay: '0.2s' }}></div>
                <div className="w-[2px] bg-lumbago-primary rounded-full animate-[loading-bar_0.8s_ease-in-out_infinite]" style={{ height: '40%', animationDelay: '0.4s' }}></div>
             </div>
         ) : (
             <div className="scale-[0.65]"><StatusIcon state={file.state} /></div>
         )}
      </div>

      {/* --- Title & Cover Column --- */}
      <div className={`flex items-center gap-3 overflow-hidden ${!gridClass ? 'flex-grow ml-2' : ''}`}>
          
          <div className="relative group/cover flex-shrink-0" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
             <div className="relative">
                <AlbumCover tags={displayTags} className="w-8 h-8 rounded shadow-sm" />
                <button 
                    onClick={onPlayPause} 
                    className={`absolute inset-0 flex items-center justify-center bg-black/50 rounded transition-opacity ${isActive || isPlaying ? 'opacity-100' : 'opacity-0 group-hover/cover:opacity-100'}`}
                >
                    {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-lumbago-primary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white pl-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    )}
                </button>
             </div>
             {hasFetchedTags && isHovered && (
                <Suspense fallback={null}>
                    <TagPreviewTooltip originalTags={file.originalTags} fetchedTags={file.fetchedTags} />
                </Suspense>
            )}
          </div>

          <div className="min-w-0 flex flex-col justify-center">
             <div className="flex items-center gap-2">
                <span className={`font-semibold text-sm truncate cursor-pointer hover:text-lumbago-primary transition-colors ${isActive ? 'text-lumbago-primary neon-text' : 'text-slate-200'}`} title={displayName} onClick={onPlayPause}>
                    {displayName}
                </span>
                
                {/* --- Waveform Visualizer next to Title --- */}
                {isActive && (
                    <div className="flex-shrink-0 h-3 w-10 mb-0.5">
                        <MiniAudioVisualizer isPlaying={!!isPlaying} />
                    </div>
                )}

                <button 
                    onClick={() => onToggleFavorite(file.id)}
                    className={`transition-colors ${file.isFavorite ? 'text-lumbago-secondary' : 'text-slate-600 hover:text-lumbago-secondary opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                </button>
             </div>
             
             {/* Error message */}
             {file.state === ProcessingState.ERROR && (
                <div className="text-[10px] text-red-400 truncate leading-tight" title={file.errorMessage}>{file.errorMessage}</div>
             )}
          </div>
      </div>

      {/* --- Artist Column --- */}
      <div className="hidden md:block truncate text-xs text-slate-400" title={displayTags?.artist}>
          {displayTags?.artist || '-'}
      </div>

      {/* --- Album Column --- */}
      <div className="hidden md:block truncate text-xs text-slate-500" title={displayTags?.album}>
          {displayTags?.album || '-'}
      </div>

      {/* --- BPM Column --- */}
      <div className="hidden md:block truncate text-xs font-mono text-lumbago-accent/80">
          {displayTags?.bpm || '-'}
      </div>

      {/* --- Key Column --- */}
      <div className="hidden md:block truncate text-xs font-mono text-lumbago-secondary/80">
          {displayTags?.initialKey || '-'}
      </div>

      {/* --- Genre/Year Column --- */}
      <div className="hidden md:block truncate text-[10px] text-slate-500">
          {displayTags?.genre ? <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{displayTags.genre}</span> : ''}
          {displayTags?.year && <span className="ml-1 text-slate-600">{displayTags.year}</span>}
      </div>

      {/* --- Actions Column --- */}
      <div className="flex items-center justify-end gap-1 ml-auto md:ml-0 opacity-0 group-hover:opacity-100 transition-opacity">
         <button onClick={() => onAddToPlaylist(file.id)} className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-lumbago-primary transition-colors" title="Dodaj do playlisty">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
         </button>
         <button onClick={onInspect} className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors" title="Szczegóły">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
         </button>
         <button onClick={() => onEdit(file)} className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-lumbago-secondary transition-colors" title="Edytuj">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
         </button>
         <button onClick={handleDelete} className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-colors" title="Usuń">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
         </button>
      </div>
    </div>
  );
};

export default FileListItem;
