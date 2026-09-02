import { motion } from "framer-motion";
import Card from "./Card";

export default function StatCard({ icon: Icon, label, value, trend, gradient = "from-blue-500 to-navy-700" }) {
  return (
    <Card hover className="overflow-hidden relative">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-2xl`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-1 text-3xl font-bold tracking-tight"
          >
            {value}
          </motion.p>
          {trend && <p className="mt-1 text-xs text-emerald-500">{trend}</p>}
        </div>
        <div className={`rounded-xl bg-gradient-to-br ${gradient} p-3 shadow-glow`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </Card>
  );
}
