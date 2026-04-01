import { Link, useLocation, Outlet } from 'react-router-dom';
import { Baby, BookOpen, Users, BarChart3, Settings, CreditCard, LayoutDashboard, UserCircle, ShoppingCart, HelpCircle, Menu, X, ClipboardList, PenLine, TrendingUp, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import GlobalSearch from '@/components/GlobalSearch';

const navItems = [
  { path: '/', label: 'הזמנה חדשה', icon: PenLine },
  { path: '/dashboard', label: 'ניהול', icon: LayoutDashboard },
  { path: '/help', label: 'עזרה', icon: HelpCircle },
];

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">

      {/* Overlay (mobile only) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 right-0 h-full w-64 bg-primary text-primary-foreground z-50 flex flex-col shadow-2xl transition-all duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/20">
          <button onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Baby className="w-6 h-6" />
            <span className="font-bold text-2xl tracking-tight">ToyAgent 🧸</span>
          </button>
          <button
            className="lg:hidden p-1 rounded hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
               'flex items-center gap-3 px-3 py-3 rounded-xl text-lg font-medium transition-colors',
                location.pathname === path
                  ? 'bg-white/20 text-white'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4">
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-lg font-medium transition-colors w-full text-white/75 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            התנתק
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow lg:bg-white lg:text-foreground lg:border-b lg:border-border lg:shadow-sm">
          <div className="flex items-center gap-2">
            <button
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/10"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex lg:hidden items-center gap-2">
              <Baby className="w-5 h-5" />
              <span className="font-bold text-lg">ToyAgent 🧸</span>
            </div>
          </div>
          <span className="hidden lg:block text-sm text-muted-foreground font-medium">
            {navItems.find(n => n.path === location.pathname)?.label || ''}
          </span>
          <div className="flex items-center gap-2">
            <GlobalSearch />
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}