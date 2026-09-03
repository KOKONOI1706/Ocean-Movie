import { z } from 'zod';

export const aiSearchSchema = z.object({
  query: z.string().min(2, 'Vui lòng nhập câu hỏi hoặc mô tả phim muốn tìm (tối thiểu 2 ký tự)'),
});
