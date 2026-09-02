import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, AlertTriangle, Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import TimetableGrid from "../../components/ui/TimetableGrid";

export default function GenerateTimetable() {
  const [departments, setDepartments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({ department: "", session: "", semester: "First Semester" });
  const [timetable, setTimetable] = useState(null);
  const [stats, setStats] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    api.get("/departments").then(({ data }) => setDepartments(data.data));
    api.get("/sessions").then(({ data }) => setSessions(data.data));
  }, []);

  const handleGenerate = async () => {
    if (!form.department || !form.session) {
      toast.error("Please select a department and academic session.");
      return;
    }
    setGenerating(true);
    setTimetable(null);
    try {
      const { data } = await api.post("/timetables/generate", form);
      setTimetable(data.data);
      setStats(data.stats);
      if (data.stats.unscheduledCourses.length > 0) {
        toast(`Generated with ${data.stats.unscheduledCourses.length} course(s) unresolved - see details below.`, {
          icon: "⚠️",
        });
      } else {
        toast.success("Conflict-free timetable generated successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate timetable");
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const { data } = await api.patch(`/timetables/${timetable._id}/publish`);
      setTimetable(data.data);
      toast.success("Timetable published! Lecturers and students have been notified.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to publish timetable");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Generate Timetable</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Runs a Constraint Satisfaction (Backtracking) solver over the selected department's active
          courses, venues, and time slots to produce a conflict-free schedule.
        </p>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Department</label>
            <select
              className="input-field"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Academic Session</label>
            <select
              className="input-field"
              value={form.session}
              onChange={(e) => setForm({ ...form, session: e.target.value })}
            >
              <option value="">Select session</option>
              {sessions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Semester</label>
            <select
              className="input-field"
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
            >
              <option>First Semester</option>
              <option>Second Semester</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button icon={Sparkles} loading={generating} onClick={handleGenerate}>
            {generating ? "Running CSP Solver..." : "Generate Timetable"}
          </Button>
        </div>
      </Card>

      {stats && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="flex flex-wrap items-center gap-6">
            <Stat label="Total Courses" value={stats.totalCourses} />
            <Stat label="Scheduled" value={stats.scheduledCourses} good />
            <Stat label="Unscheduled" value={stats.unscheduledCourses.length} bad={stats.unscheduledCourses.length > 0} />
            <Stat label="Backtrack Steps" value={stats.backtrackSteps} />
            <Stat label="Generation Time" value={`${stats.generationTimeMs} ms`} />
            <div className="ml-auto">
              {stats.unscheduledCourses.length === 0 && timetable?.status !== "published" ? (
                <Badge variant="success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Conflict-free
                </Badge>
              ) : timetable?.status === "published" ? (
                <Badge variant="info">Published</Badge>
              ) : (
                <Badge variant="warning">
                  <AlertTriangle className="h-3.5 w-3.5" /> Needs attention
                </Badge>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {timetable && (
        <>
          <TimetableGrid entries={timetable.entries} />
          <div className="flex justify-end">
            <Button
              icon={publishing ? undefined : Send}
              loading={publishing}
              onClick={handlePublish}
              disabled={timetable.status === "published"}
            >
              {timetable.status === "published" ? "Already Published" : "Publish Timetable"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, good, bad }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-lg font-bold ${good ? "text-emerald-500" : bad ? "text-rose-500" : ""}`}>{value}</p>
    </div>
  );
}
