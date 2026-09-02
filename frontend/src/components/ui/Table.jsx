import { motion } from "framer-motion";

export default function Table({ columns, data, emptyMessage = "No records found.", rowKey = "_id" }) {
  if (!data || data.length === 0) {
    return (
      <div className="py-14 text-center text-slate-400">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-navy-100 dark:border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy-50/80 dark:bg-white/5 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-semibold">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <motion.tr
              key={row[rowKey] || i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="border-t border-navy-100 dark:border-white/5 hover:bg-navy-50/60 dark:hover:bg-white/5 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
