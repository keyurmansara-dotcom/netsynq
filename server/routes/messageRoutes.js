import express from 'express';
import {
  createConversation,
  getConversations,
  getMessages,
  markConversationRead,
  sendMessage
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.post('/conversations', protect, createConversation);
router.get('/:conversationId', protect, getMessages);
router.post('/:conversationId', protect, sendMessage);
router.put('/:conversationId/read', protect, markConversationRead);

export default router;