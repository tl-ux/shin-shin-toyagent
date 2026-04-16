import { useState } from 'react';
import { ShoppingCart, ClipboardList, CreditCard, ChevronDown, ChevronUp, BookOpen, Zap } from 'lucide-react';

const sections = [
  {
    icon: ShoppingCart,
    title: 'הזמנה חדשה',
    color: 'bg-primary/10 text-primary',
    features: [
      { title: 'בחירת לקוח', desc: 'לחץ על שמך ברשימה כדי להתחיל הזמנה.' },
      { title: 'קטלוג מוצרים', desc: 'עיין במוצרים, סנן לפי קטגוריה וחפש לפי שם.' },
      { title: 'הוספת מוצר', desc: 'לחץ על מוצר, הזן כמות ולחץ הוסף. לשינוי כמות השתמש בכפתורי + ו-.' },
      { title: 'הסרת מוצר', desc: 'לחץ על - עד שהכמות מגיעה ל-0, או הקלד 0 בחלון הכמות.' },
      { title: 'שמירה אוטומטית', desc: 'ההזמנה נשמרת אוטומטית. אפשר לצאת ולחזור - ההזמנה תמיד תחכה לך.' },
      { title: 'אישור הזמנה', desc: 'בדף העגלה לחץ "אשר הזמנה" לשליחה.' },
    ],
  },
  {
    icon: ClipboardList,
    title: 'ההזמנות שלי',
    color: 'bg-purple-500/10 text-purple-600',
    features: [
      { title: 'צפייה בהזמנות', desc: 'רשימת כל ההזמנות שלך עם סטטוס, תאריך וסכום.' },
      { title: 'סטטוס הזמנה', desc: 'טיוטה - בתהליך, מאושר - נשלחה, נמסר - התקבלה, בוטל - בוטלה.' },
      { title: 'עריכת הזמנה', desc: 'לחץ על עיפרון ✏️ לעריכה - ניתן לשנות כמויות ולהוסיף מוצרים גם אחרי אישור.' },
    ],
  },
  {
    icon: CreditCard,
    title: 'החובות שלי',
    color: 'bg-orange-500/10 text-orange-600',
    features: [
      { title: 'יתרת חוב', desc: 'צפייה בחובות פתוחים ויתרה לתשלום.' },
      { title: 'היסטוריה', desc: 'צפייה בכל התשלומים שבוצעו.' },
      { title: 'סטטוס', desc: 'פתוח, שולם חלקית, שולם במלואו, באיחור.' },
    ],
  },
];

function SectionCard({ section }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 text-right hover:bg-muted/30 transition-colors">
        <div className={\`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 \${section.color}\`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 text-right">
          <div className="font-semibold text-foreground">{section.title}</div>
          <div className="text-xs text-muted-foreground">{section.features.length} נושאים</div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3 space-y-2 bg-muted/20">
          {section.features.map((f, i) => (
            <div key={i} className="flex gap-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div>
                <span className="font-medium text-sm text-foreground">{f.title} - </span>
                <span className="text-sm text-muted-foreground">{f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HelpStore() {
  return (
    <div className="p-4 pb-24 space-y-4 max-w-2xl mx-auto">
      <div className="bg-gradient-to-l from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">מדריך לבעל חנות</h1>
            <p className="text-sm text-muted-foreground">ToyAgent 🧸 - איך מבצעים הזמנה</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-warning" />
          <span className="font-semibold text-sm">טיפים מהירים</span>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <span className="text-primary flex-shrink-0">🛒</span>
            <span>לחץ "הזמנה חדשה" בדף הבית כדי להתחיל הזמנה.</span>
          </div>
          <div className="flex gap-2">
            <span className="text-primary flex-shrink-0">💾</span>
            <span>ההזמנה נשמרת אוטומטית - אפשר לצאת ולחזור בכל עת.</span>
          </div>
          <div className="flex gap-2">
            <span className="text-primary flex-shrink-0">✏️</span>
            <span>ניתן לערוך הזמנה גם אחרי שאושרה - לחץ על העיפרון.</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-muted-foreground px-1">נושאים - לחץ להרחבה</h2>
        {sections.map((s, i) => (<SectionCard key={i} section={s} />))}
      </div>
    </div>
  );
}