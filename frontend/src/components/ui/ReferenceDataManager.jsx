import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import Card from "./Card";
import Button from "./Button";
import Modal from "./Modal";
import Table from "./Table";
import { TableSkeleton } from "./Skeleton";

/**
 * Generic list + create/edit/delete manager for simple reference-data
 * resources (Faculty, Department, Programme, Level, Venue, TimeSlot,
 * AcademicSession). Driven entirely by a small config object so each
 * concrete page is just a few lines - mirrors the backend's generic
 * CRUD controller factory.
 */
export default function ReferenceDataManager({ title, description, endpoint, fields, columns }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(endpoint).then(({ data }) => setItems(data.data)).finally(() => setLoading(false));
  };
  useEffect(load, [endpoint]);

  const openCreate = () => {
    setActive(null);
    setForm(Object.fromEntries(fields.map((f) => [f.key, f.default ?? ""])));
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setActive(item);
    const next = {};
    fields.forEach((f) => {
      const val = item[f.key];
      next[f.key] = f.type === "select" && val && typeof val === "object" ? val._id : val ?? f.default ?? "";
    });
    setForm(next);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (active) await api.put(`${endpoint}/${active._id}`, form);
      else await api.post(endpoint, form);
      toast.success(`${title.slice(0, -1)} saved`);
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this record?")) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const tableColumns = [
    ...columns,
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(row)} className="rounded-lg p-2 hover:bg-navy-100 dark:hover:bg-white/10">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(row._id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        <Button icon={Plus} onClick={openCreate}>Add {title.slice(0, -1)}</Button>
      </div>

      <Card>{loading ? <TableSkeleton rows={4} /> : <Table columns={tableColumns} data={items} />}</Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={active ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`}>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1.5 block text-sm font-medium">{f.label}</label>
              {f.type === "select" ? (
                <select className="input-field" value={form[f.key] || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                  <option value="">Select</option>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === "checkbox" ? (
                <input type="checkbox" checked={!!form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} />
              ) : (
                <input
                  type={f.type || "text"}
                  className="input-field"
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm({ ...form, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}
