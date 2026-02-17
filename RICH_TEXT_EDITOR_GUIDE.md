# מדריך Rich Text Editor למאמרים

## מה הוסף לפרויקט?

הוספתי עורך טקסט עשיר (Rich Text Editor) מלא למאמרים בפרויקט, בדיוק כמו שיש בפרויקט השני (`pays/ort/back-office`).

## רכיבים חדשים

### 1. RichTextEditor Component
**מיקום:** `src/components/RichTextEditor.tsx`

עורך טקסט עשיר מבוסס TipTap עם כל האפשרויות הבאות:

#### אפשרויות עיצוב טקסט:
- **מודגש (Bold)** - Ctrl/Cmd + B
- *נטוי (Italic)* - Ctrl/Cmd + I
- <u>קו תחתון (Underline)</u> - Ctrl/Cmd + U
- ~~קו חוצה (Strikethrough)~~
- צבע טקסט
- צבע רקע (Highlight)

#### אפשרויות מבנה:
- כותרות (H1, H2, H3)
- רשימות עם תבליטים
- רשימות ממוספרות
- בלוק קוד (Code Block) עם Syntax Highlighting
- קישורים (Links)

#### אפשרויות יישור:
- יישור לימין
- יישור למרכז
- יישור לשמאל

#### הטמעת מדיה:
- **YouTube Videos** - כפתור אדום
- **Vimeo Videos** - כפתור כחול
- תמיכה בהדבקת קוד iframe או URL ישיר

#### אפשרויות נוספות:
- Undo/Redo
- תמיכה מלאה בעברית וכיוון RTL/LTR
- בלוקי קוד תמיד LTR (שמאל לימין) לנוחות

### 2. AdminArticles Page
**מיקום:** `src/pages/AdminArticles.tsx`

דף ניהול מאמרים מלא עם:
- רשימת כל המאמרים
- יצירת מאמר חדש
- עריכת מאמרים קיימים
- מחיקת מאמרים
- תמיכה בעברית ואנגלית (טאבים נפרדים)
- סטטוס מאמר: טיוטה (Draft) או פורסם (Published)
- Slug לכתובת URL

### 3. ReadOnlyRichText Component
**מיקום:** `src/components/RichTextEditor.tsx` (exported)

רכיב לתצוגת מאמרים בלבד (ללא עריכה) - משמש בדף המאמר הציבורי.

## נתיבים (Routes)

### דף ניהול מאמרים (Admin)
```
/0522577194/admin/articles
```

### דף מאמר ציבורי
```
/articles/:slug
```

## איך להשתמש?

### 1. גישה לדף הניהול
1. היכנס לדף האדמין: `http://localhost:8080/0522577194/admin`
2. לחץ על הכפתור "מאמרים" בתפריט העליון
3. תגיע לדף ניהול המאמרים

### 2. יצירת מאמר חדש
1. לחץ על כפתור "מאמר חדש" / "New Article"
2. מלא את השדות:
   - **Slug** - שם ייחודי לכתובת URL (לדוגמה: `cyber-security-tips`)
   - **Status** - בחר טיוטה או פורסם
   - **עברית (Hebrew)** - כותרת, כותרת משנה, תוכן
   - **אנגלית (English)** - כותרת, כותרת משנה, תוכן
3. השתמש בעורך הטקסט העשיר לעיצוב התוכן
4. לחץ "שמור" / "Save"

### 3. הטמעת וידאו
1. בעורך הטקסט, לחץ על אחד מכפתורי הוידאו:
   - **כפתור אדום** - YouTube
   - **כפתור כחול** - Vimeo
2. הדבק אחד מהבאים:
   - URL של הוידאו (לדוגמה: `https://www.youtube.com/watch?v=VIDEO_ID`)
   - קוד iframe מלא
3. לחץ "הוסף" / "Add"

### 4. עריכת מאמר קיים
1. בדף ניהול המאמרים, לחץ על "ערוך" / "Edit" בכרטיס המאמר
2. ערוך את השדות הרצויים
3. לחץ "שמור" / "Save"

### 5. מחיקת מאמר
1. לחץ על אייקון הפח בכרטיס המאמר
2. אשר את המחיקה

## טכנולוגיות

### חבילות שהותקנו:
```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-text-align": "^2.x",
  "@tiptap/extension-color": "^2.x",
  "@tiptap/extension-text-style": "^2.x",
  "@tiptap/extension-link": "^2.x",
  "@tiptap/extension-underline": "^2.x",
  "@tiptap/extension-highlight": "^2.x",
  "@tiptap/extension-code-block-lowlight": "^2.x",
  "lowlight": "^3.x"
}
```

## מבנה Firebase

### Collection: `articles`
```typescript
{
  id: string;
  slug: string;
  status: 'draft' | 'published';
  titleHe: string;
  subtitleHe: string;
  bodyHe: string;  // HTML מ-Rich Text Editor
  titleEn: string;
  subtitleEn: string;
  bodyEn: string;  // HTML מ-Rich Text Editor
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## עיצוב

העורך משתמש ב-shadcn/ui components ומותאם לעיצוב הקיים של הפרויקט:
- כפתורים עם אייקונים מ-lucide-react
- צבעים מותאמים לפלטת הצבעים של הפרויקט
- תמיכה מלאה ב-RTL/LTR
- Responsive Design

## הבדלים מהפרויקט המקורי (pays/ort)

1. **UI Framework**: המקור משתמש ב-Material-UI, הפרויקט הזה משתמש ב-shadcn/ui
2. **עיצוב**: הותאם לפלטת הצבעים של הפרויקט (gold/navy במקום ברירות המחדל)
3. **שפה**: תמיכה מלאה בעברית ואנגלית עם מעבר בין טאבים

## טיפים

1. **בלוק קוד**: כשאתה מוסיף בלוק קוד, הוא אוטומטית מוגדר ל-LTR (שמאל לימין)
2. **וידאו**: אפשר להדביק את כל קוד ה-iframe או רק את ה-URL
3. **קישורים**: הקישורים במאמרים מוצגים בצבע כחול (sky-500) לבהירות
4. **Slug**: השתמש ב-slug קצר וברור באנגלית עם מקפים (לדוגמה: `my-article-title`)

## בעיות נפוצות

### הוידאו לא מוטמע
- ודא שה-URL תקין
- נסה להדביק את קוד ה-iframe המלא מהאתר
- בדוק שהוידאו ציבורי ולא פרטי

### הטקסט לא מיושר נכון
- השתמש בכפתורי היישור בסרגל הכלים
- לטקסט עברי, בחר יישור לימין
- לטקסט אנגלי, בחר יישור לשמאל

### המאמר לא מופיע באתר
- ודא שהסטטוס הוא "Published" ולא "Draft"
- רענן את העמוד
- בדוק שיש תוכן לפחות בשפה אחת

## תמיכה

לשאלות או בעיות, פנה למפתח הפרויקט.
