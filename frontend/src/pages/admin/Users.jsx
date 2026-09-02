import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, Power } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import { TableSkeleton } from "../../components/ui/Skeleton";

const emptyForm = {
  fullName: "", email: "", password: "", role: "student", phone: "",
  department: "", programme: "", level: "", matricNumber: "", staffId: "",
  title: "Dr.", officeLocation: "", officeHours: "", isClassRep: false,
};

const ROLE_VARIANT = { admin: "danger", lecturer: "info", student: "success" };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([api.get("/users"), api.get("/departments"), api.get("/programmes"), api.get("/levels")])
      .then(([u, d, p, l]) => {
        setUsers(u.data.data);
        setDepartments(d.data.data);
        setProgrammes(p.data.data);
        setLevels(l.data.data);
      })
      .finally(() => setLoading(false));
  };
  useEffect(loadAll, []);

  const openCreate = () => {
    setActive(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setActive(user);
    setForm({
      ...emptyForm, ...user,
      department: user.department?._id || "", programme: user.programme?._id || "", level: user.level?._id || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (active) {
        await api.put(`/users/${active._id}`, form);
        toast.success("User updated");
      } else {
        await api.post("/users", form);
        toast.success("User created - welcome notification sent");
      }
      setModalOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user permanently?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted");
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/users/${id}/toggle-active`);
      loadAll();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const filtered = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    const q = search.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const columns = [
    {
      key: "fullName",
      header: "Name",
      render: (u) => (
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-navy-700 text-xs font-bold text-white">
            {u.fullName[0]}
          </div>
          <div>
            <p className="font-medium">{u.fullName}</p>
            <p className="text-xs text-slate-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Role", render: (u) => <Badge variant={ROLE_VARIANT[u.role]}>{u.role}</Badge> },
    { key: "department", header: "Department", render: (u) => u.department?.name || "-" },
    { key: "phone", header: "Phone", render: (u) => u.phone || "-" },
    {
      key: "status",
      header: "Status",
      render: (u) => <Badge variant={u.isActive ? "success" : "danger"}>{u.isActive ? "Active" : "Disabled"}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (u) => (
        <div className="flex gap-1">
          <button onClick={() => handleToggle(u._id)} className="rounded-lg p-2 hover:bg-navy-100 dark:hover:bg-white/10" title="Toggle active">
            <Power className="h-4 w-4" />
          </button>
          <button onClick={() => openEdit(u)} className="rounded-lg p-2 hover:bg-navy-100 dark:hover:bg-white/10" title="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(u._id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" title="Delete">
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
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage admin, lecturer, and student accounts.</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>Add User</Button>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input-field pl-10" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input-field max-w-[160px]" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="lecturer">Lecturer</option>
            <option value="student">Student</option>
          </select>
        </div>
        {loading ? <TableSkeleton /> : <Table columns={columns} data={filtered} />}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={active ? "Edit User" : "Add User"} maxWidth="max-w-2xl">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full Name"><input className="input-field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
          <Field label="Email"><input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!active} /></Field>
          {!active && <Field label="Temporary Password"><input className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="changeme123" /></Field>}
          <Field label="Role">
            <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={!!active}>
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <Field label="Phone Number"><input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Department">
            <select className="input-field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              <option value="">Select</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </Field>

          {form.role === "lecturer" && (
            <>
              <Field label="Title"><input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Dr. / Prof. / Mr." /></Field>
              <Field label="Staff ID"><input className="input-field" value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })} /></Field>
              <Field label="Office Location"><input className="input-field" value={form.officeLocation} onChange={(e) => setForm({ ...form, officeLocation: e.target.value })} /></Field>
              <Field label="Office Hours"><input className="input-field" value={form.officeHours} onChange={(e) => setForm({ ...form, officeHours: e.target.value })} placeholder="Mon & Wed, 2-4pm" /></Field>
            </>
          )}

          {form.role === "student" && (
            <>
              <Field label="Matric Number"><input className="input-field" value={form.matricNumber} onChange={(e) => setForm({ ...form, matricNumber: e.target.value })} /></Field>
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
              <Field label="Class Representative?">
                <select className="input-field" value={form.isClassRep ? "yes" : "no"} onChange={(e) => setForm({ ...form, isClassRep: e.target.value === "yes" })}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </Field>
            </>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>Save User</Button>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
