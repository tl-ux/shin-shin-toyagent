import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, Users, Package, CreditCard, BarChart3,
  LayoutDashboard, UserCircle, Settings, ChevronDown, ChevronUp,
  Search, BookOpen, Zap, Mail, Copy, BookmarkCheck
} from 'lucide-react';

const sections = [
  {
    icon: ShoppingCart,
    title: 'הזמנה חדשה',
    color: 'bg-primary/10 text-primary',
    features: [
      { title: 'בחירת לקוח', desc: 'חיפוש וסינון לקוחות לפי שם, עיר או איש קשר.' },
      { title: 'מספר לקוח בהדר', desc: 'הצגת שם הלקוח ומספרו בהדר עמוד ההזמנה לזיהוי מיידי.' },
      { title: 'קטלוג מוצרים', desc: 'עיון במוצרים לפי קטגוריה ומותג, חיפוש וסינון, עם תמונות ומחירים.' },
      { title: 'כפתורי כמות', desc: 'לחיצה על + ו- ישירות על כרטיס המוצר. הקלדת 0 מסירה את המוצר.' },
      { title: 'שמירת טיוטה אוטומטית', desc: 'ההזמנה נשמרת אוטומטית כטיוטה בכל שינוי - גם אחרי יציאה מהדף וריענון.' },
      { title: 'מיון מוצרים', desc: 'מיון הקטלוג לפי מחיר עולה/יורד או לפי פופולריות.' },
      { title: 'מחירים סיטונאים', desc: '50% ממחיר הצרכן לפני מע\"מ, בתוספת עמלת רשת אישית.' },
      { title: 'תבניות הזמנה', desc: 'טעינת הזמנות קבועות שמורות ושמירת הזמנה נוכחית כתבנית.' },
      { title: 'אישור הזמנה', desc: 'שליחת ההזמנה - נוצרת אוטומטית גם רשומת חוב ללקוח.' },
      { title: 'שליחת אישור במייל', desc: 'שליחת מייל HTML מסודר עם פרטי הלקוח והמוצרים כולל מק\"ט.' },
    ],
  },
  {
    icon: BarChart3,
    title: 'הזמנות',
    color: 'bg-success/10 text-success',
    features: [
      { title: 'רשימת הזמנות', desc: 'צפייה בכל ההזמנות עם סינון לפי סטטוס, תאריך וחיפוש חופשי.' },
      { title: 'סינון תאריכים', desc: 'היום / השבוע / החודש / חודש קודם / לא נשלחו.' },
      { title: 'עריכת הזמנה', desc: 'שינוי סטטוס, כמויות, פריטים ולקוח - גם אחרי אישור.' },
      { title: 'הוספת מוצרים לאחר אישור', desc: 'חיפוש מהיר להוספת מוצרים חדשים להזמנה קיימת.' },
      { title: 'שינוי לקוח', desc: 'העברת הזמנה קיימת מלקוח אחד לאחר.' },
      { title: 'טיוטות', desc: 'הזמנות שלא אושרו נשמרות כטיוטה.' },
      { title: 'העתקת הזמנה', desc: 'יצירת הזמנה חדשה זהה בלחיצה אחת.' },
      { title: 'שיתוף הזמנה', desc: 'שליחת פרטי הזמנה במייל HTML מסודר.' },
      { title: 'מחיקת הזמנה', desc: 'מחיקת כל הזמנה בכל סטטוס.' },
    ],
  },
  {
    icon: Users,
    title: 'לקוחות',
    color: 'bg-accent-foreground/10 text-accent-foreground',
    features: [
      { title: 'ניהול לקוחות', desc: 'הוספה, עריכה וחיפוש לקוחות עם פרטי קשר מלאים.' },
      { title: 'לקוח סיטונאי', desc: 'סימון לקוח כסיטונאי - המחיר יחושב כ-50% ממחיר הצרכן לפני מע\"מ.' },
      { title: 'עמלת רשת', desc: 'הגדרת אחוז עמלה אישי ללקוח שיתווסף מעל המחיר הסיטונאי.' },
      { title: 'גישת חנות', desc: 'הזמנת בעל חנות לאפליקציה - יוכל לצפות בהזמנות ובחובות שלו ולבצע הזמנות.' },
    ],
  },
  {
    icon: CreditCard,
    title: 'חובות וגבייה',
    color: 'bg-destructive/10 text-destructive',
    features: [
      { title: 'מעקב חובות', desc: 'רשימת כל החובות הפתוחים עם סינון לפי סטטוס.' },
      { title: 'רישום תשלום', desc: 'רישום תשלום חלקי או מלא לחוב.' },
      { title: 'היסטוריית תשלומים', desc: 'צפייה בכל התשלומים שנרשמו לכל חוב.' },
      { title: 'גיל חוב', desc: 'הצגת מספר ימים מאז יצירת החוב עם קידוד צבעים.' },
      { title: 'ייצוא לאקסל', desc: 'הורדת דוח חובות פתוחים לאקסל.' },
    ],
  },
  {
    icon: Package,
    title: 'מלאי',
    color: 'bg-warning/10 text-warning',
    features: [
      { title: 'ניהול מוצרים', desc: 'הוספה, עריכה וארכיון מוצרים עם תמונה, מחיר, מק\"ט וקטגוריה.' },
      { title: 'קטגוריות מרובות', desc: 'שיוך מוצר למספר קטגוריות בו זמנית - מותג וגיל מומלץ.' },
      { title: 'סוג פריט', desc: 'סימון האם מדובר בפריט בודד או בדיספליי.' },
      { title: 'מעקב מלאי', desc: 'עדכון כמות במלאי והתראה על מלאי נמוך.' },
      { title: 'ייבוא מאקסל', desc: 'ייבוא מוצרים בכמות מקובץ Excel או CSV.' },
    ],
  },
  {
    icon: LayoutDashboard,
    title: 'פאנל ניהול',
    color: 'bg-primary/10 text-primary',
    features: [
      { title: 'מכירות החודש', desc: 'סיכום מכירות החודש הנוכחי.' },
      { title: 'השוואה שנה מול שנה', desc: 'טבלת מכירות חודשית עם השוואה לשנה הקודמת.' },
      { title: 'לקוחות מובילים', desc: 'חמשת הלקוחות עם הרכישות הגבוהות ביותר.' },
      { title: 'התראות מלאי נמוך', desc: 'פריטים עם פחות מ-5 יחידות במלאי.' },
    ],
  },
  {
    icon: UserCircle,
    title: 'ביצועים (סוכן)',
    color: 'bg-success/10 text-success',
    features: [
      { title: 'סיכום אישי', desc: 'סה\"כ מכירות, מספר הזמנות ולקוחות בטווח זמן נבחר.' },
      { title: 'גרף מגמה', desc: 'גרף מכירות חודשי לביצועי הסוכן.' },
      { title: 'דירוג סוכנים', desc: 'השוואת ביצועים מול יתר הסוכנים.' },
    ],
  },
  {
    icon: Settings,
    title: 'הגדרות',
    color: 'bg-muted-foreground/10 text-muted-foreground',
    features: [
      { title: 'הזמנת חנויות', desc: 'שליחת הזמנה לבעל חנות - יקבל גישה לצפייה בהזמנות ובחובות שלו.' },
      { title: 'מייל משרד', desc: 'הגדרת כתובת מייל לקבלת עותק הזמנות.' },
      { title: 'שיעור מע\"מ', desc: 'הגדרת אחוז המע\"מ הנוכחי (ברירת מחדל: 18%).' },
      { title: 'ריווחית', desc: 'חיבור API לריווחית לשליחה אוטומטית של הזמנות.' },
    ],
  },
];

