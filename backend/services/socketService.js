const Notification = require('../models/Notification');

let io = null;
const userSockets = new Map(); // userId -> socketId

function init(socketIO) {
  io = socketIO;

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (userId) {
      userSockets.set(userId, socket.id);
      socket.join(`user:${userId}`);
    }

    socket.on('send_message', ({ receiverId, content, tempId }) => {
      socket.to(`user:${receiverId}`).emit('new_message_typing', { senderId: userId });
    });

    socket.on('typing_start', ({ receiverId }) => {
      socket.to(`user:${receiverId}`).emit('typing_start', { senderId: userId });
    });

    socket.on('typing_stop', ({ receiverId }) => {
      socket.to(`user:${receiverId}`).emit('typing_stop', { senderId: userId });
    });

    socket.on('messages_read', ({ senderId }) => {
      socket.to(`user:${senderId}`).emit('messages_read', { by: userId });
    });

    socket.on('disconnect', () => {
      userSockets.delete(userId);
    });
  });
}

function emitToUser(userId, event, data) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

async function createAndEmitNotification(recipientId, senderId, type, postId, message) {
  try {
    const notif = await Notification.create({ recipient: recipientId, sender: senderId, type, post: postId, message });
    const populated = await notif.populate('sender', 'username avatar');
    emitToUser(recipientId.toString(), 'notification', populated);
  } catch { /* noop */ }
}

module.exports = { init, emitToUser, createAndEmitNotification };
