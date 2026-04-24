import express from 'express';
import { searchEverything } from '../controllers/searchController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, searchEverything);

export default router;