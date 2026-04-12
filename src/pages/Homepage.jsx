import { Link } from 'react-router-dom';
import { PenLine, BarChart3, Users, CreditCard, BookOpen, HelpCircle, Settings, Contact } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

export default function Homepage() {
  const { user } = useAuth();
  
  const allActions = [
    { to: '/new-order', label: 'הזמנה חדשה', icon: PenLine, color: 'bg-primary', roles: ['admin', 'user', 'store_manager'] },
    { to: '/dashboard', label: 'פאנל ניהול', icon: BarChart3, color: 'bg-blue-500', roles: ['admin', 'user'] },
    { to: '/orders', label: 'הזמנות', icon: PenLine, color: 'bg-purple-500', roles: ['admin', 'user'] },
    { to: '/customers', label: 'לקוחות', icon: Users, color: 'bg-green-500', roles: ['admin', 'user'] },
    { to: '/debts', label: 'חובות', icon: CreditCard, color: 'bg-orange-500', roles: ['admin', 'user'] },
    { to: '/products', label: 'קטלוג', icon: BookOpen, color: 'bg-indigo-500', roles: ['admin', 'user'] },
    { to: '/settings', label: 'הגדרות', icon: Settings, color: 'bg-blue-800', roles: ['admin'] },
    { to: '/crm', label: 'CRM', icon: Contact, color: 'bg-teal-600', roles: ['admin', 'user'] },
    { to: '/help', label: 'עזרה', icon: HelpCircle, color: 'bg-gray-500', roles: ['admin', 'user', 'store_manager'] },
  ];

  const actions = allActions.filter(action => user && action.roles.includes(user.role));

  return (
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
  );
}