import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export default function Card({ children, className = "", hover = false, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={cn("glass-card p-5", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
