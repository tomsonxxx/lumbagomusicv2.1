
import { AudioFile, ID3Tags } from '../types';
import { generatePath } from './filenameUtils';

export interface OrganizationTask {
  file: AudioFile;
  destinationPath: string; // Relative path inside target folder
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export const previewOrganization = (
  files: AudioFile[], 
  pattern: string
): OrganizationTask[] => {
  return files.map(file => {
    // Generate new path based on tags and pattern
    // generatePath handles metadata replacement and sanitization
    const newPath = generatePath(pattern, file.fetchedTags || file.originalTags, file.file.name);
    
    return {
      file,
      destinationPath: newPath,
      status: 'pending'
    };
  });
};

const getNestedDirectoryHandle = async (rootHandle: any, path: string) => {
  const parts = path.split('/').filter(p => p && p !== '.');
  // Remove filename, keep directories
  parts.pop(); 
  
  let currentHandle = rootHandle;
  for (const part of parts) {
    currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
  }
  return currentHandle;
};

export const executeOrganization = async (
  tasks: OrganizationTask[],
  targetRootHandle: any,
  onProgress: (completed: number, current: string) => void
): Promise<OrganizationTask[]> => {
  const results = [...tasks];
  let completedCount = 0;

  for (let i = 0; i < results.length; i++) {
    const task = results[i];
    onProgress(completedCount, task.destinationPath);

    try {
      // 1. Get/Create destination folder
      const dirHandle = await getNestedDirectoryHandle(targetRootHandle, task.destinationPath);
      
      // 2. Create file handle
      const fileName = task.destinationPath.split('/').pop() || 'unknown_file';
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      
      // 3. Write data
      // We read the original file blob and write it to the new handle
      const writable = await fileHandle.createWritable();
      
      // If we have fetched tags, we should ideally ensure they are written.
      // However, reading from 'file.file' gives the original blob.
      // If the user hasn't applied tags to the original file yet, we might be copying untagged files.
      // In this flow, we assume files in library are 'ready'. 
      // Ideally, we would apply tags here on the fly if needed, but that requires re-encoding.
      // For performance, we copy the source blob. If the user Applied tags earlier, the blob is updated in some flows,
      // but in this web app, 'file.file' is usually the reference to disk. 
      // TODO: Add on-the-fly tagging if requested. For now, binary copy.
      
      await writable.write(task.file.file);
      await writable.close();

      task.status = 'success';
    } catch (error: any) {
      console.error(`Error organizing file ${task.file.file.name}:`, error);
      task.status = 'error';
      task.error = error.message;
    }

    completedCount++;
  }

  return results;
};
