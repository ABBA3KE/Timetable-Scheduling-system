import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Sun, Moon, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import NotificationBell from "./NotificationBell";

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-navy-100 dark:border-white/10 bg-white/70 dark:bg-navy-950/70 backdrop-blur-xl px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 hover:bg-navy-100 dark:hover:bg-white/10 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm text-slate-400">Welcome back,</p>
          <p className="font-semibold leading-tight">{user?.fullName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="rounded-xl p-2.5 hover:bg-navy-100 dark:hover:bg-white/10 transition-colors"
          title="Toggle dark / light mode"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-navy-100 dark:hover:bg-white/10 transition-colors"
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-navy-700 text-sm font-bold text-white">
              {user?.fullName?.[0]}
            </div>
            <ChevronDown className="hidden h-4 w-4 sm:block" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="glass-card absolute right-0 z-40 mt-2 w-48 p-1.5"
                >
                  <div className="px-3 py-2 text-xs text-slate-400 capitalize">{user?.role} account</div>
                  <a
                    href={`/${user?.role}/profile`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-navy-50 dark:hover:bg-white/10"
                  >
                    <User className="h-4 w-4" /> My Profile
                  </a>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
