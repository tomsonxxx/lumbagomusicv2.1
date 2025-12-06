
import { ID3Tags, AudioFile, MetadataHealth } from '../types';

/**
 * Mechanizm Analizy Wstępnej (Pre-Scan Logic)
 * Zgodnie z dokumentacją: Analizuje kompletność metadanych, jakość audio i spójność.
 */
export const calculateMetadataHealth = (file: AudioFile): MetadataHealth => {
    const tags = file.fetchedTags || file.originalTags;
    let score = 0;
    const missing: string[] = [];
    const issues: string[] = [];

    // 1. Podstawowe Metadane (40 pkt)
    if (tags.title && tags.title.trim().length > 0) score += 15; else missing.push('Tytuł');
    if (tags.artist && tags.artist.trim().length > 0) score += 15; else missing.push('Artysta');
    if (tags.album && tags.album.trim().length > 0) score += 10; else missing.push('Album');

    // 2. Okładka (20 pkt)
    if (tags.albumCoverUrl) {
        score += 20;
    } else {
        missing.push('Okładka');
    }

    // 3. Dane DJ-skie / Techniczne (30 pkt)
    if (tags.bpm && tags.bpm > 0) {
        score += 10;
        if (tags.bpm < 50 || tags.bpm > 250) issues.push('Podejrzane BPM');
    } else {
        missing.push('BPM');
    }

    if (tags.initialKey) {
        score += 10;
    } else {
        missing.push('Klucz (Key)');
    }

    if (tags.genre) score += 5; else missing.push('Gatunek');
    if (tags.year) score += 5; else missing.push('Rok');

    // 4. Jakość Audio (10 pkt)
    const bitrate = tags.bitrate || 0;
    if (bitrate >= 320) score += 10;
    else if (bitrate >= 256) score += 8;
    else if (bitrate >= 192) score += 5;
    else if (bitrate > 0 && bitrate < 128) {
        issues.push('Niska jakość audio (<128kbps)');
        score += 2;
    }

    // Klasyfikacja
    let rating: MetadataHealth['rating'] = 'Bad';
    let color = '#ef4444'; // red-500

    if (score === 100) {
        rating = 'Perfect';
        color = '#39ff14'; // lumbago-accent (neon green)
    } else if (score >= 80) {
        rating = 'Good';
        color = '#22c55e'; // green-500
    } else if (score >= 50) {
        rating = 'Average';
        color = '#eab308'; // yellow-500
    }

    return {
        score,
        rating,
        missingFields: missing,
        issues,
        color
    };
};
