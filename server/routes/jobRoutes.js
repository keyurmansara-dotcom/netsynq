import express from 'express';
import { applyJob, createJob, getJobs, getMyApplications, getRecruiterJobs, updateApplicationStatus } from '../controllers/jobController.js';
import { authenticateRecruiter, protect, recruiterOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getJobs);
router.get('/applications', protect, getMyApplications);
router.get('/myjobs', authenticateRecruiter, recruiterOnly, getRecruiterJobs);
router.post('/', authenticateRecruiter, recruiterOnly, createJob);
router.post('/:id/apply', protect, applyJob);
router.put('/:id/applicant/:applicantId', authenticateRecruiter, recruiterOnly, updateApplicationStatus);

export default router;