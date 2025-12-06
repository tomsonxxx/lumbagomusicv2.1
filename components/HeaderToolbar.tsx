
import React from 'react';

interface HeaderToolbarProps {
  totalCount: number;
  selectedCount: number;
  isAnalyzing: boolean;
  isSaving: boolean;
  allSelected: boolean;
  onToggleSelectAll: () => void;
  onAnalyze: () => void;
  onAnalyzeAll: () => void;
  onDownloadOrSave: () => void;
  onEdit: () => void;
  onRename: () => void;
  onExportCsv: () => void;
  onDelete: () => void;
  onClearAll: () => void;
  isDirectAccessMode: boolean;
  directoryName?: string;
  isRestored?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onToggleFilters: () => void;
  showFilters: boolean;
}

const ActionButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  isLoading?: boolean;
  loadingText?: string;
  title: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}> = ({ onClick, disabled, isLoading = false, loadingText = "...", title, children, variant = 'primary' }) => {
  
  let variantClasses = "";
  switch(variant) {
      case 'primary':
          variantClasses = "bg-gradient-to-r from-lumbago-primary to-[#4fd1ff] text-lumbago-dark hover:shadow-[0_0_15px_rgba(142,240,255,0.4)] border-none";
          break;
      case 'secondary':
          variantClasses = "bg-gradient-to-r from-lumbago-secondary to-[#ff8cd9] text-lumbago-dark hover:shadow-[0_0_15px_rgba(255,102,204,0.4)] border-none";
          break;
      case 'danger':
          variantClasses = "bg-transparent border border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500";
          break;
      case 'outline':
          variantClasses = "bg-transparent border border-lumbago-primary/30 text-lumbago-primary hover:bg-lumbago-primary/10 hover:border-lumbago-primary";
          break;
  }

  const disabledClasses = "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-none";
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title}
      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md flex items-center justify-center transition-all duration-200 transform active:scale-95 ${variantClasses} ${disabledClasses}`}
    >
      {isLoading ? (
          <>
            <span className="btn-spinner !mr-2 h-3 w-3 border-current"></span>
            <span>{loadingText}</span>
          </>
      ) : (
        children
      )}
    </button>
  );
};

const HeaderToolbar: React.FC<HeaderToolbarProps> = ({
  totalCount,
  selectedCount,
  isAnalyzing,
  isSaving,
  allSelected,
  onToggleSelectAll,
  onAnalyze,
  onAnalyzeAll,
  onDownloadOrSave,
  onEdit,
  onRename,
  onExportCsv,
  onDelete,
  onClearAll,
  isDirectAccessMode,
  directoryName,
  isRestored = false,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onToggleFilters,
  showFilters
}) => {
  const hasSelection = selectedCount > 0;
  const isAnyLoading = isAnalyzing || isSaving;

  return (
    <div className="flex items-center justify-between h-full px-6">
        
        {/* Lewa strona: Tytuł sekcji + Folder Info */}
        <div className="flex flex-col justify-center">
             <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white neon-text">Biblioteka</h2>
                <span className="bg-lumbago-light border border-lumbago-border text-lumbago-primary text-xs font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(142,240,255,0.1)]">
                    {totalCount} UTWORÓW
                </span>
             </div>
             {isDirectAccessMode && (
                <div className="flex items-center text-[10px] text-lumbago-text-dim mt-0.5" title={`Pracujesz w folderze: ${directoryName}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-lumbago-accent" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2 2v1h12V8H4z" clipRule="evenodd" /></svg>
                    <span className="truncate max-w-[200px] font-mono text-lumbago-accent">{directoryName}</span>
                </div>
            )}
        </div>

        {/* Środek: Wyszukiwarka */}
        <div className="flex-1 max-w-xl mx-8">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-500 group-focus-within:text-lumbago-primary transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Szukaj wykonawcy, tytułu, albumu..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-full leading-5 bg-lumbago-dark/50 text-white placeholder-slate-500 focus:outline-none focus:border-lumbago-primary focus:ring-1 focus:ring-lumbago-primary sm:text-sm transition-all shadow-inner"
                />
            </div>
        </div>

        {/* Prawa strona: Akcje */}
        <div className="flex items-center gap-3">
            
            {/* Przyciski Akcji Masowych (widoczne gdy wybrano) */}
            {hasSelection && (
                <div className="flex items-center gap-2 mr-4 animate-fade-in bg-lumbago-light/50 px-3 py-1.5 rounded-lg border border-white/5">
                    <span className="text-xs font-bold text-white mr-2">{selectedCount} WYBRANO</span>
                    
                    <ActionButton
                        onClick={onAnalyze}
                        disabled={isAnyLoading}
                        isLoading={isAnalyzing}
                        title="Analizuj wybrane"
                        variant="primary"
                    >
                        Analizuj AI
                    </ActionButton>
                    
                    <ActionButton
                        onClick={onDownloadOrSave}
                        disabled={isAnyLoading}
                        isLoading={isSaving}
                        title="Zapisz/Pobierz"
                        variant="secondary"
                    >
                        {isDirectAccessMode ? "Zapisz" : "Pobierz"}
                    </ActionButton>

                    <button onClick={onEdit} className="p-2 text-lumbago-primary hover:bg-lumbago-primary/20 rounded-md" title="Edytuj">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                    
                    <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-500/20 rounded-md" title="Usuń">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            )}

            {!hasSelection && (
                 <ActionButton
                    onClick={onAnalyzeAll}
                    disabled={isAnyLoading || totalCount === 0}
                    title="Analizuj wszystkie"
                    variant="outline"
                >
                    Analizuj Wszystko
                </ActionButton>
            )}

            <div className="h-8 w-px bg-slate-700 mx-1"></div>

            {/* Widok i Filtry */}
            <div className="flex bg-lumbago-dark border border-slate-700 rounded-lg p-1">
                <button
                    onClick={() => onViewModeChange('list')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-white'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <button
                    onClick={() => onViewModeChange('grid')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-white'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
            </div>

            <button
                onClick={onToggleFilters}
                className={`p-2 rounded-lg border transition-all ${showFilters ? 'bg-lumbago-primary/20 border-lumbago-primary text-lumbago-primary' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}
                title="Filtry"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
            </button>
        </div>
    </div>
  );
};

export default HeaderToolbar;
