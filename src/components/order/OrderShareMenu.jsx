import { useState } from 'react';
import { Mail, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

function buildOrderText(order) {
  const lines = [
    `הזמנה חדשה - ${order.order_number || ''}`,
    `לקוח: ${order.customer_name}`,
    `סוכן: ${order.agent_name || ''}`,
    `תאריך: ${order.visit_date || ''}`,
    ``,
    `פריטים:`,
    ...(order.items || []).map(i => `• ${i.product_name} × ${i.quantity} = ₪${(i.total || 0).toLocaleString()}`),
    ``,
    `סה"כ: ₪${(order.total_amount || 0).toLocaleString()}`,
    order.notes ? `הערות: ${order.notes}` : '',
  ].filter(l => l !== undefined);
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
    await base44.functions.invoke('sendOrderEmail', { order, toEmail: officeEmail });
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
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleWhatsApp} className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50">
        <MessageCircle className="w-4 h-4" />
        וואטסאפ
      </Button>
      <Button variant="outline" size="sm" onClick={handleEmail} disabled={sendingEmail} className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50">
        {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        מייל
      </Button>
    </div>
  );
}