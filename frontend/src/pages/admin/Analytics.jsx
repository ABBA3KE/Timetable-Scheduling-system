import AdminDashboard from "./Dashboard";

// The overview dashboard already surfaces the full analytics suite
// (counts, lecturer workload, venue utilization); this route reuses it
// so "Analytics" in the sidebar and the dashboard stay perfectly in sync.
export default function Analytics() {
  return <AdminDashboard />;
}
