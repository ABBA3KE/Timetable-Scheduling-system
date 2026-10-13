import { useEffect, useState } from "react";
import { CalendarClock, Download, Phone, Mail, LayoutGrid, List, MapPin, Calendar, Building2, User } from "lucide-react";
import api from "../../api/axios";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import TimetableGrid from "../../components/ui/TimetableGrid";
import { TableSkeleton } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { exportStudentTimetablePDF } from "../../utils/pdfExport";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function StudentTimetable() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [activeEntry, setActiveEntry] = useState(null);

  useEffect(() => {
    api
      .get("/timetables/student/me")
      .then(({ data }) => setTimetable(data.data))
      .catch((err) => setError(err.response?.data?.message || "Unable to load your timetable."))
      .finally(() => setLoading(false));
  }, []);

  const entries = timetable?.entries || [];

  const handleDownload = () => {
    exportStudentTimetablePDF({
      student: user,
      session: timetable?.session?.name || entries[0]?.session?.name || "2025/2026",
      semester: timetable?.semester || entries[0]?.semester || "First Semester",
      entries,
      fileName: `${(user?.fullName || "Student").replace(/\s+/g, "_")}_Timetable.pdf`,
    });
  };

  const entriesByDay = DAY_ORDER.reduce((acc, day) => {
    const dayLectures = entries.filter((e) => e.timeSlot?.day === day);
    if (dayLectures.length > 0) acc[day] = dayLectures;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Timetable</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {user?.department?.name || user?.programme?.name || "Academic"} &middot; {user?.level?.name || "All Levels"}
            {user?.isClassRep && " &middot; Class Representative"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-navy-100 dark:border-white/10 p-1 bg-white dark:bg-navy-900">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid View
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white"
              }`}
            >
              <List className="h-3.5 w-3.5" /> List View
            </button>
          </div>
          <Button icon={Download} onClick={handleDownload} disabled={!entries.length}>
            Download PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <Card><TableSkeleton rows={6} /></Card>
      ) : error ? (
        <Card><EmptyState icon={CalendarClock} title="Timetable could not be loaded" description={error} /></Card>
      ) : entries.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarClock}
            title="No Published Timetable Yet"
            description="There are no published lectures matching your academic level and department at this time. When your administrator publishes the schedule, your full Monday to Friday lectures will be visible here."
          />
        </Card>
      ) : viewMode === "grid" ? (
        <TimetableGrid entries={entries} onEntryClick={setActiveEntry} />
      ) : (
        <div className="space-y-4">
          {Object.entries(entriesByDay).map(([day, dayEntries]) => (
            <Card key={day}>
              <h2 className="text-base font-bold text-navy-900 dark:text-white mb-3 flex items-center gap-2 border-b border-navy-100 dark:border-white/10 pb-2">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {day} ({dayEntries.length} {dayEntries.length === 1 ? "class" : "classes"})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dayEntries.map((e) => (
                  <div
                    key={e._id}
                    onClick={() => setActiveEntry(e)}
                    className="p-3.5 rounded-xl border border-navy-100 dark:border-white/10 bg-navy-50/40 dark:bg-white/[0.02] hover:border-blue-300 dark:hover:border-blue-500/30 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-blue-600 dark:text-blue-400">{e.course?.code}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                        {e.timeSlot?.startTime} - {e.timeSlot?.endTime}
                      </span>
                    </div>
                    <p className="font-semibold text-sm line-clamp-1">{e.course?.title}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-navy-100 dark:border-white/5">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {e.venue?.name || "TBA"}
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {e.lecturer?.fullName || "Unassigned"}
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {e.department?.name || e.course?.department?.name || "Department"}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        {e.course?.units ? `${e.course.units} Credit Units` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Course Detail Modal */}
      <Modal open={!!activeEntry} onClose={() => setActiveEntry(null)} title={activeEntry ? `${activeEntry.course?.code} - Class Details` : ""}>
        {activeEntry && (
          <div className="space-y-3 text-sm">
            <Row label="Course Code" value={activeEntry.course?.code} />
            <Row label="Course Title" value={activeEntry.course?.title} />
            <Row label="Credit Units" value={activeEntry.course?.units} />
            <Row label="Venue" value={activeEntry.venue?.name} />
            <Row label="Day / Time" value={`${activeEntry.timeSlot?.day}, ${activeEntry.timeSlot?.startTime} - ${activeEntry.timeSlot?.endTime}`} />
            <Row label="Department" value={activeEntry.department?.name || activeEntry.course?.department?.name} />
            <Row label="Lecturer" value={activeEntry.lecturer?.fullName || "Unassigned"} />
            <Row label="Lecturer Email" value={activeEntry.lecturer?.email || "Not available"} />
            <Row label="Lecturer Phone" value={activeEntry.lecturer?.phone || "Not provided"} />
            {activeEntry.lecturer?.officeLocation && (
              <Row label="Lecturer Office" value={activeEntry.lecturer.officeLocation} />
            )}

            {user?.isClassRep && activeEntry.lecturer?.phone && (
              <a href={`tel:${activeEntry.lecturer.phone}`} className="btn-primary w-full mt-3 flex items-center justify-center gap-2">
                <Phone className="h-4 w-4" /> Call Lecturer Directly
              </a>
            )}
            {activeEntry.lecturer?.email && (
              <a href={`mailto:${activeEntry.lecturer.email}`} className="btn-secondary w-full mt-1 flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" /> Email Lecturer
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-navy-100 dark:border-white/10 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-right">{value || "-"}</span>
    </div>
  );
}
