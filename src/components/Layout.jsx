import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Baby, BookOpen, Users, BarChart3, Settings, CreditCard, LayoutDashboard, UserCircle, ShoppingCart, HelpCircle, Menu, X, ClipboardList, PenLine, TrendingUp, LogOut, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import GlobalSearch from '@/components/GlobalSearch';
import { useAuth } from '@/lib/AuthContext';

const allNavItems = [
  { path: '/', label: 'הזמנה חדשה', icon: PenLine, roles: ['admin', 'user', 'store_manager'] },
  { path: '/dashboard', label: 'פאנל ניהול', icon: LayoutDashboard, roles: ['admin', 'user'] },
  { path: '/help', label: 'עזרה', icon: HelpCircle, roles: ['admin', 'user', 'store_manager'] },
];

const allBottomNavItems = [
  { path: '/', label: 'הזמנה', icon: PenLine, roles: ['admin', 'user', 'store_manager'] },
  { path: '/orders', label: 'הזמנות', icon: ClipboardList, roles: ['admin', 'user'] },
  { path: '/customers', label: 'לקוחות', icon: Users, roles: ['admin', 'user'] },
  { path: '/debts', label: 'חובות', icon: CreditCard, roles: ['admin', 'user'] },
  { path: '/products', label: 'קטלוג', icon: BookOpen, roles: ['admin', 'user'] },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isSubPage = !['/','/new-order'].includes(location.pathname) && !location.pathname.startsWith('/new-order');
  const isHomePage = location.pathname === '/';
  
  const navItems = allNavItems.filter(item => user && item.roles.includes(user.role));
  const bottomNavItems = allBottomNavItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">

      {/* Top bar */}
      <header
        className="bg-white border-b border-border px-4 flex items-center justify-between sticky top-0 z-30 shadow-sm"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
      >
        <div className="flex items-center gap-2">
          {isSubPage && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              aria-label="חזרה"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Baby className="w-5 h-5" />
            <span className="font-bold text-lg">Shin Shin - ToyAgent</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <GlobalSearch />
          <button
            onClick={() => base44.auth.logout()}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="התנתק"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border flex lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {bottomNavItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}