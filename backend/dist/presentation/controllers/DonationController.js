"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonationController = void 0;
const CreateDonationUseCase_js_1 = require("../../application/use-cases/donations/CreateDonationUseCase.js");
const ValidateDonationUseCase_js_1 = require("../../application/use-cases/donations/ValidateDonationUseCase.js");
const prisma_js_1 = require("../../infrastructure/database/prisma.js");
const AppError_js_1 = require("../../domain/errors/AppError.js");
const index_js_1 = require("../../domain/enums/index.js");
class DonationController {
    createDonationUseCase = new CreateDonationUseCase_js_1.CreateDonationUseCase();
    validateDonationUseCase = new ValidateDonationUseCase_js_1.ValidateDonationUseCase();
    create = async (req, res, next) => {
        try {
            if (!req.user)
                throw AppError_js_1.AppError.unauthorized();
            const donation = await this.createDonationUseCase.execute(req.user.userId, req.body);
            res.status(201).json({
                status: 'success',
                message: 'Solicitação de doação registrada com sucesso! Aguardando validação pela equipe COPER.',
                data: { donation },
            });
        }
        catch (error) {
            next(error);
        }
    };
    validate = async (req, res, next) => {
        try {
            if (!req.user)
                throw AppError_js_1.AppError.unauthorized();
            const id = req.params.id;
            const result = await this.validateDonationUseCase.execute(id, req.user.userId, req.body);
            res.status(200).json({
                status: 'success',
                message: `Doação ${req.body.status === 'APPROVED' ? 'aprovada' : 'rejeitada'} com sucesso.`,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    list = async (req, res, next) => {
        try {
            if (!req.user)
                throw AppError_js_1.AppError.unauthorized();
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
            const skip = (page - 1) * limit;
            const whereClause = req.user.role === index_js_1.UserRole.COPER
                ? {}
                : { userId: req.user.userId };
            const [donations, total, totalHoursAgg] = await Promise.all([
                prisma_js_1.prisma.donation.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    include: {
                        items: true,
                        user: {
                            select: { id: true, name: true, email: true, cpf: true, role: true },
                        },
                        validatedBy: {
                            select: { id: true, name: true, email: true },
                        },
                        certificate: {
                            select: { id: true, authHash: true, validationUrl: true, issuedAt: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                prisma_js_1.prisma.donation.count({ where: whereClause }),
                prisma_js_1.prisma.donation.aggregate({
                    where: { ...whereClause, status: 'APPROVED' },
                    _sum: { hoursEarned: true },
                }),
            ]);
            const totalPages = Math.ceil(total / limit);
            res.status(200).json({
                status: 'success',
                data: {
                    donations,
                    totalHours: totalHoursAgg._sum?.hoursEarned || 0,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages,
                    },
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
    getById = async (req, res, next) => {
        try {
            if (!req.user)
                throw AppError_js_1.AppError.unauthorized();
            const id = req.params.id;
            const donation = await prisma_js_1.prisma.donation.findUnique({
                where: { id },
                include: {
                    items: true,
                    user: {
                        select: { id: true, name: true, email: true, cpf: true, role: true },
                    },
                    validatedBy: {
                        select: { id: true, name: true, email: true },
                    },
                    certificate: {
                        select: { id: true, authHash: true, validationUrl: true, issuedAt: true },
                    },
                },
            });
            if (!donation) {
                throw AppError_js_1.AppError.notFound('Doação não encontrada.');
            }
            if (req.user.role !== index_js_1.UserRole.COPER && donation.userId !== req.user.userId) {
                throw AppError_js_1.AppError.forbidden('Você não tem permissão para visualizar esta doação.');
            }
            res.status(200).json({
                status: 'success',
                data: { donation },
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.DonationController = DonationController;
