export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto p-6 pb-24 space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold text-foreground">מדיניות פרטיות</h1>
      <p className="text-sm text-muted-foreground">עדכון אחרון: אפריל 2026</p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1. כללי</h2>
        <p className="text-muted-foreground leading-relaxed">
          אפליקציית ToyAgent (להלן "האפליקציה") מופעלת על ידי שין שין. אנו מכבדים את פרטיות המשתמשים ומחויבים להגן על המידע האישי שנמסר לנו.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2. מידע שנאסף</h2>
        <p className="text-muted-foreground leading-relaxed">
          האפליקציה אוספת מידע הנדרש לניהול הזמנות ולקוחות, לרבות:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1 mr-4">
          <li>שם, כתובת אימייל ומספר טלפון של משתמשים ולקוחות</li>
          <li>פרטי הזמנות ומוצרים</li>
          <li>מידע עסקי כגון כתובת, מספר ח.פ/ע.מ.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">3. שימוש במידע</h2>
        <p className="text-muted-foreground leading-relaxed">
          המידע נאסף לצורך ניהול הזמנות, שליחת עדכונים ללקוחות, ועיבוד מסמכים חשבונאיים דרך מערכת ריווחית. לא נמכור, נשכיר או נשתף את המידע עם צדדים שלישיים, למעט ספקי שירות הכרחיים.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">4. אבטחת מידע</h2>
        <p className="text-muted-foreground leading-relaxed">
          אנו נוקטים באמצעי אבטחה סבירים להגנה על המידע, לרבות הצפנת תעבורת נתונים (HTTPS) ובקרת גישה מבוססת תפקידים.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">5. זכויות המשתמש</h2>
        <p className="text-muted-foreground leading-relaxed">
          כל משתמש רשאי לבקש עיון, תיקון או מחיקה של המידע האישי שלו באמצעות פנייה ישירה אלינו.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">6. יצירת קשר</h2>
        <p className="text-muted-foreground leading-relaxed">
          לכל שאלה בנוגע למדיניות הפרטיות, ניתן לפנות אלינו דרך האפליקציה או בדואר אלקטרוני.
        </p>
      </section>
    </div>
  );
}