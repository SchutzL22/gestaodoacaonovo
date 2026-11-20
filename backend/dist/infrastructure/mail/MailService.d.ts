export declare class MailService {
    private static transporter;
    private static getTransporter;
    static sendPasswordResetCode(to: string, code: string): Promise<void>;
    static sendMail(options: {
        to: string;
        subject: string;
        html: string;
    }): Promise<void>;
    static sendWaitlistPromotionNotification(userEmail: string, userName: string, courseTitle: string): Promise<void>;
    static sendDonationStatusNotification(options: {
        userEmail: string;
        userName: string;
        status: 'APPROVED' | 'REJECTED';
        hoursEarned?: number;
        rejectionReason?: string;
        authHash?: string;
        isStudent?: boolean;
    }): Promise<void>;
    static sendCourseCertificateNotification(options: {
        userEmail: string;
        userName: string;
        courseTitle: string;
        workloadHours: number;
        authHash: string;
    }): Promise<void>;
}
