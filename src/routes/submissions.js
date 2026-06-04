import express from 'express';
import multer from 'multer';
import os from 'os';
import { uploadSubmission, getMySubmissions, getStats, viewPdf } from '../controllers/submissions.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();
const upload = multer({ dest: os.tmpdir() });

router.use(authenticate);

router.post('/upload', upload.single('file'), uploadSubmission);
router.get('/', getMySubmissions);
router.get('/stats', getStats);
router.get('/:id/view', viewPdf);

export default router;
