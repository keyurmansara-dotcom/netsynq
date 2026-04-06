import express from 'express';
import { applyJob, createJob, getJobs, getRecruiterJobs, updateApplicationStatus } from '../controllers/jobController.js';
import { protect, recruiterOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getJobs);
router.get('/myjobs', protect, recruiterOnly, getRecruiterJobs);
router.post('/', protect, recruiterOnly, createJob);
router.post('/:id/apply', protect, applyJob);
router.put('/:id/applicant/:applicantId', protect, recruiterOnly, updateApplicationStatus);

export default router;