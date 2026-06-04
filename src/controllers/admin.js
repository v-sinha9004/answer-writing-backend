import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { 
        id: true, name: true, email: true, role: true, createdAt: true,
        submissions: {
          select: { upload_date: true, question_count: true }
        }
      }
    });

    const enrichedUsers = users.map(u => {
      let totalUploads = u.submissions.length;
      let totalQuestions = u.submissions.reduce((acc, sub) => acc + sub.question_count, 0);
      
      // Basic streak/activity calc
      let streak = totalUploads > 0 ? 'Active' : '0 Days';
      
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        totalUploads,
        totalQuestions,
        streak
      };
    });

    res.json(enrichedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        submissions: {
          orderBy: { upload_date: 'desc' }
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: passwordHash,
        role: role || 'USER'
      },
      select: { id: true, name: true, email: true, role: true }
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const getAllSubmissions = async (req, res) => {
  try {
    const { userId, startDate, endDate, paper, topic } = req.query;

    const where = {};
    if (userId) where.userId = userId;
    if (paper) where.paper = paper;
    if (topic) where.topic = { contains: topic, mode: 'insensitive' };
    
    if (startDate || endDate) {
      where.upload_date = {};
      if (startDate) where.upload_date.gte = new Date(startDate);
      if (endDate) where.upload_date.lte = new Date(endDate);
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { upload_date: 'desc' }
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};
