import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Lock, Phone, CalendarClock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const emptyForm = {
  fullName: "", email: "", password: "", role: "student", phone: "",
  matricNumber: "", staffId: "", title: "Dr.", officeLocation: "", officeHours: "",
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const redirectTo = await register(form);
      navigate(redirectTo);
    } catch (err) {
      const message = err.response?.data?.message || "Unable to register. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden gradient-bg flex items-center justify-center p-4">
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-navy-600/30 blur-3xl animate-float" />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-navy-400/20 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div className="absolute inset-0 bg-grid-pattern bg-[length:40px_40px] opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="mb-8 flex flex-col items-center text-white">
          <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-navy-400 to-navy-700 shadow-glow">
            <CalendarClock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">UniSchedule</h1>
          <p className="text-sm text-blue-200/70">Create your account</p>
        </div>

        <div className="glass-card p-8">
          <h2 className="mb-1 text-xl font-semibold">Register an account</h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
            Create your account and get taken straight to your dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1.5 block text-sm font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input required className="input-field pl-10" value={form.fullName} onChange={set("fullName")} />
                </div>
              </div>

              <div className="col-span-2">
                <label className="mb-1.5 block text-sm font-medium">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="email" required className="input-field pl-10" value={form.email} onChange={set("email")} placeholder="you@university.edu" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="password" required minLength={6} className="input-field pl-10" value={form.password} onChange={set("password")} />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input className="input-field pl-10" value={form.phone} onChange={set("phone")} />
                </div>
              </div>

              <div className="col-span-2">
                <label className="mb-1.5 block text-sm font-medium">I am registering as a...</label>
                <select className="input-field" value={form.role} onChange={set("role")}>
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {form.role === "student" && (
                <div className="col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">Matric Number</label>
                  <input className="input-field" value={form.matricNumber} onChange={set("matricNumber")} />
                </div>
              )}

              {form.role === "lecturer" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Title</label>
                    <input className="input-field" value={form.title} onChange={set("title")} placeholder="Dr. / Prof. / Mr." />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Staff ID</label>
                    <input className="input-field" value={form.staffId} onChange={set("staffId")} />
                  </div>
                </>
              )}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400"
              >
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
