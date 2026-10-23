export declare class MailService {
    private static transporter;
    private static getTransporter;
    static sendMail(options: {
        to: string;
        subject: string;
        html: string;
    }): Promise<void>;
    static sendWaitlistPromotionNotification(userEmail: string, userName: string, courseTitle: string): Promise<void>;
}
