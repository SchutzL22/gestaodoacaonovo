"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const RegisterUseCase_js_1 = require("../../application/use-cases/auth/RegisterUseCase.js");
const LoginUseCase_js_1 = require("../../application/use-cases/auth/LoginUseCase.js");
const RefreshTokenUseCase_js_1 = require("../../application/use-cases/auth/RefreshTokenUseCase.js");
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../domain/errors/AppError.js");
class AuthController {
    registerUseCase = new RegisterUseCase_js_1.RegisterUseCase();
    loginUseCase = new LoginUseCase_js_1.LoginUseCase();
    refreshTokenUseCase = new RefreshTokenUseCase_js_1.RefreshTokenUseCase();
    register = async (req, res, next) => {
        try {
            const result = await this.registerUseCase.execute(req.body);
            res.status(201).json({
                status: 'success',
                message: 'Usuário registrado com sucesso.',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    login = async (req, res, next) => {
        try {
            const result = await this.loginUseCase.execute(req.body);
            res.status(200).json({
                status: 'success',
                message: 'Autenticação realizada com sucesso.',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    refreshToken = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            const result = await this.refreshTokenUseCase.execute(refreshToken);
            res.status(200).json({
                status: 'success',
                message: 'Token renovado com sucesso.',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    me = async (req, res, next) => {
        try {
            if (!req.user) {
                throw AppError_js_1.AppError.unauthorized();
            }
            const user = await prisma_js_1.prisma.user.findUnique({
                where: { id: req.user.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    cpf: true,
                    role: true,
                    createdAt: true,
                },
            });
            if (!user) {
                throw AppError_js_1.AppError.notFound('Usuário não encontrado.');
            }
            res.status(200).json({
                status: 'success',
                data: { user },
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AuthController = AuthController;
