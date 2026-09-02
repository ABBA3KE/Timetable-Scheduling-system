import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users2, Search } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import { TableSkeleton } from "../../components/ui/Skeleton";

const emptyForm = {
  title: "", code: "", units: 3, department: "", programme: "", level: "",
  semester: "First Semester", studentCount: 50, sessionsPerWeek: 1,
};

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [levels, setLevels] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeCourse, setActiveCourse] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api.get("/courses"),
      api.get("/departments"),
      api.get("/programmes"),
      api.get("/levels"),
      api.get("/users", { params: { role: "lecturer" } }),
    ])
      .then(([c, d, p, l, u]) => {
        setCourses(c.data.data);
        setDepartments(d.data.data);
        setProgrammes(p.data.data);
        setLevels(l.data.data);
        setLecturers(u.data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadAll, []);

  const openCreate = () => {
    setActiveCourse(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (course) => {
    setActiveCourse(course);
    setForm({
      title: course.title, code: course.code, units: course.units,
      department: course.department?._id, programme: course.programme?._id || "",
      level: course.level?._id, semester: course.semester,
      studentCount: course.studentCount, sessionsPerWeek: course.sessionsPerWeek,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeCourse) {
        await api.put(`/courses/${activeCourse._id}`, form);
        toast.success("Course updated");
      } else {
        await api.post("/courses", form);
        toast.success("Course created");
      }
      setModalOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    try {
      await api.delete(`/courses/${id}`);
      toast.success("Course deleted");
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete course");
    }
  };

  const openAssign = (course) => {
    setActiveCourse(course);
    setForm({ ...form, lecturerIds: course.lecturers.map((l) => l._id) });
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    setSaving(true);
    try {
      await api.patch(`/courses/${activeCourse._id}/assign-lecturers`, { lecturerIds: form.lecturerIds || [] });
      toast.success("Lecturers assigned");
      setAssignOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign lecturers");
    } finally {
      setSaving(false);
    }
  };

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: "code", header: "Code", render: (c) => <span className="font-semibold">{c.code}</span> },
    { key: "title", header: "Title" },
    { key: "department", header: "Department", render: (c) => c.department?.name },
    { key: "level", header: "Level", render: (c) => c.level?.name },
    { key: "semester", header: "Semester" },
    {
      key: "lecturers",
      header: "Lecturer(s)",
      render: (c) =>
        c.lecturers?.length ? (
          <div className="flex flex-wrap gap-1">
            {c.lecturers.map((l) => (
              <Badge key={l._id} variant="info">{l.fullName}</Badge>
            ))}
          </div>
        ) : (
          <Badge variant="warning">Unassigned</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (c) => (
        <div className="flex gap-1">
          <button onClick={() => openAssign(c)} className="rounded-lg p-2 hover:bg-navy-100 dark:hover:bg-white/10" title="Assign lecturers">
            <Users2 className="h-4 w-4" />
          </button>
          <button onClick={() => openEdit(c)} className="rounded-lg p-2 hover:bg-navy-100 dark:hover:bg-white/10" title="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(c._id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" title="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage courses and assign lecturers.</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>Add Course</Button>
      </div>

      <Card>
        <div className="mb-4 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input-field pl-10"
            placeholder="Search by title or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading ? <TableSkeleton /> : <Table columns={columns} data={filtered} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={activeCourse ? "Edit Course" : "Add Course"}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Course Title" className="col-span-2">
            <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Course Code">
            <input className="input-field" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          </Field>
          <Field label="Units">
            <input type="number" min="1" max="6" className="input-field" value={form.units} onChange={(e) => setForm({ ...form, units: Number(e.target.value) })} />
          </Field>
          <Field label="Department">
            <select className="input-field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              <option value="">Select</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Programme">
            <select className="input-field" value={form.programme} onChange={(e) => setForm({ ...form, programme: e.target.value })}>
              <option value="">Select</option>
              {programmes.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Level">
            <select className="input-field" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option value="">Select</option>
              {levels.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </Field>
          <Field label="Semester">
            <select className="input-field" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
              <option>First Semester</option>
              <option>Second Semester</option>
            </select>
          </Field>
          <Field label="Expected Students">
            <input type="number" min="1" className="input-field" value={form.studentCount} onChange={(e) => setForm({ ...form, studentCount: Number(e.target.value) })} />
          </Field>
          <Field label="Sessions / Week">
            <input type="number" min="1" max="5" className="input-field" value={form.sessionsPerWeek} onChange={(e) => setForm({ ...form, sessionsPerWeek: Number(e.target.value) })} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>Save Course</Button>
        </div>
      </Modal>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title={`Assign Lecturers - ${activeCourse?.code || ""}`}>
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {lecturers.map((l) => (
            <label key={l._id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-navy-50 dark:hover:bg-white/5">
              <input
                type="checkbox"
                checked={form.lecturerIds?.includes(l._id) || false}
                onChange={(e) => {
                  const ids = form.lecturerIds || [];
                  setForm({
                    ...form,
                    lecturerIds: e.target.checked ? [...ids, l._id] : ids.filter((id) => id !== l._id),
                  });
                }}
              />
              <span className="text-sm">{l.fullName} <span className="text-slate-400">({l.email})</span></span>
            </label>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleAssign}>Save Assignment</Button>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
