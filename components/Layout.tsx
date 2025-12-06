
import React from 'react';

interface LayoutProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  content: React.ReactNode;
  player: React.ReactNode;
  activeView: string;
}

const Layout: React.FC<LayoutProps> = ({ sidebar, header, content, player, activeView }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-lumbago-dark via-lumbago-medium to-lumbago-light text-lumbago-text font-sans selection:bg-lumbago-primary selection:text-lumbago-dark">
      
      {/* Sidebar - Fixed Left */}
      <aside className="w-64 flex-shrink-0 z-30 glass-panel border-r-0 border-r-lumbago-border transition-all duration-300 hidden md:flex flex-col">
        {sidebar}
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Header - Sticky Top */}
        <header className="h-16 z-20 flex-shrink-0 glass-panel border-b-0 border-b-lumbago-border sticky top-0">
          {header}
        </header>

        {/* Content - Scrollable */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 relative pb-32">
           <div className="max-w-[1920px] mx-auto">
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
