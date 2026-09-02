import { useEffect, useState } from "react";
import { BookOpen, Clock, MapPin } from "lucide-react";
import api from "../../api/axios";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { useAuth } from "../../context/AuthContext";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/timetables/student/me")
      .then(({ data }) => setTimetable(data.data))
      .finally(() => setLoading(false));
  }, []);

  const entries = timetable?.entries || [];
  const uniqueCourses = [...new Map(entries.map((e) => [e.course?._id, e.course])).values()];
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todaysClasses = entries.filter((e) => e.timeSlot?.day === today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.fullName?.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {user?.programme?.name} &middot; {user?.level?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={BookOpen} label="Registered Courses" value={uniqueCourses.length} gradient="from-blue-500 to-navy-700" />
            <StatCard icon={Clock} label="Weekly Classes" value={entries.length} gradient="from-sky-500 to-blue-700" />
            <StatCard icon={MapPin} label="Today's Classes" value={todaysClasses.length} gradient="from-emerald-500 to-teal-700" />
          </>
        )}
      </div>

      <Card>
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <Clock className="h-4 w-4" /> Today's Classes ({today})
        </h3>
        {todaysClasses.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No classes scheduled for today.</p>
        ) : (
          <div className="space-y-2">
            {todaysClasses.map((e) => (
              <div key={e._id} className="flex items-center justify-between rounded-xl border border-navy-100 dark:border-white/10 p-3">
                <div>
                  <p className="font-medium">{e.course?.code} - {e.course?.title}</p>
                  <p className="text-xs text-slate-400">{e.venue?.name} &middot; {e.lecturer?.fullName}</p>
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
