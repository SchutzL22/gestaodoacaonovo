"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class MailService {
    static transporter = null;
    static getTransporter() {
        if (!this.transporter) {
            this.transporter = nodemailer_1.default.createTransport({
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
    static async sendMail(options) {
        try {
            if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
                console.log(`[MailService:FALLBACK_LOG] SMTP não configurado. E-mail simulado com sucesso:\n` +
                    `  Para: ${options.to}\n` +
                    `  Assunto: ${options.subject}\n` +
                    `  Corpo: ${options.html.substring(0, 150).replace(/\s+/g, ' ')}...`);
                return;
            }
            const transporter = this.getTransporter();
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"COPER 3.0 - FMP" <notificacoes@coper.edu.br>',
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
            console.log(`[MailService] E-mail enviado com sucesso para: ${options.to} | Assunto: ${options.subject}`);
        }
        catch (error) {
            console.error(`[MailService] Falha ao enviar e-mail para ${options.to} (fallback seguro ativado):`, error);
        }
    }
    static async sendWaitlistPromotionNotification(userEmail, userName, courseTitle) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0A3A60; margin-bottom: 4px;">FACULDADE MUNICIPAL DE PALHOÇA</h2>
          <p style="color: #64748b; font-size: 13px; margin: 0;">Comissão Permanente de Responsabilidade Social e Extensão (COPER 3.0)</p>
        </div>
        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 8px 0; color: #166534;">🎉 Parabéns, ${userName}! Uma vaga foi liberada para você!</h3>
          <p style="margin: 0; color: #1e293b; font-size: 14px;">Você estava na fila de espera e acaba de ser <strong>promovido para vaga ATIVA</strong> no curso:</p>
          <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: bold; color: #0f172a;">${courseTitle}</p>
        </div>
        <p style="color: #334155; line-height: 1.5; font-size: 14px;">
          Acesse a plataforma para consultar o diário de classe, cronograma de aulas e informações complementares da turma.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${frontendUrl}/aluno/cursos" style="background-color: #0A3A60; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Acessar Meus Cursos
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
          Mensagem automática gerada pelo Sistema COPER 3.0 • FMP Palhoça
        </p>
      </div>
    `;
        await this.sendMail({
            to: userEmail,
            subject: `[COPER 3.0] Vaga Liberada no Curso: ${courseTitle}`,
            html,
        });
    }
    static async sendDonationStatusNotification(options) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const isApproved = options.status === 'APPROVED';
        let contentHtml = '';
        let subject = '';
        if (isApproved) {
            subject = `[COPER 3.0] Sua Doação foi Aprovada com Sucesso!`;
            const validationLink = options.authHash ? `${frontendUrl}/validar?code=${options.authHash}` : `${frontendUrl}/historico`;
            const hoursBadge = options.isStudent && (options.hoursEarned || 0) > 0
                ? `
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 12px; margin: 16px 0; text-align: center;">
            <span style="font-size: 13px; color: #065f46; font-weight: bold; display: block;">HORAS COMPLEMENTARES HOMOLOGADAS</span>
            <span style="font-size: 26px; color: #047857; font-weight: bold;">+${options.hoursEarned} HORAS</span>
            <span style="font-size: 12px; color: #065f46; display: block; margin-top: 4px;">Creditas diretamente no seu histórico acadêmico FMP</span>
          </div>
        `
                : `
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 12px; margin: 16px 0; text-align: center;">
            <span style="font-size: 14px; color: #1e40af; font-weight: bold;">Agradecemos sua valiosa contribuição solidária e compromisso comunitário!</span>
          </div>
        `;
            contentHtml = `
        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 6px 0; color: #166534;">Doação Homologada!</h3>
          <p style="margin: 0; color: #1e293b; font-size: 14px;">Olá, <strong>${options.userName}</strong>. Os itens doados foram conferidos e aprovados pela equipe do balcão COPER.</p>
        </div>
        ${hoursBadge}
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
          Seu comprovante oficial assinado digitalmente com código verificador e QR Code já está disponível para consulta pública e download.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${validationLink}" style="background-color: #0A3A60; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Visualizar Comprovante Oficial
          </a>
        </div>
      `;
        }
        else {
            subject = `[COPER 3.0] Atualização sobre sua Solicitação de Doação`;
            contentHtml = `
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 6px 0; color: #991b1b;">Solicitação Não Homologada</h3>
          <p style="margin: 0; color: #1e293b; font-size: 14px;">Olá, <strong>${options.userName}</strong>. Infelizmente sua doação não pôde ser homologada neste momento.</p>
        </div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin: 16px 0;">
          <strong style="color: #475569; font-size: 13px;">Motivo informado pelo avaliador:</strong>
          <p style="margin: 6px 0 0 0; color: #0f172a; font-size: 14px;">${options.rejectionReason || 'Itens em desacordo com as diretrizes da campanha ou documentação incompleta.'}</p>
        </div>
        <p style="color: #64748b; font-size: 13px;">
          Caso tenha dúvidas, dirija-se ao balcão de atendimento presencial da COPER na FMP ou responda a esta mensagem.
        </p>
      `;
        }
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0A3A60; margin-bottom: 4px;">FACULDADE MUNICIPAL DE PALHOÇA</h2>
          <p style="color: #64748b; font-size: 13px; margin: 0;">Comissão Permanente de Responsabilidade Social e Extensão (COPER 3.0)</p>
        </div>
        ${contentHtml}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
          Mensagem oficial gerada pelo Sistema COPER 3.0 • FMP Palhoça
        </p>
      </div>
    `;
        await this.sendMail({
            to: options.userEmail,
            subject,
            html,
        });
    }
    static async sendCourseCertificateNotification(options) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const validationUrl = `${frontendUrl}/validar?code=${options.authHash}`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0A3A60; margin-bottom: 4px;">FACULDADE MUNICIPAL DE PALHOÇA</h2>
          <p style="color: #64748b; font-size: 13px; margin: 0;">Certificação Oficial de Extensão Universitária (COPER 3.0)</p>
        </div>
        <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 8px 0; color: #166534;">🎓 Parabéns pela Conclusão, ${options.userName}!</h3>
          <p style="margin: 0; color: #1e293b; font-size: 14px;">Você concluiu com êxito o curso de extensão:</p>
          <p style="margin: 8px 0 0 0; font-size: 16px; font-weight: bold; color: #0f172a;">${options.courseTitle}</p>
        </div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin: 16px 0;">
          <p style="margin: 0 0 6px 0; color: #334155; font-size: 14px;"><strong>Carga Horária:</strong> ${options.workloadHours} horas</p>
          <p style="margin: 0; color: #334155; font-size: 14px;"><strong>Código de Autenticidade (Hash):</strong> <code style="font-family: monospace; color: #0A3A60;">${options.authHash}</code></p>
        </div>
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
          Seu certificado digital oficial com QR Code e validade jurídica para atividades complementares está disponível para consulta e download.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${validationUrl}" style="background-color: #0A3A60; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Visualizar e Baixar Certificado
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
          Mensagem oficial gerada pelo Sistema COPER 3.0 • FMP Palhoça
        </p>
      </div>
    `;
        await this.sendMail({
            to: options.userEmail,
            subject: `[COPER 3.0] Certificado de Conclusão Disponível: ${options.courseTitle}`,
            html,
        });
    }
}
exports.MailService = MailService;
