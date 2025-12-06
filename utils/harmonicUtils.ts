
// Narzędzia do Harmonic Mixing (Koło Camelot)

export interface HarmonicTransition {
    type: 'Perfect' | 'Energy Boost' | 'Energy Drop' | 'Harmonic Change' | 'Dissonant';
    description: string;
    score: number; // 0-100 compatibility
}

const CAMELOT_KEYS: Record<string, { hour: number, letter: 'A' | 'B' }> = {
    '1A': { hour: 1, letter: 'A' }, '1B': { hour: 1, letter: 'B' },
    '2A': { hour: 2, letter: 'A' }, '2B': { hour: 2, letter: 'B' },
    '3A': { hour: 3, letter: 'A' }, '3B': { hour: 3, letter: 'B' },
    '4A': { hour: 4, letter: 'A' }, '4B': { hour: 4, letter: 'B' },
    '5A': { hour: 5, letter: 'A' }, '5B': { hour: 5, letter: 'B' },
    '6A': { hour: 6, letter: 'A' }, '6B': { hour: 6, letter: 'B' },
    '7A': { hour: 7, letter: 'A' }, '7B': { hour: 7, letter: 'B' },
    '8A': { hour: 8, letter: 'A' }, '8B': { hour: 8, letter: 'B' },
    '9A': { hour: 9, letter: 'A' }, '9B': { hour: 9, letter: 'B' },
    '10A': { hour: 10, letter: 'A' }, '10B': { hour: 10, letter: 'B' },
    '11A': { hour: 11, letter: 'A' }, '11B': { hour: 11, letter: 'B' },
    '12A': { hour: 12, letter: 'A' }, '12B': { hour: 12, letter: 'B' },
};

// Normalizacja kluczy (np. 08A -> 8A, 8a -> 8A)
export const normalizeKey = (key: string): string => {
    if (!key) return '';
    const clean = key.toUpperCase().trim();
    // Usuń wiodące zero
    if (clean.startsWith('0') && clean.length === 3) return clean.substring(1);
    return clean;
};

export const analyzeTransition = (fromKey: string, toKey: string): HarmonicTransition => {
    const k1 = CAMELOT_KEYS[normalizeKey(fromKey)];
    const k2 = CAMELOT_KEYS[normalizeKey(toKey)];

    if (!k1 || !k2) {
        return { type: 'Dissonant', description: 'Nieznany klucz', score: 0 };
    }

    if (k1.hour === k2.hour && k1.letter === k2.letter) {
        return { type: 'Perfect', description: 'Ten sam klucz (Idealne miksowanie)', score: 100 };
    }

    // Relative Major/Minor (8A <-> 8B)
    if (k1.hour === k2.hour && k1.letter !== k2.letter) {
        return { type: 'Perfect', description: 'Względny Major/Minor (Zmiana nastroju)', score: 95 };
    }

    const hourDiff = k2.hour - k1.hour;
    // Obsługa przejścia przez 12 (np. 12 -> 1 to +1)
    const diff = (hourDiff + 12) % 12; 

    // +1 Hour (8A -> 9A) - Energy Boost
    if (diff === 1 && k1.letter === k2.letter) {
        return { type: 'Energy Boost', description: 'Podniesienie energii (+1)', score: 90 };
    }

    // -1 Hour (8A -> 7A) - Energy Drop
    if (diff === 11 && k1.letter === k2.letter) { // 11 mod 12 is -1
        return { type: 'Energy Drop', description: 'Obniżenie energii (-1)', score: 85 };
    }

    // Diagonal Mix (+1 + Change Letter) - 8A -> 9B
    if (diff === 1 && k1.letter !== k2.letter) {
        return { type: 'Harmonic Change', description: 'Przejście diagonalne (Wzrost energii + Zmiana nastroju)', score: 70 };
    }
    
    // Diagonal Mix (-1 + Change Letter) - 8A -> 7B
    if (diff === 11 && k1.letter !== k2.letter) {
        return { type: 'Harmonic Change', description: 'Przejście diagonalne (Spadek energii + Zmiana nastroju)', score: 70 };
    }

    // Semitone Energy Boost (+7 hours on wheel, e.g. 8A -> 3A is +7? No wait. Semitone is +7 or -5)
    // 8A -> 3A (+7 hours) is a known modulated boost
    if (diff === 7 && k1.letter === k2.letter) {
         return { type: 'Energy Boost', description: 'Modulacja o półton (+7h)', score: 60 };
    }
    
    // +2 Hours (8A -> 10A) - Compatible but distinct
    if ((diff === 2 || diff === 10) && k1.letter === k2.letter) {
        return { type: 'Harmonic Change', description: 'Kompatybilne (+/- 2h)', score: 50 };
    }

    return { type: 'Dissonant', description: 'Klucze niekompatybilne', score: 10 };
};
