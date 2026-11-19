import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

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

export class PDFGeneratorService {
  private static getLogoBuffer(): Buffer | null {
    const candidatePaths = [
      path.join(process.cwd(), 'backend/src/assets/fmplogo.png'),
      path.join(process.cwd(), 'src/assets/fmplogo.png'),
      path.join(process.cwd(), 'imagens/fmplogo.png'),
      path.join(process.cwd(), 'client/src/assets/fmplogo.png'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          return fs.readFileSync(p);
        } catch {}
      }
    }
    return null;
  }

  private static maskCpf(cpf: string): string {
    const clean = String(cpf || '').replace(/\D/g, '');
    if (clean.length === 11) {
      return `***.${clean.substring(3, 6)}.${clean.substring(6, 9)}-**`;
    }
    return '***.***.***-**';
  }

  private static formatDateLong(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  }

  /**
   * MODELO 1: Comprovante de Doação — Aluno (com horas complementares)
   */
  static async generateStudentDonationPDF(data: StudentDonationPDFData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'portrait',
          margins: { top: 40, bottom: 40, left: 45, right: 45 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const qrBuffer = await QRCode.toBuffer(data.validationUrl, {
          width: 90,
          margin: 1,
          color: { dark: '#06233B', light: '#ffffff' },
        });

        const logoBuffer = this.getLogoBuffer();

        // Moldura externa elegante
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(1.5).strokeColor('#0A3A60').stroke();
        doc.rect(24, 24, doc.page.width - 48, doc.page.height - 48).lineWidth(0.5).strokeColor('#94a3b8').stroke();

        // Cabeçalho Institucional
        let headerY = 38;
        if (logoBuffer) {
          doc.image(logoBuffer, 45, headerY, { width: 55 });
        }

        doc
          .font('Helvetica-Bold')
          .fontSize(13)
          .fillColor('#06233B')
          .text('FACULDADE MUNICIPAL DE PALHOÇA - FMP', 115, headerY + 5)
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#475569')
          .text('Comissão Permanente de Responsabilidade Social e Extensão (COPER)', 115, headerY + 22)
          .text('Credenciada pelo Conselho Estadual de Educação de Santa Catarina', 115, headerY + 34);

        doc.moveTo(40, 105).lineTo(doc.page.width - 40, 105).lineWidth(1).strokeColor('#CBD5E1').stroke();

        // Título do Documento
        doc
          .font('Helvetica-Bold')
          .fontSize(16)
          .fillColor('#0A3A60')
          .text('COMPROVANTE OFICIAL DE DOAÇÃO SOLIDÁRIA', 45, 120, { align: 'center' })
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#059669')
          .text('CÔMPUTO DE HORAS COMPLEMENTARES ACADÊMICAS', { align: 'center' });

        // Caixa de Identificação do Aluno
        doc.roundedRect(45, 165, doc.page.width - 90, 72, 8).fillAndStroke('#F8FAFC', '#E2E8F0');

        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#0F172A')
          .text('DADOS DO ESTUDANTE BENEFICIÁRIO', 55, 175)
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#334155')
          .text(`Nome Completo: `, 55, 192)
          .font('Helvetica-Bold')
          .text(data.userName.toUpperCase(), 140, 192)
          .font('Helvetica')
          .text(`Matrícula FMP: `, 55, 206)
          .font('Helvetica-Bold')
          .text(data.userMatricula || 'Regular', 140, 206)
          .font('Helvetica')
          .text(`CPF: ${this.maskCpf(data.userCpf)}`, 320, 192)
          .text(`E-mail Institucional: ${data.userEmail}`, 320, 206);

        // Detalhamento dos Itens Doados
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#0A3A60')
          .text('ITENS ENTREGUES E CONFERIDOS NO BALCÃO COPER', 45, 255);

        let tableY = 275;
        doc.rect(45, tableY, doc.page.width - 90, 20).fill('#0A3A60');
        doc
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor('#FFFFFF')
          .text('ITEM / DESCRIÇÃO', 55, tableY + 5)
          .text('CATEGORIA', 280, tableY + 5)
          .text('QUANTIDADE', 440, tableY + 5, { align: 'right', width: 60 });

        tableY += 20;

        const itemsList = data.items && data.items.length > 0 ? data.items : [{ description: 'Doação Solidária', quantity: 1, unit: 'itens' }];
        itemsList.forEach((it, idx) => {
          const isEven = idx % 2 === 0;
          if (isEven) {
            doc.rect(45, tableY, doc.page.width - 90, 18).fill('#F1F5F9');
          }
          doc
            .font('Helvetica')
            .fontSize(8.5)
            .fillColor('#1E293B')
            .text(it.description, 55, tableY + 4, { width: 220, ellipsis: true })
            .text(it.category || 'GERAL', 280, tableY + 4)
            .text(`${it.quantity} ${it.unit || 'un.'}`, 440, tableY + 4, { align: 'right', width: 60 });
          tableY += 18;
        });

        // DESTAQUE: HORAS COMPLEMENTARES
        const hoursBoxY = tableY + 18;
        doc.roundedRect(45, hoursBoxY, doc.page.width - 90, 58, 8).fillAndStroke('#ECFDF5', '#10B981');
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor('#065F46')
          .text('TOTAL DE HORAS COMPLEMENTARES HOMOLOGADAS', 55, hoursBoxY + 12)
          .fontSize(22)
          .fillColor('#047857')
          .text(`${data.hoursEarned || 0} HORAS`, 55, hoursBoxY + 28)
          .fontSize(8.5)
          .font('Helvetica')
          .fillColor('#065F46')
          .text(
            'Horas computadas diretamente no histórico acadêmico do estudante, válidas para atividades complementares de extensão social.',
            210,
            hoursBoxY + 24,
            { width: 290 }
          );

        // Dados de Validação e Balcão
        const valY = hoursBoxY + 75;
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#475569')
          .text(`Recebido e Conferido por: `, 45, valY)
          .font('Helvetica-Bold')
          .text(data.receivedByName || 'Equipe de Atendimento COPER FMP', 180, valY)
          .font('Helvetica')
          .text(`Homologado por: `, 45, valY + 15)
          .font('Helvetica-Bold')
          .text(data.validatedByName || 'Coordenação COPER FMP', 180, valY + 15)
          .font('Helvetica')
          .text(`Data da Homologação: `, 45, valY + 30)
          .font('Helvetica-Bold')
          .text(this.formatDateLong(data.approvedAt), 180, valY + 30);

        // Rodapé de Autenticidade com QR Code (Estilo Unisul)
        const footerY = doc.page.height - 130;
        doc.rect(45, footerY, doc.page.width - 90, 78).fillAndStroke('#F8FAFC', '#CBD5E1');
        doc.image(qrBuffer, 52, footerY + 4, { width: 70 });

        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#0A3A60')
          .text('AUTENTICIDADE DIGITAL E AUDITORIA OFICIAL (MODELO UNISUL / FMP)', 135, footerY + 10)
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#475569')
          .text(`Código Verificador (Hash): `, 135, footerY + 24)
          .font('Helvetica-Bold')
          .fillColor('#0F172A')
          .text(data.authHash, 245, footerY + 24)
          .font('Helvetica')
          .fillColor('#475569')
          .text(`URL de Validação: ${data.validationUrl}`, 135, footerY + 36)
          .text(
            'Este comprovante foi assinado e emitido digitalmente pelo Sistema COPER 3.0. Para validar este documento, aponte a câmera para o QR Code acima ou acesse o endereço de validação informando o código hash.',
            135,
            footerY + 48,
            { width: 360 }
          );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * MODELO 2: Comprovante de Doação — Civil / Professor (Sem menção a horas)
   */
  static async generateCivilOrProfessorDonationPDF(data: CivilOrProfessorDonationPDFData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'portrait',
          margins: { top: 40, bottom: 40, left: 45, right: 45 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const qrBuffer = await QRCode.toBuffer(data.validationUrl, {
          width: 90,
          margin: 1,
          color: { dark: '#06233B', light: '#ffffff' },
        });

        const logoBuffer = this.getLogoBuffer();

        // Moldura externa azul institucional
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(1.5).strokeColor('#1E3A8A').stroke();
        doc.rect(24, 24, doc.page.width - 48, doc.page.height - 48).lineWidth(0.5).strokeColor('#94a3b8').stroke();

        // Cabeçalho Institucional
        const headerY = 38;
        if (logoBuffer) {
          doc.image(logoBuffer, 45, headerY, { width: 55 });
        }

        doc
          .font('Helvetica-Bold')
          .fontSize(13)
          .fillColor('#06233B')
          .text('FACULDADE MUNICIPAL DE PALHOÇA - FMP', 115, headerY + 5)
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#475569')
          .text('Comissão Permanente de Responsabilidade Social e Extensão (COPER)', 115, headerY + 22)
          .text('Campanhas Comunitárias e Ação Social Regional de Palhoça', 115, headerY + 34);

        doc.moveTo(40, 105).lineTo(doc.page.width - 40, 105).lineWidth(1).strokeColor('#CBD5E1').stroke();

        // Título do Documento
        doc
          .font('Helvetica-Bold')
          .fontSize(16)
          .fillColor('#1E3A8A')
          .text('COMPROVANTE DE DOAÇÃO E AÇÃO SOCIAL', 45, 120, { align: 'center' })
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#475569')
          .text('CERTIFICADO DE RESPONSABILIDADE SOCIAL E CIDADANIA', { align: 'center' });

        // Caixa de Identificação do Doador
        doc.roundedRect(45, 160, doc.page.width - 90, 68, 8).fillAndStroke('#F8FAFC', '#E2E8F0');

        const roleLabel = data.userRole === 'PROFESSOR' ? 'PROFESSOR(A) / CORPO DOCENTE FMP' : data.userRole === 'EMPRESARIO' ? 'PARCEIRO EMPRESARIAL' : 'DOADOR DA COMUNIDADE (CIVIL)';

        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#0F172A')
          .text(`DADOS DO DOADOR • ${roleLabel}`, 55, 170)
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#334155')
          .text(`Nome Completo: `, 55, 187)
          .font('Helvetica-Bold')
          .text(data.userName.toUpperCase(), 140, 187)
          .font('Helvetica')
          .text(`CPF: ${this.maskCpf(data.userCpf)}`, 55, 201)
          .text(`E-mail de Contato: ${data.userEmail || 'Informado no balcão'}`, 280, 201);

        // Texto Institucional de Agradecimento e Reconhecimento
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#334155')
          .text(
            'A Direção da Faculdade Municipal de Palhoça e a Coordenação da COPER declaram para os devidos fins e agradecem publicamente a valiosa contribuição solidária discriminada abaixo, destinada aos projetos de assistência social e cidadania comunitária da nossa região:',
            45,
            242,
            { align: 'justify', lineGap: 3 }
          );

        // Detalhamento dos Itens Doados
        let tableY = 295;
        doc.rect(45, tableY, doc.page.width - 90, 20).fill('#1E3A8A');
        doc
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .fillColor('#FFFFFF')
          .text('ITEM / BEM DOADO', 55, tableY + 5)
          .text('CATEGORIA', 280, tableY + 5)
          .text('QUANTIDADE', 440, tableY + 5, { align: 'right', width: 60 });

        tableY += 20;

        const itemsList = data.items && data.items.length > 0 ? data.items : [{ description: 'Doação Solidária', quantity: 1, unit: 'itens' }];
        itemsList.forEach((it, idx) => {
          const isEven = idx % 2 === 0;
          if (isEven) {
            doc.rect(45, tableY, doc.page.width - 90, 18).fill('#F1F5F9');
          }
          doc
            .font('Helvetica')
            .fontSize(8.5)
            .fillColor('#1E293B')
            .text(it.description, 55, tableY + 4, { width: 220, ellipsis: true })
            .text(it.category || 'GERAL', 280, tableY + 4)
            .text(`${it.quantity} ${it.unit || 'un.'}`, 440, tableY + 4, { align: 'right', width: 60 });
          tableY += 18;
        });

        // Termo de Não Concessão de Horas e Registro de Validação
        const boxY = tableY + 16;
        doc.roundedRect(45, boxY, doc.page.width - 90, 48, 8).fillAndStroke('#EFF6FF', '#BFDBFE');
        doc
          .font('Helvetica-Bold')
          .fontSize(9.5)
          .fillColor('#1E40AF')
          .text('RECONHECIMENTO DE RESPONSABILIDADE SOCIAL INSTITUCIONAL', 55, boxY + 10)
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor('#1E3A8A')
          .text(
            'Este documento comprova formalmente o recebimento dos bens para fins de prestação de contas sociais e doação voluntária, sem geração de créditos ou horas curriculares de graduação.',
            55,
            boxY + 24,
            { width: doc.page.width - 110 }
          );

        // Responsáveis e Data
        const valY = boxY + 62;
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#475569')
          .text(`Recebido e Registrado por: `, 45, valY)
          .font('Helvetica-Bold')
          .text(data.receivedByName || 'Equipe COPER FMP', 180, valY)
          .font('Helvetica')
          .text(`Homologado por: `, 45, valY + 15)
          .font('Helvetica-Bold')
          .text(data.validatedByName || 'Coordenação de Extensão COPER', 180, valY + 15)
          .font('Helvetica')
          .text(`Data do Recebimento: `, 45, valY + 30)
          .font('Helvetica-Bold')
          .text(this.formatDateLong(data.approvedAt), 180, valY + 30);

        // Rodapé de Autenticidade com QR Code
        const footerY = doc.page.height - 130;
        doc.rect(45, footerY, doc.page.width - 90, 78).fillAndStroke('#F8FAFC', '#CBD5E1');
        doc.image(qrBuffer, 52, footerY + 4, { width: 70 });

        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#0A3A60')
          .text('AUTENTICIDADE DIGITAL E AUDITORIA OFICIAL (MODELO UNISUL / FMP)', 135, footerY + 10)
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#475569')
          .text(`Código Verificador (Hash): `, 135, footerY + 24)
          .font('Helvetica-Bold')
          .fillColor('#0F172A')
          .text(data.authHash, 245, footerY + 24)
          .font('Helvetica')
          .fillColor('#475569')
          .text(`URL de Validação: ${data.validationUrl}`, 135, footerY + 36)
          .text(
            'Documento emitido pelo Sistema COPER 3.0. Para verificar a autenticidade e a data de entrega, aponte a câmera para o QR Code ao lado ou acesse o portal de validação.',
            135,
            footerY + 48,
            { width: 360 }
          );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * MODELO 3: Certificado de Conclusão de Curso Extracurricular (Paisagem / Diploma)
   */
  static async generateCourseCertificatePDF(data: CourseCertificatePDFData): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margins: { top: 35, bottom: 35, left: 45, right: 45 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        const qrBuffer = await QRCode.toBuffer(data.validationUrl, {
          width: 85,
          margin: 1,
          color: { dark: '#06233B', light: '#ffffff' },
        });

        const logoBuffer = this.getLogoBuffer();

        // Moldura Nobre de Certificado / Diploma
        const pw = doc.page.width;
        const ph = doc.page.height;

        doc.rect(20, 20, pw - 40, ph - 40).lineWidth(3).strokeColor('#0A3A60').stroke();
        doc.rect(25, 25, pw - 50, ph - 50).lineWidth(1).strokeColor('#10B981').stroke();
        doc.rect(28, 28, pw - 56, ph - 56).lineWidth(0.5).strokeColor('#CBD5E1').stroke();

        // Logo e Cabeçalho
        if (logoBuffer) {
          doc.image(logoBuffer, (pw - 60) / 2, 42, { width: 60 });
        }

        const titleStartY = logoBuffer ? 112 : 60;

        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .fillColor('#06233B')
          .text('FACULDADE MUNICIPAL DE PALHOÇA - FMP', 0, titleStartY, { align: 'center' })
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#475569')
          .text('Comissão Permanente de Responsabilidade Social e Extensão Universitária (COPER)', { align: 'center' })
          .moveDown(0.8);

        doc
          .font('Helvetica-Bold')
          .fontSize(26)
          .fillColor('#0A3A60')
          .text('CERTIFICADO DE CONCLUSÃO', { align: 'center', characterSpacing: 2 })
          .moveDown(0.9);

        // Período formatado
        const periodoStr = data.startDate && data.endDate
          ? `no período de ${this.formatDateLong(data.startDate)} a ${this.formatDateLong(data.endDate)}`
          : 'no semestre letivo regulamentar';

        const matriculaStr = data.userMatricula ? `, matrícula nº ${data.userMatricula}` : '';
        const gradeStr = data.finalGrade !== null && data.finalGrade !== undefined
          ? `, com média de aprovação ${data.finalGrade.toFixed(1)} e frequência de ${data.attendancePct || 100}%`
          : '';

        // Texto do Certificado
        doc
          .font('Helvetica')
          .fontSize(13)
          .fillColor('#1E293B')
          .text(
            `Certificamos que `,
            65,
            doc.y,
            { align: 'justify', continued: true }
          )
          .font('Helvetica-Bold')
          .text(`${data.userName.toUpperCase()}`, { continued: true })
          .font('Helvetica')
          .text(
            `${matriculaStr}, portador(a) do CPF nº ${this.maskCpf(data.userCpf)}, concluiu com êxito o curso de extensão curricular `,
            { continued: true }
          )
          .font('Helvetica-Bold')
          .fillColor('#0A3A60')
          .text(`"${data.courseTitle}"`, { continued: true })
          .font('Helvetica')
          .fillColor('#1E293B')
          .text(
            `, ${periodoStr}${gradeStr}, perfazendo a carga horária total de `,
            { continued: true }
          )
          .font('Helvetica-Bold')
          .fillColor('#059669')
          .text(`${data.workloadHours} horas complementares.`)
          .moveDown(1.2);

        // Data de Emissão
        doc
          .font('Helvetica-Oblique')
          .fontSize(11)
          .fillColor('#475569')
          .text(`Palhoça - SC, ${this.formatDateLong(data.issuedAt)}.`, 0, doc.y, { align: 'center' });

        // Assinaturas Digitais / Selos
        const signY = ph - 130;

        // Linha 1: Professor
        doc.moveTo(100, signY).lineTo(310, signY).lineWidth(0.8).strokeColor('#64748B').stroke();
        doc
          .font('Helvetica-Bold')
          .fontSize(9.5)
          .fillColor('#0F172A')
          .text(data.instructorName || 'Prof. Responsável', 100, signY + 5, { width: 210, align: 'center' })
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#64748B')
          .text('Docente / Instrutor do Curso', 100, signY + 18, { width: 210, align: 'center' });

        // Linha 2: Coordenação COPER
        doc.moveTo(pw - 310, signY).lineTo(pw - 100, signY).lineWidth(0.8).strokeColor('#64748B').stroke();
        doc
          .font('Helvetica-Bold')
          .fontSize(9.5)
          .fillColor('#0F172A')
          .text('Coordenação Geral COPER', pw - 310, signY + 5, { width: 210, align: 'center' })
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#64748B')
          .text('Faculdade Municipal de Palhoça', pw - 310, signY + 18, { width: 210, align: 'center' });

        // Bloco de Autenticidade e QR Code no Rodapé
        const qrY = ph - 90;
        doc.image(qrBuffer, 45, qrY, { width: 55 });

        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor('#0A3A60')
          .text('AUTENTICIDADE DIGITAL (MODELO UNISUL / FMP)', 108, qrY + 4)
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#475569')
          .text(`Código Verificador (Hash): ${data.authHash}`, 108, qrY + 16)
          .text(`Validação pública disponível em: ${data.validationUrl}`, 108, qrY + 27)
          .text(
            'Documento chancelado digitalmente em conformidade com o regimento acadêmico de extensão universitária da FMP.',
            108,
            qrY + 38,
            { width: pw - 230 }
          );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Despachador de compatibilidade genérica
   */
  static async generateCertificateBuffer(data: any): Promise<Buffer> {
    if (data.type === 'COURSE_CERTIFICATE') {
      return this.generateCourseCertificatePDF({
        authHash: data.authHash,
        validationUrl: data.validationUrl,
        userName: data.userName,
        userMatricula: data.matricula || data.userMatricula,
        userCpf: data.userCpf,
        courseTitle: data.title,
        workloadHours: data.hours || 40,
        startDate: data.startDate,
        endDate: data.endDate,
        instructorName: data.instructorName,
        finalGrade: data.finalGrade,
        attendancePct: data.attendancePct,
        issuedAt: data.issuedAt || new Date(),
      });
    }

    // Doação
    if (data.userRole === 'ALUNO') {
      return this.generateStudentDonationPDF({
        authHash: data.authHash,
        validationUrl: data.validationUrl,
        userName: data.userName,
        userMatricula: data.matricula || data.userMatricula,
        userEmail: data.userEmail || '',
        userCpf: data.userCpf,
        items: data.items || [],
        hoursEarned: data.hours || 0,
        receivedByName: data.receivedByName,
        validatedByName: data.validatedByName,
        approvedAt: data.issuedAt || new Date(),
        campaignTitle: data.title,
      });
    }

    return this.generateCivilOrProfessorDonationPDF({
      authHash: data.authHash,
      validationUrl: data.validationUrl,
      userName: data.userName,
      userRole: data.userRole || 'CIVIL',
      userCpf: data.userCpf,
      userEmail: data.userEmail,
      items: data.items || [],
      receivedByName: data.receivedByName,
      validatedByName: data.validatedByName,
      approvedAt: data.issuedAt || new Date(),
      observation: data.description,
      campaignTitle: data.title,
    });
  }
}
