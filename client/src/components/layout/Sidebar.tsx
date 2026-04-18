import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Database, Radar, Send, BarChart3,
  Clock, Settings2, Zap, X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/leads',      icon: Database,         label: 'Leads'      },
  { to: '/scrape',     icon: Radar,            label: 'Scraping'   },
  { to: '/send',       icon: Send,             label: 'Disparar'   },
  { to: '/analytics',  icon: BarChart3,        label: 'Analytics'  },
  { to: '/history',    icon: Clock,            label: 'Histórico'  },
  { to: '/automation', icon: Settings2,        label: 'Automação'  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[200px] bg-card border-r border-border flex flex-col transition-transform duration-200',
          'md:static md:translate-x-0 md:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Zap size={18} className="text-accent" />
            <span className="font-display font-extrabold text-lg tracking-widest text-text uppercase">
              Sentinel
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-dim hover:text-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 w-full px-3 py-2.5 rounded text-sm font-medium transition-colors mb-0.5',
                  isActive
                    ? 'bg-elevated text-accent border-l-accent border-l-2 pl-[10px]'
                    : 'text-muted hover:bg-elevated hover:text-text'
                )
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border">
          <p className="text-dim text-xs font-mono">v2.0.0</p>
        </div>
      </aside>
    </>
  );
}
