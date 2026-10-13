import { useEffect, useState } from "react";
import { BookOpen, CalendarCheck, MapPin, Clock } from "lucide-react";
import api from "../../api/axios";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { useAuth } from "../../context/AuthContext";

export default function LecturerDashboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/timetables/lecturer/me")
      .then(({ data }) => setEntries(data.data))
      .finally(() => setLoading(false));
  }, []);

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

  const uniqueCourses = [...new Map(entries.map((e) => [e.course?._id, e.course])).values()];
  const uniqueVenues = [...new Set(entries.map((e) => e.venue?._id))];
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todaysClasses = entries
    .filter((e) => e.timeSlot?.day === today)
    .sort((a, b) => parseTimeToMinutes(a.timeSlot?.startTime) - parseTimeToMinutes(b.timeSlot?.startTime));

  const lecturerName = user?.fullName || "Lecturer";
  const titleDisplay = user?.title ? `${user.title} ` : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {titleDisplay}{lecturerName}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {user?.department?.name || "Teaching Faculty"} &middot; Teaching overview for this semester
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={BookOpen} label="Assigned Courses" value={uniqueCourses.length} gradient="from-blue-500 to-navy-700" />
            <StatCard icon={CalendarCheck} label="Weekly Sessions" value={entries.length} gradient="from-sky-500 to-blue-700" />
            <StatCard icon={MapPin} label="Venues Used" value={uniqueVenues.length} gradient="from-emerald-500 to-teal-700" />
          </>
        )}
      </div>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <Clock className="h-4 w-4" /> Today's Classes ({today})
        </h3>
        {todaysClasses.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No classes scheduled for today. Enjoy the break!</p>
        ) : (
          <div className="space-y-2">
            {todaysClasses.map((e) => (
              <div key={e._id} className="flex items-center justify-between rounded-xl border border-navy-100 dark:border-white/10 p-3">
                <div>
                  <p className="font-medium">{e.course?.code} - {e.course?.title}</p>
                  <p className="text-xs text-slate-400">{e.venue?.name}</p>
                </div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {e.timeSlot?.startTime} - {e.timeSlot?.endTime}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
