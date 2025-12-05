

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { AudioFile, ProcessingState } from '../types';
import { StatusIcon } from './StatusIcon';
import AlbumCover from './AlbumCover';
import { isTagWritingSupported } from '../utils/audioUtils';
import MiniAudioVisualizer from './MiniAudioVisualizer';

const TagPreviewTooltip = React.lazy(() => import('./TagPreviewTooltip'));

interface FileListItemProps {
  file: AudioFile;
  onEdit: (file: AudioFile) => void;
  onProcess: (file: AudioFile) => void;
  onDelete: (fileId: string) => void;
  onSelectionChange: (fileId: string, isSelected: boolean) => void;
  // New Player Props
  isPlaying?: boolean;
  onPlayPause?: () => void;
  isActive?: boolean;
  // New Inspect Prop
  onInspect: () => void;
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
  onInspect
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<any>(null);

  const itemRef = useRef<HTMLDivElement>(null);
  const prevState = usePrevious(file.state);

  const isProcessing = file.state === ProcessingState.PROCESSING || file.state === ProcessingState.DOWNLOADING;
  const hasBeenProcessed = file.state === ProcessingState.SUCCESS || file.state === ProcessingState.ERROR;
  const hasFetchedTags = file.fetchedTags && Object.keys(file.fetchedTags).length > 0;
  
  const displayTags = file.fetchedTags || file.originalTags;
  const displayName = file.newName || file.file.name;
  const hasNewName = !!file.newName && file.newName !== file.file.name;
  const supportsTagWriting = isTagWritingSupported(file.file);

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
          }, 200);
      }
  };

  const handleMouseLeave = () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      setIsHovered(false);
  };

  let bgClass = "bg-white dark:bg-slate-800";
  let borderClass = "border-transparent dark:border-slate-700";

  if (isProcessing) {
    bgClass = "bg-gradient-to-r from-slate-50 via-indigo-50 to-slate-50 dark:from-slate-800 dark:via-indigo-900/20 dark:to-slate-800 animate-gradient-loading";
    borderClass = "border-indigo-200 dark:border-indigo-900";
  } else if (isActive) {
      bgClass = "bg-indigo-50 dark:bg-indigo-900/30";
      borderClass = "border-indigo-500/50";
  }

  if (file.isSelected) {
    borderClass = 'border-indigo-500 ring-2 ring-indigo-500/50';
  }

  const itemClasses = [
      "flex items-center p-3 rounded-lg shadow-sm transition-all duration-300 border relative overflow-hidden",
      bgClass,
      borderClass,
      file.state === ProcessingState.SUCCESS && !isActive ? 'opacity-70' : '',
      isExiting ? 'animate-fade-out' : 'animate-fade-in'
  ].join(' ');

  return (
    <div ref={itemRef} className={itemClasses}>
      
      {/* Progress Bar for Processing */}
      {isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-100 dark:bg-slate-700">
           <div className="h-full bg-indigo-500 animate-indeterminate-bar"></div>
           <style>{`
             @keyframes indeterminate-bar {
                0% { width: 0%; margin-left: 0%; }
                50% { width: 50%; margin-left: 25%; }
                100% { width: 0%; margin-left: 100%; }
             }
             .animate-indeterminate-bar {
                animation: indeterminate-bar 1.5s infinite linear;
             }
           `}</style>
        </div>
      )}

      <input 
        type="checkbox"
        checked={!!file.isSelected}
        onChange={(e) => onSelectionChange(file.id, e.target.checked)}
        className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 mr-4 flex-shrink-0 z-10"
      />
      <div className="mr-3 z-10">
          <button 
            onClick={onPlayPause} 
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900'}`}
          >
              {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 pl-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              )}
          </button>
      </div>
      
      <StatusIcon state={file.state} />
      
      <div 
        className="relative group z-10"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <AlbumCover tags={displayTags} />
        {hasFetchedTags && isHovered && (
            <Suspense fallback={null}>
                <TagPreviewTooltip originalTags={file.originalTags} fetchedTags={file.fetchedTags} />
            </Suspense>
        )}
      </div>
      <div className="flex-grow ml-4 overflow-hidden z-10">
        <p className={`font-bold text-sm truncate transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`} title={displayName}>
            {displayName}
        </p>
        
        {isActive ? (
             <MiniAudioVisualizer isPlaying={!!isPlaying} />
        ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={file.file.name}>
              {hasNewName ? `Oryginalnie: ${file.file.name}` : `Artysta: ${displayTags?.artist || 'Brak'}`}
            </p>
        )}

         {!supportsTagWriting && hasBeenProcessed && file.state !== ProcessingState.ERROR && (
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 truncate">
                Tylko zmiana nazwy
            </p>
        )}
        {file.state === ProcessingState.ERROR && (
          <div className="flex items-center mt-1 text-xs text-red-500 dark:text-red-400" title={file.errorMessage || "Kliknij, aby zobaczyć szczegóły błędu"}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
             </svg>
             <span className="truncate font-medium">
                {file.errorMessage || "Wystąpił nieznany błąd"}
             </span>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2 ml-4 flex-shrink-0 z-10">
        {!hasBeenProcessed && (
           <button onClick={() => onProcess(file)} disabled={isProcessing} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed" title="Przetwarzaj">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
           </button>
        )}
         {/* Inspect Button */}
         <button onClick={onInspect} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400" title="Szczegóły pliku">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
         </button>

         <button onClick={() => onEdit(file)} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400" title="Edytuj tagi">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
         </button>
         <button onClick={handleDelete} className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500 dark:text-red-400" title="Usuń">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
         </button>
      </div>
    </div>
  );
};

export default FileListItem;
