import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center gradient-bg">
        <Loader2 className="h-8 w-8 animate-spin text-blue-300" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RoleRoute({ allow }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) {
    const home = { admin: "/admin", lecturer: "/lecturer", student: "/student" }[user.role];
    return <Navigate to={home} replace />;
  }
  return <Outlet />;
}
