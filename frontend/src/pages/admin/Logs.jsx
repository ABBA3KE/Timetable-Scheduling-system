import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import api from "../../api/axios";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import { TableSkeleton } from "../../components/ui/Skeleton";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    api
      .get("/activity-logs", { params: { page } })
      .then(({ data }) => {
        setLogs(data.logs);
        setPages(data.pages);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const columns = [
    { key: "user", header: "User", render: (l) => l.user?.fullName || "System" },
    { key: "action", header: "Action", render: (l) => <Badge variant="info">{l.action.replaceAll("_", " ")}</Badge> },
    { key: "entity", header: "Entity" },
    { key: "details", header: "Details" },
    {
      key: "createdAt",
      header: "When",
      render: (l) => formatDistanceToNow(new Date(l.createdAt), { addSuffix: true }),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Logs</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Audit trail of administrative actions across the system.</p>
      </div>

      <Card>
        {loading ? (
          <TableSkeleton rows={8} />
        ) : (
          <>
            <Table columns={columns} data={logs} />
            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-secondary disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-slate-400">Page {page} of {pages}</span>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
