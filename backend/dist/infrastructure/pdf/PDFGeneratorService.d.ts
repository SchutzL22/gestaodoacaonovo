export interface DonationItemPDF {
    description: string;
    category?: string;
    quantity: number;
    unit?: string;
}
export interface StudentDonationPDFData {
    authHash: string;
    validationUrl: string;
    userName: string;
    userMatricula?: string | null;
    userEmail: string;
    userCpf: string;
    items: DonationItemPDF[];
    hoursEarned: number;
    receivedByName?: string | null;
    validatedByName?: string | null;
    approvedAt: Date;
    campaignTitle?: string | null;
}
export interface CivilOrProfessorDonationPDFData {
    authHash: string;
    validationUrl: string;
    userName: string;
    userRole: 'CIVIL' | 'PROFESSOR' | 'EMPRESARIO';
    userCpf: string;
    userEmail?: string | null;
    items: DonationItemPDF[];
    receivedByName?: string | null;
    validatedByName?: string | null;
    approvedAt: Date;
    observation?: string | null;
    campaignTitle?: string | null;
}
export interface CourseCertificatePDFData {
    authHash: string;
    validationUrl: string;
    userName: string;
    userMatricula?: string | null;
    userCpf: string;
    courseTitle: string;
    workloadHours: number;
    startDate?: Date | null;
    endDate?: Date | null;
    instructorName?: string | null;
    finalGrade?: number | null;
    attendancePct?: number | null;
    issuedAt: Date;
}
export declare class PDFGeneratorService {
    private static getLogoBuffer;
    private static maskCpf;
    private static formatDateLong;
    static generateStudentDonationPDF(data: StudentDonationPDFData): Promise<Buffer>;
    static generateCivilOrProfessorDonationPDF(data: CivilOrProfessorDonationPDFData): Promise<Buffer>;
    static generateCourseCertificatePDF(data: CourseCertificatePDFData): Promise<Buffer>;
    static generateCertificateBuffer(data: any): Promise<Buffer>;
}
