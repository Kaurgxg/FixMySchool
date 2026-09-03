import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function ProtectedRoute({ children, restrictTo }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:"60vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ fontFamily:"'DM Mono',monospace", fontSize:".85rem", color:"#9B7A40" }}>Checking session…</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace/>;
  // Normal users must never land on admin-only screens...
  if (restrictTo === "admin" && user.role !== "admin") return <Navigate to="/dashboard" replace/>;
  // ...and admins are routed to their own dashboard instead of the
  // student/teacher/parent-facing pages (e.g. reporting a new issue).
  if (restrictTo === "user" && user.role === "admin") return <Navigate to="/admin" replace/>;
  return children;
}
