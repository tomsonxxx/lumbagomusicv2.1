
import React from 'react';

interface LayoutProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  content: React.ReactNode;
  player: React.ReactNode;
  activeView: string;
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
    sidebar, header, content, player, activeView,
    isSidebarCollapsed, isMobileMenuOpen, onCloseMobileMenu 
}) => {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-lumbago-dark via-lumbago-medium to-lumbago-light text-lumbago-text font-sans selection:bg-lumbago-primary selection:text-lumbago-dark">
      
      {/* MOBILE DRAWER SIDEBAR */}
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/80 z-[60] transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onCloseMobileMenu}
      />
      {/* Drawer */}
      <aside 
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 z-[70] transform transition-transform duration-300 ease-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
          {sidebar}
      </aside>

      {/* DESKTOP SIDEBAR */}
      <aside 
        className={`hidden md:flex flex-col z-30 glass-panel border-r-0 border-r-lumbago-border transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}
      >
        {sidebar}
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative transition-all duration-300">
        
        {/* Header - Sticky Top */}
        <header className="h-14 md:h-16 z-20 flex-shrink-0 glass-panel border-b-0 border-b-lumbago-border sticky top-0">
          {header}
        </header>

        {/* Content - Scrollable */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4 relative pb-32">
           <div className="w-full max-w-[1920px] mx-auto">
              {content}
           </div>
        </main>

        {/* Player Dock - Fixed Bottom */}
        <footer className="h-24 z-40 fixed bottom-0 left-0 right-0 glass-panel border-t border-t-lumbago-border shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
           {player}
        </footer>
      </div>
    </div>
  );
};

export default Layout;
