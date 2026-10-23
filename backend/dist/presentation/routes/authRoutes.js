"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
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
router.post('/register', authLimiter, (0, validationMiddleware_js_1.validate)({ body: auth_dto_js_1.registerSchema }), authController.register);
router.post('/login', authLimiter, (0, validationMiddleware_js_1.validate)({ body: auth_dto_js_1.loginSchema }), authController.login);
router.post('/refresh', (0, validationMiddleware_js_1.validate)({ body: auth_dto_js_1.refreshTokenSchema }), authController.refreshToken);
router.get('/me', authMiddleware_js_1.authMiddleware, authController.me);
exports.default = router;
