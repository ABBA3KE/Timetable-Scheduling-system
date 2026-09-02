import { useEffect, useState } from "react";
import { Users, GraduationCap, BookOpen, MapPin, CalendarCheck, FileClock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../../api/axios";
import StatCard from "../../components/ui/StatCard";
import Card from "../../components/ui/Card";
import { CardSkeleton } from "../../components/ui/Skeleton";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/analytics/overview")
      .then(({ data }) => setData(data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          System-wide overview of students, lecturers, courses, and timetable status.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={GraduationCap} label="Students" value={data.studentCount} gradient="from-blue-500 to-navy-700" />
            <StatCard icon={Users} label="Lecturers" value={data.lecturerCount} gradient="from-sky-500 to-blue-700" />
            <StatCard icon={BookOpen} label="Active Courses" value={data.courseCount} gradient="from-emerald-500 to-teal-700" />
            <StatCard icon={MapPin} label="Venues" value={data.venueCount} gradient="from-amber-500 to-orange-700" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {loading || !data ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <StatCard icon={CalendarCheck} label="Published Timetables" value={data.publishedCount} gradient="from-emerald-500 to-teal-700" />
            <StatCard icon={FileClock} label="Draft Timetables" value={data.draftCount} gradient="from-rose-500 to-pink-700" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold">Lecturer Workload (weekly sessions)</h3>
          {data?.lecturerWorkload?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.lecturerWorkload}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="sessions" fill="#4338ca" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-slate-400">No published timetable data yet.</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold">Venue Utilization (weekly sessions)</h3>
          {data?.venueUtilization?.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.venueUtilization}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="sessions" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-slate-400">No published timetable data yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
