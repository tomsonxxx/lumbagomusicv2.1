
import React, { useState, useEffect } from 'react';
import { AudioFile, ID3Tags } from '../types';
import { extractAudioSnippet } from '../utils/audioAnalysis';
import { identifyAudioSnippet, ApiKeys, AIProvider } from '../utils/services/aiService';
import AlbumCover from './AlbumCover';

interface AudioRecognizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: AudioFile;
  aiProvider: AIProvider;
  apiKeys: ApiKeys;
  onSave: (fileId: string, tags: ID3Tags) => void;
}

const AudioRecognizerModal: React.FC<AudioRecognizerModalProps> = ({ 
    isOpen, onClose, file, aiProvider, apiKeys, onSave 
}) => {
  const [step, setStep] = useState<'processing' | 'result' | 'error'>('processing');
  const [result, setResult] = useState<ID3Tags | null>(null);
  const [status, setStatus] = useState("Przygotowywanie audio...");

  useEffect(() => {
      if (isOpen && file) {
          runRecognition();
      }
  }, [isOpen, file]);

  const runRecognition = async () => {
      setStep('processing');
      try {
          setStatus("Wycinanie próbki (15s)...");
          const snippetBlob = await extractAudioSnippet(file.file);
          
          setStatus("Wysyłanie do Gemini 2.5...");
          const tags = await identifyAudioSnippet(snippetBlob, aiProvider, apiKeys);
          
          setResult(tags);
          setStep('result');
      } catch (error) {
          console.error(error);
          setStep('error');
      }
  };

  const handleAccept = () => {
      if (result) {
          onSave(file.id, result);
          onClose();
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[80] backdrop-blur-md" onClick={onClose}>
      <div className="bg-slate-900 border border-lumbago-secondary/50 rounded-xl shadow-[0_0_50px_rgba(255,102,204,0.1)] p-8 w-full max-w-md text-center animate-fade-in-scale relative overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-lumbago-secondary blur-[20px]"></div>

        <h2 className="text-2xl font-bold text-white mb-6 flex justify-center items-center gap-2">
            <span className="text-lumbago-secondary">🎙️</span> Audio Recognizer
        </h2>

        {step === 'processing' && (
            <div className="py-8">
                <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-2 border-slate-800"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-t-lumbago-secondary animate-spin"></div>
                    <div className="absolute inset-4 bg-slate-800 rounded-full flex items-center justify-center animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-lumbago-secondary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>
                    </div>
                </div>
                <p className="text-slate-300 animate-pulse">{status}</p>
            </div>
        )}

        {step === 'error' && (
            <div className="py-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-white mb-2">Nie udało się rozpoznać utworu.</p>
                <p className="text-xs text-slate-500 mb-6">Sprawdź połączenie internetowe i klucz API.</p>
                <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Zamknij</button>
            </div>
        )}

        {step === 'result' && result && (
            <div className="text-left animate-fade-in">
                <div className="flex gap-4 mb-6">
                    <AlbumCover tags={result} className="w-24 h-24 rounded-lg shadow-lg" />
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h3 className="text-xl font-bold text-white truncate">{result.title}</h3>
                        <p className="text-lumbago-secondary truncate">{result.artist}</p>
                        <p className="text-sm text-slate-400 truncate">{result.album} ({result.year})</p>
                        <div className="flex gap-2 mt-2">
                            <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">{result.genre}</span>
                            <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">{result.bpm} BPM</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-bold transition-colors">Odrzuć</button>
                    <button onClick={handleAccept} className="flex-1 py-3 bg-lumbago-secondary text-lumbago-dark rounded-lg hover:bg-white font-bold shadow-[0_0_15px_rgba(255,102,204,0.4)] transition-all">Zapisz Tagi</button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default AudioRecognizerModal;
