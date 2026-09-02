export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="mb-4 rounded-2xl bg-navy-50 dark:bg-white/5 p-4">
          <Icon className="h-8 w-8 text-navy-400" />
        </div>
      )}
      <h3 className="font-semibold text-lg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
