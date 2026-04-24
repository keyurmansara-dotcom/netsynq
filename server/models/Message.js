import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  attachments: [{
    url: { type: String, default: '' },
    name: { type: String, default: '' },
    type: { type: String, default: '' }
  }],
  readAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;