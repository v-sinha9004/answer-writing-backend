import express from 'express';
import { getUsers, createUser, getAllSubmissions, getUserDetails } from '../controllers/admin.js';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/users', getUsers);
// Only Super Admin can create users
router.post('/users', requireSuperAdmin, createUser);
router.get('/users/:id', getUserDetails);

router.get('/submissions', getAllSubmissions);

export default router;
