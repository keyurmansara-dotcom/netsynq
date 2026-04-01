import express from 'express';
import { getMyProfile, updateProfile } from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', protect, getMyProfile);
router.put('/update', protect, updateProfile);

export default router;