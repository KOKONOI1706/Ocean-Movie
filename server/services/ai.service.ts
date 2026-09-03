import { GoogleGenAI } from '@google/genai';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { NotFoundError } from '../utils/errors.js';

let genAIClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!genAIClient && env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return genAIClient;
}

export class AIService {
  /**
   * Natural Language AI Search:
   * 1. Extract structured criteria using Gemini (or heuristic fallback).
   * 2. Query PostgreSQL database with extracted criteria.
   * 3. Return structured transparency chips and database candidate items.
   */
  async search(queryText: string) {
    const cleanQuery = queryText.trim();
    const lower = cleanQuery.toLowerCase();

    // Default intent heuristics
    let genre = 'Khoa học viễn tưởng (Sci-Fi)';
    let tone = 'Giàu cảm xúc & Sâu lắng';
    let complexity = 'Vừa phải';
    let similarity = 'Điện ảnh chiêm nghiệm';
    let maxRuntimeMinutes: number | undefined = undefined;

    if (lower.includes('30 phút') || lower.includes('ngắn') || lower.includes('short')) {
      maxRuntimeMinutes = 40;
      genre = 'Phim ngắn tuyển chọn (Short Film)';
    } else if (lower.includes('2 tiếng') || lower.includes('dưới 2 giờ')) {
      maxRuntimeMinutes = 120;
    }

    if (lower.includes('interstellar')) {
      similarity = 'Interstellar';
      genre = 'Khoa học viễn tưởng (Sci-Fi)';
      complexity = lower.includes('less') || lower.includes('ít') || lower.includes('đơn giản') ? 'Thấp / Dễ tiếp nhận' : 'Cao / Đa tầng';
    } else if (lower.includes('anime') || lower.includes('ghibli')) {
      genre = 'Anime / Hoạt hình';
      similarity = 'Studio Ghibli';
    } else if (lower.includes('series') || lower.includes('tập') || lower.includes('dark')) {
      genre = 'Series truyền hình';
      similarity = 'Dark / Severance';
    }

    if (lower.includes('buồn') || lower.includes('sad') || lower.includes('khóc')) {
      tone = 'U buồn & Day dứt (Melancholic)';
    } else if (lower.includes('nhẹ nhàng') || lower.includes('thư giãn') || lower.includes('ngủ')) {
      tone = 'Thư thái & Êm đềm (Peaceful)';
      complexity = 'Nhẹ nhàng';
    }

    let explanation = `Biển Phim AI đã lọc hàng ngàn câu chuyện và chọn ra những tác phẩm có thể loại ${genre.toLowerCase()} với tông ${tone.toLowerCase()}, đáp ứng mong muốn của bạn.`;
    let curatorNote = 'Mỗi bộ phim là một hòn đảo đang chờ bạn ghé thăm và cảm nhận theo cách riêng.';

    // Call Gemini if key exists
    const gemini = getGemini();
    if (gemini) {
      try {
        const prompt = `Bạn là cố vấn AI điện ảnh thông minh cho nền tảng "BIỂN PHIM — Oceans of cinema".
Người dùng tìm kiếm tự nhiên: "${cleanQuery}"
Hãy trích xuất tiêu chí tìm kiếm và trả về JSON:
{
  "genre": "Thể loại (VD: Sci-Fi, Drama, Anime)",
  "tone": "Tông cảm xúc (VD: Giàu cảm xúc, U uất, Thư thái)",
  "complexity": "Độ phức tạp (VD: Thấp, Vừa phải, Cao)",
  "similarity": "Tác phẩm tương đồng hoặc cảm hứng (VD: Interstellar)",
  "maxRuntimeMinutes": null hoặc số phút,
  "explanation": "2 câu súc tích giải thích vì sao chọn các phim này.",
  "curatorNote": "1 câu bình nhẹ nhàng mang phong vị biển cả và điện ảnh."
}
Chỉ trả về JSON thuần túy, không dùng markdown.`;

        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          if (parsed.genre) genre = parsed.genre;
          if (parsed.tone) tone = parsed.tone;
          if (parsed.complexity) complexity = parsed.complexity;
          if (parsed.similarity) similarity = parsed.similarity;
          if (parsed.maxRuntimeMinutes) maxRuntimeMinutes = parsed.maxRuntimeMinutes;
          if (parsed.explanation) explanation = parsed.explanation;
          if (parsed.curatorNote) curatorNote = parsed.curatorNote;
        }
      } catch (err) {
        console.warn('Gemini intent extraction error, using heuristic fallback:', err);
      }
    }

