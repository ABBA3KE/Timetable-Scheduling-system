import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

export default function Button({
  children,
  variant = "primary",
  loading = false,
  icon: Icon,
  className = "",
  ...props
}) {
  const base =
    variant === "primary" ? "btn-primary" : variant === "secondary" ? "btn-secondary" : "btn-primary bg-red-600 from-red-600 to-red-700";

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={cn(base, className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </motion.button>
  );
}
