export interface PublicValidationResponse {
    isValid: boolean;
    status: string;
    authHash: string;
    beneficiaryName: string;
    beneficiaryCpfMasked: string;
    documentType: any;
    documentTypeName: string;
    title: string;
    description?: string;
    hoursCompleted: number;
    issuedAt: Date;
    details?: Record<string, unknown>;
}
export declare class CertificateService {
    private validateUseCase;
    validatePublicHash(hash: string): Promise<any>;
    issueCourseCertificate(enrollmentId: string): Promise<string>;
    getCertificatePDF(authHash: string): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
}
