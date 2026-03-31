import { Link, useLocation, Outlet } from 'react-router-dom';
import { Baby, Package, Users, BarChart3, Menu, X, Settings, CreditCard, LayoutDashboard, UserCircle, ShoppingCart, HelpCircle, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import GlobalSearch from '@/components/GlobalSearch';

const navItems = [
  { path: '/', label: 'הזמנה חדשה', icon: ShoppingCart },
  { path: '/orders', label: 'הזמנות', icon: BarChart3 },
  { path: '/customers', label: 'לקוחות', icon: Users },
  { path: '/debts', label: 'חובות', icon: CreditCard },
  { path: '/products', label: 'מלאי', icon: Package },
  { path: '/settings', label: 'הגדרות', icon: Settings },
  { path: '/dashboard', label: 'דשבורד', icon: LayoutDashboard },
  { path: '/agent-summary', label: 'ביצועים', icon: UserCircle },
  { path: '/help', label: 'עזרה', icon: HelpCircle },
];

const bottomNavMain = navItems.slice(0, 4);
const bottomNavMore = navItems.slice(4);

export default function Layout() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = bottomNavMore.some(i => i.path === location.pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Baby className="w-6 h-6" />
            <span className="font-bold text-lg tracking-tight">ToyAgent 🧸</span>
          </div>
          <div className="flex items-center gap-2">
            <GlobalSearch />
            <button
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors lg:hidden"
              onClick={() => setMoreOpen(!moreOpen)}
            >
              {moreOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === path
                    ? 'bg-white/20 text-white'
                    : 'hover:bg-white/10 text-white/80'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-lg z-40">
        <div className="flex items-center justify-around py-1">
          {bottomNavMain.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1',
                location.pathname === path
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium truncate">{label}</span>
            </Link>
          ))}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1',
              isMoreActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-xs font-medium">עוד</span>
          </button>
        </div>

        {/* More drawer */}
        {moreOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setMoreOpen(false)}
            />
            <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-border shadow-xl z-50 rounded-t-2xl">
              <div className="p-2 grid grid-cols-3 gap-1">
                {bottomNavMore.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 px-2 py-4 rounded-xl transition-colors',
                      location.pathname === path
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium text-center">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </nav>
    </div>
  );
}