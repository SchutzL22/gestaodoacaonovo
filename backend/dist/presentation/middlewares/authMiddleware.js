"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const TokenService_js_1 = require("../../infrastructure/security/TokenService.js");
const AppError_js_1 = require("../../domain/errors/AppError.js");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw AppError_js_1.AppError.unauthorized('Token de autenticação não fornecido ou formato inválido.');
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = TokenService_js_1.TokenService.verifyAccessToken(token);
        req.user = payload;
        next();
    }
    catch (error) {
        throw AppError_js_1.AppError.unauthorized('Token inválido ou expirado.');
    }
}
