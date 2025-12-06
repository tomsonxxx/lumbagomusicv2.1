
import React, { useState, useMemo } from 'react';
import { AudioFile, ProcessingState, ID3Tags } from '../types';
import HeaderToolbar from './HeaderToolbar';
import FileListItem from './FileListItem';
import FileGridItem from './FileGridItem';
import FilterSidebar from './FilterSidebar';
import { SortKey } from '../utils/sortingUtils';

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

const SortableHeader: React.FC<{ 
    label: string; 
    sortKey: SortKey; 
    currentKey?: SortKey; 
    direction?: 'asc' | 'desc'; 
    onClick?: (key: SortKey) => void;
    className?: string; 
    alignRight?: boolean;
}> = ({ label, sortKey, currentKey, direction, onClick, className, alignRight }) => {
    const isActive = currentKey === sortKey;
    return (
        <div 
            className={`flex items-center cursor-pointer group hover:text-white transition-colors py-2 px-2 font-bold text-[10px] uppercase tracking-wider text-slate-500 select-none ${alignRight ? 'justify-end' : ''} ${className}`}
            onClick={() => onClick && onClick(sortKey)}
        >
            <span className="truncate">{label}</span>
            <div className={`ml-1 w-3 flex flex-col items-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                {isActive && (
                    direction === 'asc' 
                    ? <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-lumbago-primary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-lumbago-primary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                )}
            </div>
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

  // --- STRICT GRID SYSTEM CONFIGURATION ---
  const gridTemplate = "grid-cols-[30px_40px_minmax(200px,4fr)_minmax(120px,3fr)_minmax(120px,3fr)_50px_50px_80px_90px_30px]";

  return (
    <div className="relative flex flex-col h-full">
       {props.isRestored && (
            <div className="mb-2 p-2 bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-300 rounded-r text-xs flex justify-between items-center animate-fade-in">
                <span>Sesja przywrócona. Aby zapisać zmiany na dysku, zaimportuj pliki ponownie.</span>
                <button onClick={props.onClearAll} className="underline hover:text-yellow-100">Wyczyść</button>
            </div>
        )}

      {/* 
          --- COMBINED STICKY HEADER BLOCK ---
          Wrapping Toolbar and List Header in one sticky block.
          Using negative margins (-mx-4 -mt-4) to counteract the Layout's padding
          and force the header to the very top of the scrollable viewport.
      */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-lumbago-border shadow-xl -mx-4 -mt-4 pt-4 px-4">
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
          
          {/* List Header - Only visible in list view, part of sticky block */}
          {viewMode === 'list' && (
              <div className={`hidden md:grid ${gridTemplate} gap-2 px-2 pb-1 text-[10px] mt-2 border-t border-white/5 pt-1`}>
                    <div className="flex items-center justify-center py-2">
                        <input type="checkbox" checked={props.allFilesSelected} onChange={props.onToggleSelectAll} className="h-3 w-3 rounded bg-slate-800 border-slate-600 text-lumbago-secondary focus:ring-0 cursor-pointer" />
                    </div>
                    
                    <SortableHeader label="St" sortKey="state" currentKey={props.currentSortKey} direction={props.currentSortDirection} onClick={handleSort} className="border-r border-white/5 justify-center" />
                    <SortableHeader label="Utwór" sortKey="title" currentKey={props.currentSortKey} direction={props.currentSortDirection} onClick={handleSort} />
                    <SortableHeader label="Artysta" sortKey="artist" currentKey={props.currentSortKey} direction={props.currentSortDirection} onClick={handleSort} />
                    <SortableHeader label="Album" sortKey="album" currentKey={props.currentSortKey} direction={props.currentSortDirection} onClick={handleSort} />
                    <SortableHeader label="BPM" sortKey="bpm" currentKey={props.currentSortKey} direction={props.currentSortDirection} onClick={handleSort} />
                    <SortableHeader label="Key" sortKey="key" currentKey={props.currentSortKey} direction={props.currentSortDirection} onClick={handleSort} />
                    <SortableHeader label="Gatunek" sortKey="genre" currentKey={props.currentSortKey} direction={props.currentSortDirection} onClick={handleSort} />
                    
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right py-2 pr-2 flex items-center justify-end">Akcje</div>
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
                            // Layout Injection
                            gridClass={gridTemplate}
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
