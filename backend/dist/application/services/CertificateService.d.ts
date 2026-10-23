import { DocType } from '../../domain/enums/index.js';
export interface PublicValidationResponse {
    isValid: boolean;
    status: 'VÁLIDO' | 'AUTÊNTICO';
    authHash: string;
    beneficiaryName: string;
    beneficiaryCpfMasked: string;
    documentType: DocType;
    documentTypeName: string;
    title: string;
    description?: string;
    hoursCompleted: number;
    issuedAt: Date;
    details?: Record<string, unknown>;
}
export declare class CertificateService {
    validatePublicHash(hash: string): Promise<PublicValidationResponse>;
    issueCourseCertificate(enrollmentId: string): Promise<string>;
    getCertificatePDF(authHash: string): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
}
