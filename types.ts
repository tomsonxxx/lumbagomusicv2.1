
export enum ProcessingState {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DOWNLOADING = 'DOWNLOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface ID3Tags {
  artist?: string;
  title?: string;
  album?: string;
  year?: string;
  genre?: string;
  albumCoverUrl?: string;
  mood?: string;
  comments?: string;
  bitrate?: number;
  sampleRate?: number;
  trackNumber?: string; // Can be "1" or "1/12"
  albumArtist?: string;
  composer?: string;
  copyright?: string;
  encodedBy?: string;
  originalArtist?: string;
  discNumber?: string; // Can be "1" or "1/2"
  bpm?: number;
  initialKey?: string;
}

export interface MetadataHealth {
  score: number; // 0-100
  rating: 'Bad' | 'Average' | 'Good' | 'Perfect';
  missingFields: string[];
  issues: string[];
  color: string; // Hex color for UI
}

export interface AudioFile {
  id: string;
  file: File;
  state: ProcessingState;
  originalTags: ID3Tags;
  fetchedTags?: ID3Tags;
  newName?: string;
  isSelected?: boolean;
  isFavorite?: boolean; 
  errorMessage?: string;
  dateAdded: number;
  handle?: any; // FileSystemFileHandle for direct saving
  webkitRelativePath?: string; 
  duration?: number;
  health?: MetadataHealth; // Nowe pole: Wynik analizy wstępnej (Pre-Scan)
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
  type?: 'manual';
}

export type SmartPlaylistRuleOperator = 'equals' | 'contains' | 'gt' | 'lt' | 'between';
export type SmartPlaylistField = 'bpm' | 'year' | 'genre' | 'artist' | 'title';

export interface SmartPlaylistRule {
  id: string;
  field: SmartPlaylistField;
  operator: SmartPlaylistRuleOperator;
  value: string;
  value2?: string; 
}

export interface SmartPlaylist {
  id: string;
  name: string;
  rules: SmartPlaylistRule[];
  createdAt: number;
  type: 'smart';
}

export type GroupKey = 'artist' | 'album' | 'none';

export type SortKey = 
  | 'dateAdded' 
  | 'originalName' 
  | 'newName' 
  | 'state'
  | 'artist'
  | 'title'
  | 'album'
  | 'bpm'
  | 'key'
  | 'year'
  | 'genre'
  | 'health'; // Dodano sortowanie po zdrowiu

export interface ColumnDef {
  id: string;
  label: string;
  width: number;
  minWidth: number;
  sortKey?: SortKey;
  isFlexible?: boolean; 
}