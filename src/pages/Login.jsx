// =============================================================
// src/pages/Login.jsx
// דף כניסה חדש — Supabase Auth (Magic Link + Email/Password)
// =============================================================

import { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Baby, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode]         = useState('password'); // 'password' | 'magic'
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const { toast }               = useToast();

  const handlePasswordLogin = async () => {
    if (!email || !password) {
      toast({ description: 'נא למלא אימייל וסיסמה', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ description: 'אימייל או סיסמה שגויים', variant: 'destructive' });
    }
    // On success, AuthContext listener handles redirect
    setLoading(false);
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast({ description: 'נא להזין אימייל', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      toast({ description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Baby className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">Shin Shin</span>
          </div>
          <p className="text-muted-foreground text-sm">ToyAgent — כניסה למערכת</p>
        </div>

        {sent ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
            <div className="text-4xl">📬</div>
            <p className="font-medium">בדוק את תיבת המייל שלך</p>
            <p className="text-sm text-muted-foreground">
              שלחנו קישור כניסה לכתובת <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">

            <div className="space-y-2">
              <Label>אימייל</Label>
              <Input
                dir="ltr"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && mode === 'password' && handlePasswordLogin()}
              />
            </div>

            {mode === 'password' && (
              <div className="space-y-2">
                <Label>סיסמה</Label>
                <Input
                  dir="ltr"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                />
              </div>
            )}

            {mode === 'password' ? (
              <Button className="w-full" onClick={handlePasswordLogin} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                כניסה
              </Button>
            ) : (
              <Button className="w-full" onClick={handleMagicLink} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                שלח קישור כניסה
              </Button>
            )}

            <button
              className="text-xs text-muted-foreground hover:text-foreground w-full text-center underline"
              onClick={() => setMode(m => m === 'password' ? 'magic' : 'password')}
            >
              {mode === 'password' ? 'כניסה ללא סיסמה (קישור למייל)' : 'כניסה עם סיסמה'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
