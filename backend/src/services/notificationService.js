import Notification from "../models/Notification.js";
import { getIO } from "../sockets/index.js";

/**
 * Creates a notification for one or many recipients and pushes it in
 * real time over Socket.IO to any connected client for that user.
 */
export async function notifyUsers({ recipients, title, message, type = "general", link = "" }) {
  const ids = Array.isArray(recipients) ? recipients : [recipients];
  const docs = await Notification.insertMany(
    ids.map((recipient) => ({ recipient, title, message, type, link }))
  );

  try {
    const io = getIO();
    docs.forEach((doc) => {
      io.to(`user:${doc.recipient}`).emit("notification:new", doc);
    });
  } catch (_) {
    // Socket layer not initialized (e.g. during tests) - notifications are
    // still persisted and will be fetched on next poll/login.
  }

  return docs;
}
