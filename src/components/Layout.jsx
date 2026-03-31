import { Link, useLocation, Outlet } from 'react-router-dom';
import { Baby, Package, Users, BarChart3, Settings, CreditCard, LayoutDashboard, UserCircle, ShoppingCart, HelpCircle, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import GlobalSearch from '@/components/GlobalSearch';

const navItems = [
  { path: '/', label: 'הזמנה חדשה', icon: ShoppingCart },
  { path: '/orders', label: 'הזמנות', icon: BarChart3 },
  { path: '/customers', label: 'לקוחות', icon: Users },
  { path: '/debts', label: 'חובות', icon: CreditCard },
  { path: '/products', label: 'מלאי', icon: Package },
  { path: '/dashboard', label: 'דשבורד', icon: LayoutDashboard },
  { path: '/agent-summary', label: 'ביצועים', icon: UserCircle },
  { path: '/settings', label: 'הגדרות', icon: Settings },
  { path: '/help', label: 'עזרה', icon: HelpCircle },
];

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-row-reverse">

      {/* Sidebar */}
      <>
        {/* Overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar panel */}
        <aside
          className={cn(
            'fixed top-0 right-0 h-full w-60 bg-primary text-primary-foreground z-50 flex flex-col shadow-2xl transition-transform duration-300',
            'md:static md:translate-x-0 md:flex md:shrink-0',
            sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
          )}
        >
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-white/20">
            <div className="flex items-center gap-2">
              <Baby className="w-6 h-6" />
              <span className="font-bold text-lg tracking-tight">ToyAgent 🧸</span>
            </div>
            <button
              className="md:hidden p-1 rounded hover:bg-white/10"
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
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
        </aside>
      </>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile only — just hamburger + search) */}
        <header className="md:hidden bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow">
          <div className="flex items-center gap-2">
            <Baby className="w-5 h-5" />
            <span className="font-bold">ToyAgent 🧸</span>
          </div>
          <div className="flex items-center gap-2">
            <GlobalSearch />
            <button
              className="p-1.5 rounded-lg hover:bg-white/10"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Desktop top bar (search only) */}
        <header className="hidden md:flex bg-white border-b border-border px-6 py-3 items-center justify-between sticky top-0 z-30 shadow-sm">
          <span className="text-sm text-muted-foreground font-medium">
            {navItems.find(n => n.path === location.pathname)?.label || ''}
          </span>
          <GlobalSearch />
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}