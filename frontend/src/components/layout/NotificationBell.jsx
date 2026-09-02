import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import api from "../../api/axios";
import { useSocket } from "../../context/SocketContext";
import { formatDistanceToNow } from "date-fns";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, setNotifications, unreadCount, setUnreadCount } = useSocket();

  useEffect(() => {
    api.get("/notifications").then(({ data }) => {
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
    });
  }, []);

  const markAllRead = async () => {
    await api.patch("/notifications/read-all");
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const markOneRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2.5 hover:bg-navy-100 dark:hover:bg-white/10 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="glass-card absolute right-0 z-40 mt-2 w-80 p-0 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-navy-100 dark:border-white/10 px-4 py-3">
                <p className="font-semibold text-sm">Notifications</p>
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">You're all caught up.</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => markOneRead(n._id)}
                      className={`w-full border-b border-navy-50 dark:border-white/5 px-4 py-3 text-left text-sm transition-colors hover:bg-navy-50 dark:hover:bg-white/5 ${
                        !n.isRead ? "bg-blue-50/60 dark:bg-blue-500/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{n.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{n.message}</p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
