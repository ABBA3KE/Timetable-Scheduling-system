const VARIANTS = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  danger: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  neutral: "bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300",
};

export default function Badge({ children, variant = "neutral", className = "" }) {
  return <span className={`badge ${VARIANTS[variant]} ${className}`}>{children}</span>;
}
