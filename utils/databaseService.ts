
import { AudioFile, Playlist, SmartPlaylist, ID3Tags, ProcessingState } from '../types';
import { ApiKeys, AIProvider } from './services/aiService';

export interface LumbagoDatabase {
  version: string;
  timestamp: number;
  files: SerializedAudioFile[];
  playlists: Playlist[];
  smartPlaylists: SmartPlaylist[];
  settings: {
    theme: 'light' | 'dark';
    apiKeys: ApiKeys;
    aiProvider: AIProvider;
    renamePattern: string;
  };
}

// Uproszczona wersja AudioFile do zapisu w JSON (bez obiektów File i Handle)
interface SerializedAudioFile {
  id: string;
  originalName: string; // file.name
  fileType: string;     // file.type
  size: number;         // file.size
  lastModified: number; // file.lastModified
  path?: string;        // webkitRelativePath
  
  state: ProcessingState;
  originalTags: ID3Tags;
  fetchedTags?: ID3Tags;
  newName?: string;
  isFavorite?: boolean;
  dateAdded: number;
  errorMessage?: string;
  duration?: number;
}

export const serializeDatabase = (
  files: AudioFile[],
  playlists: Playlist[],
  smartPlaylists: SmartPlaylist[],
  settings: any
): string => {
  const serializedFiles: SerializedAudioFile[] = files.map(f => ({
    id: f.id,
    originalName: f.file.name,
    fileType: f.file.type,
    size: f.file.size,
    lastModified: f.file.lastModified,
    path: f.webkitRelativePath,
    state: f.state === ProcessingState.PROCESSING || f.state === ProcessingState.DOWNLOADING ? ProcessingState.PENDING : f.state, // Reset processing states
    originalTags: f.originalTags,
    fetchedTags: f.fetchedTags,
    newName: f.newName,
    isFavorite: f.isFavorite,
    dateAdded: f.dateAdded,
    errorMessage: f.errorMessage,
    duration: f.duration
  }));

  const db: LumbagoDatabase = {
    version: '2.0',
    timestamp: Date.now(),
    files: serializedFiles,
    playlists,
    smartPlaylists,
    settings
  };

  return JSON.stringify(db, null, 2);
};

export const parseDatabase = async (jsonFile: File): Promise<LumbagoDatabase> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const db = JSON.parse(text) as LumbagoDatabase;
        
        // Basic validation
        if (!db.version || !Array.isArray(db.files)) {
          throw new Error("Nieprawidłowy format pliku bazy danych Lumbago.");
        }
        
        resolve(db);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Błąd odczytu pliku."));
    reader.readAsText(jsonFile);
  });
};

// Konwersja zserializowanych plików z powrotem do stanu aplikacji
// Uwaga: Obiekty File będą "atrapami" (0 bytes) dopóki nie zostaną zrelinkowane
export const hydrateFiles = (serializedFiles: SerializedAudioFile[]): AudioFile[] => {
  return serializedFiles.map(sf => {
    // Tworzymy "pusty" plik jako placeholder. 
    // Mechanizm "Relink" (Synchronizacja) będzie musiał podmienić te pliki na prawdziwe.
    const placeholderFile = new File([""], sf.originalName, { 
      type: sf.fileType, 
      lastModified: sf.lastModified 
    });

    return {
      id: sf.id,
      file: placeholderFile,
      state: sf.state,
      originalTags: sf.originalTags,
      fetchedTags: sf.fetchedTags,
      newName: sf.newName,
      isSelected: false,
      isFavorite: sf.isFavorite,
      errorMessage: sf.errorMessage,
      dateAdded: sf.dateAdded,
      webkitRelativePath: sf.path,
      duration: sf.duration,
      handle: undefined // Handle tracimy przy eksporcie, wymaga relinku
    };
  });
};
