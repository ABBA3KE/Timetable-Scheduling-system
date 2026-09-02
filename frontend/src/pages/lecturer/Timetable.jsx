import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import api from "../../api/axios";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import TimetableGrid from "../../components/ui/TimetableGrid";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { exportTimetablePDF } from "../../utils/pdfExport";

export default function LecturerTimetable() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/timetables/lecturer/me")
      .then(({ data }) => setEntries(data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = () => {
    exportTimetablePDF({
      universityName: "UniSchedule University",
      personName: `${user?.title || ""} ${user?.fullName}`.trim(),
      personLine2: `Department: ${user?.department?.name || "-"}`,
      session: entries[0]?.session?.name || "-",
      semester: entries[0]?.semester || "-",
      entries,
      fileName: `${user?.fullName?.replace(/\s+/g, "_")}_Timetable.pdf`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Teaching Timetable</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your published weekly teaching schedule.</p>
        </div>
        <Button icon={Download} onClick={handleDownload} disabled={!entries.length}>
          Download PDF
        </Button>
      </div>

      {loading ? (
        <Card><TableSkeleton rows={6} /></Card>
      ) : (
        <TimetableGrid entries={entries} />
      )}
    </div>
  );
}
