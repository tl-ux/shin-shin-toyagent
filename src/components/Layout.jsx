import { Link, useLocation, Outlet } from 'react-router-dom';
import { Baby, BookOpen, Users, BarChart3, Settings, CreditCard, LayoutDashboard, UserCircle, ShoppingCart, HelpCircle, Menu, X, ClipboardList, PenLine, TrendingUp, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import GlobalSearch from '@/components/GlobalSearch';

const navItems = [
  { path: '/', label: 'הזמנה חדשה', icon: PenLine },
  { path: '/dashboard', label: 'פאנל ניהול', icon: LayoutDashboard },
  { path: '/help', label: 'עזרה', icon: HelpCircle },
];

const bottomNavItems = [
  { path: '/', label: 'הזמנה', icon: PenLine },
  { path: '/orders', label: 'הזמנות', icon: ClipboardList },
  { path: '/customers', label: 'לקוחות', icon: Users },
  { path: '/debts', label: 'חובות', icon: CreditCard },
  { path: '/products', label: 'קטלוג', icon: BookOpen },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">

      {/* Top bar */}
      <header className="bg-white border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Baby className="w-5 h-5" />
          <span className="font-bold text-lg">ToyAgent 🧸</span>
        </Link>

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

        <main className="flex-1 overflow-auto pb-16 lg:pb-0">
          <Outlet />
        </main>
      </div>


    </div>
  );
}