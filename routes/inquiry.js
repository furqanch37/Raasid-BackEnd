import express from 'express';
import { submitInquiry, getAllInquiries } from '../controllers/inquiry.js';

const router = express.Router();

router.post('/submitinquiry', submitInquiry);  // POST /api/inquiry
router.get('/inquiries', getAllInquiries); // GET /api/inquiries

export default router;
