
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AudioFile, ID3Tags } from '../types';

export type AIProvider = 'gemini' | 'grok' | 'openai';

export interface ApiKeys {
  grok: string;
  openai: string;
}

const getSystemInstruction = () => {
  return `You are an expert music archivist with access to a vast database of music information.
Your task is to identify the song from the provided filename and any existing tags, and then provide the most accurate and complete ID3 tag information possible.

RULES FOR MERGING AND ACCURACY:
- Analyze the filename and existing tags to identify the track.
- Existing tags provided in the input are hints. If they seem correct, preserve them. If they seem wrong or missing, correct/fill them.
- If you cannot confidently determine a piece of information, return null or omit the field. DO NOT return empty strings ("") or generic placeholders like "Unknown Artist".
- Prioritize the original studio album.

TAGS TO FIND:
- title, artist, album, release year (4 digits), genre.
- trackNumber, discNumber.
- albumArtist, composer, originalArtist.
- copyright, encodedBy.
- mood, comments.
- albumCoverUrl (high-quality image URL).
- bitrate, sampleRate (estimates).

The response must be in JSON format.`;
};

const singleFileResponseSchema = {
    type: Type.OBJECT,
    properties: {
        artist: { type: Type.STRING, description: "The name of the main artist or band for the track." },
        title: { type: Type.STRING, description: "The official title of the song." },
        album: { type: Type.STRING, description: "The name of the original studio album." },
        year: { type: Type.STRING, description: "The 4-digit release year of the original album or song." },
        genre: { type: Type.STRING, description: "The primary genre of the music." },
        trackNumber: { type: Type.STRING, description: "The track number, possibly including the total count (e.g., '01' or '1/12')." },
        albumArtist: { type: Type.STRING, description: "The primary artist for the entire album, if different from the track artist." },
        composer: { type: Type.STRING, description: "The composer(s) of the music." },
        copyright: { type: Type.STRING, description: "Copyright information for the track." },
        encodedBy: { type: Type.STRING, description: "The person or company that encoded the file." },
        originalArtist: { type: Type.STRING, description: "The original artist(s) if the track is a cover." },
        discNumber: { type: Type.STRING, description: "The disc number, possibly including the total count (e.g., '1' or '1/2')." },
        albumCoverUrl: { type: Type.STRING, description: "A direct URL to a high-quality album cover image." },
        mood: { type: Type.STRING, description: "The overall mood or feeling of the song." },
        comments: { type: Type.STRING, description: "Brief interesting facts or description about the song." },
        bitrate: { type: Type.NUMBER, description: "The typical bitrate in kbps for the release (e.g., 320)." },
        sampleRate: { type: Type.NUMBER, description: "The typical sample rate in Hz for the release (e.g., 44100)." },
    },
};

const batchFileResponseSchema = {
    type: Type.ARRAY,
    description: "An array of objects, each containing the tags for a single song from the input list.",
    items: {
        type: Type.OBJECT,
        properties: {
            originalFilename: { type: Type.STRING, description: "The original filename provided in the prompt, used for mapping the results back." },
            ...singleFileResponseSchema.properties
        },
        required: ["originalFilename"],
    }
};