function SectionCard({ section }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 text-right hover:bg-muted/30 transition-colors">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${section.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 text-right">
          <div className="font-semibold text-foreground">{section.title}</div>
          <div className="text-xs text-muted-foreground">{section.features.length} פיצ\'רים</div>
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

export default function Help() {
  const totalFeatures = sections.reduce((s, sec) => s + sec.features.length, 0);
  return (
    <div className="p-4 pb-24 space-y-4 max-w-2xl mx-auto">
      <div className="bg-gradient-to-l from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">מדריך שימוש</h1>
            <p className="text-sm text-muted-foreground">ToyAgent 🧸 - כל הפיצ\'רים במקום אחד</p>
          </div>
        </div>
        <div className="flex gap-4 mt-3 text-sm">
          <div className="bg-white/60 rounded-lg px-3 py-1.5 text-center">
            <div className="font-bold text-primary text-lg">{sections.length}</div>
            <div className="text-xs text-muted-foreground">מודולים</div>
          </div>
          <div className="bg-white/60 rounded-lg px-3 py-1.5 text-center">
            <div className="font-bold text-primary text-lg">{totalFeatures}</div>
            <div className="text-xs text-muted-foreground">פיצ\'רים</div>
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-warning" />
          <span className="font-semibold text-sm">טיפים מהירים</span>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex gap-2"><Search className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /><span>השתמש בחיפוש הגלובלי בסרגל העליון למציאת לקוח, הזמנה או מוצר.</span></div>
          <div className="flex gap-2"><BookmarkCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /><span>שמור תבניות הזמנה ללקוחות שמזמינים תמיד את אותם פריטים.</span></div>
          <div className="flex gap-2"><Mail className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /><span>לאחר אישור הזמנה ניתן לשלוח למשרד מייל מסודר עם כל פרטי ההזמנה.</span></div>
          <div className="flex gap-2"><Copy className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /><span>בדף ההזמנות - לחץ על אייקון ההעתקה כדי לשכפל הזמנה קיימת במהירות.</span></div>
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-muted-foreground px-1">מודולים - לחץ להרחבה</h2>
        {sections.map((s, i) => (<SectionCard key={i} section={s} />))}
      </div>
      <div className="text-center text-xs text-muted-foreground pt-2">
        <Link to="/privacy" className="underline hover:text-foreground transition-colors">מדיניות פרטיות</Link>
        <span className="mx-2">·</span>
        <Link to="/terms" className="underline hover:text-foreground transition-colors">תנאי שימוש</Link>
      </div>
    </div>
  );
}