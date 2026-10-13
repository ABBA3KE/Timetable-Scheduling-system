import { motion } from "framer-motion";
import { MapPin, User, Building2, GraduationCap } from "lucide-react";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const COLORS = [
  "from-blue-600 to-indigo-700",
  "from-sky-500 to-blue-700",
  "from-emerald-600 to-teal-700",
  "from-amber-500 to-orange-700",
  "from-purple-600 to-violet-800",
  "from-rose-500 to-pink-700",
  "from-slate-600 to-navy-800",
];

function colorFor(code) {
  let hash = 0;
  for (let i = 0; i < (code || "").length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const str = String(timeStr).trim().toUpperCase();
  const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3];
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  return 0;
};

export default function TimetableGrid({ entries = [], onEntryClick, showDetails = true }) {
  // Monday to Friday are ALWAYS shown. Saturday is included if there are Saturday lectures.
  const hasSaturday = entries.some((e) => e.timeSlot?.day === "Saturday");
  const activeDays = hasSaturday ? DAY_ORDER.slice(0, 6) : DAY_ORDER.slice(0, 5);

  const rawLabels = [...new Set(entries.map((e) => `${e.timeSlot?.startTime}-${e.timeSlot?.endTime}`))]
    .filter((l) => l && l !== "undefined-undefined" && l !== "-");

  const timeLabels = rawLabels.sort((a, b) => {
    const [startA] = a.split("-");
    const [startB] = b.split("-");
    return parseTimeToMinutes(startA) - parseTimeToMinutes(startB);
  });

  if (!entries.length) {
    return (
      <div className="rounded-2xl border border-navy-100 dark:border-white/10 bg-white/50 dark:bg-navy-900/50 p-12 text-center text-slate-400">
        <p className="text-base font-medium">No published timetable entries to display.</p>
        <p className="text-xs text-slate-500 mt-1">Check back once the schedule for this semester is published.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-navy-100 dark:border-white/10 shadow-sm bg-white dark:bg-navy-950">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-28 border-b border-navy-100 dark:border-white/10 bg-navy-50/80 dark:bg-white/5 px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Time
            </th>
            {activeDays.map((day) => (
              <th
                key={day}
                className="border-b border-l border-navy-100 dark:border-white/10 bg-navy-50/80 dark:bg-white/5 px-3 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
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
              <tr key={label} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="border-b border-navy-100 dark:border-white/10 px-3 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 align-top bg-navy-50/30 dark:bg-white/[0.02]">
                  <span className="block text-blue-600 dark:text-blue-400">{start}</span>
                  <span className="block text-[10px] text-slate-400 font-normal">to</span>
                  <span className="block text-slate-500">{end}</span>
                </td>
                {activeDays.map((day) => {
                  const cellEntries = entries.filter(
                    (e) => e.timeSlot?.day === day && e.timeSlot?.startTime === start && e.timeSlot?.endTime === end
                  );
                  return (
                    <td key={day} className="border-b border-l border-navy-100 dark:border-white/10 p-2 align-top">
                      {cellEntries.length === 0 ? (
                        <div className="h-full min-h-[50px] flex items-center justify-center text-[10px] text-slate-300 dark:text-slate-700">
                          &mdash;
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {cellEntries.map((entry) => (
                            <motion.button
                              key={entry._id || `${entry.course?._id}-${day}-${start}`}
                              onClick={() => onEntryClick?.(entry)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`w-full rounded-xl bg-gradient-to-br ${colorFor(
                                entry.course?.code
                              )} p-2.5 text-left text-white shadow-md hover:shadow-lg transition-shadow cursor-pointer`}
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold tracking-wide">{entry.course?.code || "Course"}</p>
                                {entry.course?.units && (
                                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-medium">
                                    {entry.course.units}U
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-medium opacity-95 line-clamp-1 mt-0.5">
                                {entry.course?.title || "-"}
                              </p>
                              <div className="mt-2 space-y-0.5 border-t border-white/20 pt-1.5 text-[10px] opacity-90">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{entry.venue?.name || "TBA"}</span>
                                </div>
                                {entry.lecturer?.fullName && (
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{entry.lecturer.fullName}</span>
                                  </div>
                                )}
                                {(entry.department?.name || entry.course?.department?.name) && showDetails && (
                                  <div className="flex items-center gap-1 text-[9px] opacity-75">
                                    <Building2 className="h-2.5 w-2.5 shrink-0" />
                                    <span className="truncate">
                                      {entry.department?.code || entry.department?.name || entry.course?.department?.code}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </motion.button>
                          ))}
                        </div>
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
