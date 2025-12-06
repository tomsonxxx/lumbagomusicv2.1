
# **Plan Budowy Systemu Lumbago Music AI**
## **z priorytetem: Przeglądarka Biblioteki Multimediów**

---

# **Status Realizacji**

### 🟢 Faza 1: Przeglądarka Biblioteki (Library Browser)
*   ✅ **Główny Layout:** Przebudowa na układ z lewym panelem (Sidebar) w stylu **Neon/Cyberpunk**.
*   ✅ **Panel Boczny (Sidebar):** 
    *   Nawigacja między widokami (Biblioteka, Import, Narzędzia).
    *   System Playlist (Tworzenie, Usuwanie, Liczniki).
    *   ✅ **Smart Playlists:** Dynamiczne playlisty oparte na regułach (Gatunek, Rok, BPM).
*   ✅ **Widoki Danych:** Widok Listy i Siatki.
*   ✅ **Sortowanie:** Klikalne nagłówki kolumn w widoku listy.
*   ✅ **Kolumny niestandardowe:** Tabela listy zawiera BPM, Key, Gatunek.
*   ✅ **Ulubione:** Oznaczanie utworów serduszkiem i filtrowanie.
*   ✅ **Organizacja:** Sortowanie po wszystkich polach, filtrowanie (Rok, Gatunek, Status).
*   ✅ **Inspektor:** Podgląd szczegółów pliku.

### 🟢 Faza 2: Import & Skaner
*   ✅ Drag & Drop, Folder Scan, URL Import.
*   ✅ File System Access API (Tryb bezpośredni).

### 🟢 Faza 3: Smart Tagger AI
*   ✅ Integracja z Gemini 3.0 Pro.
*   ✅ **Search Grounding:** Użycie Google Search Tool do weryfikacji metadanych.
*   ✅ Edycja pojedyncza i masowa.
*   ✅ **Tap Tempo:** Ręczne wykrywanie BPM w oknie edycji.
*   ✅ **Optymalizacja Wsadowa (Parallel Requests):** Przetwarzanie wielu plików jednocześnie.
*   ⚠️ Obsługa innych modeli (Grok/OpenAI) w przygotowaniu.

### 🟢 Faza 4: Duplicate Finder
*   ✅ Wykrywanie duplikatów po nazwie, metadanych i rozmiarze.
*   ✅ Interfejs usuwania i zachowywania najlepszej jakości (UI odświeżony do wersji Neon).

### 🟢 Faza 5: XML Converter
*   ✅ Parsowanie plików XML z Rekordbox i VirtualDJ.
*   ✅ **NOWOŚĆ: Generator XML:** Eksport biblioteki do formatu Rekordbox.
*   ✅ Widok statystyk i struktury playlist.
*   ✅ UI odświeżony (Glassmorphism).
*   ✅ **Synchronizacja (Relink):** Mapowanie ścieżek z XML na lokalne pliki.

### 🟢 Faza 6: Odtwarzacz & Audio
*   ✅ Globalny Dock Player w stylu Neon.
*   ✅ Wizualizacje (Web Audio API) w docku.
*   ✅ **Mini Waveform:** Wizualizacja przy tytule na liście utworów.
*   ✅ **Analiza Audio (Client-side):** Wykrywanie BPM i Tonacji (Key) bezpośrednio w przeglądarce (Web Audio API).

### 🟢 Faza 7: Zarządzanie Danymi (Baza Danych & Backup)
*   ✅ **Eksport JSON:** Zapis pełnego stanu aplikacji (pliki, playlisty, ustawienia) na dysk.
*   ✅ **Import JSON:** Przywracanie kopii zapasowej (z obsługą placeholderów dla plików).
*   ✅ **Interfejs UI:** Nowa zakładka "Backup & Baza" ze statystykami.

### 🟢 Faza 8: Zaawansowana Organizacja (Library Builder)
*   ✅ **Kreator (Wizard):** Trzy-etapowy proces.
*   ✅ **Symulacja (Dry Run):** Podgląd zmian ścieżek przed wykonaniem.
*   ✅ **Wykonanie:** Fizyczne kopiowanie plików z tworzeniem struktury folderów.

### 🟢 Faza 9: Zaawansowane Funkcje AI (Extension)
*   ✅ **Playlist Intelligence:** Sugestie kolejności tracków (Harmonic Mixing - Camelot Wheel).
*   ✅ **Audio Recognizer:** Rozpoznawanie utworu przez Gemini (Multimodal Audio).
*   ✅ **Client-side DSP:** Lokalna analiza BPM (Energy Peak) i Tonacji (Chromagram) bez użycia tokenów AI.
*   ✅ **Crate Digger:** Wyszukiwanie utworów podobnych (BPM, Key, Genre) z wagami preferencji.

---

# **Czeklista ToDo (Pozostałe Zadania)**

## **UI & UX Polish**
- [ ] **Wirtualizacja listy:** Optymalizacja renderowania dla bibliotek > 1000 utworów (`react-window`).
- [ ] **Drag & Drop:** Przenoszenie utworów do playlist metodą przeciągnij-i-upuść.
- [ ] **Set Recorder:** Nagrywanie i analiza setów (Jeszcze nie zaimplementowane).
