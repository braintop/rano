# תיקון Slug למאמר קיים

## הבעיה:
המאמר נוצר בלי Slug נכון, ולכן לא נטען בטלפון.

## הפתרון:

### 1. כנס לדף האדמין:
```
http://localhost:8080/0522577194/admin/articles
```

### 2. מצא את המאמר:
"אחריות דירקטורים: פסק דין חדש והשלכות על ביטוח D&O בישראל"

### 3. לחץ "ערוך"

### 4. בשדה "Slug" תקן ל:
```
directors-liability-court-ruling-do-insurance-israel
```

### 5. שמור

### 6. נסה שוב את הלינק בטלפון!

---

## אם זה לא עובד - אפשרות 2:

### צור מאמר חדש עם הנתונים הנכונים:

1. העתק את כל התוכן מהמאמר הישן
2. צור מאמר חדש
3. הדבק את התוכן
4. הגדר את ה-Slug: `directors-liability-court-ruling-do-insurance-israel`
5. הגדר Status: **Published**
6. שמור
7. מחק את המאמר הישן

---

## אם גם זה לא עובד:

אז הבעיה היא ב-Firebase Rules - בדוק שהכללים מאפשרים קריאה לכולם:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /articles/{article} {
      // כולם יכולים לקרוא מאמרים שפורסמו
      allow read: if resource.data.status == 'published';
      
      // רק משתמשים מאומתים יכולים לכתוב
      allow write: if request.auth != null;
    }
  }
}
```

---

## בדיקה:

אחרי התיקון, נסה:

1. **במחשב (Incognito):**
   ```
   https://www.ranw.tech/articles/directors-liability-court-ruling-do-insurance-israel
   ```

2. **בטלפון:**
   לחץ על הלינק מוואטסאפ שוב

אם עובד - מעולה! ✅
אם לא - תראה לי מה מופיע ב-Console.
