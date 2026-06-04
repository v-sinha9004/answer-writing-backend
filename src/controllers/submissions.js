import { PrismaClient } from '@prisma/client';
import { uploadPdfToSupabase } from '../services/storage.js';

const prisma = new PrismaClient();

export const uploadSubmission = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    if (req.file.size > 20 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 20MB limit' });
    }

    const { paper, topic, question_count, upload_date } = req.body;
    
    // Upload to Supabase Storage
    const fileName = `${req.user.name}_${paper}_${new Date().toISOString().split('T')[0]}.pdf`;
    req.file.originalname = fileName;
    
    const { path, url } = await uploadPdfToSupabase(req.file);

    // Save in Database
    const submission = await prisma.submission.create({
      data: {
        userId: req.user.id,
        paper,
        topic,
        question_count: parseInt(question_count, 10),
        upload_date: upload_date ? new Date(upload_date) : new Date(),
        file_path: path,
        file_url: url
      }
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
};

export const getMySubmissions = async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { userId: req.user.id },
      orderBy: { upload_date: 'desc' }
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

export const getStats = async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { userId: req.user.id },
      orderBy: { upload_date: 'asc' },
      select: { upload_date: true, question_count: true, paper: true }
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const viewPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await prisma.submission.findUnique({ where: { id } });
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // RBAC Check
    if (submission.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Cannot view other users submissions' });
    }

    res.json({ url: submission.file_url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch PDF URL' });
  }
};
