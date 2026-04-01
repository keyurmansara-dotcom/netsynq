import express from 'express';
import {
    acceptRequest,
    declineRequest,
    getNetworkData,
    sendRequest
} from '../controllers/networkController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all network data: connections, requests, suggestions
router.get('/', protect, getNetworkData);

// POST: send connection request
router.post('/request/:id', protect, sendRequest);

// PUT: accept connection request
router.put('/accept/:id', protect, acceptRequest);

// PUT: decline/ignore connection request
router.delete('/decline/:id', protect, declineRequest);

export default router;
