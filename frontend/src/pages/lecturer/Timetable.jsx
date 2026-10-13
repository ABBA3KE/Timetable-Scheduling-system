import { useEffect, useState } from "react";
import { Download, LayoutGrid, List, MapPin, Calendar, Clock, Building2, GraduationCap, AlertCircle } from "lucide-react";
import api from "../../api/axios";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import TimetableGrid from "../../components/ui/TimetableGrid";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { exportLecturerTimetablePDF } from "../../utils/pdfExport";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function LecturerTimetable() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    api
      .get("/timetables/lecturer/me")
      .then(({ data }) => setEntries(data.data || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = () => {
    exportLecturerTimetablePDF({
      lecturer: user,
      session: entries[0]?.session?.name || "2025/2026",
      semester: entries[0]?.semester || "All Semesters",
      entries,
      fileName: `${(user?.fullName || "Lecturer").replace(/\s+/g, "_")}_Teaching_Timetable.pdf`,
    });
  };

  // Group entries by day for list view
  const entriesByDay = DAY_ORDER.reduce((acc, day) => {
    const dayLectures = entries.filter((e) => e.timeSlot?.day === day);
    if (dayLectures.length > 0) acc[day] = dayLectures;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Teaching Timetable</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your published weekly lecture schedule across all assigned courses and departments.
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
      ) : entries.length === 0 ? (
        <Card>
          <EmptyState
            icon={AlertCircle}
            title="No Published Teaching Schedule"
            description="You have no lectures scheduled on any published timetables at this time. Once the administrator generates and publishes the departmental timetable, your courses will appear here automatically."
          />
        </Card>
      ) : viewMode === "grid" ? (
        <TimetableGrid entries={entries} onEntryClick={setSelectedEntry} />
      ) : (
        <div className="space-y-4">
          {Object.entries(entriesByDay).map(([day, dayEntries]) => (
            <Card key={day}>
              <h2 className="text-base font-bold text-navy-900 dark:text-white mb-3 flex items-center gap-2 border-b border-navy-100 dark:border-white/10 pb-2">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                {day} ({dayEntries.length} {dayEntries.length === 1 ? "lecture" : "lectures"})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dayEntries.map((e) => (
                  <div
                    key={e._id}
                    onClick={() => setSelectedEntry(e)}
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
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {e.department?.name || e.course?.department?.name || "Department"}
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {e.level?.name || e.course?.level?.name || "Level"}
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

      {/* Entry Details Modal */}
      <Modal
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title={selectedEntry ? `${selectedEntry.course?.code} - Lecture Details` : ""}
      >
        {selectedEntry && (
          <div className="space-y-3 text-sm">
            <DetailRow label="Course Title" value={selectedEntry.course?.title} />
            <DetailRow label="Course Code" value={selectedEntry.course?.code} />
            <DetailRow label="Credit Units" value={selectedEntry.course?.units} />
            <DetailRow label="Department" value={selectedEntry.department?.name || selectedEntry.course?.department?.name} />
            <DetailRow label="Academic Level" value={selectedEntry.level?.name || selectedEntry.course?.level?.name} />
            <DetailRow label="Venue" value={selectedEntry.venue?.name} />
            <DetailRow label="Venue Capacity" value={selectedEntry.venue?.capacity ? `${selectedEntry.venue.capacity} seats` : "N/A"} />
            <DetailRow
              label="Day & Time"
              value={`${selectedEntry.timeSlot?.day}, ${selectedEntry.timeSlot?.startTime} - ${selectedEntry.timeSlot?.endTime}`}
            />
            <DetailRow label="Semester" value={selectedEntry.semester} />
            <DetailRow label="Academic Session" value={selectedEntry.session?.name} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-navy-100 dark:border-white/10 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-right">{value || "-"}</span>
    </div>
  );
}
