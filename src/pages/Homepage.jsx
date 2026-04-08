import { Link } from 'react-router-dom';
import { PenLine, BarChart3, Users, CreditCard, BookOpen, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Homepage() {
  const actions = [
    { to: '/new-order', label: 'הזמנה חדשה', icon: PenLine, color: 'bg-primary' },
    { to: '/dashboard', label: 'פאנל ניהול', icon: BarChart3, color: 'bg-blue-500' },
    { to: '/orders', label: 'הזמנות', icon: PenLine, color: 'bg-purple-500' },
    { to: '/customers', label: 'לקוחות', icon: Users, color: 'bg-green-500' },
    { to: '/debts', label: 'חובות', icon: CreditCard, color: 'bg-orange-500' },
    { to: '/products', label: 'קטלוג', icon: BookOpen, color: 'bg-indigo-500' },
    { to: '/help', label: 'עזרה', icon: HelpCircle, color: 'bg-gray-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">ToyAgent 🧸</h1>
          <p className="text-lg text-muted-foreground">ביוטה לניהול הזמנות ולקוחות</p>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {actions.map(({ to, label, icon: Icon, color }) => (
            <Link key={to} to={to}>
              <div className="h-full flex flex-col items-center justify-center p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group">
                <div className={`${color} p-4 rounded-full text-white mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-semibold text-center text-sm text-foreground">{label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Start Section */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-3">התחל עכשיו</h2>
            <p className="text-muted-foreground mb-6">בחר פעולה מעל כדי להתחיל לעבוד</p>
            <Link to="/new-order">
              <Button size="lg" className="gap-2">
                <PenLine className="w-5 h-5" />
                התחל הזמנה חדשה
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}