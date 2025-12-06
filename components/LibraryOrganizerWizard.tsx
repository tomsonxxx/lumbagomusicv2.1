
import React, { useState, useMemo } from 'react';
import { AudioFile } from '../types';
import { previewOrganization, executeOrganization, OrganizationTask } from '../utils/libraryOrganizer';
import DirectoryConnect from './DirectoryConnect';

interface LibraryOrganizerWizardProps {
  files: AudioFile[];
  onClose: () => void;
}

const presets = [
  { name: 'Gatunek / Artysta / Album', pattern: '[genre]/[artist]/[album]/[trackNumber] - [title]' },
  { name: 'Rok / Album', pattern: '[year]/[album]/[title]' },
  { name: 'BPM / Key', pattern: '[bpm]/[initialKey]/[artist] - [title]' },
  { name: 'Płaska lista (Artysta - Tytuł)', pattern: '[artist] - [title]' },
];

const LibraryOrganizerWizard: React.FC<LibraryOrganizerWizardProps> = ({ files, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pattern, setPattern] = useState(presets[0].pattern);
  const [targetHandle, setTargetHandle] = useState<any>(null);
  const [tasks, setTasks] = useState<OrganizationTask[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Step 1: Configuration
  const handleDirectorySelected = (handle: any) => {
    setTargetHandle(handle);
  };

  const handlePreview = () => {
    if (!targetHandle) return alert("Wybierz folder docelowy!");
    const generatedTasks = previewOrganization(files, pattern);
    setTasks(generatedTasks);
    setStep(2);
  };

  // Step 2: Confirmation
  const handleExecute = async () => {
    setStep(3);
    setIsProcessing(true);
    await executeOrganization(tasks, targetHandle, (count, current) => {
      setProgress(Math.round((count / tasks.length) * 100));
      setCurrentFile(current);
    });
    setIsProcessing(false);
  };

  return (
    <div className="animate-fade-in p-4 pb-20 max-w-5xl mx-auto">
      <div className="bg-slate-100 dark:bg-slate-800/50 p-8 rounded-xl border border-slate-200 dark:border-slate-700 mb-8">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                Organizator Biblioteki
                <span className="ml-3 text-sm font-normal text-slate-500 bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full">
                    Krok {step} z 3
                </span>
            </h2>
            {step < 3 && (
                <button onClick={onClose} className="text-slate-400 hover:text-white">Anuluj</button>
            )}
        </div>

        {/* STEP 1: CONFIG */}
        {step === 1 && (
            <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-bold text-lumbago-primary mb-4">1. Gdzie zapisać?</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Wybierz PUSTY folder, do którego zostaną skopiowane i uporządkowane pliki. 
                            Oryginalne pliki pozostaną nienaruszone.
                        </p>
                        {targetHandle ? (
                            <div className="p-4 bg-green-900/20 border border-green-500/50 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                    <div>
                                        <div className="text-xs text-green-400 uppercase font-bold">Wybrany folder</div>
                                        <div className="font-mono text-white text-sm">{targetHandle.name}</div>
                                    </div>
                                </div>
                                <button onClick={() => setTargetHandle(null)} className="text-xs text-slate-400 hover:text-white underline">Zmień</button>
                            </div>
                        ) : (
                            <DirectoryConnect onDirectoryConnect={handleDirectorySelected} />
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-lumbago-secondary mb-4">2. Jak ułożyć?</h3>
                        <p className="text-sm text-slate-400 mb-4">Zdefiniuj strukturę folderów i nazwy plików.</p>
                        
                        <div className="space-y-3 mb-4">
                            {presets.map(p => (
                                <button
                                    key={p.name}
                                    onClick={() => setPattern(p.pattern)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                                        pattern === p.pattern 
                                        ? 'bg-lumbago-secondary/10 border-lumbago-secondary text-white' 
                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                                    }`}
                                >
                                    <div className="font-bold">{p.name}</div>
                                    <div className="font-mono text-xs opacity-70 mt-1">{p.pattern}</div>
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <label className="text-xs text-slate-500 mb-1 block">Własny wzorzec:</label>
                            <input 
                                type="text" 
                                value={pattern} 
                                onChange={e => setPattern(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-mono text-sm focus:ring-1 focus:ring-lumbago-secondary outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-700">
                    <button 
                        onClick={handlePreview}
                        disabled={!targetHandle}
                        className="px-8 py-3 bg-lumbago-primary text-lumbago-dark font-bold rounded-lg hover:bg-white hover:shadow-[0_0_20px_rgba(142,240,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Dalej: Podgląd
                    </button>
                </div>
            </div>
        )}

        {/* STEP 2: PREVIEW */}
        {step === 2 && (
            <div className="animate-fade-in flex flex-col h-[60vh]">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-sm">Sprawdź, czy nowa struktura jest poprawna. Pliki zostaną skopiowane.</p>
                        <p className="text-xs text-slate-500 mt-1">Liczba plików: <span className="text-white font-bold">{tasks.length}</span></p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-800 text-xs text-slate-400 uppercase sticky top-0">
                            <tr>
                                <th className="p-3">Oryginał</th>
                                <th className="p-3 text-center">➜</th>
                                <th className="p-3">Nowa Ścieżka</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-mono">
                            {tasks.slice(0, 100).map((task, i) => (
                                <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                                    <td className="p-3 text-slate-400 truncate max-w-[200px]" title={task.file.file.name}>
                                        {task.file.file.name}
                                    </td>
                                    <td className="p-3 text-center text-slate-600">➜</td>
                                    <td className="p-3 text-lumbago-primary truncate max-w-[300px]" title={task.destinationPath}>
                                        {task.destinationPath}
                                    </td>
                                </tr>
                            ))}
                            {tasks.length > 100 && (
                                <tr>
                                    <td colSpan={3} className="p-3 text-center text-slate-500 italic">
                                        ...i {tasks.length - 100} więcej
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between pt-6 mt-4 border-t border-slate-700">
                    <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white px-4 py-2">Wróć</button>
                    <button 
                        onClick={handleExecute}
                        className="px-8 py-3 bg-lumbago-accent text-lumbago-dark font-bold rounded-lg hover:bg-[#00ff88] hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Wykonaj Organizację
                    </button>
                </div>
            </div>
        )}

        {/* STEP 3: EXECUTION */}
        {step === 3 && (
            <div className="animate-fade-in py-10 text-center">
                {isProcessing ? (
                    <>
                        <div className="mb-6 relative w-48 h-48 mx-auto">
                             <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                             <div className="absolute inset-0 rounded-full border-4 border-t-lumbago-accent animate-spin"></div>
                             <div className="absolute inset-0 flex items-center justify-center flex-col">
                                 <span className="text-4xl font-bold text-white">{progress}%</span>
                             </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Porządkowanie biblioteki...</h3>
                        <p className="text-sm text-slate-400 font-mono truncate max-w-md mx-auto">{currentFile}</p>
                    </>
                ) : (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8 max-w-lg mx-auto">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-lumbago-dark shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Gotowe!</h3>
                        <p className="text-slate-300 mb-6">Twoja biblioteka została pomyślnie zorganizowana w nowym folderze.</p>
                        <button onClick={onClose} className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                            Zamknij
                        </button>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default LibraryOrganizerWizard;
