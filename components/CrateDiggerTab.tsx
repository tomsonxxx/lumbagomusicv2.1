
import React, { useState, useMemo } from 'react';
import { AudioFile } from '../types';
import { findSimilarTracks, SimilarityWeights } from '../utils/similarityUtils';
import AlbumCover from './AlbumCover';
import { StatusIcon } from './StatusIcon';

interface CrateDiggerTabProps {
  files: AudioFile[];
  onPlayPause: (fileId: string) => void;
  playingFileId: string | null;
  isPlaying: boolean;
}

const CrateDiggerTab: React.FC<CrateDiggerTabProps> = ({ files, onPlayPause, playingFileId, isPlaying }) => {
  const [seedTrackId, setSeedTrackId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [weights, setWeights] = useState<SimilarityWeights>({
      bpm: 0.4,
      key: 0.4,
      genre: 0.1,
      year: 0.1
  });

  const seedTrack = useMemo(() => files.find(f => f.id === seedTrackId), [files, seedTrackId]);

  const recommendations = useMemo(() => {
      if (!seedTrack) return [];
      return findSimilarTracks(seedTrack, files, weights);
  }, [seedTrack, files, weights]);

  // Filtr do wyszukiwania seed tracka
  const filteredLibrary = useMemo(() => {
      if (!searchQuery) return files.slice(0, 20); // Pokaż pierwsze 20 domyślnie
      const lower = searchQuery.toLowerCase();
      return files.filter(f => 
          f.file.name.toLowerCase().includes(lower) || 
          (f.fetchedTags?.title || f.originalTags.title || '').toLowerCase().includes(lower) ||
          (f.fetchedTags?.artist || f.originalTags.artist || '').toLowerCase().includes(lower)
      ).slice(0, 20);
  }, [files, searchQuery]);

  return (
    <div className="animate-fade-in p-4 pb-20 h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
        
        {/* Left Panel: Selector & Settings */}
        <div className="w-full md:w-1/3 bg-slate-100 dark:bg-slate-900 border border-lumbago-border rounded-xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-lumbago-border bg-slate-50 dark:bg-slate-800/50">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-lumbago-secondary">🔍</span> Crate Digger
                </h2>
                <p className="text-xs text-slate-500 mt-1">Znajdź idealny następny utwór do miksu.</p>
            </div>

            {/* Seed Selection */}
            <div className="p-4 flex-1 overflow-hidden flex flex-col">
                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Utwór Wzorcowy (Seed)</label>
                    {seedTrack ? (
                        <div className="bg-lumbago-primary/10 border border-lumbago-primary rounded-lg p-3 flex items-center gap-3 relative group">
                            <AlbumCover tags={seedTrack.fetchedTags || seedTrack.originalTags} className="w-12 h-12 rounded shadow-sm" />
                            <div className="min-w-0">
                                <div className="font-bold text-white truncate text-sm">{seedTrack.fetchedTags?.title || seedTrack.originalTags.title || seedTrack.file.name}</div>
                                <div className="text-xs text-lumbago-primary truncate">{seedTrack.fetchedTags?.artist || seedTrack.originalTags.artist || 'Unknown'}</div>
                                <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
                                    <span className="bg-slate-800 px-1.5 rounded">{seedTrack.fetchedTags?.bpm || seedTrack.originalTags.bpm || '?'} BPM</span>
                                    <span className="bg-slate-800 px-1.5 rounded">{seedTrack.fetchedTags?.initialKey || seedTrack.originalTags.initialKey || '?'} Key</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSeedTrackId(null)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-white"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414 1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Szukaj utworu..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 pl-9 text-sm text-white focus:ring-1 focus:ring-lumbago-secondary outline-none"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            
                            <div className="mt-2 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                                {filteredLibrary.map(f => (
                                    <button 
                                        key={f.id}
                                        onClick={() => setSeedTrackId(f.id)}
                                        className="w-full text-left px-3 py-2 rounded hover:bg-white/5 flex items-center gap-3 transition-colors group"
                                    >
                                        <AlbumCover tags={f.fetchedTags || f.originalTags} className="w-8 h-8 rounded opacity-70 group-hover:opacity-100" />
                                        <div className="min-w-0">
                                            <div className="text-sm text-slate-300 truncate group-hover:text-white">{f.fetchedTags?.title || f.originalTags.title || f.file.name}</div>
                                            <div className="text-xs text-slate-500 truncate">{f.fetchedTags?.artist || f.originalTags.artist}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Weights Sliders */}
                <div className="mt-4 border-t border-slate-800 pt-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-4">Priorytety Algorytmu</label>
                    
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Tempo (BPM)</span>
                                <span className="text-lumbago-primary">{Math.round(weights.bpm * 100)}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="1" step="0.1" 
                                value={weights.bpm} 
                                onChange={e => setWeights({...weights, bpm: parseFloat(e.target.value)})}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-lumbago-primary"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Klucz (Harmonia)</span>
                                <span className="text-lumbago-secondary">{Math.round(weights.key * 100)}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="1" step="0.1" 
                                value={weights.key} 
                                onChange={e => setWeights({...weights, key: parseFloat(e.target.value)})}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-lumbago-secondary"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Gatunek</span>
                                <span className="text-lumbago-accent">{Math.round(weights.genre * 100)}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="1" step="0.1" 
                                value={weights.genre} 
                                onChange={e => setWeights({...weights, genre: parseFloat(e.target.value)})}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-lumbago-accent"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Panel: Results */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 dark:text-slate-200">
                    Rekomendacje 
                    {seedTrack && <span className="ml-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">{recommendations.length}</span>}
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {!seedTrack ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                        <p>Wybierz utwór wzorcowy po lewej stronie.</p>
                    </div>
                ) : recommendations.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <p>Brak pasujących utworów. Spróbuj zmienić wagi.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recommendations.map((rec, idx) => {
                            const tags = rec.file.fetchedTags || rec.file.originalTags;
                            const isPlayingThis = playingFileId === rec.file.id && isPlaying;
                            
                            return (
                                <div key={rec.file.id} className="bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-lg p-3 flex items-center gap-4 transition-colors group border border-transparent hover:border-indigo-500/30">
                                    <div className="text-xl font-bold text-slate-700 dark:text-slate-600 w-6 text-center">{idx + 1}</div>
                                    
                                    <div className="relative cursor-pointer" onClick={() => onPlayPause(rec.file.id)}>
                                        <AlbumCover tags={tags} className="w-12 h-12 rounded shadow-sm" />
                                        <div className={`absolute inset-0 flex items-center justify-center bg-black/40 rounded transition-opacity ${isPlayingThis ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            {isPlayingThis ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div className="truncate">
                                                <div className="font-bold text-slate-800 dark:text-white text-sm truncate">{tags.title || rec.file.file.name}</div>
                                                <div className="text-xs text-slate-500 truncate">{tags.artist}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-green-500">{Math.round(rec.score)}%</div>
                                                <div className="text-[10px] text-slate-400">match</div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2 mt-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${rec.matches.bpm ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                                                {tags.bpm || '?'} BPM
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${rec.matches.key ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                                                {tags.initialKey || '?'} Key
                                            </span>
                                            {tags.genre && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded border ${rec.matches.genre ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                                                    {tags.genre}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default CrateDiggerTab;
