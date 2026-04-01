import express from 'express';
import { createPost, getFeed, toggleLike } from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getFeed);
router.post('/', protect, createPost);
router.put('/:id/like', protect, toggleLike);

export default router;