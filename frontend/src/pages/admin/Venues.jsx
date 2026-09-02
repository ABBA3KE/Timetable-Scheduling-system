import { useState } from "react";
import ReferenceDataManager from "../../components/ui/ReferenceDataManager";

export default function Venues() {
  const [tab, setTab] = useState("Venues");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Venues &amp; Time Slots</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Define the rooms and weekly time periods the scheduler can allocate courses to.
        </p>
      </div>

      <div className="flex gap-2 border-b border-navy-100 dark:border-white/10 pb-2">
        {["Venues", "Time Slots"].map((t) => (
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

      {tab === "Venues" && (
        <ReferenceDataManager
          title="Venues"
          endpoint="/venues"
          fields={[
            { key: "name", label: "Venue Name" },
            { key: "code", label: "Code" },
            { key: "capacity", label: "Capacity", type: "number", default: 50 },
            {
              key: "type", label: "Type", type: "select", default: "Lecture Hall",
              options: ["Lecture Hall", "Laboratory", "Auditorium", "Classroom"].map((t) => ({ value: t, label: t })),
            },
            { key: "building", label: "Building" },
          ]}
          columns={[
            { key: "name", header: "Name" },
            { key: "code", header: "Code" },
            { key: "capacity", header: "Capacity" },
            { key: "type", header: "Type" },
          ]}
        />
      )}

      {tab === "Time Slots" && (
        <ReferenceDataManager
          title="Time Slots"
          endpoint="/time-slots"
          fields={[
            {
              key: "day", label: "Day", type: "select",
              options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => ({ value: d, label: d })),
            },
            { key: "startTime", label: "Start Time (HH:MM)" },
            { key: "endTime", label: "End Time (HH:MM)" },
            { key: "label", label: "Label (optional)" },
          ]}
          columns={[
            { key: "day", header: "Day" },
            { key: "startTime", header: "Start" },
            { key: "endTime", header: "End" },
          ]}
        />
      )}
    </div>
  );
}
