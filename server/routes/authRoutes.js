import express from 'express';
import {
    forgotPassword,
    getAuthenticatedJobseekerProfile,
    getAuthenticatedRecruiterDashboard,
    loginByRole,
    logoutByRole,
    refreshByRole,
    resetPassword,
    signup
} from '../controllers/authController.js';
import {
    authenticateJobseeker,
    authenticateRecruiter
} from '../middleware/authMiddleware.js';
import { validateCsrfFromRouteRole } from '../middleware/csrfMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/:role/login', loginByRole);
router.post('/:role/refresh', validateCsrfFromRouteRole, refreshByRole);
router.post('/:role/logout', validateCsrfFromRouteRole, logoutByRole);

router.get('/jobseeker/profile', authenticateJobseeker, getAuthenticatedJobseekerProfile);
router.get('/recruiter/dashboard', authenticateRecruiter, getAuthenticatedRecruiterDashboard);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;