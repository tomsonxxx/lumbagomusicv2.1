
import React, { useState } from 'react';
import { Playlist, SmartPlaylist } from '../types';

interface LibrarySidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  playlists: Playlist[];
  smartPlaylists: SmartPlaylist[];
  onCreatePlaylist: (name: string) => void;
  onCreateSmartPlaylist: () => void;
  onDeletePlaylist: (id: string, isSmart: boolean) => void;
  onDownloadPlaylist?: (id: string) => void;
  totalTracks: number;
  favoritesCount: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const LibrarySidebar: React.FC<LibrarySidebarProps> = ({
  activeView,
  onViewChange,
  playlists,
  smartPlaylists,
  onCreatePlaylist,
  onCreateSmartPlaylist,
  onDeletePlaylist,
  onDownloadPlaylist,
  totalTracks,
  favoritesCount,
  isCollapsed,
  onToggleCollapse
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreating(false);
    }
  };

  // Helper for Nav Items
  const NavItem = ({ id, label, icon, count }: { id: string, label: string, icon: React.ReactNode, count?: number }) => {
    const isActive = activeView === id;
    
    return (
      <button
        onClick={() => onViewChange(id)}
        title={isCollapsed ? label : undefined}
        className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2 md:py-1.5 mb-0.5 text-xs rounded-md transition-all duration-200 group ${
          isActive
            ? 'bg-lumbago-border/20 text-lumbago-primary border-l-2 border-l-lumbago-primary shadow-[0_0_10px_rgba(142,240,255,0.1)]'
            : 'text-lumbago-text-dim hover:bg-white/5 hover:text-white border-l-2 border-transparent'
        }`}
      >
        <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <div className={`transform ${isCollapsed ? 'scale-110' : 'scale-90'} ${isActive ? 'text-lumbago-primary drop-shadow-[0_0_5px_rgba(142,240,255,0.8)]' : 'text-slate-400 group-hover:text-white'}`}>
            {icon}
          </div>
          {!isCollapsed && <span className="truncate font-medium pt-0.5">{label}</span>}
        </div>
        
        {!isCollapsed && count !== undefined && (
          <span className={`text-[9px] font-bold px-1.5 py-px rounded-full ${
              isActive 
                ? 'bg-lumbago-primary text-lumbago-dark' 
                : 'bg-lumbago-dark text-slate-500 border border-slate-700'
          }`}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo Area */}
      <div className={`p-4 pb-2 flex ${isCollapsed ? 'justify-center' : ''}`}>
         <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-lumbago-primary to-lumbago-secondary shadow-[0_0_10px_rgba(142,240,255,0.5)] flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-lumbago-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
            </div>
            {!isCollapsed && (
                <div className="flex flex-col animate-fade-in origin-left">
                    <span className="text-lg font-bold tracking-tight text-lumbago-primary drop-shadow-[0_0_8px_rgba(142,240,255,0.6)] leading-none">Lumbago</span>
                    <span className="text-[8px] tracking-[0.2em] text-lumbago-secondary font-bold uppercase leading-none mt-0.5">Music AI</span>
                </div>
            )}
         </div>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar px-2 space-y-4">
        
        {/* Biblioteka */}
        <div>
            {!isCollapsed && <h3 className="px-3 text-[10px] font-bold text-lumbago-primary/80 uppercase tracking-widest mb-1 flex items-center gap-2 opacity-70">Biblioteka</h3>}
            <NavItem 
                id="library" 
                label="Wszystkie utwory" 
                count={totalTracks}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
            />
            <NavItem 
                id="favorites" 
                label="Ulubione" 
                count={favoritesCount}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
            />
             <NavItem 
                id="recent" 
                label="Ostatnio dodane" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
        </div>

        {/* Playlisty */}
        <div className={isCollapsed ? 'hidden' : 'block'}>
            <div className="flex items-center justify-between px-3 mb-1">
                <h3 className="text-[10px] font-bold text-lumbago-secondary/80 uppercase tracking-widest flex items-center gap-2 opacity-70">
                    Playlisty
                </h3>
                <button onClick={() => setIsCreating(true)} className="text-lumbago-secondary hover:text-white hover:drop-shadow-[0_0_5px_#ff66cc] transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreateSubmit} className="mb-1 px-2 animate-fade-in">
                    <input
                        type="text"
                        autoFocus
                        placeholder="Nazwa..."
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        onBlur={() => !newPlaylistName && setIsCreating(false)}
                        className="w-full px-2 py-1 text-xs bg-lumbago-dark border border-lumbago-secondary/50 rounded text-white focus:ring-1 focus:ring-lumbago-secondary focus:outline-none placeholder-slate-600"
                    />
                </form>
            )}

            <div className="space-y-px">
                {playlists.map(playlist => (
                    <div key={playlist.id} className="group relative">
                        <button
                            onClick={() => onViewChange(`playlist:${playlist.id}`)}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-all truncate hover:bg-white/5 rounded-md ${
                                activeView === `playlist:${playlist.id}`
                                ? 'text-white bg-white/5 border-l-2 border-lumbago-secondary pl-[10px]'
                                : 'text-slate-400 border-l-2 border-transparent pl-[12px]'
                            }`}
                        >
                            <span className="truncate">{playlist.name}</span>
                        </button>
                        
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex opacity-0 group-hover:opacity-100 transition-opacity bg-lumbago-dark/80 rounded px-1">
                            {onDownloadPlaylist && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDownloadPlaylist(playlist.id); }}
                                    className="p-1 text-slate-400 hover:text-lumbago-primary"
                                    title="Pobierz m3u8"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                </button>
                            )}
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeletePlaylist(playlist.id, false); }}
                                className="p-1 text-slate-400 hover:text-red-500 ml-1"
                                title="Usuń"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Narzędzia */}
        <div>
            {!isCollapsed && <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2 opacity-70">Narzędzia</h3>}
            <NavItem 
                id="scan" 
                label="Skaner / Import" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
            />
            <NavItem 
                id="tagger" 
                label="Smart Tagger AI" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
            />
            <NavItem 
                id="converter" 
                label="Konwerter XML" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
            />
            <NavItem 
                id="duplicates" 
                label="Duplikaty" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
            />
            <NavItem 
                id="cratedigger" 
                label="Crate Digger 🔍" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>}
            />
            <NavItem 
                id="organizer" 
                label="Organizator Plików" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
            />
            <NavItem 
                id="backup" 
                label="Backup & Baza" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>}
            />
        </div>

      </div>
      
      {/* Collapse Toggle (Desktop only) */}
      <div className="hidden md:flex p-2 border-t border-slate-800 justify-center">
          <button 
            onClick={onToggleCollapse}
            className="p-1.5 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            title={isCollapsed ? "Rozwiń" : "Zwiń"}
          >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
          </button>
      </div>
      
      {/* Footer Info (Hidden if collapsed) */}
      {!isCollapsed && (
        <div className="p-2 text-[9px] text-slate-600 text-center border-t border-slate-800 md:block hidden">
            v2.0 Beta • build 2025.14
        </div>
      )}
    </div>
  );
};

export default LibrarySidebar;
