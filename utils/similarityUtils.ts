
import { AudioFile, ID3Tags } from '../types';
import { analyzeTransition } from './harmonicUtils';

/**
 * Oblicza podobieństwo BPM (0.0 - 1.0)
 */
const calculateBpmScore = (bpm1?: number, bpm2?: number): number => {
    if (!bpm1 || !bpm2) return 0;
    const diff = Math.abs(bpm1 - bpm2);
    const percentage = diff / bpm1;
    if (percentage > 0.15) return 0; 
    return 1.0 - (percentage / 0.15); 
};

export interface RecommendationResult {
    file: AudioFile;
    score: number;
    matches: {
        bpm: boolean;
        key: boolean;
        genre: boolean;
    };
    harmonicDetails?: string; // Info o przejściu
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
        .filter(f => f.id !== seedTrack.id) 
        .map(target => {
            const targetTags = target.fetchedTags || target.originalTags;
            let score = 0;
            const matches = { bpm: false, key: false, genre: false };

            // 1. BPM Score
            const bpmScore = calculateBpmScore(seedTags.bpm, targetTags.bpm);
            score += bpmScore * w.bpm;
            if (bpmScore > 0.8) matches.bpm = true;

            // 2. Key Score (Updated using harmonicUtils)
            let harmonicInfo = '';
            let keyScore = 0;
            if (seedTags.initialKey && targetTags.initialKey) {
                const transition = analyzeTransition(seedTags.initialKey, targetTags.initialKey);
                keyScore = transition.score / 100;
                harmonicInfo = transition.description;
            }
            
            score += keyScore * w.key;
            if (keyScore > 0.6) matches.key = true;

            // 3. Genre Score
            let genreScore = 0;
            if (seedTags.genre && targetTags.genre) {
                const g1 = seedTags.genre.toLowerCase();
                const g2 = targetTags.genre.toLowerCase();
                if (g1 === g2) genreScore = 1.0;
                else if (g1.includes(g2) || g2.includes(g1)) genreScore = 0.8;
            }
            score += genreScore * w.genre;
            if (genreScore > 0.7) matches.genre = true;

            // 4. Year Score
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
                score: score * 100,
                matches,
                harmonicDetails: harmonicInfo
            };
        })
        .filter(r => r.score > 30)
        .sort((a, b) => b.score - a.score);

    return results.slice(0, 50);
};
