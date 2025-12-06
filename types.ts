
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

export interface AudioFile {
  id: string;
  file: File;
  state: ProcessingState;
  originalTags: ID3Tags;
  fetchedTags?: ID3Tags;
  newName?: string;
  isSelected?: boolean;
  isFavorite?: boolean; // Nowe pole
  errorMessage?: string;
  dateAdded: number;
  handle?: any; // FileSystemFileHandle for direct saving
  webkitRelativePath?: string; // The relative path of the file within the directory
  duration?: number; // Duration in seconds
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
  value2?: string; // For 'between'
}

export interface SmartPlaylist {
  id: string;
  name: string;
  rules: SmartPlaylistRule[];
  createdAt: number;
  type: 'smart';
}

export type GroupKey = 'artist' | 'album' | 'none';

// Extended sort keys for column sorting
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
  | 'genre';
