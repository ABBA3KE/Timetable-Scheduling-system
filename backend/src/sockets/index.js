import { Server } from "socket.io";

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || "*", credentials: true },
  });

  io.on("connection", (socket) => {
    // Client joins a private room keyed by their own user id right after login,
    // so we can target notifications to exactly one user.
    socket.on("join", (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on("disconnect", () => {
      // no-op - room membership is cleaned up automatically
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.IO not initialized. Call initSocket(server) first.");
  return io;
}
