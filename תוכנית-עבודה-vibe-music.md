# תוכנית עבודה – Vibe Music App
**תאריך:** 18.3.2026 | **גרסה:** vibe-music-app-phi.vercel.app

---

## סיכום ממצאים

עברתי על כל הקוד. הנה מה שמצאתי לגבי כל בעיה:

---

## בעיה 1: תיקיית `.claude` בגיטהאב

### מה המצב?
**הטוב ביותר — כבר מטופל.** התיקייה `.claude/` כבר מוגדרת בקובץ `.gitignore` ו-**אינה** נמצאת ב-git tracking. ריצת `git ls-files | grep claude` לא החזירה כלום — כלומר תיקיית ה-Claude **לא מופיעה בגיטהאב שלך כבר**.

### מה עדיין צריך לעשות?

**להסיר את Claude כ-collaborator מגיטהאב:**

1. לך ל-GitHub → הריפו שלך (`tamtam888/vibe-music-app`)
2. לחץ על `Settings` (בריפו, לא בפרופיל)
3. לחץ על `Collaborators and teams` בתפריט השמאלי
4. מצא את `Claude` ולחץ על `Remove`

**תיקיית `.claude` מקומית:**
היא נמצאת רק על המחשב שלך ולא בגיטהאב. אם רוצה להסיר אותה לגמרי מהמחשב:
```bash
rm -rf /path/to/vibe-music/.claude
```
(אם תשתמש ב-Claude Code שוב בפרויקט הזה — היא תיווצר מחדש אוטומטית)

---

## בעיה 2: כפתורי ה-AI לא עובדים

### מה המצב?
הכפתורים **עובדים נכון** מבחינת קוד — זה אינו באג, זה עיצוב. בואי נבין מה הם עושים:

**AI Radio (⚡ Zap icon):**
- כאשר לוחצים עליו — הוא מציג toast "AI Radio on" ✅
- הוא **אינו** מדלג מיד לשיר הבא
- הוא **מגדיר מצב**: כשהשיר הנוכחי מסתיים, האלגוריתם יבחר את השיר הבא לפי **אנרגיה, מצב רוח, BPM ו-texture**
- המצב "AI Flow Active" יופיע מעל הוינייל רק אחרי שיר **אחד לפחות** מסיים ומשיר חדש מתחיל

**Beat Match (🎵 Waves icon):**
- עובד אותו הדבר — מצב עתידי, לא פעולה מיידית
- כשהשיר הנוכחי מסיים → הכפתור בוחר שיר עם BPM הכי קרוב
- מוסיף סטטוס "Beat Match Active" מעל הוינייל

### למה זה נראה "לא עובד"?
כי אין הסבר ברור בממשק שהמצב ייכנס לפועל **בשיר הבא**, לא מיד.

### תיקון מומלץ:
להוסיף טקסט מסביר בתוך ה-toast, לדוגמה:
> "AI Radio on · applies to the **next** track when current song ends"

או — להוסיף כפתור "Skip now with AI" שמדלג מיד.

---

## בעיה 3: כפתור Spotify לא מתחבר

### מה המצב?
זאת הבעיה הכי מורכבת — יש **שלושה** דברים שצריכים להיות מוגדרים נכון במקביל:

```
Frontend (Vercel) → Spotify OAuth → Supabase Edge Function → Supabase DB
```

### שלב 1: Vercel — להוסיף env var

