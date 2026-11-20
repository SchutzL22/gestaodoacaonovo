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

export class NotificationService {
  private static notifications: NotificationItem[] = [
    {
      id: 'notif-seed-1',
      userId: 'usr-student-001',
      titulo: 'Doação Aprovada com Sucesso!',
      mensagem: 'Sua doação foi validada pela equipe COPER e as horas complementares já constam no seu histórico.',
      tipo: 'DONATION_APPROVED',
      link: '/historico',
      lida: false,
      dataEnvio: new Date().toISOString(),
    },
    {
      id: 'notif-seed-2',
      userId: 'usr-student-001',
      titulo: 'Inscrição Ativa em Curso',
      mensagem: 'Você está matriculado na turma de Libras 2026.1. Acompanhe sua frequência e notas.',
      tipo: 'ENROLLMENT_ACTIVE',
      link: '/aluno/cursos',
      lida: true,
      dataEnvio: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  static createNotification(params: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
  }): NotificationItem {
    const item: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: params.userId,
      titulo: params.title,
      mensagem: params.message,
      tipo: params.type || 'INFO',
      link: params.link,
      lida: false,
      dataEnvio: new Date().toISOString(),
    };

    this.notifications.unshift(item);
    console.log(`[NotificationService] In-App Notification criada para o usuário ${params.userId}: ${params.title}`);
    return item;
  }

  static getUserNotifications(userId: string): NotificationItem[] {
    return this.notifications.filter((n) => n.userId === userId);
  }

  static markAsRead(notificationId: string, userId?: string): boolean {
    const item = this.notifications.find(
      (n) => n.id === notificationId && (!userId || n.userId === userId)
    );
    if (item) {
      item.lida = true;
      return true;
    }
    return false;
  }

  static deleteNotification(notificationId: string, userId?: string): boolean {
    const index = this.notifications.findIndex(
      (n) => n.id === notificationId && (!userId || n.userId === userId)
    );
    if (index !== -1) {
      this.notifications.splice(index, 1);
      return true;
    }
    return false;
  }

  static clearAll(): void {
    this.notifications = [];
  }
}
