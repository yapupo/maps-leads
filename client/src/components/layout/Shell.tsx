import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const TITLES: Record<string, string> = {
  '/':           'Dashboard',
  '/leads':      'Leads',
  '/scrape':     'Scraping',
  '/send':       'Disparar',
  '/analytics':  'Analytics',
  '/history':    'Histórico',
  '/automation': 'Automação',
};

export function Shell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'Sentinel';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-base overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 noise-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
