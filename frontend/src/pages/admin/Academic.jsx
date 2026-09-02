import { useState, useEffect } from "react";
import ReferenceDataManager from "../../components/ui/ReferenceDataManager";
import api from "../../api/axios";

const TABS = ["Faculties", "Departments", "Programmes", "Levels", "Academic Sessions"];

export default function Academic() {
  const [tab, setTab] = useState("Faculties");
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    api.get("/faculties").then(({ data }) => setFaculties(data.data));
    api.get("/departments").then(({ data }) => setDepartments(data.data));
  }, [tab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Faculties &amp; Departments</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage the institutional academic structure.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-navy-100 dark:border-white/10 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-navy-900 text-white dark:bg-white/10" : "text-slate-500 hover:bg-navy-50 dark:hover:bg-white/5"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Faculties" && (
        <ReferenceDataManager
          title="Faculties"
          endpoint="/faculties"
          fields={[
            { key: "name", label: "Faculty Name" },
            { key: "code", label: "Code" },
          ]}
          columns={[
            { key: "name", header: "Name" },
            { key: "code", header: "Code" },
          ]}
        />
      )}

      {tab === "Departments" && (
        <ReferenceDataManager
          title="Departments"
          endpoint="/departments"
          fields={[
            { key: "name", label: "Department Name" },
            { key: "code", label: "Code" },
            { key: "faculty", label: "Faculty", type: "select", options: faculties.map((f) => ({ value: f._id, label: f.name })) },
          ]}
          columns={[
            { key: "name", header: "Name" },
            { key: "code", header: "Code" },
            { key: "faculty", header: "Faculty", render: (r) => r.faculty?.name },
          ]}
        />
      )}

      {tab === "Programmes" && (
        <ReferenceDataManager
          title="Programmes"
          endpoint="/programmes"
          fields={[
            { key: "name", label: "Programme Name" },
            { key: "code", label: "Code" },
            { key: "department", label: "Department", type: "select", options: departments.map((d) => ({ value: d._id, label: d.name })) },
            { key: "durationYears", label: "Duration (years)", type: "number", default: 4 },
          ]}
          columns={[
            { key: "name", header: "Name" },
            { key: "code", header: "Code" },
            { key: "department", header: "Department", render: (r) => r.department?.name },
          ]}
        />
      )}

      {tab === "Levels" && (
        <ReferenceDataManager
          title="Levels"
          endpoint="/levels"
          fields={[
            { key: "name", label: "Level Name (e.g. 300 Level)" },
            { key: "code", label: "Code (e.g. 300)" },
          ]}
          columns={[
            { key: "name", header: "Name" },
            { key: "code", header: "Code" },
          ]}
        />
      )}

      {tab === "Academic Sessions" && (
        <ReferenceDataManager
          title="Academic Sessions"
          endpoint="/sessions"
          fields={[
            { key: "name", label: "Session (e.g. 2025/2026)" },
            { key: "isActive", label: "Set as active session", type: "checkbox" },
          ]}
          columns={[
            { key: "name", header: "Session" },
            { key: "isActive", header: "Active", render: (r) => (r.isActive ? "Yes" : "No") },
          ]}
        />
      )}
    </div>
  );
}
