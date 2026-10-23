"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = requireRoles;
const AppError_js_1 = require("../../domain/errors/AppError.js");
function requireRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            throw AppError_js_1.AppError.unauthorized('Usuário não autenticado.');
        }
        if (!allowedRoles.includes(req.user.role)) {
            throw AppError_js_1.AppError.forbidden(`Acesso negado. Perfil '${req.user.role}' não tem permissão para esta ação. Perfis permitidos: ${allowedRoles.join(', ')}`);
        }
        next();
    };
}
