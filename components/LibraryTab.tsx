
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AudioFile, ProcessingState, ID3Tags, ColumnDef, SortKey } from '../types';
import HeaderToolbar from './HeaderToolbar';
import FileListItem from './FileListItem';
import FileGridItem from './FileGridItem';
import FilterSidebar from './FilterSidebar';

interface LibraryTabProps {
  files: AudioFile[];
  sortedFiles: AudioFile[]; 
  selectedFiles: AudioFile[];
  allFilesSelected: boolean;
  isBatchAnalyzing: boolean;
  isSaving: boolean;
  directoryHandle: any | null;
  isRestored: boolean;
  onToggleSelectAll: () => void;
  onBatchAnalyze: (files: AudioFile[]) => void;
  onBatchAnalyzeAll: () => void;
  onDownloadOrSave: () => void;
  onBatchEdit: () => void;
  onSingleItemEdit: (fileId: string) => void;
  onRename: () => void;
  onExportCsv: () => void;
  onDeleteItem: (id: string | 'selected' | 'all') => void;
  onClearAll: () => void;
  onProcessFile: (file: AudioFile) => void;
  onSelectionChange: (fileId: string, isSelected: boolean) => void;
  onTabChange: (tabId: string) => void;
  // Player props
  playingFileId: string | null;
  isPlaying: boolean;
  onPlayPause: (fileId: string) => void;
  // Inspector prop
  onInspectItem: (fileId: string) => void;
  // Playlist & Favs
  onToggleFavorite: (fileId: string) => void;
  onAddToPlaylist: (fileId: string) => void;
  // Sorting (Passed from App)
  currentSortKey?: SortKey;
  currentSortDirection?: 'asc' | 'desc';
  onSortChange?: (key: SortKey) => void;
}

const DEFAULT_COLUMNS: ColumnDef[] = [
    { id: 'health', label: 'Jakość', width: 50, minWidth: 40, sortKey: 'health' }, // Nowa kolumna
    { id: 'title', label: 'Utwór', width: 250, minWidth: 150, sortKey: 'title', isFlexible: true },
    { id: 'artist', label: 'Artysta', width: 180, minWidth: 100, sortKey: 'artist', isFlexible: true },
    { id: 'album', label: 'Album', width: 150, minWidth: 100, sortKey: 'album', isFlexible: true },
    { id: 'bpm', label: 'BPM', width: 50, minWidth: 40, sortKey: 'bpm' },
    { id: 'key', label: 'Key', width: 50, minWidth: 40, sortKey: 'key' },
    { id: 'genre', label: 'Gatunek', width: 80, minWidth: 60, sortKey: 'genre' },
    { id: 'year', label: 'Rok', width: 50, minWidth: 40, sortKey: 'year' },
];

