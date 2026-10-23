import { Request, Response, NextFunction } from 'express';
import { ValidateCertificateUseCase } from '../../application/use-cases/certificates/ValidateCertificateUseCase.js';
import { prisma } from '../../infrastructure/database/prisma.js';

export class PublicValidationController {
  private validateUseCase = new ValidateCertificateUseCase();

  validateDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const code = (req.query.code as string) || (req.params.code as string);
      const result = await this.validateUseCase.execute(code);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  publicStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [totalDonations, totalHours, totalCertificates, activeCourses] = await Promise.all([
        prisma.donation.count({ where: { status: 'APPROVED' } }),
        prisma.donation.aggregate({
          where: { status: 'APPROVED' },
          _sum: { hoursEarned: true },
        }),
        prisma.certificate.count(),
        prisma.course.count(),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          impact: {
            totalApprovedDonations: totalDonations,
            totalHoursGranted: totalHours._sum?.hoursEarned || 0,
            totalCertificatesIssued: totalCertificates,
            activeCourses,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
