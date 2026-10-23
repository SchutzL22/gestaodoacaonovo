import { Router } from 'express';
import { CertificateController } from '../controllers/CertificateController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();
const certificateController = new CertificateController();

// 🔍 Endpoint público de validação por hash (Sem Autenticação - Estilo Unisul)
// Suporta /api/v1/certificates/validate/:hash e /api/certificates/validate/:hash
router.get('/validate/:hash', certificateController.validate);
router.get('/validate', certificateController.validate);

// Download público do PDF Oficial auditável com QR Code e Hash
router.get('/:id/pdf', certificateController.downloadPdf);

// A partir daqui, requer autenticação
router.use(authMiddleware);

// Listar certificados do usuário ou todos (se COPER)
router.get('/', certificateController.list);

export default router;
