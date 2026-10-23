"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    isOperational;
    details;
    constructor(message, statusCode = 400, details) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
    static badRequest(message, details) {
        return new AppError(message, 400, details);
    }
    static unauthorized(message = 'Não autorizado. Faça login para continuar.') {
        return new AppError(message, 401);
    }
    static forbidden(message = 'Acesso negado. Você não possui permissão para este recurso.') {
        return new AppError(message, 403);
    }
    static notFound(message = 'Recurso não encontrado.') {
        return new AppError(message, 404);
    }
    static conflict(message) {
        return new AppError(message, 409);
    }
    static unprocessable(message, details) {
        return new AppError(message, 422, details);
    }
    static internal(message = 'Erro interno do servidor.') {
        return new AppError(message, 500);
    }
}
exports.AppError = AppError;
