import { useEffect, useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import api from "../../api/axios";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import { TableSkeleton } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SearchTimetable() {
  const [filters, setFilters] = useState({ department: "", level: "", semester: "", lecturer: "", venue: "", day: "", course: "" });
  const [options, setOptions] = useState({ departments: [], levels: [], lecturers: [], venues: [] });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/departments"),
      api.get("/levels"),
      api.get("/users", { params: { role: "lecturer" } }),
      api.get("/venues"),
    ]).then(([d, l, u, v]) => {
      setOptions({ departments: d.data.data, levels: l.data.data, lecturers: u.data.data, venues: v.data.data });
    });
  }, []);

  const runSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const { data } = await api.get("/timetables/search", { params });
      setResults(data.data);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "course", header: "Course", render: (e) => `${e.course?.code} - ${e.course?.title}` },
    { key: "lecturer", header: "Lecturer", render: (e) => e.lecturer?.fullName },
    { key: "venue", header: "Venue", render: (e) => e.venue?.name },
    { key: "day", header: "Day", render: (e) => e.timeSlot?.day },
    { key: "time", header: "Time", render: (e) => `${e.timeSlot?.startTime} - ${e.timeSlot?.endTime}` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search Timetable</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Search published classes across the university by department, level, lecturer, venue, day, or course.
        </p>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select className="input-field" value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
            <option value="">Any department</option>
            {options.departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select className="input-field" value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })}>
            <option value="">Any level</option>
            {options.levels.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
          <select className="input-field" value={filters.semester} onChange={(e) => setFilters({ ...filters, semester: e.target.value })}>
            <option value="">Any semester</option>
            <option>First Semester</option>
            <option>Second Semester</option>
          </select>
          <select className="input-field" value={filters.lecturer} onChange={(e) => setFilters({ ...filters, lecturer: e.target.value })}>
            <option value="">Any lecturer</option>
            {options.lecturers.map((l) => <option key={l._id} value={l._id}>{l.fullName}</option>)}
          </select>
          <select className="input-field" value={filters.venue} onChange={(e) => setFilters({ ...filters, venue: e.target.value })}>
            <option value="">Any venue</option>
            {options.venues.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
          </select>
          <select className="input-field" value={filters.day} onChange={(e) => setFilters({ ...filters, day: e.target.value })}>
            <option value="">Any day</option>
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <input
            className="input-field sm:col-span-2"
            placeholder="Course title or code..."
            value={filters.course}
            onChange={(e) => setFilters({ ...filters, course: e.target.value })}
          />
        </div>
        <button onClick={runSearch} className="btn-primary mt-4">
          <SearchIcon className="h-4 w-4" /> Search
        </button>
      </Card>

      <Card>
        {loading ? (
          <TableSkeleton />
        ) : !searched ? (
          <EmptyState icon={SearchIcon} title="Start a search" description="Use the filters above to find classes across the university." />
        ) : (
          <Table columns={columns} data={results} emptyMessage="No matching classes found." />
        )}
      </Card>
    </div>
  );
}