    // Query Database with extracted constraints
    const whereConditions: any[] = [];
    if (maxRuntimeMinutes) {
      whereConditions.push({ runtimeMinutes: { lte: maxRuntimeMinutes } });
    }

    // Genre/keyword matching in DB
    const searchTerms = [cleanQuery, genre, similarity].filter(Boolean);
    const orClauses: any[] = [];
    for (const term of searchTerms) {
      orClauses.push(
        { title: { contains: term, mode: 'insensitive' } },
        { synopsis: { contains: term, mode: 'insensitive' } },
        { tagline: { contains: term, mode: 'insensitive' } },
        { genres: { some: { genre: { name: { contains: term, mode: 'insensitive' } } } } }
      );
    }

    let candidates = await prisma.movie.findMany({
      where: {
        AND: [
          ...(whereConditions.length ? whereConditions : []),
          { OR: orClauses },
        ],
      },
      take: 8,
      orderBy: { rating: 'desc' },
      include: {
        genres: { include: { genre: true } },
        moods: { include: { mood: true } },
        availability: { include: { provider: true } },
      },
    });

    // Fallback if strict query produced too few results
    if (candidates.length < 3) {
      const fallback = await prisma.movie.findMany({
        where: whereConditions.length ? { AND: whereConditions } : {},
        take: 6,
        orderBy: { rating: 'desc' },
        include: {
          genres: { include: { genre: true } },
          moods: { include: { mood: true } },
          availability: { include: { provider: true } },
        },
      });
      const existingIds = new Set(candidates.map((c) => c.id));
      for (const f of fallback) {
        if (!existingIds.has(f.id)) candidates.push(f);
      }
    }

