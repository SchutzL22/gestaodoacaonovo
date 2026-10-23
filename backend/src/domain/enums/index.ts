export {
  UserRole,
  DonationStatus,
  CourseStatus,
  EnrollmentStatus,
  DocType,
} from '@prisma/client';

import { UserRole, DocType } from '@prisma/client';

// Aliases para máxima ergonomia e compatibilidade
export const Role = UserRole;
export type Role = UserRole;

export const CertificateType = DocType;
export type CertificateType = DocType;
