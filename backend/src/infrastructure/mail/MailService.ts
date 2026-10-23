import nodemailer from 'nodemailer';

export class MailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
        port: Number(process.env.SMTP_PORT) || 2525,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      });
    }
    return this.transporter;
  }

  static async sendMail(options: { to: string; subject: string; html: string }): Promise<void> {
    try {
      const transporter = this.getTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"COPER 3.0" <notificacoes@coper.edu.br>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(`[MailService] E-mail enviado com sucesso para: ${options.to} | Assunto: ${options.subject}`);
    } catch (error) {
      console.error(`[MailService] Falha ao enviar e-mail para ${options.to}:`, error);
      // Não propagamos erro fatal em desenvolvimento se o SMTP não estiver configurado
    }
  }

  static async sendWaitlistPromotionNotification(userEmail: string, userName: string, courseTitle: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0d9488;">Parabéns, ${userName}! Uma vaga foi liberada para você!</h2>
        <p>Você estava na fila de espera e acaba de ser <strong>promovido para vaga ATIVA</strong> no curso:</p>
        <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 12px; margin: 16px 0;">
          <h3 style="margin: 0; color: #134e4a;">${courseTitle}</h3>
        </div>
        <p>Acesse o <strong>Sistema COPER 3.0</strong> para visualizar os detalhes da turma, cronograma de aulas e informações do instrutor.</p>
        <p style="margin-top: 24px; color: #64748b; font-size: 13px;">Mensagem automática gerada pelo Sistema COPER 3.0.</p>
      </div>
    `;

    await this.sendMail({
      to: userEmail,
      subject: `[COPER 3.0] Vaga Liberada no Curso: ${courseTitle}`,
      html,
    });
  }
}
