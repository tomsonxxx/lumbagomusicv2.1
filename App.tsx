
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from './components/Layout';
import LibrarySidebar from './components/LibrarySidebar';
import GlobalPlayer from './components/GlobalPlayer';
import LibraryTab from './components/LibraryTab';
import ScanTab from './components/ScanTab';
import ConverterTab from './components/ConverterTab';
import DuplicateFinderTab from './components/DuplicateFinderTab';
import CrateDiggerTab from './components/CrateDiggerTab';
import SettingsModal from './components/SettingsModal';
import EditTagsModal from './components/EditTagsModal';
import FileDetailsModal from './components/FileDetailsModal';
import RenameModal from './components/RenameModal';
import ConfirmationModal from './components/ConfirmationModal';
import BatchEditModal from './components/BatchEditModal';
import PostDownloadModal from './components/PostDownloadModal';
import AlbumCoverModal from './components/AlbumCoverModal';
import PreviewChangesModal from './components/PreviewChangesModal';
import AddToPlaylistModal from './components/AddToPlaylistModal';
import CreateSmartPlaylistModal from './components/CreateSmartPlaylistModal';
import AudioRecognizerModal from './components/AudioRecognizerModal';
import LibraryOrganizerWizard from './components/LibraryOrganizerWizard';
import BackupTab from './components/BackupTab';

import { AudioFile, Playlist, SmartPlaylist, ID3Tags, ProcessingState, SortKey, SmartPlaylistRule } from './types';
import { ApiKeys, AIProvider, fetchTagsForFile, fetchTagsForBatch } from './utils/services/aiService';
import { saveFileDirectly, readID3Tags } from './utils/audioUtils';
import { sortFiles } from './utils/sortingUtils';
import { exportFilesToCsv } from './utils/csvUtils';
import { parseDatabase, LumbagoDatabase } from './utils/databaseService';
// Import new Health Utility
import { calculateMetadataHealth } from './utils/metadataHealth';

// Define RenamePreview locally as it is needed for ModalState
interface RenamePreview {
  originalName: string;
  newName: string;
  isTooLong: boolean;
}

type ModalState = 
  | { type: 'none' }
  | { type: 'edit'; fileId: string }
  | { type: 'inspect'; fileId: string } 
  | { type: 'rename' }
  | { type: 'delete'; fileId: string | 'selected' | 'all' }
  | { type: 'settings' }
  | { type: 'batch-edit' }
  | { type: 'post-download'; count: number }
  | { type: 'zoom-cover', imageUrl: string }
  | { type: 'preview-changes'; title: string; confirmationText: string; previews: RenamePreview[]; onConfirm: () => void; }
  | { type: 'add-to-playlist'; fileIds: string[] }
  | { type: 'create-smart-playlist' }
  | { type: 'audio-recognizer'; fileId: string }
  | { type: 'organizer' };

