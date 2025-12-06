
import React, { useEffect, useRef, useState, Suspense } from 'react';
import { AudioFile, ProcessingState, ColumnDef } from '../types';
import { StatusIcon } from './StatusIcon';
import AlbumCover from './AlbumCover';
import MiniAudioVisualizer from './MiniAudioVisualizer';
import { formatFileSize, formatDate } from '../utils/metadataUtils';

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
  // Dynamic Layout Props
  gridTemplate?: string;
  columns?: ColumnDef[];
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
  gridTemplate,
  columns
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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

  const toggleExpand = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
  };

  // Base backgrounds
  let stateClasses = "hover:bg-slate-800 transition-colors bg-slate-900/20"; 

  if (isProcessing) {
    stateClasses = "bg-gradient-to-r from-transparent via-indigo-900/20 to-transparent animate-gradient-loading border-b border-indigo-500/20";
  } else if (isActive) {
      stateClasses = "!bg-indigo-900/30 border-l-2 border-l-lumbago-primary";
  } else if (file.isSelected) {
    stateClasses = "!bg-indigo-900/20";
  }

  // Flex for Mobile, Grid for Desktop
  const containerClasses = [
      "relative group text-xs min-h-[40px] flex md:grid items-center gap-2 px-2", 
      stateClasses,
      isExiting ? 'animate-fade-out' : '',
  ].join(' ');

  // Helper to render specific cell types based on column config
  const renderCell = (col: ColumnDef) => {
      switch(col.id) {
          case 'health':
              return (
                  <div key={col.id} className="hidden md:flex justify-center items-center">
                      {file.health && (
                          <div 
                            className="w-8 h-1.5 rounded-full bg-slate-700 overflow-hidden" 
                            title={`Jakość metadanych: ${file.health.score}% (${file.health.rating})\nBrakujące: ${file.health.missingFields.join(', ') || 'Brak'}`}
                          >
                              <div 
                                className="h-full rounded-full" 
                                style={{ width: `${file.health.score}%`, backgroundColor: file.health.color }}
                              ></div>
                          </div>
                      )}
                  </div>
              );
          case 'title':
              return (
                <div key={col.id} className="flex items-center gap-2 overflow-hidden flex-grow md:flex-grow-0 min-w-0">
                    <div className="relative group/cover flex-shrink-0" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                        <div className="relative flex items-center">
                            <AlbumCover tags={displayTags} className="w-7 h-7 rounded shadow-sm border border-white/5" />
                            <button 
                                onClick={onPlayPause} 
                                className={`absolute inset-0 flex items-center justify-center bg-black/50 rounded transition-opacity ${isActive || isPlaying ? 'opacity-100' : 'opacity-0 group-hover/cover:opacity-100'}`}
                            >
                                {isPlaying ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-lumbago-primary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white pl-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
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
                        <div className="flex items-center gap-1.5">
                            <span 
                                className={`font-medium text-xs truncate cursor-pointer hover:text-lumbago-primary transition-colors leading-tight ${isActive ? 'text-lumbago-primary neon-text' : 'text-slate-200'}`} 
                                title={displayName} 
                                onClick={onPlayPause}
                                onDoubleClick={toggleExpand}
                            >
                                {displayName}
                            </span>
                            
                            <button 
                                onClick={() => onToggleFavorite(file.id)}
                                className={`transition-colors ${file.isFavorite ? 'text-lumbago-secondary' : 'text-slate-600 hover:text-lumbago-secondary opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                        <div className="md:hidden text-[10px] text-slate-500 truncate">{displayTags?.artist}</div>
                    </div>
                </div>
              );
          case 'artist':
              return (
                  <div key={col.id} className="hidden md:block truncate text-[11px] text-slate-300" title={displayTags?.artist}>
                      {displayTags?.artist || '-'}
                  </div>
              );
          case 'album':
              return (
                  <div key={col.id} className="hidden md:block truncate text-[11px] text-slate-500 italic" title={displayTags?.album}>
                      {displayTags?.album || '-'}
                  </div>
              );
          case 'bpm':
              return (
                  <div key={col.id} className="hidden md:block truncate">
                      {displayTags?.bpm ? (
                          <span className="inline-block bg-cyan-950/40 text-cyan-300 px-1.5 py-px rounded border border-cyan-900/30 text-[9px] font-bold font-mono">
                              {displayTags.bpm}
                          </span>
                      ) : (
                          <span className="text-slate-700 text-[9px]">-</span>
                      )}
                  </div>
              );
          case 'key':
              return (
                  <div key={col.id} className="hidden md:block truncate">
                      {displayTags?.initialKey ? (
                          <span className="inline-block bg-purple-950/40 text-purple-300 px-1.5 py-px rounded border border-purple-900/30 text-[9px] font-bold font-mono">
                              {displayTags.initialKey}
                          </span>
                      ) : (
                          <span className="text-slate-700 text-[9px]">-</span>
                      )}
                  </div>
              );
          case 'genre':
              return (
                  <div key={col.id} className="hidden md:block truncate text-[9px]">
                      {displayTags?.genre ? (
                          <span className="bg-slate-800 text-slate-400 px-1.5 py-px rounded border border-slate-700/50 truncate max-w-[70px] inline-block align-middle" title={displayTags.genre}>
                              {displayTags.genre}
                          </span>
                      ) : (
                          <span className="text-slate-700">-</span>
                      )}
                  </div>
              );
          case 'year':
              return (
                  <div key={col.id} className="hidden md:block truncate text-[9px] text-slate-500 font-mono">
                      {displayTags?.year || '-'}
                  </div>
              );
          default:
              return <div key={col.id}></div>;
      }
  }

  return (
    <div 
        ref={itemRef} 
        className={containerClasses} 
        style={gridTemplate ? { gridTemplateColumns: gridTemplate } : undefined}
        draggable 
        onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify([file.id]));
            e.dataTransfer.effectAllowed = 'copyMove';
        }}
    >
      
      {/* Progress Bar for Processing */}
      {isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-indigo-900/50 z-20">
           <div className="h-full bg-lumbago-primary animate-indeterminate-bar"></div>
        </div>
      )}

      {/* --- Checkbox Column (Fixed) --- */}
      <div className="flex items-center justify-center">
          <input 
            type="checkbox"
            checked={!!file.isSelected}
            onChange={(e) => onSelectionChange(file.id, e.target.checked)}
            className="h-3 w-3 rounded bg-slate-800 border-slate-600 text-lumbago-secondary focus:ring-0 cursor-pointer z-10 opacity-40 group-hover:opacity-100 transition-opacity"
          />
      </div>

      {/* --- Status / Visualizer Column (Fixed) --- */}
      <div className="hidden md:flex justify-center items-center w-full border-r border-white/5 h-6">
         {isActive ? (
             <div className="h-3 w-5 flex items-end justify-center pb-0.5">
                 <MiniAudioVisualizer isPlaying={!!isPlaying} />
             </div>
         ) : isProcessing ? (
             <div className="flex gap-[1px] items-center justify-center h-2 w-3">
                <div className="w-[1px] bg-lumbago-primary rounded-full animate-bounce delay-0 h-full"></div>
                <div className="w-[1px] bg-lumbago-secondary rounded-full animate-bounce delay-100 h-full"></div>
                <div className="w-[1px] bg-lumbago-primary rounded-full animate-bounce delay-200 h-full"></div>
             </div>
         ) : (
             <div className="scale-[0.6] opacity-60"><StatusIcon state={file.state} /></div>
         )}
      </div>

      {/* --- DYNAMIC COLUMNS --- */}
      {columns ? columns.map(col => renderCell(col)) : (
          // Fallback if no columns prop passed (e.g. mobile or old usage)
          <>
             {renderCell({ id: 'title', label: '', width: 0, minWidth: 0 })}
             {renderCell({ id: 'artist', label: '', width: 0, minWidth: 0 })}
             {renderCell({ id: 'album', label: '', width: 0, minWidth: 0 })}
             {renderCell({ id: 'bpm', label: '', width: 0, minWidth: 0 })}
             {renderCell({ id: 'key', label: '', width: 0, minWidth: 0 })}
             {renderCell({ id: 'genre', label: '', width: 0, minWidth: 0 })}
          </>
      )}

      {/* --- Actions Column (Fixed) --- */}
      <div className="hidden md:flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
         <button onClick={() => onAddToPlaylist(file.id)} className="p-1 rounded hover:bg-lumbago-primary hover:text-black text-slate-500 transition-colors" title="Dodaj do playlisty">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
         </button>
         <button onClick={onInspect} className="p-1 rounded hover:bg-white hover:text-black text-slate-500 transition-colors" title="Szczegóły">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
         </button>
         <button onClick={() => onEdit(file)} className="p-1 rounded hover:bg-lumbago-secondary hover:text-black text-slate-500 transition-colors" title="Edytuj">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
         </button>
         <button onClick={handleDelete} className="p-1 rounded hover:bg-red-500 hover:text-white text-slate-500 transition-colors" title="Usuń">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
         </button>
      </div>

      {/* --- Expand Button Column (Fixed) --- */}
      <div className="flex items-center justify-center ml-auto md:ml-0">
          <button 
            onClick={toggleExpand}
            className={`p-0.5 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-all duration-200 transform ${isExpanded ? 'rotate-180 text-white bg-white/10' : ''}`}
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
      </div>

      {/* --- EXPANDED DETAILS (Accordion) --- */}
      {isExpanded && (
          <div className="col-span-full w-full bg-slate-900/80 border-t border-b border-slate-700/50 -mx-2 px-4 py-3 animate-fade-in origin-top shadow-inner backdrop-blur-sm z-20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                      <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1">Info o Pliku</h4>
                      <div className="flex gap-2">
                          <span className="text-slate-500 w-12">Ścieżka:</span>
                          <span className="text-slate-300 font-mono break-all">{file.webkitRelativePath || file.file.name}</span>
                      </div>
                      <div className="flex gap-2">
                          <span className="text-slate-500 w-12">Rozmiar:</span>
                          <span className="text-slate-300">{formatFileSize(file.file.size)}</span>
                      </div>
                      <div className="flex gap-2">
                          <span className="text-slate-500 w-12">Data:</span>
                          <span className="text-slate-300">{formatDate(file.file.lastModified)}</span>
                      </div>
                  </div>

                  <div className="space-y-1">
                      <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1">Audio Info</h4>
                      <div className="flex gap-2">
                          <span className="text-slate-500 w-20">Bitrate:</span>
                          <span className="text-lumbago-primary font-mono">{displayTags?.bitrate ? `${displayTags.bitrate} kbps` : '-'}</span>
                      </div>
                      <div className="flex gap-2">
                          <span className="text-slate-500 w-20">Sample Rate:</span>
                          <span className="text-slate-300 font-mono">{displayTags?.sampleRate ? `${displayTags.sampleRate} Hz` : '-'}</span>
                      </div>
                      <div className="flex gap-2">
                          <span className="text-slate-500 w-20">Rok:</span>
                          <span className="text-slate-300">{displayTags?.year || '-'}</span>
                      </div>
                  </div>

                  <div className="space-y-1">
                      <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1">Komentarz / Label</h4>
                      <div className="p-1.5 bg-black/40 rounded border border-slate-800 text-slate-400 italic min-h-[30px] text-[10px]">
                          {displayTags?.comments || displayTags?.copyright || 'Brak.'}
                      </div>
                      
                      {/* Mobile Actions in Expanded View */}
                      <div className="md:hidden flex justify-end pt-2 gap-3 border-t border-slate-800 mt-2">
                          <button onClick={() => onAddToPlaylist(file.id)} className="text-slate-300 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg> Playlista</button>
                          <button onClick={() => onEdit(file)} className="text-slate-300 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg> Edytuj</button>
                          <button onClick={handleDelete} className="text-red-400 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> Usuń</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default FileListItem;
