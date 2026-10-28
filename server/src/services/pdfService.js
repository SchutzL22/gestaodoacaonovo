const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Gera o buffer do PDF oficial do Certificado de Doação FMP / COPER
 */
async function gerarCertificadoPDF(dados) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 35, bottom: 35, left: 45, right: 45 }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const validationUrl = dados.validationUrl || `http://localhost:5173/validar?code=${dados.token}`;

      // Gera QR Code em Buffer
      const qrBuffer = await QRCode.toBuffer(validationUrl, {
        width: 110,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      });

      const width = doc.page.width;
      const height = doc.page.height;

      // Moldura externa elegante
      doc.rect(20, 20, width - 40, height - 40)
         .lineWidth(2.5)
         .strokeColor('#0284c7')
         .stroke();

      // Moldura interna sutil
      doc.rect(26, 26, width - 52, height - 52)
         .lineWidth(0.8)
         .strokeColor('#94a3b8')
         .stroke();

      // Barra superior com gradiente visual
      doc.rect(27, 27, width - 54, 75)
         .fillColor('#0f172a')
         .fill();

      // Cabeçalho Institucional
      doc.fillColor('#38bdf8')
         .font('Helvetica-Bold')
         .fontSize(16)
         .text('FACULDADE MUNICIPAL DE PALHOÇA — FMP', 45, 42, { align: 'left' });

      doc.fillColor('#94a3b8')
         .font('Helvetica')
         .fontSize(10)
         .text('SISTEMA COPER 3.0 • GESTÃO DE DOAÇÕES SOCIAIS E EXTENSÃO UNIVERSITÁRIA', 45, 64, { align: 'left' });

      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('DOCUMENTO OFICIAL AUDITÁVEL', width - 245, 52, { align: 'right', width: 190 });

      // Título do Certificado
      doc.fillColor('#0f172a')
         .font('Helvetica-Bold')
         .fontSize(22)
         .text('DECLARAÇÃO DE DOAÇÃO SOCIAL E HORAS COMPLEMENTARES', 45, 125, { align: 'center', width: width - 90 });

      // Linha decorativa
      doc.moveTo(width / 2 - 120, 155)
         .lineTo(width / 2 + 120, 155)
         .lineWidth(2)
         .strokeColor('#0284c7')
         .stroke();

      // Corpo do Certificado
      const horasStr = Number(dados.horasConcedidas || 0).toFixed(1);
      const dataEmissaoStr = dados.dataEmissao 
        ? new Date(dados.dataEmissao).toLocaleDateString('pt-BR') 
        : new Date().toLocaleDateString('pt-BR');

      doc.fillColor('#334155')
         .font('Helvetica')
         .fontSize(13)
         .text(
           `Certificamos para os devidos fins acadêmicos e legais que o(a) aluno(a) abaixo qualificado(a) realizou a doação voluntária descrita nesta declaração, tendo sua participação aprovada pela coordenação do COPER com direito a horas de atividades complementares:`,
           55, 175, { align: 'justify', lineGap: 5, width: width - 110 }
         );

      // Caixa de Destaque com Dados do Aluno e Doação
      const boxY = 230;
      doc.rect(55, boxY, width - 110, 120)
         .fillColor('#f8fafc')
         .fill()
         .strokeColor('#cbd5e1')
         .lineWidth(1)
         .stroke();

      // Coluna 1
      doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('ALUNO(A):', 75, boxY + 15);
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(13).text(dados.alunoNome || 'Aluno(a) Institucional', 75, boxY + 28);

      doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('MATRÍCULA:', 75, boxY + 52);
      doc.fillColor('#0f172a').font('Helvetica').fontSize(11).text(dados.alunoMatricula || '—', 75, boxY + 65);

      doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('CURSO / VÍNCULO:', 75, boxY + 86);
      doc.fillColor('#0f172a').font('Helvetica').fontSize(11).text(dados.alunoCurso || 'Graduação FMP', 75, boxY + 98);

      // Coluna 2
      const col2X = 320;
      doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('CAMPANHA BENEFICIADA:', col2X, boxY + 15);
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12).text(dados.campanhaTitulo || 'Ação Social COPER', col2X, boxY + 28);

      doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('ITEM E QUANTIDADE:', col2X, boxY + 52);
      doc.fillColor('#0f172a').font('Helvetica').fontSize(11).text(`${dados.quantidade || 1} un. de ${dados.tipoItem || 'Doação'}`, col2X, boxY + 65);

      doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('DATA DA DOAÇÃO:', col2X, boxY + 86);
      doc.fillColor('#0f172a').font('Helvetica').fontSize(11).text(dados.dataDoacao || dataEmissaoStr, col2X, boxY + 98);

      // Coluna 3 - Badge de Horas
      const col3X = width - 240;
      doc.rect(col3X, boxY + 18, 160, 84)
         .fillColor('#e0f2fe')
         .fill()
         .strokeColor('#0284c7')
         .lineWidth(1.5)
         .stroke();

      doc.fillColor('#0369a1').font('Helvetica-Bold').fontSize(9).text('HORAS COMPLEMENTARES', col3X, boxY + 28, { width: 160, align: 'center' });
      doc.fillColor('#0284c7').font('Helvetica-Bold').fontSize(28).text(`+${horasStr}h`, col3X, boxY + 44, { width: 160, align: 'center' });
      doc.fillColor('#0369a1').font('Helvetica').fontSize(8.5).text('Atividade de Extensão', col3X, boxY + 80, { width: 160, align: 'center' });

      // Rodapé com QR Code e Hash de Validação
      const footerY = height - 145;

      // Insere o QR Code
      doc.image(qrBuffer, 55, footerY, { width: 85 });

      // Textos de validação ao lado do QR Code
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10).text('VERIFICAÇÃO DE AUTENTICIDADE PÚBLICA (QR CODE)', 155, footerY + 5);
      doc.fillColor('#475569').font('Helvetica').fontSize(8.5).text(
        'Este documento é assinado digitalmente e pode ser validado por qualquer instituição ou empresa parceira apontando a câmera para o QR Code ou digitando o código verificador no portal.',
        155, footerY + 20, { width: 380, lineGap: 3 }
      );

      doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8.5).text('CÓDIGO VERIFICADOR (HASH):', 155, footerY + 56);
      doc.fillColor('#0369a1').font('Courier-Bold').fontSize(11).text(dados.token || 'COPER-VERIFY-HASH', 155, footerY + 68);

      // Data de emissão e carimbo institucional
      doc.fillColor('#64748b').font('Helvetica').fontSize(8.5).text(`Emitido em: ${dataEmissaoStr}`, width - 240, footerY + 45, { align: 'right', width: 185 });
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9).text('COORDENAÇÃO COPER / FMP', width - 240, footerY + 62, { align: 'right', width: 185 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  gerarCertificadoPDF
};
