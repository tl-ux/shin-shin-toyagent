import { Link, useLocation, Outlet } from 'react-router-dom';
import { Baby, BookOpen, Users, BarChart3, Settings, CreditCard, LayoutDashboard, UserCircle, ShoppingCart, HelpCircle, Menu, X, ClipboardList, PenLine, TrendingUp, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { base44, supabase } from '@/api/supabaseClient';
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
  const { user } = useAuth();
  
  const navItems = allNavItems.filter(item => user && item.roles.includes(user.role));
  const bottomNavItems = allBottomNavItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">

      {/* Top bar */}
      <header className="bg-white border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Baby className="w-5 h-5" />
          <span className="font-bold text-lg">Shin Shin - ToyAgent</span>
        </Link>

        <div className="flex items-center gap-2">
          <GlobalSearch />
          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="התנתק"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto pb-16 lg:pb-0">
          <Outlet />
        </main>
      </div>


    </div>
  );
}