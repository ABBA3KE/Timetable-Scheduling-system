import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Building2, GraduationCap, BookOpen, Users, MapPin,
  CalendarClock, CalendarCheck, Bell, FileClock, BarChart3, User, X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";

const ADMIN_LINKS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/academic", label: "Faculties & Departments", icon: Building2 },
  { to: "/admin/courses", label: "Courses", icon: BookOpen },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/venues", label: "Venues & Time Slots", icon: MapPin },
  { to: "/admin/timetable", label: "Generate Timetable", icon: CalendarClock },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/logs", label: "Activity Logs", icon: FileClock },
];

const LECTURER_LINKS = [
  { to: "/lecturer", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/lecturer/timetable", label: "My Timetable", icon: CalendarCheck },
  { to: "/lecturer/profile", label: "Profile", icon: User },
];

const STUDENT_LINKS = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/student/timetable", label: "My Timetable", icon: CalendarCheck },
  { to: "/student/search", label: "Search Timetable", icon: GraduationCap },
];

const LINKS_BY_ROLE = { admin: ADMIN_LINKS, lecturer: LECTURER_LINKS, student: STUDENT_LINKS };

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const links = LINKS_BY_ROLE[user?.role] || [];

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />
      )}
      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : "-100%" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "fixed z-40 inset-y-0 left-0 w-64 gradient-bg text-white flex flex-col",
          "lg:translate-x-0 lg:static lg:z-0"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-700 font-bold shadow-glow">
              U
            </div>
            <div>
              <p className="font-bold leading-tight">UniSchedule</p>
              <p className="text-[11px] text-blue-200/70 capitalize">{user?.role} portal</p>
            </div>
          </div>
          <button className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-blue-100/70 hover:bg-white/5 hover:text-white"
                )
              }
            >
              <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 text-[11px] text-blue-200/50 border-t border-white/10">
          &copy; {new Date().getFullYear()} UniSchedule
        </div>
      </motion.aside>
    </>
  );
}