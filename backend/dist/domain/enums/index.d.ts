export { UserRole, DonationStatus, CourseStatus, EnrollmentStatus, DocType, } from '@prisma/client';
import { UserRole, DocType } from '@prisma/client';
export declare const Role: {
    ALUNO: "ALUNO";
    PROFESSOR: "PROFESSOR";
    COPER: "COPER";
    EMPRESARIO: "EMPRESARIO";
    CIVIL: "CIVIL";
};
export type Role = UserRole;
export declare const CertificateType: {
    DONATION_DECLARATION: "DONATION_DECLARATION";
    COURSE_CERTIFICATE: "COURSE_CERTIFICATE";
};
export type CertificateType = DocType;
