/**
 * إعداد Socket.io للإشعارات الفورية
 * كل مستخدم ينضم لغرفته الخاصة: user_{id}
 * وكل مستخدم ينضم لغرفة دوره: role_{role}
 */
const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket.io] مستخدم متصل: ${socket.id}`);

    // انضمام المستخدم لغرفته الخاصة
    socket.on('join', ({ userId, role }) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`[Socket.io] المستخدم ${userId} انضم لغرفة user_${userId}`);
      }
      if (role) {
        socket.join(`role_${role}`);
        console.log(`[Socket.io] المستخدم ${userId} انضم لغرفة role_${role}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] مستخدم قطع الاتصال: ${socket.id}`);
    });
  });

  return io;
};

module.exports = setupSocket;