const callGeminiWithRetry = async (
    apiCall: () => Promise<GenerateContentResponse>,
    maxRetries = 3
): Promise<GenerateContentResponse> => {
    let lastError: Error | null = null;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiCall();
        } catch (error) {
            lastError = error as Error;
            console.warn(`Błąd wywołania API Gemini (próba ${i + 1}/${maxRetries}):`, lastError.message);
            if (i < maxRetries - 1) {
                // Exponential backoff
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError || new Error("Nie udało się wykonać zapytania do API po wielokrotnych próbach.");
};

// Helper to determine if a new value should overwrite an old one
const shouldOverwrite = (newValue: any, oldValue: any): boolean => {
    if (newValue === null || newValue === undefined || newValue === '') return false;
    if (typeof newValue === 'string') {
        const lowerNew = newValue.toLowerCase();
        if ((lowerNew.includes('unknown') || lowerNew.includes('undefined')) && oldValue && oldValue.length > 0) {
            return false;
        }
    }
    return true;
};


export const fetchTagsForFile = async (
  fileName: string,
  originalTags: ID3Tags,
  provider: AIProvider,
  apiKeys: ApiKeys
): Promise<ID3Tags> => {
  if (provider === 'gemini') {
    if (!process.env.API_KEY) {
      throw new Error("Klucz API Gemini nie jest skonfigurowany w zmiennych środowiskowych (API_KEY).");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Identify this song and provide its tags. Filename: "${fileName}". Existing tags: ${JSON.stringify(originalTags)}.`;
    
    try {
        const response = await callGeminiWithRetry(() => 
            ai.models.generateContent({
                model: "gemini-3-pro-preview", // UPDATED MODEL
                contents: prompt,
                config: {
                    systemInstruction: getSystemInstruction(),
                    responseMimeType: "application/json",
                    responseSchema: singleFileResponseSchema,
                    thinkingConfig: { thinkingBudget: 32768 } // ADDED THINKING BUDGET
                },
            })
        );

        const text = response.text?.trim() || "{}";
        let parsedResponse: Partial<ID3Tags>;

        try {
            parsedResponse = JSON.parse(text);
        } catch (e) {
            console.error("Nie udało się sparsować JSON z Gemini:", text);
            throw new Error("Otrzymano nieprawidłowy format JSON z AI.");
        }

        const mergedTags: ID3Tags = { ...originalTags };
        
        Object.keys(parsedResponse).forEach((key) => {
            const typedKey = key as keyof ID3Tags;
            const newValue = parsedResponse[typedKey];
            const oldValue = originalTags[typedKey];

            if (shouldOverwrite(newValue, oldValue)) {
                (mergedTags as any)[typedKey] = newValue;
            }
        });

        return mergedTags;

    } catch (error) {
        console.error("Błąd podczas pobierania tagów z Gemini API:", error);
        if (error instanceof Error) {
           throw new Error(`Błąd Gemini API: ${error.message}`);
        }
        throw new Error("Wystąpił nieznany błąd z Gemini API.");
    }
  }
  
  // Placeholder for other providers
  if (provider === 'grok' || provider === 'openai') {
      console.warn(`${provider} not implemented yet.`);
      return originalTags;
  }
  
  return originalTags;
};

export const fetchTagsForBatch = async (
    files: AudioFile[],
    provider: AIProvider,
    apiKeys: ApiKeys
): Promise<({ originalFilename: string } & ID3Tags)[]> => {
    if (provider === 'gemini') {
        if (!process.env.API_KEY) {
            throw new Error("Klucz API Gemini nie jest skonfigurowany w zmiennych środowiskowych (API_KEY).");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const fileList = files.map(f => JSON.stringify({ filename: f.file.name, existingTags: f.originalTags })).join(',\n');
        const prompt = `Batch identify these songs. Filenames and existing tags:\n[${fileList}]\n\nReturn a JSON array of objects with 'originalFilename' and identified tags. Consistency for albums is key.`;

        try {
            const response = await callGeminiWithRetry(() =>
                ai.models.generateContent({
                    model: "gemini-3-pro-preview", // UPDATED MODEL
                    contents: prompt,
                    config: {
                        systemInstruction: getSystemInstruction(),
                        responseMimeType: "application/json",
                        responseSchema: batchFileResponseSchema,
                        thinkingConfig: { thinkingBudget: 32768 } // ADDED THINKING BUDGET
                    },
                })
            );
            
            const text = response.text?.trim() || "[]";
            let parsedResponse: any[];
            try {
                parsedResponse = JSON.parse(text);
            } catch (e) {
                console.error("Failed to parse JSON from Gemini batch response:", text, e);
                throw new Error("Otrzymano nieprawidłowy format JSON z AI.");
            }
            
            if (!Array.isArray(parsedResponse)) {
                 throw new Error("Odpowiedź AI nie jest w formacie tablicy JSON.");
            }
            
            const validatedResults: any[] = [];
            const filesMap = new Map(files.map(f => [f.file.name, f]));
        
            for (const item of parsedResponse) {
                if (!item.originalFilename) continue;
                
                const originalFile = filesMap.get(item.originalFilename);
                const originalTags = originalFile ? originalFile.originalTags : {};
                const mergedItem: any = { originalFilename: item.originalFilename };
                
                const allKeys = new Set([...Object.keys(item), ...Object.keys(originalTags)]);
                allKeys.forEach(key => {
                    if (key === 'originalFilename') return;
                    const newVal = item[key];
                    const oldVal = (originalTags as any)[key];
                    
                    if (shouldOverwrite(newVal, oldVal)) {
                        mergedItem[key] = newVal;
                    } else {
                         mergedItem[key] = oldVal;
                    }
                });

                validatedResults.push(mergedItem);
            }
            
            return validatedResults as any;

        } catch (error) {
            console.error("Błąd podczas pobierania tagów wsadowo z Gemini API:", error);
            if (error instanceof Error) {
               throw new Error(`Błąd wsadowy Gemini API: ${error.message}`);
            }
            throw new Error("Wystąpił nieznany błąd wsadowy z Gemini API.");
        }
    }

    throw new Error(`Nieznany dostawca ${provider} nie jest obsługiwany w trybie wsadowym.`);
};