const SortableHeader: React.FC<{ 
    column: ColumnDef;
    currentKey?: SortKey; 
    direction?: 'asc' | 'desc'; 
    onClick?: (key: SortKey) => void;
    onResizeStart: (e: React.MouseEvent, colId: string) => void;
    onDragStart: (e: React.DragEvent, colIndex: number) => void;
    onDragOver: (e: React.DragEvent, colIndex: number) => void;
    onDrop: (e: React.DragEvent, colIndex: number) => void;
    index: number;
    className?: string; 
}> = ({ column, currentKey, direction, onClick, onResizeStart, onDragStart, onDragOver, onDrop, index, className }) => {
    const isActive = currentKey === column.sortKey;
    
    return (
        <div 
            className={`relative flex items-center group hover:bg-white/5 transition-colors py-1.5 px-2 font-bold text-[9px] uppercase tracking-wider text-slate-500 select-none ${className}`}
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
        >
            <div 
                className="flex-grow flex items-center cursor-pointer overflow-hidden"
                onClick={() => column.sortKey && onClick && onClick(column.sortKey)}
            >
                <span className="truncate">{column.label}</span>
                <div className={`ml-1 w-3 flex flex-col items-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                    {isActive && (
                        direction === 'asc' 
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-lumbago-primary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-lumbago-primary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    )}
                </div>
            </div>
            
            {/* Resize Handle */}
            <div 
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 z-10"
                onMouseDown={(e) => onResizeStart(e, column.id)}
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
};

const LibraryTab: React.FC<LibraryTabProps> = (props) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
      genre: string | null;
      year: string | null;
      status: ProcessingState | null | 'PROCESSED';
  }>({
      genre: null,
      year: null,
      status: null
  });

  // Column State
  const [columns, setColumns] = useState<ColumnDef[]>(DEFAULT_COLUMNS);
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);

  // Resize Logic
  const handleResizeStart = (e: React.MouseEvent, colId: string) => {
      e.preventDefault();
      const startX = e.clientX;
      const colIndex = columns.findIndex(c => c.id === colId);
      const startWidth = columns[colIndex].width;

      const handleMouseMove = (moveEvent: MouseEvent) => {
          const diff = moveEvent.clientX - startX;
          const newWidth = Math.max(columns[colIndex].minWidth, startWidth + diff);
          
          setColumns(prev => {
              const next = [...prev];
              next[colIndex] = { ...next[colIndex], width: newWidth, isFlexible: false }; // Disable flex on manual resize
              return next;
          });
      };

      const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.body.style.cursor = 'default';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
  };

  // Drag & Drop Logic
  const handleDragStart = (e: React.DragEvent, index: number) => {
      setDraggedColumnIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      // Optional: Set custom drag image
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault(); // Necessary to allow dropping
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedColumnIndex === null || draggedColumnIndex === index) return;

      const newColumns = [...columns];
      const [removed] = newColumns.splice(draggedColumnIndex, 1);
      newColumns.splice(index, 0, removed);
      setColumns(newColumns);
      setDraggedColumnIndex(null);
  };

  const filteredFiles = useMemo(() => {
    let result = props.sortedFiles;

    if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase();
        result = result.filter(file => {
            const tags = file.fetchedTags || file.originalTags;
            return (
                file.file.name.toLowerCase().includes(lowerQuery) ||
                (tags?.title && tags.title.toLowerCase().includes(lowerQuery)) ||
                (tags?.artist && tags.artist.toLowerCase().includes(lowerQuery)) ||
                (tags?.album && tags.album.toLowerCase().includes(lowerQuery))
            );
        });
    }

    if (activeFilters.genre) {
        result = result.filter(f => {
             const g = f.fetchedTags?.genre || f.originalTags?.genre;
             return g === activeFilters.genre;
        });
    }

    if (activeFilters.year) {
        result = result.filter(f => {
             const y = f.fetchedTags?.year || f.originalTags?.year;
             return y === activeFilters.year;
        });
    }

    if (activeFilters.status) {
        if (activeFilters.status === ProcessingState.SUCCESS) {
             result = result.filter(f => f.state === ProcessingState.SUCCESS);
        } else if (activeFilters.status === ProcessingState.ERROR) {
             result = result.filter(f => f.state === ProcessingState.ERROR);
        } else if (activeFilters.status === ProcessingState.PENDING) {
             result = result.filter(f => f.state === ProcessingState.PENDING);
        }
    }

    return result;
  }, [props.sortedFiles, searchQuery, activeFilters]);


  const handleFilterChange = (key: 'genre' | 'year' | 'status', value: any) => {
      setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (key: SortKey) => {
      if (props.onSortChange) props.onSortChange(key);
  };

  // --- DYNAMIC GRID STYLE ---
  // Checkbox (30px) | Status (40px) | ...Dynamic Cols... | Actions (90px) | Expand (30px)
  const gridTemplate = useMemo(() => {
      const colSizes = columns.map(c => c.isFlexible ? `minmax(${c.minWidth}px, ${c.width}fr)` : `${c.width}px`).join(' ');
      return `30px 40px ${colSizes} 90px 30px`;
  }, [columns]);

  if (props.files.length === 0) {
    return (
      <div className="text-center p-10 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 animate-fade-in mt-10">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Twoja biblioteka jest pusta</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 mb-4">
          Przejdź do zakładki "Import / Skan", aby dodać pliki audio.
        </p>
        <button
          onClick={() => props.onTabChange('scan')}
          className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors"
        >
          Przejdź do Importu
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
       {props.isRestored && (
            <div className="mb-2 p-2 bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-300 rounded-r text-xs flex justify-between items-center animate-fade-in">
                <span>Sesja przywrócona. Aby zapisać zmiany na dysku, zaimportuj pliki ponownie.</span>
                <button onClick={props.onClearAll} className="underline hover:text-yellow-100">Wyczyść</button>
            </div>
        )}

      {/* STICKY HEADER BLOCK */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-lumbago-border shadow-xl -mx-4 -mt-4 pt-2 px-4">
          <HeaderToolbar
            totalCount={props.files.length}
            selectedCount={props.selectedFiles.length}
            isAnalyzing={props.isBatchAnalyzing}
            isSaving={props.isSaving}
            allSelected={props.allFilesSelected}
            onToggleSelectAll={props.onToggleSelectAll}
            onAnalyze={() => props.onBatchAnalyze(props.selectedFiles)}
            onAnalyzeAll={props.onBatchAnalyzeAll}
            onDownloadOrSave={props.onDownloadOrSave}
            onEdit={props.onBatchEdit}
            onRename={props.onRename}
            onExportCsv={props.onExportCsv}
            onDelete={() => props.onDeleteItem('selected')}
            onClearAll={props.onClearAll}
            isDirectAccessMode={!!props.directoryHandle}
            directoryName={props.directoryHandle?.name}
            isRestored={props.isRestored}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onToggleFilters={() => setShowFilters(!showFilters)}
            showFilters={showFilters}
          />
          
          {/* List Header - Only visible in list view */}
          {viewMode === 'list' && (
              <div 
                className="hidden md:grid gap-2 px-2 pb-0 text-[10px] mt-0 select-none"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                    <div className="flex items-center justify-center py-1.5 border-r border-white/5">
                        <input type="checkbox" checked={props.allFilesSelected} onChange={props.onToggleSelectAll} className="h-3 w-3 rounded bg-slate-800 border-slate-600 text-lumbago-secondary focus:ring-0 cursor-pointer" />
                    </div>
                    
                    <div className="flex items-center justify-center py-1.5 border-r border-white/5">
                        <span className="text-slate-500 font-bold">ST</span>
                    </div>
                    
                    {columns.map((col, index) => (
                        <SortableHeader 
                            key={col.id}
                            index={index}
                            column={col}
                            currentKey={props.currentSortKey} 
                            direction={props.currentSortDirection} 
                            onClick={handleSort}
                            onResizeStart={handleResizeStart}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className="border-r border-white/5 last:border-0"
                        />
                    ))}
                    
                    <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right py-1.5 pr-2 flex items-center justify-end">Akcje</div>
                    {/* Empty cell for expand button */}
                    <div></div> 
              </div>
          )}
      </div>
      
      <FilterSidebar 
          files={props.files}
          filters={activeFilters}
          onFilterChange={handleFilterChange}
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
      />

      <div className="mt-0 pb-20">
        {filteredFiles.length === 0 ? (
            <div className="text-center py-20 opacity-60">
                <p className="text-lg text-slate-500 dark:text-slate-400">Nie znaleziono plików pasujących do kryteriów.</p>
                <button onClick={() => { setSearchQuery(''); setActiveFilters({ genre: null, year: null, status: null }); }} className="mt-2 text-indigo-500 hover:underline">Wyczyść filtry</button>
            </div>
        ) : viewMode === 'list' ? (
            <div className="w-full">
                {/* --- FILE ROWS --- */}
                <div className="divide-y divide-slate-800/50">
                    {filteredFiles.map((file, index) => (
                        <FileListItem 
                            key={file.id} 
                            file={file} 
                            onProcess={props.onProcessFile}
                            onEdit={(f) => props.onSingleItemEdit(f.id)}
                            onDelete={props.onDeleteItem}
                            onSelectionChange={props.onSelectionChange}
                            // Player Props
                            isPlaying={props.playingFileId === file.id && props.isPlaying}
                            onPlayPause={() => props.onPlayPause(file.id)}
                            isActive={props.playingFileId === file.id}
                            // Inspect
                            onInspect={() => props.onInspectItem(file.id)}
                            // Actions
                            onToggleFavorite={props.onToggleFavorite}
                            onAddToPlaylist={props.onAddToPlaylist}
                            // Layout Injection - Pass Dynamic Config
                            gridTemplate={gridTemplate}
                            columns={columns}
                        />
                    ))}
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-2 mt-4">
                 {filteredFiles.map(file => (
                    <FileGridItem
                        key={file.id}
                        file={file}
                        onProcess={props.onProcessFile}
                        onEdit={(f) => props.onSingleItemEdit(f.id)}
                        onSelectionChange={props.onSelectionChange}
                        // Player Props
                        isPlaying={props.playingFileId === file.id && props.isPlaying}
                        onPlayPause={() => props.onPlayPause(file.id)}
                        isActive={props.playingFileId === file.id}
                        // Inspect
                        onInspect={() => props.onInspectItem(file.id)}
                    />
                 ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default LibraryTab;