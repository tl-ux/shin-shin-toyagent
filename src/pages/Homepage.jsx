import { Link } from 'react-router-dom';
import { PenLine, BarChart3, Users, CreditCard, BookOpen, HelpCircle, Settings, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/supabaseClient';
import { differenceInDays } from 'date-fns';

export default function Homepage() {
  const { user } = useAuth();
  
  const allActions = [
    { to: '/new-order', label: 'הזמנה חדשה', icon: PenLine, color: 'bg-primary', roles: ['admin', 'user', 'store_manager'] },
    { to: '/dashboard', label: 'פאנל ניהול', icon: BarChart3, color: 'bg-blue-500', roles: ['admin', 'user'] },
    { to: '/orders', label: 'הזמנות', icon: PenLine, color: 'bg-purple-500', roles: ['admin', 'user'] },
    { to: '/customers', label: 'לקוחות', icon: Users, color: 'bg-green-500', roles: ['admin', 'user'] },
    { to: '/debts', label: 'חובות', icon: CreditCard, color: 'bg-orange-500', roles: ['admin', 'user'] },
    { to: '/returns', label: 'החזרות', icon: PenLine, color: 'bg-pink-500', roles: ['admin', 'user'] },
    { to: '/products', label: 'קטלוג', icon: BookOpen, color: 'bg-indigo-500', roles: ['admin', 'user'] },
    { to: '/settings', label: 'הגדרות', icon: Settings, color: 'bg-blue-800', roles: ['admin'] },

    { to: '/orders', label: 'ההזמנות שלי', icon: ClipboardList, color: 'bg-purple-500', roles: ['store_manager'] },
    { to: '/debts', label: 'החובות שלי', icon: CreditCard, color: 'bg-orange-500', roles: ['store_manager'] },
    { to: '/help-store', label: 'עזרה', icon: HelpCircle, color: 'bg-gray-500', roles: ['store_manager'] },
    { to: '/help', label: 'עזרה', icon: HelpCircle, color: 'bg-gray-500', roles: ['admin', 'user'] },
  ];

  const actions = allActions.filter(action => user && action.roles.includes(user.role));

  const [upcomingDebts, setUpcomingDebts] = useState([]);

  useEffect(() => {
    base44.entities.Debt.list().then(debts => {
      const today = new Date();
      const upcoming = debts.filter(d => {
        if (!d.collection_date || d.status === 'paid') return false;
        const diff = differenceInDays(new Date(d.collection_date), today);
        return diff >= 0 && diff <= 1;
      });
      setUpcomingDebts(upcoming);
    });
  }, []);

  return (
    <>
    {upcomingDebts.length > 0 && (
      <div className="mx-auto mt-4 mb-2 p-4 bg-destructive/10 border border-destructive/30 rounded-xl max-w-sm text-center">
        <div className="font-semibold text-destructive mb-1">⚠️ תזכורת גבייה</div>
        {upcomingDebts.map(d => (
          <Link key={d.id} to="/debts" className="block text-sm text-destructive">
            {d.customer_name} - ₪{(d.balance_due||0).toLocaleString()} - {d.collection_date ? d.collection_date.split('-').reverse().join('-') : ''}
          </Link>
        ))}
      </div>
    )}
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center py-12">
          <img src="https://media.base44.com/images/public/69cbdbfb3ccb589826de82bf/d6c37f31b_SHIN_SHIN_transparent.png" alt="שין שין לוגו" className="h-24 mb-8 mx-auto" loading="lazy" />
          {user && <p className="text-3xl text-muted-foreground mt-4">שלום, {user.full_name}</p>}
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {actions.map(({ to, label, icon: Icon, color }) => (
            <Link key={to} to={to}>
              <div className="h-full flex flex-col items-center justify-center p-8 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group">
                <div className={`${color} p-5 rounded-full text-white mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8" />
                </div>
                <span className="font-semibold text-center text-lg text-foreground">{label}</span>
              </div>
            </Link>
          ))}
        </div>


      </div>
    </div>
    </>
  );
}