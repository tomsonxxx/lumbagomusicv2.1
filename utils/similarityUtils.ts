
import { AudioFile, ID3Tags } from '../types';

// Mapowanie kluczy Camelot na współrzędne (koło godzinowe)
// Format: "8A" -> { hour: 8, letter: 'A' }
const parseCamelot = (key: string): { hour: number, letter: string } | null => {
    const match = key.match(/^(\d+)([AB])$/i);
    if (!match) return null;
    return { hour: parseInt(match[1]), letter: match[2].toUpperCase() };
};

/**
 * Oblicza kompatybilność harmoniczną (0.0 - 1.0)
 * 1.0 = Ten sam klucz lub relatywny (8A <-> 8B)
 * 0.9 = Dominanta/Subdominanta (8A <-> 9A, 7A)
 * 0.5 = Dalsze (kompatybilne w miksie energetycznym)
 * 0.0 = Disharmonia
 */
const calculateHarmonicScore = (key1?: string, key2?: string): number => {
    if (!key1 || !key2) return 0;
    
    const k1 = parseCamelot(key1);
    const k2 = parseCamelot(key2);
    
    if (!k1 || !k2) {
        // Fallback dla zwykłych tekstów (np. Am == Am)
        return key1 === key2 ? 1 : 0;
    }

    if (k1.hour === k2.hour && k1.letter === k2.letter) return 1.0; // Perfect match
    if (k1.hour === k2.hour && k1.letter !== k2.letter) return 0.95; // Relative Major/Minor (8A - 8B)
    
    const hourDiff = Math.abs(k1.hour - k2.hour);
    const distance = Math.min(hourDiff, 12 - hourDiff); // Odległość na kole (max 6)

    if (distance === 1 && k1.letter === k2.letter) return 0.9; // Adjacent (8A - 9A)
    if (distance === 1 && k1.letter !== k2.letter) return 0.7; // Diagonal (8A - 9B) - Energy boost mix
    if (distance === 2) return 0.3; 
    
    return 0; 
};

/**
 * Oblicza podobieństwo BPM (0.0 - 1.0)
 * 1.0 = Idealne
 * 0.0 = Różnica > 15%
 */
const calculateBpmScore = (bpm1?: number, bpm2?: number): number => {
    if (!bpm1 || !bpm2) return 0;
    
    const diff = Math.abs(bpm1 - bpm2);
    const percentage = diff / bpm1;
    
    if (percentage > 0.15) return 0; // Za daleko do zmiksowania
    
    // Linearny spadek od 1.0 do 0.0 przy 15% różnicy
    return 1.0 - (percentage / 0.15); 
};

/**
 * Główna funkcja rekomendacji
 */
export interface RecommendationResult {
    file: AudioFile;
    score: number;
    matches: {
        bpm: boolean;
        key: boolean;
        genre: boolean;
    };
    details: string;
}

export interface SimilarityWeights {
    bpm: number;
    key: number;
    genre: number;
    year: number;
}

export const findSimilarTracks = (
    seedTrack: AudioFile, 
    library: AudioFile[],
    weights: SimilarityWeights = { bpm: 0.4, key: 0.4, genre: 0.1, year: 0.1 }
): RecommendationResult[] => {
    const seedTags = seedTrack.fetchedTags || seedTrack.originalTags;
    
    // Normalizacja wag
    const totalWeight = weights.bpm + weights.key + weights.genre + weights.year;
    const w = {
        bpm: weights.bpm / totalWeight,
        key: weights.key / totalWeight,
        genre: weights.genre / totalWeight,
        year: weights.year / totalWeight
    };

    const results = library
        .filter(f => f.id !== seedTrack.id) // Wyklucz siebie
        .map(target => {
            const targetTags = target.fetchedTags || target.originalTags;
            let score = 0;
            const matches = { bpm: false, key: false, genre: false };

            // 1. BPM Score
            const bpmScore = calculateBpmScore(seedTags.bpm, targetTags.bpm);
            score += bpmScore * w.bpm;
            if (bpmScore > 0.8) matches.bpm = true;

            // 2. Key Score
            const keyScore = calculateHarmonicScore(seedTags.initialKey, targetTags.initialKey);
            score += keyScore * w.key;
            if (keyScore > 0.8) matches.key = true;

            // 3. Genre Score (Simple string contains)
            let genreScore = 0;
            if (seedTags.genre && targetTags.genre) {
                const g1 = seedTags.genre.toLowerCase();
                const g2 = targetTags.genre.toLowerCase();
                if (g1 === g2) genreScore = 1.0;
                else if (g1.includes(g2) || g2.includes(g1)) genreScore = 0.8;
            }
            score += genreScore * w.genre;
            if (genreScore > 0.7) matches.genre = true;

            // 4. Year Score (Decade / Close years)
            let yearScore = 0;
            if (seedTags.year && targetTags.year) {
                const y1 = parseInt(seedTags.year);
                const y2 = parseInt(targetTags.year);
                if (!isNaN(y1) && !isNaN(y2)) {
                    const diff = Math.abs(y1 - y2);
                    if (diff === 0) yearScore = 1.0;
                    else if (diff <= 5) yearScore = 0.8;
                    else if (diff <= 10) yearScore = 0.5;
                }
            }
            score += yearScore * w.year;

            return {
                file: target,
                score: score * 100, // Procenty
                matches,
                details: `${Math.round(bpmScore*100)}% BPM match, ${Math.round(keyScore*100)}% Harmonic`
            };
        })
        .filter(r => r.score > 30) // Odrzuć słabe dopasowania
        .sort((a, b) => b.score - a.score);

    return results.slice(0, 50); // Zwróć top 50
};
