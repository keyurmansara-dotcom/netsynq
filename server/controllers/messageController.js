import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { createAndEmitNotification, emitToConversation, emitToUser } from '../services/realtimeService.js';

const ensureConversation = async (participantA, participantB) => {
  const sortedParticipants = [String(participantA), String(participantB)].sort();
  let conversation = await Conversation.findOne({ participants: { $all: sortedParticipants, $size: 2 } });

  if (!conversation) {
    conversation = await Conversation.create({ participants: sortedParticipants, unreadCount: new Map() });
  }

  return conversation;
};

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.userId })
      .populate('participants', 'name profile.headline profile.companyName privacy')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    return res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    return res.status(500).json({ message: 'Failed to load conversations' });
  }
};

export const createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    if (!participantId) {
      return res.status(400).json({ message: 'participantId is required' });
    }

    const [currentUser, otherUser] = await Promise.all([
      User.findById(req.user.userId).select('_id name'),
      User.findById(participantId).select('_id name')
    ]);

    if (!currentUser || !otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const conversation = await ensureConversation(currentUser._id, otherUser._id);
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name profile.headline profile.companyName privacy')
      .populate('lastMessage');

    return res.status(201).json(populatedConversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    return res.status(500).json({ message: 'Failed to create conversation' });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.some((participant) => String(participant) === String(req.user.userId))) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name profile.headline')
      .populate('recipient', 'name profile.headline')
      .sort({ createdAt: 1 });

    return res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ message: 'Failed to load messages' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, recipientId } = req.body;
    const content = String(text || '').trim();

    if (!content) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    let conversation = conversationId ? await Conversation.findById(conversationId) : null;
    if (conversation && !conversation.participants.some((participant) => String(participant) === String(req.user.userId))) {
      return res.status(403).json({ message: 'Not authorized to send this message' });
    }

    if (!conversation) {
      if (!recipientId) {
        return res.status(400).json({ message: 'recipientId is required for a new conversation' });
      }
      conversation = await ensureConversation(req.user.userId, recipientId);
    }

    const recipient = conversation.participants.find((participant) => String(participant) !== String(req.user.userId));
    if (!recipient) {
      return res.status(400).json({ message: 'Conversation recipient could not be resolved' });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user.userId,
      recipient,
      text: content,
      attachments: Array.isArray(req.body.attachments) ? req.body.attachments : []
    });

    conversation.lastMessage = message._id;
    conversation.unreadCount = conversation.unreadCount || new Map();
    const currentUnread = Number(conversation.unreadCount.get(String(recipient)) || 0);
    conversation.unreadCount.set(String(recipient), currentUnread + 1);
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profile.headline')
      .populate('recipient', 'name profile.headline');

    emitToConversation(conversation._id.toString(), 'message:new', populatedMessage);
    emitToUser(String(recipient), 'conversation:update', { conversationId: conversation._id.toString(), message: populatedMessage });

    await createAndEmitNotification(Notification, {
      recipient,
      sender: req.user.userId,
      type: 'message',
      message: 'sent you a message'
    });

    return res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ message: 'Failed to send message' });
  }
};

export const markConversationRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.some((participant) => String(participant) === String(req.user.userId))) {
      return res.status(403).json({ message: 'Not authorized to update this conversation' });
    }

    conversation.unreadCount = conversation.unreadCount || new Map();
    conversation.unreadCount.set(String(req.user.userId), 0);
    await conversation.save();

    await Message.updateMany(
      { conversation: conversationId, recipient: req.user.userId, readAt: null },
      { $set: { readAt: new Date() } }
    );

    return res.json({ message: 'Conversation marked as read' });
  } catch (error) {
    console.error('Mark conversation read error:', error);
    return res.status(500).json({ message: 'Failed to mark conversation as read' });
  }
};