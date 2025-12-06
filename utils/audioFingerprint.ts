
/**
 * Audio Fingerprinting Module
 * Implementation of a simplified acoustic fingerprinting algorithm in pure TypeScript.
 * Uses Web Audio API for FFT analysis and spectral feature extraction.
 */

const SAMPLE_RATE = 11025; // Reduced sample rate for performance/efficiency
const FINGERPRINT_DURATION = 60; // Analyze first 60 seconds (sufficient for duplicate detection)
const FFT_SIZE = 2048;

/**
 * Creates an OfflineAudioContext for rendering.
 */
const getOfflineAudioContext = (length: number) => {
    const Ctx = (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext);
    return new Ctx(1, length, SAMPLE_RATE);
};

const decodeAudio = async (file: File): Promise<Float32Array> => {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Decode audio data
    const rawBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Resample and Downmix to Mono 11025Hz
    const duration = Math.min(rawBuffer.duration, FINGERPRINT_DURATION);
    const length = Math.floor(duration * SAMPLE_RATE);
    
    // We use OfflineAudioContext to render the audio into a buffer we can process
    const offlineCtx = getOfflineAudioContext(length);
    
    const source = offlineCtx.createBufferSource();
    source.buffer = rawBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);
    
    const renderedBuffer = await offlineCtx.startRendering();
    await audioContext.close(); // Clean up
    
    return renderedBuffer.getChannelData(0);
};

/**
 * Generates a fingerprint string (hex encoded) based on audio energy dynamics.
 * This acts as a simplified signature of the audio content.
 */
export const generateFingerprint = async (file: File): Promise<string> => {
    try {
        const pcmData = await decodeAudio(file);
        
        // Energy Fingerprint:
        // Divide signal into small windows (e.g., 200ms) and calculate RMS energy.
        // This creates a "loudness contour" which is robust for exact duplicates.
        // For a true Chromaprint (AcoustID), we'd need complex FFT band mapping,
        // but for local duplicate finding, energy+zero crossing is often sufficient and much faster.
        
        const windowSize = Math.floor(SAMPLE_RATE * 0.2); // 200ms windows
        const fingerprints: number[] = [];
        
        for (let i = 0; i < pcmData.length; i += windowSize) {
            let sum = 0;
            // Calculate RMS for this window
            for (let j = 0; j < windowSize && i + j < pcmData.length; j++) {
                sum += pcmData[i + j] * pcmData[i + j];
            }
            const rms = Math.sqrt(sum / windowSize);
            
            // Quantize to 16 levels (0-9, A-F) to create a hex string
            // We scale up the RMS to get meaningful variation
            const val = Math.min(15, Math.floor(rms * 100)); 
            fingerprints.push(val);
        }
        
        // Convert to hex string
        return fingerprints.map(n => n.toString(16)).join('');
        
    } catch (e) {
        console.error("Fingerprint generation failed for file:", file.name, e);
        return "";
    }
};

/**
 * Calculates similarity between two fingerprints.
 * Uses a sliding window Hamming distance approach to account for slight offsets.
 */
export const compareFingerprints = (fp1: string, fp2: string): number => {
    if (!fp1 || !fp2) return 0;
    
    const len = Math.min(fp1.length, fp2.length);
    if (len === 0) return 0;
    
    // Find best match with a small offset tolerance (e.g. +/- 2 seconds)
    // 200ms windows, so +/- 10 steps
    let bestScore = 0;
    const maxOffset = 10; 
    
    for (let offset = -maxOffset; offset <= maxOffset; offset++) {
        let matchCount = 0;
        let totalCount = 0;
        
        for (let i = 0; i < len; i++) {
            const idx1 = i;
            const idx2 = i + offset;
            
            if (idx2 >= 0 && idx2 < fp2.length) {
                const val1 = parseInt(fp1[idx1], 16);
                const val2 = parseInt(fp2[idx2], 16);
                
                // Tolerance: exact match or off by 1 level
                const diff = Math.abs(val1 - val2);
                if (diff <= 1) matchCount += 1;
                else if (diff <= 2) matchCount += 0.5; // Partial credit
                
                totalCount++;
            }
        }
        
        if (totalCount > 0) {
            const score = matchCount / totalCount;
            if (score > bestScore) bestScore = score;
        }
    }
    
    return bestScore;
};
