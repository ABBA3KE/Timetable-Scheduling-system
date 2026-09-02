import { useEffect, useState } from "react";
import { Download, Phone, X } from "lucide-react";
import api from "../../api/axios";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import TimetableGrid from "../../components/ui/TimetableGrid";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { exportTimetablePDF } from "../../utils/pdfExport";

export default function StudentTimetable() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeEntry, setActiveEntry] = useState(null);

  useEffect(() => {
    api
      .get("/timetables/student/me")
      .then(({ data }) => setTimetable(data.data))
      .finally(() => setLoading(false));
  }, []);

  const entries = timetable?.entries || [];

  const handleDownload = () => {
    exportTimetablePDF({
      universityName: "UniSchedule University",
      personName: user?.fullName,
      personLine2: `${user?.department?.name || "-"} | ${user?.level?.name || "-"}`,
      session: timetable?.session?.name || "-",
      semester: timetable?.semester || "-",
      entries,
      fileName: `${user?.fullName?.replace(/\s+/g, "_")}_Timetable.pdf`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Timetable</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tap any class for lecturer contact details.
            {user?.isClassRep && " As class rep, you can call the lecturer directly."}
          </p>
        </div>
        <Button icon={Download} onClick={handleDownload} disabled={!entries.length}>
          Download PDF
        </Button>
      </div>

      {loading ? (
        <Card><TableSkeleton rows={6} /></Card>
      ) : (
        <TimetableGrid entries={entries} onEntryClick={setActiveEntry} />
      )}

      <Modal open={!!activeEntry} onClose={() => setActiveEntry(null)} title={activeEntry?.course?.code}>
        {activeEntry && (
          <div className="space-y-3 text-sm">
            <Row label="Course" value={`${activeEntry.course?.code} - ${activeEntry.course?.title}`} />
            <Row label="Lecturer" value={activeEntry.lecturer?.fullName} />
            <Row label="Venue" value={activeEntry.venue?.name} />
            <Row label="Day / Time" value={`${activeEntry.timeSlot?.day}, ${activeEntry.timeSlot?.startTime} - ${activeEntry.timeSlot?.endTime}`} />
            <Row label="Lecturer Email" value={activeEntry.lecturer?.email} />
            <Row label="Lecturer Phone" value={activeEntry.lecturer?.phone || "Not provided"} />

            {user?.isClassRep && activeEntry.lecturer?.phone && (
              <a href={`tel:${activeEntry.lecturer.phone}`} className="btn-primary w-full mt-2">
                <Phone className="h-4 w-4" /> Call Lecturer
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
      <span className="font-medium">{value || "-"}</span>
    </div>
  );
}
