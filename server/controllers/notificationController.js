import Notification from '../models/Notification.js';

const safePopulate = {
  sender: 'name profile.headline',
  post: 'content mediaUrl',
  job: 'title company'
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.userId })
      .populate('sender', safePopulate.sender)
      .populate('post', safePopulate.post)
      .populate('job', safePopulate.job)
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    
    // Verify recipient
    if (notification.recipient.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.read = true;
    await notification.save();

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.userId, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications' });
  }
};