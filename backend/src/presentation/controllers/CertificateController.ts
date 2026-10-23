import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { DownloadCertificatePDFUseCase } from '../../application/use-cases/certificates/DownloadCertificatePDFUseCase.js';
import { prisma } from '../../infrastructure/database/prisma.js';
import { AppError } from '../../domain/errors/AppError.js';
import { UserRole } from '../../domain/enums/index.js';
import { CertificateService } from '../../application/services/CertificateService.js';

export class CertificateController {
  private downloadPdfUseCase = new DownloadCertificatePDFUseCase();
  private certificateService = new CertificateService();

  validate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hash = (req.params.hash || req.query.code) as string;
      const result = await this.certificateService.validatePublicHash(hash);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw AppError.unauthorized();

      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
      const skip = (page - 1) * limit;

      const whereClause =
        req.user.role === UserRole.COPER
          ? {}
          : { userId: req.user.userId };

      const [certificates, total] = await Promise.all([
        prisma.certificate.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            user: {
              select: { id: true, name: true, email: true, cpf: true },
            },
            donation: true,
            enrollment: {
              include: {
                classroom: {
                  include: { course: true },
                },
              },
            },
          },
          orderBy: { issuedAt: 'desc' },
        }),
        prisma.certificate.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        status: 'success',
        data: {
          certificates,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  downloadPdf = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.downloadPdfUseCase.execute(
        id,
        req.user?.userId,
        req.user?.role
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.pdfBuffer);
    } catch (error) {
      next(error);
    }
  };
}
