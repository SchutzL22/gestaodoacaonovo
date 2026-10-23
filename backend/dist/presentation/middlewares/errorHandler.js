"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const AppError_js_1 = require("../../domain/errors/AppError.js");
function errorHandler(err, req, res, next) {
    if (err instanceof AppError_js_1.AppError) {
        res.status(err.statusCode).json({
            status: 'error',
            statusCode: err.statusCode,
            message: err.message,
            ...(err.details ? { details: err.details } : {}),
        });
        return;
    }
    if (err instanceof zod_1.ZodError) {
        const formattedErrors = err.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
        }));
        res.status(400).json({
            status: 'error',
            statusCode: 400,
            message: 'Falha na validação dos dados de entrada.',
            details: formattedErrors,
        });
        return;
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            const target = err.meta?.target || ['campo'];
            res.status(409).json({
                status: 'error',
                statusCode: 409,
                message: `Conflito de unicidade: já existe um registro com esse ${target.join(', ')}.`,
            });
            return;
        }
        if (err.code === 'P2025') {
            res.status(404).json({
                status: 'error',
                statusCode: 404,
                message: 'Registro não encontrado no banco de dados.',
            });
            return;
        }
    }
    console.error('[UnhandledError]', err);
    res.status(500).json({
        status: 'error',
        statusCode: 500,
        message: 'Ocorreu um erro interno inesperado no servidor.',
    });
}
