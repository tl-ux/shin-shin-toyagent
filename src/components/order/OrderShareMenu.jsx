import { useState } from 'react';
import { Share2, Mail, MessageCircle, FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';

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

function generatePDF(order) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  doc.setFont('helvetica');

  // Header
  doc.setFontSize(18);
  doc.setTextColor(26, 86, 168);
  doc.text(`Order: ${order.order_number || ''}`, 105, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Customer: ${order.customer_name}`, 14, 35);
  doc.text(`Agent: ${order.agent_name || ''}`, 14, 42);
  doc.text(`Date: ${order.visit_date || ''}`, 14, 49);
  if (order.notes) doc.text(`Notes: ${order.notes}`, 14, 56);

  // Table header
  let y = order.notes ? 66 : 60;
  doc.setFillColor(240, 244, 255);
  doc.rect(14, y - 5, 182, 8, 'F');
  doc.setFontSize(10);
  doc.setTextColor(26, 86, 168);
  doc.text('Item', 16, y);
  doc.text('Qty', 120, y);
  doc.text('Unit Price', 140, y);
  doc.text('Total', 170, y);

  y += 6;
  doc.setTextColor(40, 40, 40);
  (order.items || []).forEach((item, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4, 182, 7, 'F');
    }
    doc.text(item.product_name.substring(0, 40), 16, y);
    doc.text(String(item.quantity), 122, y);
    doc.text(`${(item.unit_price || 0).toLocaleString()}`, 142, y);
    doc.text(`${(item.total || 0).toLocaleString()}`, 172, y);
    y += 8;
  });

  // Total
  y += 4;
  doc.setFontSize(13);
  doc.setTextColor(26, 86, 168);
  doc.text(`Total: ${(order.total_amount || 0).toLocaleString()} ILS`, 196, y, { align: 'right' });

  return doc;
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

  const handlePDF = async () => {
    const doc = generatePDF(order);
    doc.save(`order-${order.order_number || order.id}.pdf`);
    // Mark as sent via PDF
    const sent_via = [...(order.sent_via || [])];
    if (!sent_via.includes('pdf')) {
      sent_via.push('pdf');
      await base44.entities.Order.update(order.id, { sent_via });
    }
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
      <Button variant="outline" size="sm" onClick={handlePDF} className="gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50">
        <FileDown className="w-4 h-4" />
        PDF
      </Button>
    </div>
  );
}