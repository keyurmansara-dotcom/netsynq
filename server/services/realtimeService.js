let ioInstance = null;

export const setRealtimeServer = (io) => {
  ioInstance = io;
};

export const getRealtimeServer = () => ioInstance;

export const emitToUser = (userId, eventName, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(eventName, payload);
};

export const emitToConversation = (conversationId, eventName, payload) => {
  if (!ioInstance || !conversationId) return;
  ioInstance.to(`conversation:${conversationId}`).emit(eventName, payload);
};

export const createAndEmitNotification = async (NotificationModel, payload) => {
  const notification = await NotificationModel.create(payload);
  emitToUser(payload.recipient, 'notification:new', notification);
  return notification;
};