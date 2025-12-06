
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
          variantClasses = "bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-500";
          break;
      case 'secondary':
          variantClasses = "bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600";
          break;
      case 'danger':
          variantClasses = "bg-red-900/20 border border-red-500/50 text-red-400 hover:bg-red-500/20";
          break;
      case 'outline':
          variantClasses = "bg-transparent border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10";
          break;
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title}
      className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses}`}
    >
      {isLoading ? (
          <>
            <span className="btn-spinner !mr-1 h-3 w-3 border-current"></span>
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
  onAnalyze,
  onAnalyzeAll,
  onDownloadOrSave,
  onEdit,
  onDelete,
  isDirectAccessMode,
  directoryName,
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
    <div className="flex items-center justify-between px-2 py-3 bg-lumbago-dark/30 backdrop-blur-sm border-b border-white/5 sticky top-0 z-40">
        
        {/* Lewa strona: Tytuł sekcji + Folder Info */}
        <div className="flex items-center gap-3">
             <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-bold text-white">Biblioteka</h2>
                <span className="text-slate-500 text-xs font-mono">({totalCount})</span>
             </div>
             {isDirectAccessMode && (
                <div className="hidden sm:flex items-center text-[10px] text-lumbago-primary/80 bg-lumbago-primary/10 px-2 py-0.5 rounded border border-lumbago-primary/20" title={directoryName}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2 2v1h12V8H4z" clipRule="evenodd" /></svg>
                    <span className="truncate max-w-[150px]">{directoryName}</span>
                </div>
            )}
        </div>

        {/* Środek: Wyszukiwarka */}
        <div className="flex-1 max-w-sm mx-4">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-500 group-focus-within:text-lumbago-primary transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Szukaj..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="block w-full pl-9 pr-3 py-1.5 border border-slate-700 rounded-md leading-5 bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:border-lumbago-primary focus:ring-1 focus:ring-lumbago-primary text-xs transition-all"
                />
            </div>
        </div>

        {/* Prawa strona: Akcje */}
        <div className="flex items-center gap-2">
            
            {/* Przyciski Akcji Masowych */}
            {hasSelection ? (
                <div className="flex items-center gap-1.5 animate-fade-in bg-slate-800/80 px-2 py-1 rounded border border-white/10">
                    <span className="text-[10px] font-bold text-white mr-1">{selectedCount}</span>
                    
                    <ActionButton
                        onClick={onAnalyze}
                        disabled={isAnyLoading}
                        isLoading={isAnalyzing}
                        title="Analizuj wybrane"
                        variant="primary"
                    >
                        AI
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

                    <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded" title="Edytuj">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                    
                    <button onClick={onDelete} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded" title="Usuń">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            ) : (
                 <ActionButton
                    onClick={onAnalyzeAll}
                    disabled={isAnyLoading || totalCount === 0}
                    title="Analizuj wszystkie"
                    variant="outline"
                >
                    Analizuj Wszystko
                </ActionButton>
            )}

            <div className="h-6 w-px bg-slate-700 mx-1"></div>

            {/* Widok i Filtry */}
            <div className="flex bg-slate-900 border border-slate-700 rounded p-0.5">
                <button
                    onClick={() => onViewModeChange('list')}
                    className={`p-1 rounded transition-all ${viewMode === 'list' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-white'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <button
                    onClick={() => onViewModeChange('grid')}
                    className={`p-1 rounded transition-all ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-white'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
            </div>

            <button
                onClick={onToggleFilters}
                className={`p-1.5 rounded border transition-all ${showFilters ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}
                title="Filtry"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
            </button>
        </div>
    </div>
  );
};

export default HeaderToolbar;
