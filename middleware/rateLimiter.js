import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter — 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many requests, please try again later.',
        retryAfter: '15 minutes'
    }
});

/**
 * Auth rate limiter — 10 requests per 15 minutes
 * Applied to login / OTP / verification endpoints
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many authentication attempts. Please try again in 15 minutes.',
        retryAfter: '15 minutes'
    }
});

/**
 * Strict limiter — 5 requests per 15 minutes
 * For sensitive operations like account deletion, reporting
 */
export const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Rate limit exceeded for this operation.',
        retryAfter: '15 minutes'
    }
});
