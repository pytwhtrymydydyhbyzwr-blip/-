import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Gemini Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Goal Breakdown API (הגדרת הרגל מתקדמת עם AI)
app.post('/api/ai/breakdown-goal', async (req, res) => {
  try {
    const { goal } = req.body;
    if (!goal || typeof goal !== 'string') {
      return res.status(400).json({ error: 'Goal prompt is required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `אתה מאמן הרגלים מומחה בשפה העברית.
תפקידך לקבל יעד מורכב או שאיפה של המשתמש (כגון "לרוץ מרתון", "ללמוד צרפתית", "להקים עסק", "לרדת במשקל") ולהתפרק אותו ל-3 עד 5 הרגלים יומיים קטנים, ישימים ונגישים ביותר.
לכל הרגל ספק:
- name: שם ההרגל בעברית clear and actionable
- category: אחת מתוך ['health', 'learning', 'mindfulness', 'fitness', 'productivity', 'finance', 'social']
- targetValue: מספר יעד יומי (לדוגמה: 1, 10, 20, 2000)
- unit: יחידת מידה בעברית (כגון 'פעמים', 'דקות', 'כוסות', 'עמודים', 'צעדים')
- frequency: 'daily'
- icon: אחד מתוך ['check', 'flame', 'droplet', 'dumbbell', 'book', 'brain', 'heart', 'sparkles', 'target', 'coffee', 'moon', 'smile']
- color: אחד מתוך ['emerald', 'indigo', 'amber', 'rose', 'purple', 'blue', 'orange']
- tip: טיפ קצר ומעצים בעברית להצלחה בהרגל זה
החזר רק תוצאה במבנה JSON לפי הסכמה.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `פצל את היעד הבא להרגלים יומיים: "${goal}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              targetValue: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              frequency: { type: Type.STRING },
              icon: { type: Type.STRING },
              color: { type: Type.STRING },
              tip: { type: Type.STRING },
            },
            required: ['name', 'category', 'targetValue', 'unit', 'frequency', 'icon', 'color', 'tip'],
          },
        },
      },
    });

    const jsonText = response.text ? response.text.trim() : '[]';
    const parsed = JSON.parse(jsonText);
    return res.json({ habits: parsed });
  } catch (err: any) {
    console.error('Error in breakdown-goal:', err);
    return res.status(500).json({ error: err.message || 'Failed to breakdown goal' });
  }
});

// 2. Smart Natural Language / Voice Report Parser API (מעקב מתקדם עם AI)
app.post('/api/ai/parse-smart-log', async (req, res) => {
  try {
    const { reportText, userHabits } = req.body;
    if (!reportText || typeof reportText !== 'string') {
      return res.status(400).json({ error: 'reportText is required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `אתה עוזר AI חכם לעדכון מעקב הרגלים בעברית.
המשתמש מדווח בטקסט חופשי או בדיווח קולי מה הוא עשה היום.
לפניך רשימת ההרגלים הקיימים של המשתמש עם המזהה (id) ושם ההרגל.
עליך לנתח את הדיווח, להשוות להרגלים של המשתמש, ולהחזיר מערך של עדכונים עבור ההרגלים שהוזכרו או שניתן להסיק עליהם ביצוע:
- habitId: מזהה ההרגל מתוך הרשימה שנמסרה
- habitName: שם ההרגל
- completed: true במידה וההרגל בוצע או שהושג היעד, false אחרת
- value: הכמות שבוצעה (אם מדובר בהרגל כמותי, לדוגמה 3 כוסות, 20 דקות. אם לא צוינה כמות, השתמש ב-targetValue של ההרגל)
- notes: ציטוט או הערה קצרה מהדיווח של המשתמש (בעברית)

רשימת ההרגלים של המשתמש:
${JSON.stringify(userHabits, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `דיווח המשתמש: "${reportText}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              habitId: { type: Type.STRING },
              habitName: { type: Type.STRING },
              completed: { type: Type.BOOLEAN },
              value: { type: Type.NUMBER },
              notes: { type: Type.STRING },
            },
            required: ['habitId', 'habitName', 'completed', 'value'],
          },
        },
      },
    });

    const jsonText = response.text ? response.text.trim() : '[]';
    const parsed = JSON.parse(jsonText);
    return res.json({ updates: parsed });
  } catch (err: any) {
    console.error('Error in parse-smart-log:', err);
    return res.status(500).json({ error: err.message || 'Failed to parse smart log' });
  }
});

// 3. Personalized Trend Analysis & Advice API (משוב מתקדם עם AI)
app.post('/api/ai/analyze-trends', async (req, res) => {
  try {
    const { habitsData } = req.body;
    if (!habitsData || !Array.isArray(habitsData)) {
      return res.status(400).json({ error: 'habitsData is required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `אתה אנליסט התנהגות ומאמן אישי בכיר.
תפקידך לנתח את הנתונים וההיסטוריה של המשתמש במעקב ההרגלים שלו בעברית:
1. לחשב ציון עקביות כללי (overallScore מ-0 עד 100).
2. לזהות ימי חולשה (weakDays) בהם שיעור הביצוע נמוך יחסית (למשל: סופי שבוע, ימי שלישי, וכו').
3. לזהות ימי שיא/חוrate (strongDays) בהם העקביות גבוהה.
4. לספק 3 תובנות מפתח מבוססות נתונים (keyInsights).
5. לספק 3 המלצות פעולה פרקטיות ומותאמות אישית לשיפור (actionableTips).
6. ציטוט מוטיבציה מעורר השראה (motivationQuote).

נתוני ההרגלים:
${JSON.stringify(habitsData, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'בצע ניתוח מגמות אישיות והחזר דוח מאמן מקיף בעברית.',
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            summaryHeadline: { type: Type.STRING },
            weakDays: { type: Type.ARRAY, items: { type: Type.STRING } },
            strongDays: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionableTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            motivationQuote: { type: Type.STRING },
          },
          required: [
            'overallScore',
            'summaryHeadline',
            'weakDays',
            'strongDays',
            'keyInsights',
            'actionableTips',
            'motivationQuote',
          ],
        },
      },
    });

    const jsonText = response.text ? response.text.trim() : '{}';
    const parsed = JSON.parse(jsonText);
    return res.json({ analysis: parsed });
  } catch (err: any) {
    console.error('Error in analyze-trends:', err);
    return res.status(500).json({ error: err.message || 'Failed to analyze trends' });
  }
});

// Vite middleware & Production Server Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Habit Tracker Server running on http://localhost:${PORT}`);
  });
}

startServer();
