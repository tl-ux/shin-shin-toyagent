import { useState } from 'react';
import { Mail, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44, supabase } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

function buildOrderText(order) {
  const items = order.items || [];

  const rows = items.map((i, idx) =>
    `${idx + 1}. ${i.product_name || ''} — ${i.quantity} יח' — ₪${(i.total || 0).toLocaleString()}`
  );

  const lines = [
    `🧸 *הזמנה ${order.order_number || ''}*`,
    `👤 לקוח: ${order.customer_name}`,
    `🙋 סוכן: ${order.agent_name || ''}`,
    `📅 תאריך: ${order.visit_date || ''}`,
    ``,
    `*פריטים:*`,
    `─────────────────────`,
    ...rows,
    `─────────────────────`,
    `💰 *סה"כ: ₪${(order.total_amount || 0).toLocaleString()}*`,
    order.notes ? `📝 הערות: ${order.notes}` : '',
  ].filter(l => l !== undefined && l !== '');
  return lines.join('\n');
}



export default function OrderShareMenu({ order, officeEmail, officeWhatsapp }) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const { toast } = useToast();

  const handleWhatsApp = async () => {
    const text = encodeURIComponent(buildOrderText(order));
    const phone = officeWhatsapp ? officeWhatsapp.replace(/\D/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    // Mark as sent via WhatsApp
    const sent_via = [...(order.sent_via || [])];
    if (!sent_via.includes('whatsapp')) {
      sent_via.push('whatsapp');
      await base44.entities.Order.update(order.id, { sent_via });
    }
  };

  const handleEmail = async () => {
    if (!officeEmail) {
      toast({ description: 'יש להגדיר מייל משרד בהגדרות', variant: 'destructive' });
      return;
    }
    setSendingEmail(true);
    await supabase.functions.invoke('sendOrderEmail', { body: { order, toEmail: officeEmail } });
    setSendingEmail(false);
    // Mark as sent via email
    const sent_via = [...(order.sent_via || [])];
    if (!sent_via.includes('email')) {
      sent_via.push('email');
      await base44.entities.Order.update(order.id, { sent_via });
    }
    toast({ description: 'המייל נשלח בהצלחה!' });
  };



  return (
    <div className="flex justify-center">

      <Button variant="outline" onClick={handleEmail} disabled={sendingEmail} className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 px-6 py-2">
        {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        שליחה במייל
      </Button>
    </div>
  );
}