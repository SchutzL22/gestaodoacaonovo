"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../../domain/enums/index.js");
const rbacMiddleware_js_1 = require("../middlewares/rbacMiddleware.js");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const AuthController_js_1 = require("../controllers/AuthController.js");
const validationMiddleware_js_1 = require("../middlewares/validationMiddleware.js");
const authMiddleware_js_1 = require("../middlewares/authMiddleware.js");
const auth_dto_js_1 = require("../../application/dtos/auth.dto.js");
const router = (0, express_1.Router)();
const authController = new AuthController_js_1.AuthController();
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 25,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        statusCode: 429,
        message: 'Muitas tentativas de login ou cadastro. Por segurança, tente novamente em 15 minutos.',
    },
});
router.post('/register', authLimiter, (0, validationMiddleware_js_1.validate)({ body: auth_dto_js_1.registerSchema }), (req, res, next) => {
    if (req.body.role === index_js_1.Role.COPER || req.body.role === index_js_1.Role.PROFESSOR) {
        return (0, authMiddleware_js_1.authMiddleware)(req, res, () => (0, rbacMiddleware_js_1.requireRoles)(index_js_1.Role.COPER)(req, res, next));
    }
    next();
}, authController.register);
router.post('/login', authLimiter, (0, validationMiddleware_js_1.validate)({ body: auth_dto_js_1.loginSchema }), authController.login);
router.post('/refresh', (0, validationMiddleware_js_1.validate)({ body: auth_dto_js_1.refreshTokenSchema }), authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware_js_1.authMiddleware, authController.me);
router.post('/forgot-password', authLimiter, (0, validationMiddleware_js_1.validate)({ body: auth_dto_js_1.forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', authLimiter, (0, validationMiddleware_js_1.validate)({ body: auth_dto_js_1.resetPasswordSchema }), authController.resetPassword);
exports.default = router;
