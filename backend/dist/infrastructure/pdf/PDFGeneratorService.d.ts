export interface CertificateData {
    authHash: string;
    userName: string;
    userCpf: string;
    title: string;
    description?: string;
    type: 'DONATION_DECLARATION' | 'COURSE_CERTIFICATE';
    hours?: number;
    issuedAt: Date;
    validationUrl: string;
}
export declare class PDFGeneratorService {
    static generateCertificateBuffer(data: CertificateData): Promise<Buffer>;
}
