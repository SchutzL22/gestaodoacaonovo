"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFGeneratorService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const qrcode_1 = __importDefault(require("qrcode"));
class PDFGeneratorService {
    static async generateCertificateBuffer(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({
                    size: 'A4',
                    layout: 'landscape',
                    margins: { top: 40, bottom: 40, left: 50, right: 50 },
                });
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));
                const qrCodeBuffer = await qrcode_1.default.toBuffer(data.validationUrl, {
                    width: 110,
                    margin: 1,
                    color: {
                        dark: '#0f172a',
                        light: '#ffffff',
                    },
                });
                const isCourse = data.type === 'COURSE_CERTIFICATE';
                const docTitle = isCourse ? 'CERTIFICADO DE CONCLUSÃO' : 'DECLARAÇÃO DE DOAÇÃO SOCIAL';
                const mainColor = isCourse ? '#0284c7' : '#059669';
                doc
                    .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
                    .lineWidth(2)
                    .strokeColor(mainColor)
                    .stroke();
                doc
                    .rect(26, 26, doc.page.width - 52, doc.page.height - 52)
                    .lineWidth(0.5)
                    .strokeColor('#94a3b8')
                    .stroke();
                doc
                    .font('Helvetica-Bold')
                    .fontSize(16)
                    .fillColor('#0f172a')
                    .text('INSTITUIÇÃO DE ENSINO SUPERIOR - SISTEMA COPER 3.0', { align: 'center' });
                doc
                    .fontSize(10)
                    .font('Helvetica')
                    .fillColor('#64748b')
                    .text('Comissão Permanente de Responsabilidade Social e Extensão Universitária', { align: 'center' })
                    .moveDown(1.5);
                doc
                    .font('Helvetica-Bold')
                    .fontSize(24)
                    .fillColor(mainColor)
                    .text(docTitle, { align: 'center', characterSpacing: 1.5 })
                    .moveDown(1.2);
                doc.font('Helvetica').fontSize(14).fillColor('#334155');
                let textBody = '';
                if (isCourse) {
                    textBody = `Certificamos que ${data.userName.toUpperCase()}, inscrito(a) sob o CPF nº ${data.userCpf}, concluiu com aproveitamento e frequência regulamentar o curso de extensão "${data.title}", totalizando carga horária de ${data.hours || 0} horas complementares.`;
                }
                else {
                    textBody = `Declaramos para os devidos fins que ${data.userName.toUpperCase()}, inscrito(a) sob o CPF nº ${data.userCpf}, realizou doações solidárias em prol dos projetos comunitários institucionais, correspondendo ao cômputo de ${data.hours || 0} horas de atividades complementares sociais.`;
                }
                doc.text(textBody, {
                    align: 'justify',
                    lineGap: 6,
                });
                doc.moveDown(2);
                const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                }).format(data.issuedAt);
                doc
                    .font('Helvetica-Oblique')
                    .fontSize(12)
                    .fillColor('#475569')
                    .text(`Emitido em ${dateFormatted}.`, { align: 'right' });
                const bottomY = doc.page.height - 130;
                doc.image(qrCodeBuffer, 45, bottomY, { width: 80 });
                doc
                    .font('Helvetica-Bold')
                    .fontSize(10)
                    .fillColor('#0f172a')
                    .text('AUTENTICIDADE DO DOCUMENTO', 135, bottomY + 5);
                doc
                    .font('Helvetica')
                    .fontSize(9)
                    .fillColor('#475569')
                    .text(`Código Verificador (Hash): ${data.authHash}`, 135, bottomY + 22)
                    .text(`Acesse para validar: ${data.validationUrl}`, 135, bottomY + 37)
                    .text('Documento assinado digitalmente em conformidade com o regimento institucional de extensão.', 135, bottomY + 52, { width: 450 });
                doc.end();
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
exports.PDFGeneratorService = PDFGeneratorService;
