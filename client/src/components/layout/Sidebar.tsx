import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Database, Radar, Send, BarChart3,
  Clock, Settings2, Zap,
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

export function Sidebar() {
  return (
    <aside className="w-[200px] min-h-screen bg-card border-r border-border flex flex-col flex-shrink-0 sticky top-0 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <Zap size={18} className="text-accent" />
        <span className="font-display font-extrabold text-lg tracking-widest text-text uppercase">
          Sentinel
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
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
  );
}