כנסי ל-[vercel.com](https://vercel.com) → הפרויקט שלך → **Settings → Environment Variables**

הוסיפי:
| שם | ערך |
|---|---|
| `VITE_SPOTIFY_CLIENT_ID` | `92e7dec939ad43639b46a6f4c65393cb` (מה-.env שלך) |

לאחר הוספה → **לחצי על Redeploy**.

### שלב 2: Spotify Developer Dashboard

כנסי ל-[developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → בחרי את האפליקציה שלך → **Edit Settings**

תחת **Redirect URIs** — ודאי שקיים בדיוק:
```
https://vibe-music-app-phi.vercel.app
```
(ללא סלאש בסוף, ללא /callback)

### שלב 3: Supabase — deploy Edge Function

הפונקציה `supabase/functions/spotify-auth/index.ts` קיימת בקוד אבל צריכה להיות **deployed** ל-Supabase:

```bash
# בטרמינל, מתיקיית הפרויקט:
supabase functions deploy spotify-auth
```

**ולהוסיף את ה-secrets ב-Supabase:**
```bash
supabase secrets set SPOTIFY_CLIENT_ID=92e7dec939ad43639b46a6f4c65393cb
supabase secrets set SPOTIFY_CLIENT_SECRET=<המפתח_הסודי_שלך>
```

> ⚠️ **SPOTIFY_CLIENT_SECRET** — זה המפתח הסודי מ-Spotify Developer Dashboard. הוא שונה מה-Client ID. מצאי אותו ב-dashboard תחת "Client Secret" (לחצי על "View Secret").

### שלב 4: משתמש חייב להיות מחובר

בקוד קיים guard:
```typescript
onSpotifyConnect={() => {
  if (!user) { navigate("/auth"); return; }  // ← מפנה ל-login!
  spotify.connect();
}}
```
**יש להיות מחובר עם אמייל לפני שמנסים לחבר Spotify.**

### סדר הפעולות המלא לחיבור Spotify:
1. כנסי לאפליקציה → לחצי "Continue with Email" → הרשמי / התחברי
2. ודאי שהenv var מוגדר ב-Vercel ושה-edge function deployed
3. לחצי על כפתור "Spotify" — הוא יפנה ל-Spotify לאישור
4. תאשרי את ההרשאות ב-Spotify
5. תחזרי לאפליקציה — תופיע תמונת הפרופיל שלך ב-Spotify

---

## בעיה 4: כפתור ה-Bitmit (Beat Match)

זהה לבעיה 2 למעלה — Beat Match הוא מצב עתידי, לא פעולה מיידית. הכפתור עובד נכון.

אם הכוונה לבאג ספציפי אחר (כגון: לאחר הפעלת Beat Match השיר הבא לא נבחר נכון) — נדרשת בדיקה נוספת עם לוג בקונסול.

---

## סיכום משימות לפי עדיפות

| # | משימה | איפה | מורכבות |
|---|-------|------|---------|
| 1 | הסרת Claude כ-collaborator | GitHub Settings | ⭐ קל |
| 2 | הוספת `VITE_SPOTIFY_CLIENT_ID` ל-Vercel | Vercel Dashboard | ⭐ קל |
| 3 | רישום Redirect URI ב-Spotify Dashboard | Spotify Dev | ⭐ קל |
| 4 | Deploy `spotify-auth` edge function | טרמינל + Supabase | ⭐⭐ בינוני |
| 5 | הוספת Spotify Client Secret ל-Supabase secrets | טרמינל | ⭐⭐ בינוני |
| 6 | שיפור UX של כפתורי AI/Beat Match (טקסט הסברה) | קוד | ⭐ קל |

---

## הסבר על הארכיטקטורה של ה-AI

```
useAIFlow (hook) ← buildNextTrack() ← בוחר לפי:
  ├── Energy match (הפרש × 12)
  ├── BPM proximity (הפרש × 0.3)
  ├── Mood continuity (בונוס 20)
  ├── Texture similarity (בונוס 15)
  ├── Same-vibe preference (בונוס 8)
  ├── Favorites boost (בונוס 25)
  └── Recency penalty (עונש 60-80 לאחרונות)

useBeatMatch (hook) ← buildNextTrack() ← בוחר לפי:
  ├── BPM distance (עיקרי)
  ├── Energy proximity (משני)
  └── Mood/Texture/Vibe bonus
```

שני ה-hooks עובדים נכון — הלוגיקה תקינה.

---

*נוצר עם Claude · Cowork mode · 18.3.2026*