const App: React.FC = () => {
  // --- State ---
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [smartPlaylists, setSmartPlaylists] = useState<SmartPlaylist[]>([]);
  
  const [activeView, setActiveView] = useState<string>('scan');
  const [modalState, setModalState] = useState<ModalState>({ type: 'none' });
  
  const [sortKey, setSortKey] = useState<SortKey>('dateAdded');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [playingFileId, setPlayingFileId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);
  
  // Layout State (Responsiveness)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Settings
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ grok: '', openai: '' });
  const [aiProvider, setAiProvider] = useState<AIProvider>('gemini');
  const [renamePattern, setRenamePattern] = useState<string>('[artist] - [title]');

  // Load settings on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
    
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) setApiKeys(JSON.parse(savedKeys));
    
    const savedProvider = localStorage.getItem('aiProvider') as AIProvider;
    if (savedProvider) setAiProvider(savedProvider);

    const savedPattern = localStorage.getItem('renamePattern');
    if (savedPattern) setRenamePattern(savedPattern);
    
    // Auto-collapse sidebar on smaller screens initially
    if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // --- Handlers ---

  const handleFilesSelected = async (fileList: File[] | FileList) => {
    // Normalize to array
    const rawFiles: File[] = Array.isArray(fileList) 
        ? fileList 
        : Array.from(fileList);

    if (rawFiles.length === 0) return;

    // Filter non-audio files (safety check)
    const validFiles = rawFiles.filter(f => 
        f.type.startsWith('audio/') || 
        f.name.match(/\.(mp3|wav|flac|ogg|m4a|aac|wma)$/i)
    );

    if (validFiles.length === 0) {
        alert("Brak obsługiwanych plików audio w wyborze.");
        return;
    }

    // Process in chunks to avoid blocking UI and excessive memory usage at once
    const CHUNK_SIZE = 10;
    const newFiles: AudioFile[] = [];

    for (let i = 0; i < validFiles.length; i += CHUNK_SIZE) {
        const chunk = validFiles.slice(i, i + CHUNK_SIZE);
        
        // Parallel processing of ID3 reading for this chunk
        const chunkResults = await Promise.all(chunk.map(async (file) => {
            try {
                const tags = await readID3Tags(file);
                // Create draft file
                const audioFile: AudioFile = {
                    id: crypto.randomUUID(),
                    file: file,
                    state: ProcessingState.PENDING,
                    originalTags: tags,
                    fetchedTags: undefined,
                    dateAdded: Date.now(),
                    isSelected: false,
                    isFavorite: false
                };
                
                // --- PRE-SCAN: Calculate Metadata Health ---
                // "Mechanizm 13" wg tag.txt: Analiza wstępna
                audioFile.health = calculateMetadataHealth(audioFile);
                
                return audioFile;
            } catch (e) {
                console.warn(`Failed to read tags for ${file.name}`, e);
                // Return bare minimum file on error
                return {
                    id: crypto.randomUUID(),
                    file: file,
                    state: ProcessingState.PENDING,
                    originalTags: {},
                    fetchedTags: undefined,
                    dateAdded: Date.now(),
                    isSelected: false,
                    isFavorite: false,
                    health: calculateMetadataHealth({ 
                        id: '', file, state: ProcessingState.PENDING, originalTags: {}, dateAdded: 0 
                    } as AudioFile)
                } as AudioFile;
            }
        }));
        
        newFiles.push(...chunkResults);
    }

    // Final update
    setFiles(prev => [...prev, ...newFiles]);
    if (newFiles.length > 0) setActiveView('library');
  };

  const handleUrlSubmitted = async (url: string) => {
      // Mock implementation for URL
      alert("URL processing not implemented in this demo.");
  };

  const handleDirectoryConnect = async (handle: any) => {
      setDirectoryHandle(handle);
      alert(`Connected to folder: ${handle.name}. Now dragging files from this folder will allow direct saving.`);
  };

  const handleToggleSelectAll = () => {
      const allSelected = files.every(f => f.isSelected);
      setFiles(files.map(f => ({ ...f, isSelected: !allSelected })));
  };

  const handleSelectionChange = (id: string, isSelected: boolean) => {
      setFiles(files.map(f => f.id === id ? { ...f, isSelected } : f));
  };

  const handleSortChange = (key: SortKey) => {
      if (sortKey === key) {
          setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
          setSortKey(key);
          setSortDirection('asc');
      }
  };

  const handleDelete = (target: string | 'selected' | 'all') => {
      if (target === 'all') {
          setFiles([]);
      } else if (target === 'selected') {
          setFiles(files.filter(f => !f.isSelected));
      } else {
          setFiles(files.filter(f => f.id !== target));
      }
      setModalState({ type: 'none' });
  };

  const handleBatchAnalyze = async (filesToAnalyze: AudioFile[]) => {
      // Set processing state
      setFiles(prev => prev.map(f => filesToAnalyze.some(fa => fa.id === f.id) ? { ...f, state: ProcessingState.PROCESSING } : f));
      
      try {
          // This would be the AI call
          const results = await fetchTagsForBatch(filesToAnalyze, aiProvider, apiKeys);
          
          setFiles(prev => prev.map(f => {
              const res = results.find(r => r.originalFilename === f.file.name);
              if (res) {
                  const { originalFilename, ...tags } = res;
                  const updatedFile = { ...f, fetchedTags: tags, state: ProcessingState.SUCCESS };
                  // Recalculate health after AI update
                  updatedFile.health = calculateMetadataHealth(updatedFile);
                  return updatedFile;
              }
              // If it was processing but no result returned
              if (filesToAnalyze.some(fa => fa.id === f.id) && f.state === ProcessingState.PROCESSING) {
                   return { ...f, state: ProcessingState.ERROR, errorMessage: "No result from AI" };
              }
              return f;
          }));
      } catch (error: any) {
          setFiles(prev => prev.map(f => filesToAnalyze.some(fa => fa.id === f.id) ? { ...f, state: ProcessingState.ERROR, errorMessage: error.message } : f));
      }
  };

  const handleManualSearch = async (query: string, file: AudioFile) => {
      try {
          const tags = await fetchTagsForFile(query, file.originalTags, aiProvider, apiKeys);
          // Return the tags so the modal can update its preview immediately
          return tags;
      } catch (error) {
          throw error;
      }
  };

  const handleSaveTags = (fileId: string, tags: ID3Tags) => {
      setFiles(prev => prev.map(f => {
          if (f.id === fileId) {
              const updatedFile = { ...f, fetchedTags: tags };
              // Recalculate health
              updatedFile.health = calculateMetadataHealth(updatedFile);
              return updatedFile;
          }
          return f;
      }));
  };

  const handleApplyTags = async (fileId: string, tags: ID3Tags) => {
      const file = files.find(f => f.id === fileId);
      if (!file || !directoryHandle) return;
      
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, state: ProcessingState.DOWNLOADING } : f));

      const result = await saveFileDirectly(directoryHandle, { ...file, fetchedTags: tags });
      
      setFiles(prev => prev.map(f => {
          if (f.id === fileId) {
              const updatedFile = { 
                  ...f, 
                  state: result.success ? ProcessingState.SUCCESS : ProcessingState.ERROR,
                  errorMessage: result.errorMessage,
                  ...(result.success && result.updatedFile ? result.updatedFile : {})
              };
              // Recalculate health
              updatedFile.health = calculateMetadataHealth(updatedFile);
              return updatedFile;
          }
          return f;
      }));
      
      if (result.success) {
          setModalState({ type: 'none' });
      }
  };

  const handleBatchEditSave = (tags: Partial<ID3Tags>) => {
      setFiles(prev => prev.map(f => {
          if (f.isSelected) {
              const updatedFile = { 
                  ...f, 
                  fetchedTags: { ...(f.fetchedTags || f.originalTags), ...tags } 
              };
              // Recalculate health
              updatedFile.health = calculateMetadataHealth(updatedFile);
              return updatedFile;
          }
          return f;
      }));
      setModalState({ type: 'none' });
  };

  const handleSaveRenamePattern = (pattern: string) => {
      setRenamePattern(pattern);
      setModalState({ type: 'none' });
  };

  const handleSaveSettings = (keys: ApiKeys, provider: AIProvider) => {
      setApiKeys(keys);
      setAiProvider(provider);
      localStorage.setItem('apiKeys', JSON.stringify(keys));
      localStorage.setItem('aiProvider', provider);
      setModalState({ type: 'none' });
  };

  // Player Logic
  const handlePlayPause = (fileId: string) => {
      if (playingFileId === fileId) {
          setIsPlaying(!isPlaying);
      } else {
          setPlayingFileId(fileId);
          setIsPlaying(true);
      }
  };

  const handleNext = () => {
      const sorted = sortedFiles;
      const idx = sorted.findIndex(f => f.id === playingFileId);
      if (idx !== -1 && idx < sorted.length - 1) {
          setPlayingFileId(sorted[idx + 1].id);
          setIsPlaying(true);
      }
  };

  const handlePrev = () => {
      const sorted = sortedFiles;
      const idx = sorted.findIndex(f => f.id === playingFileId);
      if (idx > 0) {
          setPlayingFileId(sorted[idx - 1].id);
          setIsPlaying(true);
      }
  };

  const toggleFavorite = (fileId: string) => {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, isFavorite: !f.isFavorite } : f));
  };

  const addTracksToPlaylist = (playlistId: string, fileIds: string[]) => {
      setPlaylists(prev => prev.map(pl => 
          pl.id === playlistId 
          ? { ...pl, trackIds: Array.from(new Set([...pl.trackIds, ...fileIds])) } 
          : pl
      ));
  };

  const createPlaylist = (name: string) => {
      const newPlaylist: Playlist = {
          id: crypto.randomUUID(),
          name,
          trackIds: [],
          createdAt: Date.now(),
          type: 'manual'
      };
      setPlaylists(prev => [...prev, newPlaylist]);
  };

  const createSmartPlaylist = (name: string, rules: SmartPlaylistRule[]) => {
      const newPlaylist: SmartPlaylist = {
          id: crypto.randomUUID(),
          name,
          rules,
          createdAt: Date.now(),
          type: 'smart'
      };
      setSmartPlaylists(prev => [...prev, newPlaylist]);
      setModalState({ type: 'none' });
  };

  const deletePlaylist = (id: string, isSmart: boolean) => {
      if (isSmart) {
          setSmartPlaylists(prev => prev.filter(pl => pl.id !== id));
      } else {
          setPlaylists(prev => prev.filter(pl => pl.id !== id));
      }
      if (activeView.includes(id)) setActiveView('library');
  };

  const handleImportDatabase = (db: LumbagoDatabase) => {
      setPlaylists(db.playlists);
      setSmartPlaylists(db.smartPlaylists);
  };

  // Derived Data
  const sortedFiles = useMemo(() => sortFiles(files, sortKey, sortDirection), [files, sortKey, sortDirection]);
  const selectedFiles = useMemo(() => files.filter(f => f.isSelected), [files]);
  
  const filesForView = useMemo(() => {
      if (activeView === 'library' || activeView === 'scan') return sortedFiles;
      if (activeView === 'favorites') return sortedFiles.filter(f => f.isFavorite);
      if (activeView === 'recent') return sortedFiles.filter(f => Date.now() - f.dateAdded < 24 * 60 * 60 * 1000); 
      
      if (activeView.startsWith('playlist:')) {
          const pid = activeView.split(':')[1];
          const playlist = playlists.find(p => p.id === pid);
          if (!playlist) return [];
          return playlist.trackIds.map(id => files.find(f => f.id === id)).filter((f): f is AudioFile => !!f);
      }
      return sortedFiles;
  }, [activeView, sortedFiles, playlists, files]);

  const playingFile = useMemo(() => files.find(f => f.id === playingFileId) || null, [files, playingFileId]);
  const modalFile = useMemo(() => {
      if (modalState.type === 'edit' || modalState.type === 'inspect' || modalState.type === 'audio-recognizer') {
          return files.find(f => f.id === modalState.fileId) || null;
      }
      return null;
  }, [files, modalState]);

  // View Components
  const sidebar = (
      <LibrarySidebar 
          activeView={activeView}
          onViewChange={(v) => { setActiveView(v); setIsMobileMenuOpen(false); }}
          playlists={playlists}
          smartPlaylists={smartPlaylists}
          onCreatePlaylist={createPlaylist}
          onCreateSmartPlaylist={() => setModalState({ type: 'create-smart-playlist' })}
          onDeletePlaylist={deletePlaylist}
          totalTracks={files.length}
          favoritesCount={files.filter(f => f.isFavorite).length}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
  );

  const header = (
      <div className="flex items-center justify-between p-3 md:p-4">
          <div className="flex items-center gap-3">
              {/* Mobile Hamburger */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-slate-300 hover:text-white"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <h1 className="text-lg md:text-xl font-bold text-white neon-text">Lumbago <span className="text-lumbago-secondary hidden xs:inline">Music AI</span></h1>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={() => setModalState({ type: 'settings' })} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
              </button>
          </div>
      </div>
  );

  const player = (
      <GlobalPlayer 
          currentFile={playingFile}
          isPlaying={isPlaying}
          volume={volume}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onVolumeChange={setVolume}
          onNext={handleNext}
          onPrev={handlePrev}
          onClose={() => setPlayingFileId(null)}
      />
  );

  let content;
  switch (activeView) {
      case 'scan':
          content = (
              <ScanTab 
                  onFilesSelected={handleFilesSelected}
                  onUrlSubmitted={handleUrlSubmitted}
                  onDirectoryConnect={handleDirectoryConnect}
                  isProcessing={false}
              />
          );
          break;
      case 'converter':
          content = <ConverterTab />;
          break;
      case 'duplicates':
          content = (
              <DuplicateFinderTab 
                  files={files}
                  onDelete={(id) => handleDelete(id)}
                  onPlayPause={handlePlayPause}
                  playingFileId={playingFileId}
                  isPlaying={isPlaying}
              />
          );
          break;
      case 'cratedigger':
          content = (
              <CrateDiggerTab 
                  files={files}
                  onPlayPause={handlePlayPause}
                  playingFileId={playingFileId}
                  isPlaying={isPlaying}
              />
          );
          break;
      case 'organizer':
          content = (
              <LibraryOrganizerWizard 
                  files={files}
                  onClose={() => setActiveView('library')}
              />
          );
          break;
      case 'backup':
          content = (
              <BackupTab 
                  files={files}
                  playlists={playlists}
                  smartPlaylists={smartPlaylists}
                  settings={{ theme, apiKeys, aiProvider, renamePattern }}
                  onImportDatabase={handleImportDatabase}
              />
          );
          break;
      default:
          content = (
              <LibraryTab 
                  files={filesForView}
                  sortedFiles={sortedFiles}
                  selectedFiles={selectedFiles}
                  allFilesSelected={selectedFiles.length === filesForView.length && filesForView.length > 0}
                  isBatchAnalyzing={false} 
                  isSaving={false}
                  directoryHandle={directoryHandle}
                  isRestored={false}
                  onToggleSelectAll={handleToggleSelectAll}
                  onBatchAnalyze={handleBatchAnalyze}
                  onBatchAnalyzeAll={() => handleBatchAnalyze(files)}
                  onDownloadOrSave={() => alert("Funkcja pobierania dostępna w edycji masowej.")}
                  onBatchEdit={() => setModalState({ type: 'batch-edit' })}
                  onSingleItemEdit={(id) => setModalState({ type: 'edit', fileId: id })}
                  onRename={() => setModalState({ type: 'rename' })}
                  onExportCsv={() => { const csv = exportFilesToCsv(files); console.log(csv); }}
                  onDeleteItem={handleDelete}
                  onClearAll={() => setFiles([])}
                  onProcessFile={(f) => handleBatchAnalyze([f])}
                  onSelectionChange={handleSelectionChange}
                  onTabChange={setActiveView}
                  playingFileId={playingFileId}
                  isPlaying={isPlaying}
                  onPlayPause={handlePlayPause}
                  onInspectItem={(id) => setModalState({ type: 'inspect', fileId: id })}
                  onToggleFavorite={toggleFavorite}
                  onAddToPlaylist={(fileId) => setModalState({ type: 'add-to-playlist', fileIds: [fileId] })}
                  currentSortKey={sortKey}
                  currentSortDirection={sortDirection}
                  onSortChange={handleSortChange}
              />
          );
          break;
  }

  const filesForRenamePreview = modalState.type === 'rename' ? (selectedFiles.length > 0 ? selectedFiles : (files.length > 0 ? [files[0]] : [])) : [];

  return (
    <>
      <Layout 
          sidebar={sidebar}
          header={header}
          content={content}
          player={player}
          activeView={activeView}
          isSidebarCollapsed={isSidebarCollapsed}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Modals */}
      {modalState.type === 'settings' && <SettingsModal isOpen={true} onClose={() => setModalState({ type: 'none' })} onSave={handleSaveSettings} currentKeys={apiKeys} currentProvider={aiProvider} />}
      {modalState.type === 'edit' && modalFile && <EditTagsModal isOpen={true} onClose={() => setModalState({ type: 'none' })} onSave={(tags) => handleSaveTags(modalFile.id, tags)} onApply={(tags) => handleApplyTags(modalFile.id, tags)} isApplying={modalFile.state === ProcessingState.DOWNLOADING} isDirectAccessMode={!!directoryHandle} file={modalFile} onManualSearch={(query) => handleManualSearch(query, modalFile).then(tags => handleSaveTags(modalFile.id, tags))} onZoomCover={(imageUrl) => setModalState({ type: 'zoom-cover', imageUrl })} />}
      {modalState.type === 'inspect' && modalFile && <FileDetailsModal isOpen={true} onClose={() => setModalState({ type: 'none' })} file={modalFile} onRecognizeAudio={() => setModalState({ type: 'audio-recognizer', fileId: modalFile.id })} />}
      {modalState.type === 'rename' && <RenameModal isOpen={true} onClose={() => setModalState({ type: 'none' })} onSave={handleSaveRenamePattern} currentPattern={renamePattern} files={filesForRenamePreview} />}
      {modalState.type === 'delete' && <ConfirmationModal isOpen={true} onCancel={() => setModalState({ type: 'none' })} onConfirm={() => { if (typeof modalState.fileId === 'string') handleDelete(modalState.fileId); }} title="Potwierdź usunięcie">{`Czy na pewno chcesz usunąć pliki?`}</ConfirmationModal>}
      {modalState.type === 'batch-edit' && <BatchEditModal isOpen={true} onClose={() => setModalState({ type: 'none' })} onSave={handleBatchEditSave} files={selectedFiles} />}
      {modalState.type === 'post-download' && <PostDownloadModal isOpen={true} onKeep={() => setModalState({ type: 'none' })} onRemove={() => handleDelete('selected')} count={modalState.count} />}
      {modalState.type === 'zoom-cover' && <AlbumCoverModal isOpen={true} onClose={() => setModalState({ type: 'none' })} imageUrl={modalState.imageUrl} />}
      {modalState.type === 'preview-changes' && <PreviewChangesModal isOpen={true} onCancel={() => setModalState({ type: 'none' })} onConfirm={modalState.onConfirm} title={modalState.title} previews={modalState.previews}>{modalState.confirmationText}</PreviewChangesModal>}
      {modalState.type === 'add-to-playlist' && <AddToPlaylistModal isOpen={true} onClose={() => setModalState({ type: 'none' })} playlists={playlists} onSelect={(pid) => { addTracksToPlaylist(pid, modalState.fileIds); setModalState({ type: 'none' }); }} onCreateNew={(name) => { createPlaylist(name); setTimeout(() => { 
                setPlaylists(curr => { 
                    const newest = curr[curr.length - 1]; 
                    if(newest) addTracksToPlaylist(newest.id, modalState.fileIds); 
                    return curr; 
                });
                setModalState({ type: 'none' });
            }, 100); }} />}
      {modalState.type === 'create-smart-playlist' && <CreateSmartPlaylistModal isOpen={true} onClose={() => setModalState({ type: 'none' })} onCreate={createSmartPlaylist} />}
      {modalState.type === 'audio-recognizer' && modalFile && <AudioRecognizerModal isOpen={true} onClose={() => setModalState({ type: 'none' })} file={modalFile} aiProvider={aiProvider} apiKeys={apiKeys} onSave={(id, tags) => { handleSaveTags(id, tags); setModalState({ type: 'none' }); }} />}
    </>
  );
};

export default App;