    return {
      aiUnderstanding: {
        genre,
        tone,
        complexity,
        similarity,
        maxRuntimeMinutes,
      },
      explanation,
      curatorNote,
      items: candidates,
    };
  }

  /**
   * Cached Film Insight:
   * Returns DB cached insight if present. Only calls Gemini if missing.
   */
  async getFilmInsight(movieIdOrSlug: string) {
    const movie = await prisma.movie.findFirst({
      where: { OR: [{ id: movieIdOrSlug }, { slug: movieIdOrSlug }] },
      include: {
        aiInsight: true,
        genres: { include: { genre: true } },
      },
    });

    if (!movie) throw new NotFoundError('Phim không tồn tại');

    // Return cached insight if available
    if (movie.aiInsight && movie.aiInsight.themes) {
      return {
        source: 'cache',
        insight: movie.aiInsight,
      };
    }

    // Call Gemini with metadata only
    const gemini = getGemini();
    if (gemini) {
      try {
        const prompt = `Phân tích tác phẩm điện ảnh "${movie.title}" (${movie.year}, ${movie.genres.map((g) => g.genre.name).join(', ')}).
Tóm tắt: "${movie.synopsis}"
Hãy đưa ra nhận định chuyên sâu dưới dạng JSON:
{
  "themes": "Chủ đề cốt lõi",
  "mood": "Tâm trạng bao trùm",
  "visualStyle": "Phong cách thị giác và quay phim",
  "narrativeStyle": "Cấu trúc dẫn chuyện",
  "emotionalIntensity": "Cường độ cảm xúc",
  "audienceFit": "Ai sẽ thích phim này",
  "aiMatchScore": 95,
  "whyYouMayLike": "Lý do súc tích 1-2 câu"
}
Chỉ trả về JSON thuần túy.`;

        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          const savedInsight = await prisma.aIInsight.upsert({
            where: { movieId: movie.id },
            update: parsed,
            create: {
              movieId: movie.id,
              ...parsed,
            },
          });
          return { source: 'gemini', insight: savedInsight };
        }
      } catch (err) {
        console.warn('Failed to generate insight via Gemini:', err);
      }
    }

    // Default fallback insight
    const fallback = {
      themes: 'Khát vọng con người, khoảng lặng và dòng thời gian vô tận',
      mood: 'Sâu lắng, tráng lệ và giàu tính chiêm nghiệm',
      visualStyle: 'Góc máy chậm, ánh sáng tự nhiên và bố cục tương phản cao',
      narrativeStyle: 'Đa tầng, tôn trọng nhịp điệu cảm xúc tự nhiên',
      emotionalIntensity: 'Cao — Đọng lại dư ba lâu dài sau khi kết thúc',
      audienceFit: 'Người xem yêu thích điện ảnh chiêm nghiệm và nghệ thuật thị giác',
      aiMatchScore: 92,
      whyYouMayLike: 'Tác phẩm sở hữu sự kết hợp tinh tế giữa nghệ thuật hình ảnh và chiều sâu triết lý.',
    };

    const saved = await prisma.aIInsight.upsert({
      where: { movieId: movie.id },
      update: fallback,
      create: { movieId: movie.id, ...fallback },
    });

    return { source: 'fallback', insight: saved };
  }

  /**
   * Cached Series Insight
   */
  async getSeriesInsight(seriesIdOrSlug: string) {
    const series = await prisma.series.findFirst({
      where: { OR: [{ id: seriesIdOrSlug }, { slug: seriesIdOrSlug }] },
      include: {
        aiInsight: true,
        genres: { include: { genre: true } },
      },
    });

    if (!series) throw new NotFoundError('Series không tồn tại');

    if (series.aiInsight) {
      return { source: 'cache', insight: series.aiInsight };
    }

    const fallback = {
      themes: 'Định mệnh, sự gắn kết không gian thời gian và tâm lý con người',
      mood: 'Kịch tính, bí ẩn và cuốn hút qua từng tập',
      visualStyle: 'Tông màu sắc lạnh, bối cảnh chi tiết và biểu tượng thị giác sắc nét',
      narrativeStyle: 'Hồi hộp liền mạch (Binge-watch)',
      emotionalIntensity: 'Cao — Căng thẳng và gợi mở',
      audienceFit: 'Khán giả thích các câu đố hóc búa và series dài kỳ nhiều nút thắt',
      aiMatchScore: 96,
      whyYouMayLike: 'Cốt truyện chặt chẽ với những bước ngoặt bất ngờ không thể đoán trước.',
    };

    const saved = await prisma.aIInsight.upsert({
      where: { seriesId: series.id },
      update: fallback,
      create: { seriesId: series.id, ...fallback },
    });

    return { source: 'fallback', insight: saved };
  }

  /**
   * AI Episode Recap (Distinct from DB summary, no hallucinations)
   */
  async getEpisodeRecap(episodeId: string) {
    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
      include: {
        season: { include: { series: true } },
      },
    });

    if (!episode) throw new NotFoundError('Tập phim không tồn tại');

    return {
      episodeId: episode.id,
      title: episode.title,
      databaseSummary: episode.overview,
      aiRecap: episode.aiRecap || `Tập ${episode.episodeNumber} tiếp nối các xung đột cốt lõi của ${episode.season.series.title}, đào sâu vào mối quan hệ của các nhân vật chính.`,
      keyCharacters: episode.keyCharacters,
      majorThemes: episode.majorThemes,
      emotionalTone: episode.emotionalTone,
      beforeYouWatchNote: episode.beforeYouWatchNote,
    };
  }

  /**
   * User AI Taste Profile
   */
  async getUserTasteProfile(userId: string) {
    const [user, ratings, progress, watchlist] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { preference: true },
      }),
      prisma.rating.findMany({
        where: { userId },
        include: {
          movie: { include: { genres: { include: { genre: true } } } },
          series: { include: { genres: { include: { genre: true } } } },
        },
      }),
      prisma.watchProgress.findMany({ where: { userId } }),
      prisma.watchlist.findMany({ where: { userId } }),
    ]);

    if (!user) throw new NotFoundError('Người dùng không tồn tại');

    // Calculate top genres dynamically from ratings and preferences
    const genreCounts = new Map<string, number>();
    for (const r of ratings) {
      r.movie?.genres.forEach((g) => genreCounts.set(g.genre.name, (genreCounts.get(g.genre.name) || 0) + r.score));
      r.series?.genres.forEach((g) => genreCounts.set(g.genre.name, (genreCounts.get(g.genre.name) || 0) + r.score));
    }

    const sortedGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    return {
      displayName: user.displayName,
      memberSince: user.createdAt.toISOString(),
      topGenres: sortedGenres.length ? sortedGenres.slice(0, 4) : user.preference?.favoriteGenres || ['Sci-Fi', 'Drama', 'Mystery'],
      favoriteMoods: user.preference?.favoriteMoods || ['curious', 'lonely', 'philosophical'],
      preferredStreaming: user.preference?.preferredProviders || ['Netflix', 'YouTube', 'Prime Video'],
      stats: {
        ratingsGiven: ratings.length,
        inWatchlist: watchlist.length,
        inProgress: progress.length,
      },
      profileSummary: user.preference?.editorialSummary || 'Bạn có xu hướng yêu thích những tác phẩm giàu chiều sâu tâm lý, khám phá vũ trụ và điện ảnh nghệ thuật thư thái.',
    };
  }
}

export const aiService = new AIService();
