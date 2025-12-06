
import { ID3Tags, AudioFile, ProcessingState } from '../types';

// Assume jsmediatags is loaded globally via a <script> tag
declare const jsmediatags: any;
// Assume ID3Writer is loaded globally via a <script> tag (for MP3)
declare const ID3Writer: any;
// Assume mp4TagWriter is loaded globally via a <script> tag (for M4A/MP4)
declare const mp4TagWriter: any;


/**
 * Checks if writing tags is supported for a given file type.
 * MP3 support is provided by 'browser-id3-writer'.
 * M4A/MP4 support is provided by 'mp4-tag-writer'.
 * @param file The file to check.
 * @returns True if tag writing is supported, false otherwise.
 */
export const isTagWritingSupported = (file: File): boolean => {
    const supportedMimeTypes = [
        'audio/mpeg', // MP3
        'audio/mp3',
        'audio/mp4',  // M4A / MP4
        'audio/x-m4a'
    ];
    // Check by MIME type first, then fallback to extension if browser detection is generic
    if (supportedMimeTypes.includes(file.type)) return true;
    
    const name = file.name.toLowerCase();
    return name.endsWith('.mp3') || name.endsWith('.m4a') || name.endsWith('.mp4');
};

export const readID3Tags = (file: File): Promise<ID3Tags> => {
  return new Promise((resolve, reject) => {
    if (typeof jsmediatags === 'undefined') {
      console.warn('jsmediatags library not found. Returning empty tags.');
      return resolve({});
    }
    
    // FIX: Proactively skip reading tags for WAV files. The jsmediatags library
    // does not support the RIFF info chunk format used by WAV files, which causes
    // a 'tagFormat' error. By skipping it, we avoid the error and proceed smoothly.
    const lowerCaseName = file.name.toLowerCase();
    if (file.type.startsWith('audio/wav') || file.type.startsWith('audio/x-wav') || lowerCaseName.endsWith('.wav') || lowerCaseName.endsWith('.wave')) {
        // WAV files usually don't have standard ID3 tags read by this lib
        return resolve({});
    }

    jsmediatags.read(file, {
      onSuccess: (tag: any) => {
        // jsmediatags attempts to unify tags, so we can check for common properties
        const tags: ID3Tags = {};
        const tagData = tag.tags;

        // --- 1. Basic standardized fields ---
        // jsmediatags usually maps these well for MP3, but sometimes misses for MP4
        
        // Title
        if (tagData.title) tags.title = tagData.title;
        else if (tagData['©nam']) tags.title = tagData['©nam'].data; // MP4 atom

        // Artist
        if (tagData.artist) tags.artist = tagData.artist;
        else if (tagData['©ART']) tags.artist = tagData['©ART'].data; // MP4 atom

        // Album
        if (tagData.album) tags.album = tagData.album;
        else if (tagData['©alb']) tags.album = tagData['©alb'].data; // MP4 atom

        // Year
        if (tagData.year) tags.year = tagData.year;
        else if (tagData['©day']) tags.year = tagData['©day'].data; // MP4 atom
        else if (tagData.DATE) tags.year = tagData.DATE; // Vorbis/FLAC

        // Genre
        if (tagData.genre) tags.genre = tagData.genre;
        else if (tagData['©gen']) tags.genre = tagData['©gen'].data; // MP4 atom

        // --- 2. Extended fields ---

        // Track Number
        if (tagData.track) tags.trackNumber = tagData.track;
        else if (tagData.TRACKNUMBER) tags.trackNumber = tagData.TRACKNUMBER; // Vorbis
        else if (tagData.trkn) { // MP4 atom (often array [num, total])
            const trkn = tagData.trkn.data;
            if (Array.isArray(trkn) && trkn.length > 0) {
                tags.trackNumber = trkn.length > 1 && trkn[1] > 0 ? `${trkn[0]}/${trkn[1]}` : `${trkn[0]}`;
            }
        }

        // Disc Number
        if (tagData.TPOS?.data) tags.discNumber = tagData.TPOS.data;
        else if(tagData.DISCNUMBER) tags.discNumber = tagData.DISCNUMBER;
        else if (tagData.disk) { // MP4 atom
             const disk = tagData.disk.data;
             if (Array.isArray(disk) && disk.length > 0) {
                tags.discNumber = disk.length > 1 && disk[1] > 0 ? `${disk[0]}/${disk[1]}` : `${disk[0]}`;
            }
        }

        // Comments
        if (tagData.comment) {
             tags.comments = typeof tagData.comment === 'string' ? tagData.comment : tagData.comment.text;
        } else if (tagData.DESCRIPTION) {
             tags.comments = tagData.DESCRIPTION; // Vorbis often uses DESCRIPTION
        } else if (tagData.COMMENT) {
             tags.comments = tagData.COMMENT; // Raw Vorbis comment
        } else if (tagData['©cmt']) {
             tags.comments = tagData['©cmt'].data; // MP4 atom
        }
        
        // Album Artist
        if (tagData.TPE2?.data) tags.albumArtist = tagData.TPE2.data;
        else if(tagData.ALBUMARTIST) tags.albumArtist = tagData.ALBUMARTIST;
        else if(tagData['ALBUM ARTIST']) tags.albumArtist = tagData['ALBUM ARTIST'];
        else if(tagData.aART) tags.albumArtist = tagData.aART.data; // MP4 atom

        // Composer
        if (tagData.TCOM?.data) tags.composer = tagData.TCOM.data;
        else if(tagData.COMPOSER) tags.composer = tagData.COMPOSER;
        else if(tagData['©wrt']) tags.composer = tagData['©wrt'].data; // MP4 atom

        // Copyright
        if (tagData.TCOP?.data) tags.copyright = tagData.TCOP.data;
        else if(tagData.COPYRIGHT) tags.copyright = tagData.COPYRIGHT;
        else if(tagData.cprt) tags.copyright = tagData.cprt.data; // MP4 atom
        
        // Encoded By
        if (tagData.TENC?.data) tags.encodedBy = tagData.TENC.data;
        else if (tagData.ENCODEDBY) tags.encodedBy = tagData.ENCODEDBY;
        else if (tagData.ENCODER) tags.encodedBy = tagData.ENCODER;
        else if (tagData['©enc']) tags.encodedBy = tagData['©enc'].data; // MP4 atom

        // Original Artist
        if (tagData.TOPE?.data) tags.originalArtist = tagData.TOPE.data;
        else if (tagData.ORIGINALARTIST) tags.originalArtist = tagData.ORIGINALARTIST;

        // Mood
        if (tagData.TMOO?.data) tags.mood = tagData.TMOO.data; 
        else if (tagData.MOOD) tags.mood = tagData.MOOD;
        
        // BPM (TBPM)
        if (tagData.TBPM?.data) tags.bpm = parseInt(tagData.TBPM.data);
        else if (tagData.BPM) tags.bpm = parseInt(tagData.BPM);
        else if (tagData.tmpo) tags.bpm = parseInt(tagData.tmpo.data); // MP4 atom

        // Initial Key (TKEY)
        if (tagData.TKEY?.data) tags.initialKey = tagData.TKEY.data;
        else if (tagData.INITIALKEY) tags.initialKey = tagData.INITIALKEY;
        else if (tagData.KEY) tags.initialKey = tagData.KEY;

        // --- 3. Picture / Cover Art ---
        if (tagData.picture) {
            const { data, format } = tagData.picture;
            let base64String = "";
            for (let i = 0; i < data.length; i++) {
                base64String += String.fromCharCode(data[i]);
            }
            
            // MP4 Fix: Some MP4 tags don't return a MIME type in 'format' (it might be empty or raw).
            // Detect based on magic numbers if format is missing or weird.
            let mimeType = format;
            if (!mimeType || mimeType === '' || !mimeType.includes('/')) {
                if (data.length > 3) {
                    // JPEG: FF D8 FF
                    if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) {
                        mimeType = "image/jpeg";
                    } 
                    // PNG: 89 50 4E 47
                    else if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) {
                        mimeType = "image/png";
                    }
                    // Default fallback
                    else {
                        mimeType = "image/jpeg";
                    }
                }
            }

            tags.albumCoverUrl = `data:${mimeType};base64,${window.btoa(base64String)}`;
        } else if (tagData.covr) {
            // Specific MP4 atom 'covr' handling if jsmediatags put it here
            const covrData = tagData.covr.data;
            if (covrData) {
                 let base64String = "";
                 for (let i = 0; i < covrData.length; i++) {
                    base64String += String.fromCharCode(covrData[i]);
                 }
                 // Detect mime for covr
                 let mimeType = "image/jpeg"; // Default for MP4 covr usually
                 if (covrData.length > 3) {
                     if (covrData[0] === 0x89 && covrData[1] === 0x50) mimeType = "image/png";
                 }
                 tags.albumCoverUrl = `data:${mimeType};base64,${window.btoa(base64String)}`;
            }
        }
        
        resolve(tags);
      },
      onError: (error: any) => {
        // Handle "No suitable tag reader found" gracefully (e.g. fresh files).
        if (error.type === 'tagFormat') {
            resolve({});
            return;
        }

        const errorType = error.type || 'Unknown';
        const errorInfo = error.info || 'No additional info';
        
        console.warn(`Ostrzeżenie odczytu tagów (${file.name}): ${errorType}`, errorInfo);
        // Resolve empty to allow processing to continue
        resolve({});
      },
    });
  });
};

