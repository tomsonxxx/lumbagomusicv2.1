
# **Plan Budowy Systemu Lumbago Music AI**
## **z priorytetem: Przeglądarka Biblioteki Multimediów**

---

# **1. Cel projektu**
Celem projektu jest stworzenie kompletnego, nowoczesnego i modularnego systemu **Lumbago Music AI**, w którym centralnym elementem staje się **Przeglądarka Biblioteki Multimediów** (Library Browser). To główne okno aplikacji, służące jako punkt wyjścia dla wszystkich funkcji, narzędzi i modułów sztucznej inteligencji.

---

# **2. Główne założenia projektu**
- Przeglądarka Biblioteki Multimediów stanowi **podstawowy widok**, widoczny od momentu uruchomienia aplikacji.
- Wszystkie moduły poboczne (np. Tagger AI, Duplicate Finder, XML Converter) działają jako **modale lub panele nakładkowe** otwierane bez opuszczania głównego widoku.
- Interfejs może bazować na makietach z dokumentu *Blueprint* lub czerpać inspiracje z najpopularniejszych aplikacji, takich jak: Rekordbox, iTunes, Serato DJ Pro czy Traktor.
- Moduł pełni funkcję **centrum zarządzania biblioteką**, integrując funkcje audio, analizy AI oraz narzędzia organizacyjne.

---

# **3. Zakres funkcjonalny przeglądarki biblioteki**
### **Widoki i elementy UI:**
- [x] Widok listy utworów (Track List) — tabela z kluczowymi metadanymi.
- [x] Widok siatki (Artwork Grid) — miniatury okładek albumów.
- [x] Globalna wyszukiwarka (Search Bar).
- [x] Filtry zaawansowane (BPM, tonacja, gatunek, ocena, data dodania).
- [ ] Lewy panel z sekcjami: Playlists, Sources, Favorites.
- [x] Prawy panel informacji o utworze (Track Info Panel) - *Zrealizowano jako Tooltip i Modal Edycji*.
- [x] Pasek narzędzi (Import, Scan, Tag AI, Duplicate Finder, Rename, Convert XML).
- [x] Dock Player z waveformem oraz obsługą hot-cue i metadanych.
- [ ] Drag & drop do playlist.
- [x] Kontekstowe menu (PPM) dla tracków i playlist - *Zrealizowano jako Dropdown akcji*.

---

# **4. Rozszerzony plan wdrożenia**
Poniższy harmonogram został uzupełniony o nowy priorytet — stworzenie Przeglądarki Biblioteki Multimediów na wczesnym etapie projektu.

## **Faza 0: Bootstrap projektu**
- [x] Inicjalizacja frontendu (React + Vite).
- [x] Konfiguracja Tailwind.

## **Faza 1: Przeglądarka Biblioteki Multimediów (PRIORYTET 1)**
- [x] Stworzenie podstawowego layoutu.
- [x] Implementacja TrackList z paginacją, sortowaniem i dynamicznym układem kolumn.
- [x] Implementacja TrackGrid (widok artworków).
- [x] System filtrowania + globalne wyszukiwanie.
- [x] Widok szczegółów utworu (Track Info).
- [x] Integracja startowych modali powiązanych z biblioteką.

## **Faza 2: Import & Scanner**
- [x] Wybór źródła folderów (Drag&Drop + File System Access API).
- [x] Wczytywanie metadanych (jsmediatags).
- [x] Raporty błędów i logowanie skanowania.

## **Faza 3: Smart Tagger AI**
- [x] Analiza metadanych przez LLM (Gemini 3 Pro Thinking).
- [x] Panel Accept/Reject dla sugerowanych metadanych.
- [x] Pełna integracja z widokiem biblioteki.

## **Faza 4: Duplicate Finder**
- [ ] Obsługa trzech metod: hash, tag-based, fingerprint.
- [ ] Interfejs w formie modalnego okna nakładkowego.

## **Faza 5: XML Converter (Rekordbox ↔ VirtualDJ)**
- [ ] Parser i generator plików XML.
- [ ] Zaawansowane mapowanie pól.

## **Faza 6: Player & Waveform**
- [x] Obsługa odtwarzania audio (Web Audio API).
- [x] Waveform preview (Real-time visualizer).
- [ ] Hotcues.
- [ ] Pitch i Key Lock.

## **Faza 7: Playlist Intelligence**
- [ ] Sugestie AI dotyczące kolejności utworów.
- [ ] Wizualizacja energii i BPM.

## **Faza 8: Crate Digger Mode**
- [ ] Wyszukiwanie podobnych utworów.
- [ ] Dopasowania na podstawie analizy akustycznej.

## **Faza 9: Cloud Sync**
- [ ] Synchronizacja, backup, panel historii wersji.

## **Faza 10: Renamer, Export, Mobile Port**
- [x] Narzędzia masowej zmiany nazw.
- [x] Eksport biblioteki (ZIP / Bezpośredni zapis).
- [ ] Port mobilny (Android, Jetpack Compose).

---

# **STATUS AKTUALNY**
Aplikacja działa w modelu Client-Side (Serverless).
- **Frontend:** React + Tailwind + Vite.
- **AI:** Google Gemini API (gemini-3-pro-preview) bezpośrednio z przeglądarki.
- **Baza danych:** LocalStorage + File System Access API (brak backendu SQL).

Zrealizowano kluczowe elementy **Fazy 1 (Biblioteka)** oraz **Fazy 6 (Player)**. Dodano globalny odtwarzacz z wizualizacją neonową. Ulepszono moduł AI (Faza 3) o tryb "Thinking".
