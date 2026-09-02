import { motion } from "framer-motion";
import { MapPin, User } from "lucide-react";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const COLORS = [
  "from-blue-500 to-blue-700",
  "from-sky-500 to-blue-700",
  "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-700",
  "from-rose-500 to-pink-700",
  "from-slate-500 to-navy-800",
];

function colorFor(code) {
  let hash = 0;
  for (let i = 0; i < (code || "").length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function TimetableGrid({ entries = [], onEntryClick }) {
  const days = DAY_ORDER.filter((d) => entries.some((e) => e.timeSlot?.day === d));
  const activeDays = days.length ? days : DAY_ORDER.slice(0, 5);

  const timeLabels = [...new Set(entries.map((e) => `${e.timeSlot?.startTime}-${e.timeSlot?.endTime}`))].sort();

  if (!entries.length) {
    return (
      <div className="glass-card p-12 text-center text-slate-400">
        No timetable entries to display yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-navy-100 dark:border-white/10">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-28 border-b border-navy-100 dark:border-white/10 bg-navy-50/80 dark:bg-white/5 px-3 py-3 text-left text-xs font-semibold uppercase text-slate-500">
              Time
            </th>
            {activeDays.map((day) => (
              <th
                key={day}
                className="border-b border-l border-navy-100 dark:border-white/10 bg-navy-50/80 dark:bg-white/5 px-3 py-3 text-xs font-semibold uppercase text-slate-500"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeLabels.map((label) => {
            const [start, end] = label.split("-");
            return (
              <tr key={label}>
                <td className="border-b border-navy-100 dark:border-white/10 px-3 py-3 text-xs font-medium text-slate-500 align-top">
                  {start}
                  <br />
                  {end}
                </td>
                {activeDays.map((day) => {
                  const entry = entries.find(
                    (e) => e.timeSlot?.day === day && e.timeSlot?.startTime === start && e.timeSlot?.endTime === end
                  );
                  return (
                    <td key={day} className="border-b border-l border-navy-100 dark:border-white/10 p-2 align-top">
                      {entry && (
                        <motion.button
                          onClick={() => onEntryClick?.(entry)}
                          whileHover={{ scale: 1.02 }}
                          className={`w-full rounded-xl bg-gradient-to-br ${colorFor(
                            entry.course?.code
                          )} p-2.5 text-left text-white shadow-md`}
                        >
                          <p className="text-xs font-bold">{entry.course?.code}</p>
                          <p className="text-[11px] opacity-90 line-clamp-1">{entry.course?.title}</p>
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] opacity-80">
                            <MapPin className="h-3 w-3" /> {entry.venue?.name}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] opacity-80">
                            <User className="h-3 w-3" /> {entry.lecturer?.fullName}
                          </div>
                        </motion.button>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