// Helper to convert base64 data URL to ArrayBuffer
const dataURLToArrayBuffer = (dataURL: string) => {
  try {
    const base64 = dataURL.split(',')[1];
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (e) {
    console.error("Error converting DataURL to ArrayBuffer", e);
    throw new Error("Nieprawidłowy format obrazu okładki.");
  }
};

// Helper function to proxy image URLs to avoid CORS issues
export const proxyImageUrl = (url: string | undefined): string | undefined => {
    if (!url || url.startsWith('data:')) {
        return url;
    }
    return `https://corsproxy.io/?${encodeURIComponent(url)}`;
};


/**
 * Applies tags to an MP3 file using ID3Writer.
 * @param fileBuffer The ArrayBuffer of the MP3 file.
 * @param tags The tags to apply.
 * @returns An ArrayBuffer of the tagged MP3 file.
 */
const applyID3TagsToFile = async (fileBuffer: ArrayBuffer, tags: ID3Tags): Promise<ArrayBuffer> => {
    // FIX: Access the global ID3Writer strictly through window to avoid ReferenceError if not loaded.
    const Writer = (window as any).ID3Writer || (window as any).BrowserID3Writer;

    if (!Writer) {
        throw new Error("Biblioteka do zapisu tagów MP3 (ID3Writer) nie została załadowana. Sprawdź połączenie internetowe lub odśwież stronę.");
    }
    const writer = new Writer(fileBuffer);

    // Standard frames supported by most players and libraries
    if (tags.title) writer.setFrame('TIT2', tags.title);
    if (tags.artist) writer.setFrame('TPE1', [tags.artist]);
    if (tags.album) writer.setFrame('TALB', tags.album);
    if (tags.year) writer.setFrame('TYER', tags.year);
    if (tags.genre) writer.setFrame('TCON', [tags.genre]);
    if (tags.trackNumber) writer.setFrame('TRCK', tags.trackNumber);
    if (tags.albumArtist) writer.setFrame('TPE2', [tags.albumArtist]);
    
    // Optional/Less supported frames - SAFE WRAPPING
    if (tags.composer) {
        try { writer.setFrame('TCOM', [tags.composer]); } catch(e) { console.warn('ID3Writer: Pominięto TCOM', e); }
    }
    if (tags.copyright) {
        try { writer.setFrame('TCOP', tags.copyright); } catch(e) { console.warn('ID3Writer: Pominięto TCOP', e); }
    }
    if (tags.encodedBy) {
        try { writer.setFrame('TENC', tags.encodedBy); } catch(e) { console.warn('ID3Writer: Pominięto TENC', e); }
    }
    if (tags.discNumber) {
        try { writer.setFrame('TPOS', tags.discNumber); } catch(e) { console.warn('ID3Writer: Pominięto TPOS', e); }
    }
    if (tags.comments) {
        try { writer.setFrame('COMM', { description: 'Comment', text: tags.comments }); } catch(e) { console.warn('ID3Writer: Pominięto COMM', e); }
    }
    
    if (tags.mood) {
        try {
            writer.setFrame('TMOO', tags.mood);
        } catch (e) {
            console.warn('ID3Writer: Pominięto nieobsługiwaną ramkę TMOO (Mood).', e);
        }
    }
    
    if (tags.originalArtist) {
        try {
            writer.setFrame('TOPE', [tags.originalArtist]);
        } catch (e) {
             console.warn('ID3Writer: Pominięto nieobsługiwaną ramkę TOPE (Original Artist).', e);
        }
    }

    if (tags.bpm) {
        try {
            writer.setFrame('TBPM', String(tags.bpm));
        } catch (e) {
            console.warn('ID3Writer: Pominięto nieobsługiwaną ramkę TBPM.', e);
        }
    }

    if (tags.initialKey) {
        try {
            writer.setFrame('TKEY', tags.initialKey);
        } catch (e) {
            console.warn('ID3Writer: Pominięto nieobsługiwaną ramkę TKEY.', e);
        }
    }
    
    if (tags.albumCoverUrl) {
        try {
            let coverBuffer: ArrayBuffer;
            if (tags.albumCoverUrl.startsWith('data:')) {
                coverBuffer = dataURLToArrayBuffer(tags.albumCoverUrl);
            } else {
                const proxiedUrl = proxyImageUrl(tags.albumCoverUrl);
                const response = await fetch(proxiedUrl!);
                if (!response.ok) throw new Error(`Nie udało się pobrać okładki: ${response.statusText}`);
                coverBuffer = await response.arrayBuffer();
            }
            writer.setFrame('APIC', {
                type: 3, // 'Cover (front)'
                data: coverBuffer,
                description: 'Cover',
            });
        } catch (error) {
            console.warn(`Nie można przetworzyć okładki albumu z URL: '${tags.albumCoverUrl}'. Błąd:`, error);
        }
    }

    writer.addTag();
    return writer.arrayBuffer;
};

/**
 * Applies tags to an M4A/MP4 file using mp4-tag-writer.
 * @param fileBuffer The ArrayBuffer of the M4A/MP4 file.
 * @param tags The tags to apply.
 * @returns An ArrayBuffer of the tagged M4A/MP4 file.
 */
const applyMP4TagsToFile = async (fileBuffer: ArrayBuffer, tags: ID3Tags): Promise<ArrayBuffer> => {
    // FIX: Access safe check for mp4TagWriter
    const Writer = (window as any).mp4TagWriter || (typeof mp4TagWriter !== 'undefined' ? mp4TagWriter : undefined);

    if (!Writer) {
        throw new Error("Biblioteka do zapisu tagów M4A/MP4 (mp4-tag-writer) nie została załadowana.");
    }
    
    const writer = Writer.create(fileBuffer);
    
    // Map ID3Tags to MP4 atoms
    if (tags.title) writer.setTag('©nam', tags.title);
    if (tags.artist) writer.setTag('©ART', tags.artist);
    if (tags.album) writer.setTag('©alb', tags.album);
    if (tags.year) writer.setTag('©day', tags.year);
    if (tags.genre) writer.setTag('©gen', tags.genre);
    if (tags.comments) writer.setTag('©cmt', tags.comments);
    if (tags.albumArtist) writer.setTag('aART', tags.albumArtist);
    if (tags.composer) writer.setTag('©wrt', tags.composer);
    if (tags.copyright) writer.setTag('cprt', tags.copyright);
    if (tags.encodedBy) writer.setTag('©enc', tags.encodedBy);
    if (tags.bpm) writer.setTag('tmpo', tags.bpm);
    
    // NEW: Add custom tags for 'mood' and 'originalArtist' for better compatibility with iTunes.
    if (tags.mood) {
        try {
            writer.setTag('----', { mean: 'com.apple.iTunes', name: 'MOOD', data: tags.mood });
        } catch (e) {
            console.warn('MP4Writer: Failed to set MOOD atom', e);
        }
    }
    if (tags.originalArtist) {
        try {
            writer.setTag('----', { mean: 'com.apple.iTunes', name: 'ORIGINAL ARTIST', data: tags.originalArtist });
        } catch (e) {
            console.warn('MP4Writer: Failed to set ORIGINAL ARTIST atom', e);
        }
    }
    if (tags.initialKey) {
        try {
            writer.setTag('----', { mean: 'com.apple.iTunes', name: 'INITIAL KEY', data: tags.initialKey });
        } catch (e) {
            console.warn('MP4Writer: Failed to set INITIAL KEY atom', e);
        }
    }

    // Track and Disc numbers are special cases
    if (tags.trackNumber) {
        try {
            const parts = String(tags.trackNumber).split('/');
            const number = parseInt(parts[0], 10) || 0;
            const total = parts.length > 1 ? parseInt(parts[1], 10) : 0;
            writer.setTag('trkn', [number, total]);
        } catch (e) {
            console.warn('MP4Writer: Failed to set trkn atom', e);
        }
    }
     if (tags.discNumber) {
        try {
            const parts = String(tags.discNumber).split('/');
            const number = parseInt(parts[0], 10) || 0;
            const total = parts.length > 1 ? parseInt(parts[1], 10) : 0;
            writer.setTag('disk', [number, total]);
        } catch (e) {
            console.warn('MP4Writer: Failed to set disk atom', e);
        }
    }
    
    if (tags.albumCoverUrl) {
         try {
            let coverBuffer: ArrayBuffer;
            if (tags.albumCoverUrl.startsWith('data:')) {
                coverBuffer = dataURLToArrayBuffer(tags.albumCoverUrl);
            } else {
                const proxiedUrl = proxyImageUrl(tags.albumCoverUrl);
                const response = await fetch(proxiedUrl!);
                if (!response.ok) throw new Error(`Nie udało się pobrać okładki: ${response.statusText}`);
                coverBuffer = await response.arrayBuffer();
            }
            writer.setTag('covr', coverBuffer);
        } catch (error) {
            console.warn(`Nie można przetworzyć okładki albumu dla M4A z URL: '${tags.albumCoverUrl}'. Błąd:`, error);
        }
    }

    return writer.write();
};

/**
 * Applies tags to an audio file, automatically detecting the format (MP3 or M4A/MP4).
 * @param file The original audio file.
 * @param tags The tags to apply.
 * @returns A Blob of the new file with tags applied.
 */
export const applyTags = async (file: File, tags: ID3Tags): Promise<Blob> => {
    if (!isTagWritingSupported(file)) {
        throw new Error(`Zapis tagów dla typu pliku '${file.type}' nie jest obsługiwany.`);
    }

    try {
        const fileBuffer = await file.arrayBuffer();
        let taggedBuffer: ArrayBuffer;

        const fileType = file.type;
        const lowerName = file.name.toLowerCase();
        
        if (fileType === 'audio/mpeg' || fileType === 'audio/mp3' || lowerName.endsWith('.mp3')) {
            taggedBuffer = await applyID3TagsToFile(fileBuffer, tags);
        } else if (fileType === 'audio/mp4' || fileType === 'audio/x-m4a' || lowerName.endsWith('.m4a') || lowerName.endsWith('.mp4')) {
            taggedBuffer = await applyMP4TagsToFile(fileBuffer, tags);
        } else {
            throw new Error(`Nieoczekiwany typ pliku: ${fileType}`);
        }
        
        return new Blob([taggedBuffer], { type: file.type });
    } catch (error) {
        console.error(`Błąd podczas aplikowania tagów dla pliku ${file.name}:`, error);
        throw new Error(`Nie udało się zapisać tagów: ${error instanceof Error ? error.message : String(error)}. Plik zostanie zapisany w oryginalnej formie.`);
    }
};


/**
 * Saves a file directly to the user's filesystem using the File System Access API.
 * @param dirHandle The handle to the root directory for saving.
 * @param audioFile The file object from the application state.
 * @returns An object indicating success and the updated file object for state management.
 */
export const saveFileDirectly = async (
  dirHandle: any, // FileSystemDirectoryHandle
  audioFile: AudioFile
): Promise<{ success: boolean; updatedFile?: AudioFile; errorMessage?: string }> => {
  try {
    const supportsTagWriting = isTagWritingSupported(audioFile.file);
    
    if (!audioFile.handle) {
      throw new Error("Brak referencji do pliku (file handle). Nie można zapisać, ponieważ plik nie pochodzi z trybu bezpośredniego dostępu.");
    }
    
    let blobToSave: Blob = audioFile.file;
    let tagWriteSuccess = false;
    let tagErrorMsg = "";

    // Intelligent Tag Writing
    if (supportsTagWriting && audioFile.fetchedTags) {
      try {
        blobToSave = await applyTags(audioFile.file, audioFile.fetchedTags);
        tagWriteSuccess = true;
      } catch (tagError: any) {
        console.warn(`Nie udało się zapisać tagów dla ${audioFile.file.name}, plik zostanie tylko przemianowany. Błąd:`, tagError);
        tagErrorMsg = tagError.message;
        blobToSave = audioFile.file;
      }
    }

    const currentPath = audioFile.webkitRelativePath || audioFile.file.name;
    const targetPath = audioFile.newName || currentPath;
    
    const normalizedCurrent = currentPath.replace(/^\/+/, '');
    const normalizedTarget = targetPath.replace(/^\/+/, '');
    
    const needsRename = normalizedCurrent !== normalizedTarget;

    if (!needsRename && !tagWriteSuccess) {
        if (tagErrorMsg) {
            return { success: false, errorMessage: `Brak zmiany nazwy i błąd zapisu tagów: ${tagErrorMsg}` };
        }
        return { success: true, updatedFile: audioFile };
    }

    // --- 1. PREPARE TARGET DIRECTORY HANDLE ---
    const pathParts = normalizedTarget.split('/').filter(p => p && p !== '.');
    const filename = pathParts.pop();

    if (!filename) {
        throw new Error(`Wygenerowana nazwa pliku jest nieprawidłowa: ${targetPath}`);
    }

    let targetDirHandle = dirHandle;
    for (const part of pathParts) {
        try {
            targetDirHandle = await targetDirHandle.getDirectoryHandle(part, { create: true });
        } catch (e: any) {
             if (e.name === 'NotAllowedError') throw new Error(`Brak uprawnień do tworzenia folderu "${part}". Sprawdź uprawnienia przeglądarki.`);
             if (e.name === 'NotFoundError') throw new Error(`Folder nadrzędny przestał istnieć. Odśwież połączenie z folderem.`);
             throw new Error(`Nie udało się utworzyć folderu "${part}": ${e.message}`);
        }
    }
      
    // --- 2. CREATE/WRITE TO TARGET FILE ---
    let newFileHandle;
    try {
        newFileHandle = await targetDirHandle.getFileHandle(filename, { create: true });
    } catch (e: any) {
        if (e.name === 'TypeMismatchError') throw new Error(`Nazwa "${filename}" jest już zajęta przez folder.`);
        if (e.name === 'NotAllowedError') throw new Error(`Brak uprawnień do utworzenia pliku "${filename}".`);
        if (e.name === 'NotFoundError') throw new Error(`Ścieżka docelowa nie istnieje.`);
        throw e;
    }

    try {
        const writable = await newFileHandle.createWritable({ keepExistingData: false });
        await writable.write(blobToSave);
        await writable.close();
    } catch (e: any) {
        if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
             throw new Error(`Użytkownik odmówił uprawnień do zapisu pliku "${filename}". Upewnij się, że zaakceptowałeś prośbę przeglądarki.`);
        }
        if (e.name === 'InvalidStateError' || e.name === 'NoModificationAllowedError' || e.code === 11) {
             throw new Error(`Plik "${filename}" jest zablokowany lub używany przez inny program (np. odtwarzacz muzyki, Spotify). Zamknij inne aplikacje korzystające z tego pliku i spróbuj ponownie.`);
        }
        if (e.name === 'QuotaExceededError') {
             throw new Error(`Brak miejsca na dysku, aby zapisać plik "${filename}".`);
        }
        throw new Error(`Błąd zapisu danych do pliku "${filename}": ${e.message} (${e.name})`);
    }
    
    // --- 3. CLEANUP OLD FILE (If Rename/Move occurred) ---
    if (needsRename) {
      try {
        const originalPathParts = normalizedCurrent.split('/').filter(p => p);
        const originalFilename = originalPathParts.pop();
             
        if (originalFilename) {
            let parentDirHandle = dirHandle;
            for (const part of originalPathParts) {
                try {
                    parentDirHandle = await parentDirHandle.getDirectoryHandle(part, { create: false });
                } catch {
                    parentDirHandle = null;
                    break;
                }
            }
            
            if (parentDirHandle) {
                 await parentDirHandle.removeEntry(originalFilename);
            }
        }
      } catch(removeError: any) {
         console.warn(`Nowy plik został pomyślnie zapisany w '${targetPath}', ale nie udało się usunąć oryginalnego pliku '${currentPath}'. Może być zablokowany przez inny proces. Błąd:`, removeError);
      }
    }

    const updatedCoreFile = await newFileHandle.getFile();
    
    let errorWarning = undefined;
    if (!tagWriteSuccess && supportsTagWriting && audioFile.fetchedTags) {
        errorWarning = "Nazwa zmieniona, ale tagi nie zostały zapisane (problem z biblioteką).";
    }

    return { 
        success: true, 
        errorMessage: errorWarning,
        updatedFile: { 
            ...audioFile, 
            file: updatedCoreFile, 
            handle: newFileHandle, 
            newName: normalizedTarget,
            webkitRelativePath: normalizedTarget
        }
    };

  } catch (err: any) {
    console.error(`Nie udało się zapisać pliku ${audioFile.file.name}:`, err);
    return { success: false, errorMessage: err.message || "Wystąpił nieznany błąd zapisu." };
  }
};