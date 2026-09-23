import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validator.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const authRouter = Router();

// Brute-force / credential-stuffing protection on top of the global API
// limiter — much tighter since these endpoints don't need high throughput.
const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Quá nhiều lần thử. Vui lòng thử lại sau 15 phút.',
    },
  },
});

authRouter.post('/register', authAttemptLimiter, validateBody(registerSchema), authController.register);
authRouter.post('/login', authAttemptLimiter, validateBody(loginSchema), authController.login);
authRouter.post('/refresh', validateBody(refreshSchema), authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', requireAuth, authController.getMe);
