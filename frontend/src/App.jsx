import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ReportIssue from "./pages/ReportIssue";
import IssueList from "./pages/IssueList";
import IssueDetail from "./pages/IssueDetail";
import Notifications from "./pages/Notifications";
import AdminPanel from "./pages/AdminPanel";

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F2E5C4" }}>
      <p style={{ fontFamily:"'DM Mono',monospace", fontSize:".85rem", color:"#9B7A40" }}>Loading…</p>
    </div>
  );
  return (
    <div style={{ minHeight:"100vh", background:"#F2E5C4" }}>
      <Navbar/>
      <Routes>
        <Route path="/"          element={<Navigate to={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login"} replace/>}/>
        <Route path="/login"     element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace/> : <Login/>}/>
        <Route path="/register"  element={<Navigate to="/login" replace/>}/>
        <Route path="/dashboard" element={<ProtectedRoute restrictTo="user"><Dashboard/></ProtectedRoute>}/>
        <Route path="/issues/new"element={<ProtectedRoute restrictTo="user"><ReportIssue/></ProtectedRoute>}/>
        <Route path="/issues"    element={<ProtectedRoute><IssueList/></ProtectedRoute>}/>
        <Route path="/issues/:id"element={<ProtectedRoute><IssueDetail/></ProtectedRoute>}/>
        <Route path="/notifications" element={<ProtectedRoute><Notifications/></ProtectedRoute>}/>
        <Route path="/admin"     element={<ProtectedRoute restrictTo="admin"><AdminPanel/></ProtectedRoute>}/>
        <Route path="*" element={
          <div style={{ minHeight:"60vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, textAlign:"center", padding:24 }}>
            <p style={{ fontSize:32 }}>🧭</p>
            <h1 style={{ fontWeight:800, fontSize:"1.2rem", color:"#1C0D04" }}>Page not found</h1>
            <p style={{ fontSize:".85rem", color:"#9B7A40" }}>The page you're looking for doesn't exist.</p>
          </div>
        }/>
      </Routes>
    </div>
  );
}
