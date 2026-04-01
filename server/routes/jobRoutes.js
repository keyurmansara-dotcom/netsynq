import express from 'express';
import { applyJob, createJob, getJobs } from '../controllers/jobController.js';
import { protect, recruiterOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getJobs);
router.post('/', protect, recruiterOnly, createJob);
router.post('/:id/apply', protect, applyJob);

export default router;