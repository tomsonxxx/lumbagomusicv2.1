
import React, { useRef, useState } from 'react';
import { AudioFile, Playlist, SmartPlaylist } from '../types';
import { serializeDatabase, parseDatabase, LumbagoDatabase } from '../utils/databaseService';

interface BackupTabProps {
  files: AudioFile[];
  playlists: Playlist[];
  smartPlaylists: SmartPlaylist[];
  settings: any;
  onImportDatabase: (db: LumbagoDatabase) => void;
}

const BackupTab: React.FC<BackupTabProps> = ({ files, playlists, smartPlaylists, settings, onImportDatabase }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      setIsProcessing(true);
      const json = serializeDatabase(files, playlists, smartPlaylists, settings);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lumbago_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Błąd eksportu: " + e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("UWAGA: Import bazy danych NADPISZE obecną bibliotekę. Czy chcesz kontynuować?")) {
      e.target.value = '';
      return;
    }

    try {
      setIsProcessing(true);
      const db = await parseDatabase(file);
      onImportDatabase(db);
      alert(`Pomyślnie zaimportowano bazę z dnia ${new Date(db.timestamp).toLocaleDateString()}.\nLiczba utworów: ${db.files.length}`);
    } catch (e: any) {
      alert("Błąd importu: " + e.message);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const dbSize = (JSON.stringify(files).length + JSON.stringify(playlists).length) / 1024 / 1024;

  return (
    <div className="animate-fade-in p-4 pb-20 max-w-5xl mx-auto">
      <div className="bg-slate-100 dark:bg-slate-800/50 p-8 rounded-xl border border-slate-200 dark:border-slate-700 text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Centrum Danych</h2>
        <p className="text-slate-500 dark:text-slate-400">
          Zarządzaj swoją biblioteką, twórz kopie zapasowe i synchronizuj dane.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center">
            <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mr-4 text-indigo-600 dark:text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Rozmiar Bazy</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">~{dbSize.toFixed(2)} MB</p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full mr-4 text-green-600 dark:text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Zindeksowane Pliki</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{files.length}</p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center">
            <div className="p-4 bg-pink-100 dark:bg-pink-900/30 rounded-full mr-4 text-pink-600 dark:text-pink-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            </div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Playlisty</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{playlists.length + smartPlaylists.length}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Local Backup */}
        <div className="glass-panel p-6 rounded-xl border border-lumbago-border relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-lumbago-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-lumbago-primary">💾</span> Kopia Lokalna
            </h3>
            <p className="text-sm text-slate-400 mb-6 relative z-10">
                Zapisz pełny stan biblioteki (tagi, playlisty, ustawienia) do pliku JSON. Pozwala to na przeniesienie bazy na inny komputer lub przywrócenie danych.
            </p>
            <div className="flex gap-4 relative z-10">
                <button 
                    onClick={handleExport}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 bg-lumbago-primary text-lumbago-dark font-bold rounded-lg hover:bg-white hover:shadow-[0_0_15px_rgba(142,240,255,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Eksportuj Bazę
                </button>
                <button 
                    onClick={handleImportClick}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 border border-slate-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Importuj Bazę
                </button>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
            </div>
        </div>

        {/* Cloud Sync (Placeholder) */}
        <div className="glass-panel p-6 rounded-xl border border-slate-700 relative overflow-hidden group opacity-80">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-lumbago-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-lumbago-secondary">☁️</span> Google Drive Sync
            </h3>
            <p className="text-sm text-slate-400 mb-6 relative z-10">
                Automatyczna synchronizacja bazy danych z Twoim dyskiem Google Drive. Dostępne w wersji Pro+.
            </p>
            <div className="relative z-10">
                <button 
                    disabled={true}
                    className="w-full px-4 py-3 bg-slate-800 text-slate-500 font-bold rounded-lg border border-slate-700 cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm-1-7h2v2h-2V9zm0 4h2v6h-2v-6z"/></svg>
                    Wkrótce dostępne
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default BackupTab;
