export interface NotificationItem {
    id: string;
    userId: string;
    titulo: string;
    mensagem: string;
    tipo?: string;
    link?: string;
    lida: boolean;
    dataEnvio: string;
}
export declare class NotificationService {
    private static notifications;
    static createNotification(params: {
        userId: string;
        title: string;
        message: string;
        type?: string;
        link?: string;
    }): NotificationItem;
    static getUserNotifications(userId: string): NotificationItem[];
    static markAsRead(notificationId: string, userId?: string): boolean;
    static deleteNotification(notificationId: string, userId?: string): boolean;
    static clearAll(): void;
}
