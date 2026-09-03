import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import IssueTagCard from "../components/IssueTagCard";
import EmptyState from "../components/EmptyState";

const CATS = ["Furniture","Electrical","Sanitation/Toilets","Structural/Building","Water Supply","Safety Hazard","Playground/Outdoor","Other"];
const STATUSES = ["Pending","In Progress","Resolved","Rejected"];
const PRIORITIES = ["Low","Medium","High","Critical"];

export default function IssueList() {
  const { user } = useAuth();
  const [sp] = useSearchParams();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: sp.get("status")||"", category: sp.get("category")||"", priority: sp.get("priority")||"", search:"" });

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = Object.fromEntries(Object.entries(filters).filter(([,v])=>v));
    api.get("/issues", { params })
      .then(r => setIssues(r.data.issues))
      .catch(() => setError("Couldn't load issues. Please check your connection and try again."))
      .finally(() => setLoading(false));
  }, [filters]);

  const ch = e => setFilters(f => ({ ...f, [e.target.name]: e.target.value }));

  const selectStyle = { background:"rgba(248,240,220,.75)", border:"2px solid #C8A060", borderRadius:9, padding:"8px 12px", fontSize:".82rem", color:"#1C0D04", outline:"none", fontFamily:"inherit", cursor:"pointer" };

  return (
    <div style={{ minHeight:"100vh", background:"#F2E5C4" }}>
      {/* Header */}
      <div style={{ background:"#1C0D04", padding:"20px 24px 0", borderBottom:"2px solid #3D1F08" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
            <div>
              <p style={{ fontSize:".62rem", color:"#7B4A1E", textTransform:"uppercase", letterSpacing:".1em", marginBottom:3 }}>
                {user.role === "admin" ? "All Reports" : "My Reports"}
              </p>
              <h1 style={{ color:"#F2E5C4", fontWeight:800, fontSize:"1.35rem" }}>Issue Tracker</h1>
            </div>
            {user.role !== "admin" && (
              <Link to="/issues/new" className="btn-gold" style={{ marginBottom:5, textDecoration:"none" }}>+ Report Issue</Link>
            )}
          </div>
          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pb-4">
            <label className="sr-only" htmlFor="issue-search">Search issues</label>
            <input id="issue-search" name="search" value={filters.search} onChange={ch} placeholder="Search issues…"
              style={{ ...selectStyle, gridColumn:"span 2 / span 2" }} className="md:col-span-1"/>
            <label className="sr-only" htmlFor="issue-status">Filter by status</label>
            <select id="issue-status" name="status"   value={filters.status}   onChange={ch} style={selectStyle}>
              <option value="">All Statuses</option>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
            <label className="sr-only" htmlFor="issue-category">Filter by category</label>
            <select id="issue-category" name="category" value={filters.category} onChange={ch} style={selectStyle}>
              <option value="">All Categories</option>
              {CATS.map(c=><option key={c}>{c}</option>)}
            </select>
            <label className="sr-only" htmlFor="issue-priority">Filter by priority</label>
            <select id="issue-priority" name="priority" value={filters.priority} onChange={ch} style={selectStyle}>
              <option value="">All Priorities</option>
              {PRIORITIES.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {error ? (
          <div role="alert" style={{ background:"rgba(200,60,40,.08)", border:"1.5px solid rgba(200,60,40,.25)", borderRadius:10, padding:"14px 16px", color:"#A02020", fontSize:".85rem", fontWeight:600 }}>
            {error}
          </div>
        ) : (
          <>
            <p style={{ fontSize:".8rem", color:"#9B7A40", marginBottom:16, fontFamily:"'DM Mono',monospace" }}>
              {issues.length} issue{issues.length!==1?"s":""} found
            </p>
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" aria-busy="true" aria-label="Loading issues">
                {[...Array(4)].map((_,i) => (
                  <div key={i} style={{ height:150, borderRadius:12, background:"rgba(155,122,64,.12)", animation:"pulse 1.4s ease-in-out infinite" }}/>
                ))}
              </div>
            ) : issues.length === 0 ? (
              <EmptyState icon="🗂" title="No issues match" subtitle="Try clearing some filters or report a new issue."/>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {issues.map(issue => <IssueTagCard key={issue._id} issue={issue}/>)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
