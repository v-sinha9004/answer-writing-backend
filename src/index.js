import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import submissionRoutes from './routes/submissions.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/', (req, res) => res.send('UPSC Answer Tracker API is running'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/submissions', submissionRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
