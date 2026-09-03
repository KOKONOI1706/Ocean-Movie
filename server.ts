import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.warn('Failed to initialize Gemini client:', err);
    }
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    brand: 'BIỂN PHIM — Oceans of Cinema & AI Discovery',
    tagline: 'Oceans of cinema — a vast sea of movies and stories.',
    geminiEnabled: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// AI Natural Language Search endpoint
app.post('/api/ai-search', async (req, res) => {
  const { query, filterType } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query string is required' });
  }

  const cleanQuery = query.trim();
  const lower = cleanQuery.toLowerCase();

  // Determine heuristic fallback breakdown
  let mood = 'Trầm lắng & Khơi gợi';
  let ending = 'Mở hoặc Tích cực';
  let genre = 'Drama / Sci-Fi';
  let pace = 'Chậm rãi, giàu cảm xúc';

  if (lower.includes('buồn') || lower.includes('sad') || lower.includes('khóc') || lower.includes('melanchol')) {
    mood = 'U uất, giàu cảm xúc (Melancholic)';
  } else if (lower.includes('nhẹ nhàng') || lower.includes('ngủ') || lower.includes('thư giãn') || lower.includes('chill')) {
    mood = 'Thư thái, an tĩnh (Peaceful & Cozy)';
    pace = 'Êm đềm, nhẹ nhàng';
  } else if (lower.includes('bí ẩn') || lower.includes('mystery') || lower.includes('kinh dị')) {
    mood = 'Hồi hộp, bí ẩn (Suspense & Mystery)';
  } else if (lower.includes('vui') || lower.includes('hài')) {
    mood = 'Tươi sáng, giải trí (Uplifting)';
    ending = 'Hạnh phúc (Happy Ending)';
  }

  if (lower.includes('tích cực') || lower.includes('hy vọng') || lower.includes('positive') || lower.includes('happy')) {
    ending = 'Tươi sáng, giàu hy vọng (Positive & Hopeful)';
  } else if (lower.includes('bi kịch') || lower.includes('đau đớn') || lower.includes('ám ảnh')) {
    ending = 'Ám ảnh, day dứt (Haunting)';
  }

  if (lower.includes('sci-fi') || lower.includes('khoa học') || lower.includes('vũ trụ') || lower.includes('interstellar')) {
    genre = 'Khoa học viễn tưởng (Sci-Fi)';
  } else if (lower.includes('anime') || lower.includes('hoạt hình') || lower.includes('ghibli')) {
    genre = 'Anime / Hoạt hình đỉnh cao';
  } else if (lower.includes('series') || lower.includes('tập')) {
    genre = 'Phim bộ kịch tính (Series)';
  } else if (lower.includes('ngắn') || lower.includes('short') || lower.includes('30 phút') || lower.includes('20 phút')) {
    genre = 'Phim ngắn tuyển chọn (Short Film)';
  }

  // Try Gemini if available
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const prompt = `Bạn là cố vấn AI điện ảnh thông minh cho nền tảng "BIỂN PHIM — Oceans of cinema".
Người dùng nhập: "${cleanQuery}"
Danh mục tác phẩm có sẵn trong Biển Phim:
- "INTERSTELLAR" (169 min, Sci-Fi Drama, hố đen, tình cha con xuyên không gian)
- "DARK" (3 Seasons, Series Sci-Fi bí ẩn thời gian, vòng lặp định mệnh)
- "SEVERANCE" (2 Seasons, Series tâm lý ly kỳ, chia tách ký ức công sở)
- "THE LAST SIGNAL" (18 min, Phim AI Sci-Fi ngắn, trạm phát sóng đơn độc)
- "AFTER YANG" (96 min, Sci-Fi êm đềm, hoài niệm, ký ức robot)
- "PERFECT DAYS" (124 min, Điện ảnh thư thái Zen, Tokyo, ánh nắng le lói)
- "PAST LIVES" (105 min, Tình cảm lắng đọng, duyên phận In-Yeon)
- "BLADE RUNNER 2049" (164 min, Neo-Noir Sci-Fi, tâm hồn người nhân tạo)
- "FRIEREN: BEYOND JOURNEY’S END" (28 tập, Anime kỳ ảo, hành trình thấu hiểu con người)
- "SPIRITED AWAY" (125 min, Anime Ghibli kiệt tác, đoàn tàu trên biển)
- "STALKER" (162 min, Kiệt tác Andrei Tarkovsky, Vùng đất ước nguyện)
- "CHRONICLE OF A METROPOLIS AT DUSK" (24 min, Phim ngắn kiến trúc AI hoàng hôn)
- "SON OF THE SUN" (12 min, Phim ngắn AI bão mặt trời)

Hãy phân tích và trả về JSON:
{
  "aiUnderstanding": {
    "mood": "Tâm trạng đã hiểu (VD: Melancholic & Deep)",
    "ending": "Kết thúc mong muốn (VD: Positive / Hopeful)",
    "genre": "Thể loại (VD: Sci-Fi / Drama)",
    "pace": "Nhịp phim (VD: Contemplative)"
  },
  "explanation": "Đoạn văn ngắn 2-3 câu giải thích vì sao chọn các phim này để giải tỏa mong muốn của người dùng.",
  "matchedIds": ["id1", "id2", "id3"],
  "aiCuratorNote": "Lời bình gợi cảm hứng nhẹ nhàng mang phong vị biển cả và điện ảnh."
}
Chỉ trả về JSON thuần túy, không dùng markdown hay code block.`;

      const response = await gemini.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({
          source: 'gemini',
          query: cleanQuery,
          aiUnderstanding: parsed.aiUnderstanding || { mood, ending, genre, pace },
          explanation: parsed.explanation || 'Đề xuất dựa trên tâm trạng, nhịp điệu cảm xúc và thời lượng phù hợp.',
          matchedItemIds: parsed.matchedIds || ['interstellar', 'frieren-journey', 'after-yang'],
          aiCuratorNote: parsed.aiCuratorNote || 'Giữa đại dương câu chuyện, đây là những hòn đảo mang lại cảm giác bình yên nhất cho bạn hôm nay.'
        });
      }
    } catch (geminiError) {
      console.warn('Gemini inference error, falling back to heuristic engine:', geminiError);
    }
  }

  // Fallback heuristic matcher
  let matchedIds: string[] = [];
  if (lower.includes('interstellar') || (lower.includes('sci-fi') && lower.includes('cảm động'))) {
    matchedIds = ['interstellar', 'after-yang', 'the-last-signal', 'blade-runner-2049'];
  } else if (lower.includes('anime') || lower.includes('hoạt hình') || lower.includes('nhẹ nhàng')) {
    matchedIds = ['frieren-journey', 'spirited-away', 'perfect-days', 'after-yang'];
  } else if (lower.includes('30 phút') || lower.includes('ngắn') || lower.includes('short')) {
    matchedIds = ['the-last-signal', 'son-of-sun', 'chronicle-metropolis'];
  } else if (lower.includes('series') || lower.includes('bí ẩn')) {
    matchedIds = ['dark', 'severance', 'frieren-journey'];
  } else if (lower.includes('ngủ') || lower.includes('thư giãn') || lower.includes('trước khi ngủ')) {
    matchedIds = ['perfect-days', 'after-yang', 'frieren-journey', 'past-lives'];
  } else if (lower.includes('buồn') && lower.includes('tích cực')) {
    matchedIds = ['past-lives', 'after-yang', 'interstellar', 'frieren-journey'];
  } else {
    matchedIds = ['interstellar', 'frieren-journey', 'perfect-days', 'after-yang', 'the-last-signal'];
  }

  return res.json({
    source: 'ocean-ai-engine',
    query: cleanQuery,
    aiUnderstanding: {
      mood,
      ending,
      genre,
      pace
    },
    explanation: `Biển Phim AI đã lọc hàng ngàn câu chuyện và chọn ra những tác phẩm có nhịp cảm xúc ${mood.toLowerCase()}, phù hợp với thời gian và tâm trạng của bạn.`,
    matchedItemIds: matchedIds,
    aiCuratorNote: 'Mỗi bộ phim là một hòn đảo đang chờ bạn ghé thăm và cảm nhận theo cách riêng.'
  });
});

// Film In-depth AI Insight
app.post('/api/film-insight', async (req, res) => {
  const { filmTitle, userTaste } = req.body;
  const gemini = getGeminiClient();

  if (gemini && filmTitle) {
    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Bạn là trợ lý điện ảnh thông minh của BIỂN PHIM. Hãy viết một đoạn phân tích cô đọng 2-3 câu bằng tiếng Việt về tác phẩm "${filmTitle}". Giải thích lý do người xem sẽ yêu thích bộ phim này dựa trên chiều sâu cảm xúc, hình ảnh đại dương/không gian và tính nhân văn.`
      });
      return res.json({ insight: response.text });
    } catch (err) {
      console.warn('Insight generation fallback:', err);
    }
  }

  return res.json({
    insight: `“${filmTitle || 'Tác phẩm này'}” tựa như một làn sóng êm dịu vỗ về tâm hồn. Sự kết hợp giữa góc máy điện ảnh khoáng đạt và giai điệu sâu lắng sẽ đưa bạn vào một chuyến hải trình khó quên.`
  });
});

// Vite middleware or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
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
    console.log(`OBLIQUE Editorial Cinema server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
