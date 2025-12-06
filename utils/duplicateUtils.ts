
import { AudioFile, ID3Tags } from '../types';
import { generateFingerprint, compareFingerprints } from './audioFingerprint';

export interface DuplicateGroup {
  id: string;
  key: string;
  files: AudioFile[];
  type: 'filename' | 'metadata' | 'size_duration' | 'fingerprint';
  similarity?: number;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const normalize = (str?: string) => {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};

// Asynchronous version of duplicate finder
export const findDuplicatesAsync = async (
    files: AudioFile[], 
    onProgress?: (progress: number, status: string) => void
): Promise<DuplicateGroup[]> => {
  const groups: DuplicateGroup[] = [];
  const processedIds = new Set<string>();

  // --- PHASE 1: Fast (Synchronous) Checks ---
  if (onProgress) onProgress(10, "Analyzing filenames...");

  // 1. Exact Filename
  const nameMap = new Map<string, AudioFile[]>();
  files.forEach(f => {
    const key = f.file.name.toLowerCase();
    if (!nameMap.has(key)) nameMap.set(key, []);
    nameMap.get(key)?.push(f);
  });

  nameMap.forEach((groupFiles, name) => {
    if (groupFiles.length > 1) {
      groups.push({
        id: generateId(),
        key: `Filename: ${name}`,
        files: groupFiles,
        type: 'filename',
        similarity: 100
      });
      groupFiles.forEach(f => processedIds.add(f.id));
    }
  });

  if (onProgress) onProgress(20, "Analyzing metadata...");

  // 2. Metadata (Artist + Title)
  const metaMap = new Map<string, AudioFile[]>();
  files.forEach(f => {
    if (processedIds.has(f.id)) return;
    const tags = f.fetchedTags || f.originalTags;
    const artist = normalize(tags.artist);
    const title = normalize(tags.title);
    if (artist && title) {
      const key = `${artist}|${title}`;
      if (!metaMap.has(key)) metaMap.set(key, []);
      metaMap.get(key)?.push(f);
    }
  });

  metaMap.forEach((groupFiles, key) => {
    if (groupFiles.length > 1) {
       const [artist, title] = key.split('|');
       groups.push({
         id: generateId(),
         key: `Tags: ${groupFiles[0].originalTags.artist || artist} - ${groupFiles[0].originalTags.title || title}`,
         files: groupFiles,
         type: 'metadata',
         similarity: 100
       });
       groupFiles.forEach(f => processedIds.add(f.id));
    }
  });

  // --- PHASE 2: Audio Fingerprinting (Heavy) ---
  // Strategy: Only fingerprint files that have similar duration to find candidates.
  // This avoids decoding every single file.
  
  if (onProgress) onProgress(40, "Grouping candidates for audio analysis...");

  const candidates = files.filter(f => !processedIds.has(f.id));
  const durationGroups = new Map<number, AudioFile[]>();
  
  // Bucket by file size (approximate for duration if not available)
  // or use metadata duration if we parsed it. 
  // Here we use a coarse file size bucket (0.5MB buckets) as a proxy for "potentially same audio"
  candidates.forEach(f => {
      const bucket = Math.floor((f.file.size / 1024 / 1024) * 2); // 0.5 MB buckets
      if (!durationGroups.has(bucket)) durationGroups.set(bucket, []);
      durationGroups.get(bucket)?.push(f);
  });

  // Filter groups that have more than 1 file
  const groupsToAnalyze = Array.from(durationGroups.values()).filter(g => g.length > 1);
  const totalFilesToAnalyze = groupsToAnalyze.reduce((acc, g) => acc + g.length, 0);
  
  let analyzedCount = 0;
  const fpCache = new Map<string, string>();

  // Process candidate groups
  for (const group of groupsToAnalyze) {
      // 1. Generate fingerprints for this group
      for (const file of group) {
          if (!fpCache.has(file.id)) {
              if (onProgress) {
                  const p = 40 + Math.floor((analyzedCount / totalFilesToAnalyze) * 60);
                  onProgress(p, `Analyzing audio: ${file.file.name}`);
              }
              const fp = await generateFingerprint(file.file);
              fpCache.set(file.id, fp);
              analyzedCount++;
          }
      }

      // 2. Compare pairs in this group
      for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
              const f1 = group[i];
              const f2 = group[j];
              
              // Skip if already grouped
              if (processedIds.has(f1.id) && processedIds.has(f2.id)) continue;

              const fp1 = fpCache.get(f1.id);
              const fp2 = fpCache.get(f2.id);
              
              if (fp1 && fp2) {
                  const similarity = compareFingerprints(fp1, fp2);
                  
                  if (similarity > 0.85) { // 85% similarity threshold
                      groups.push({
                          id: generateId(),
                          key: `Audio Match (~${Math.round(similarity * 100)}%)`,
                          files: [f1, f2],
                          type: 'fingerprint',
                          similarity: Math.round(similarity * 100)
                      });
                      processedIds.add(f1.id);
                      processedIds.add(f2.id);
                  }
              }
          }
      }
  }

  if (onProgress) onProgress(100, "Done.");
  return groups;
};

// Maintain synchronous version for compatibility if needed, but it returns empty or simple results
export const findDuplicates = (files: AudioFile[]): DuplicateGroup[] => {
    // Legacy sync implementation (placeholder)
    // Real logic moved to async
    return [];
};
