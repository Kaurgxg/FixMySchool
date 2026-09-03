import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import StatusBadge from "../components/StatusBadge";
import PriorityPill from "../components/PriorityPill";
import EmptyState from "../components/EmptyState";
import { useToast } from "../context/ToastContext";

const STATUSES = ["Pending","In Progress","Resolved","Rejected"];
const CATS = ["Furniture","Electrical","Sanitation/Toilets","Structural/Building","Water Supply","Safety Hazard","Playground/Outdoor","Other"];
const PRIORITIES = ["Low","Medium","High","Critical"];

const th = { padding:"10px 14px", fontSize:".62rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#9B7A40", textAlign:"left", background:"#F0E4C4", borderBottom:"1.5px solid #C8A060" };
const td = { padding:"10px 14px", fontSize:".82rem", color:"#1C0D04", borderBottom:"1px solid #E8D5A8" };
const selectStyle = { background:"rgba(248,240,220,.75)", border:"1.5px solid #C8A060", borderRadius:8, padding:"6px 10px", fontSize:".78rem", color:"#1C0D04", outline:"none", fontFamily:"inherit", cursor:"pointer" };

export default function AdminPanel() {
  const showToast = useToast();
  const [issues,  setIssues]  = useState([]);
  const [users,   setUsers]   = useState([]);
  const [summary, setSummary] = useState(null);
  const [tab,     setTab]     = useState("issues");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [exporting, setExporting] = useState("");
  const [reminderBusy, setReminderBusy] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState(null);

  const [filters, setFilters] = useState({ status:"", category:"", priority:"", location:"", reporter:"", search:"" });

  const activeParams = Object.fromEntries(Object.entries(filters).filter(([,v]) => v));

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      api.get("/issues", { params: activeParams }),
      api.get("/admin/users"),
      api.get("/dashboard/summary"),
    ]).then(([i,u,s]) => { setIssues(i.data.issues); setUsers(u.data.users); setSummary(s.data); })
      .catch(() => setError("Couldn't load the admin panel. Please check your connection and try again."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const ch = e => setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
  const clearFilters = () => setFilters({ status:"", category:"", priority:"", location:"", reporter:"", search:"" });
  const hasActiveFilters = Object.values(filters).some(Boolean);

  async function toggleUser(id, isActive) {
    setTogglingUserId(id);
    try {
      await api.patch(`/admin/users/${id}/toggle-active`);
      const r = await api.get("/admin/users");
      setUsers(r.data.users);
      showToast(isActive ? "User deactivated." : "User reactivated.", "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not update this user.", "error");
    } finally {
      setTogglingUserId(null);
    }
  }

  // Downloads go through axios (not a plain <a href>) so the Authorization
  // header is sent, and the current on-screen filters are forwarded so the
  // export always matches what the admin is actually looking at.
  async function downloadReport(format) {
    setExporting(format);
    try {
      const res = await api.get(`/admin/reports/${format}`, {
        params: activeParams,
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: format === "csv" ? "text/csv" : "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `issues-report.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast(`${format.toUpperCase()} report downloaded.`, "success");
    } catch (err) {
      // With responseType: "blob", an error body also arrives as a Blob
      // (not parsed JSON), so it must be read as text before we can show it.
      let message = "Could not generate report.";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          message = JSON.parse(text).message || message;
        } catch { /* keep default message */ }
      } else {
        message = err.response?.data?.message || message;
      }
      showToast(message, "error");
    } finally {
      setExporting("");
    }
  }

  async function runReminders() {
    setReminderBusy(true);
    try {
      const res = await api.post("/admin/reminders/run");
      showToast(`Checked ${res.data.checked} issue${res.data.checked!==1?"s":""}, sent ${res.data.remindersSent} reminder${res.data.remindersSent!==1?"s":""}.`, "success");
    } catch (err) {
      showToast(err.response?.data?.message || "Could not run reminder sweep.", "error");
    } finally {
      setReminderBusy(false);
    }
  }

  const KPI = summary ? [
    { l:"Total",      v:summary.total,              bg:"rgba(255,255,255,.07)" },
    { l:"Pending",    v:summary.pending,             bg:"rgba(200,150,12,.18)" },
    { l:"In Progress",v:summary.inProgress,          bg:"rgba(74,126,232,.18)" },
    { l:"Resolved",   v:`${summary.resolvedPercentage}%`, bg:"rgba(34,196,154,.18)" },
  ] : [];

  return (
    <div style={{ minHeight:"100vh", background:"#F2E5C4" }}>
      {/* Header */}
      <div style={{ background:"#1C0D04", padding:"20px 24px 0", borderBottom:"2px solid #3D1F08" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
            <div>
              <p style={{ fontSize:".62rem", color:"#7B4A1E", textTransform:"uppercase", letterSpacing:".1em", marginBottom:3 }}>School Management</p>
              <h1 style={{ color:"#F2E5C4", fontWeight:800, fontSize:"1.35rem" }}>Admin Dashboard</h1>
            </div>
          </div>

          {/* KPI strip */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {KPI.map(k => (
                <div key={k.l} style={{ borderRadius:12, padding:"10px 14px", background:k.bg, border:"1.5px solid rgba(255,255,255,.1)" }}>
                  <p style={{ fontSize:".6rem", color:"#9B7A40", textTransform:"uppercase", letterSpacing:".08em", marginBottom:3 }}>{k.l}</p>
                  <p style={{ color:"#F2E5C4", fontWeight:800, fontSize:"1.5rem", lineHeight:1 }}>{k.v}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display:"flex", gap:6 }}>
            {[{k:"issues",l:"Issues",n:issues.length},{k:"users",l:"Users",n:users.length}].map(t => (
              <button key={t.k} onClick={() => setTab(t.k)} className="nav-pill" style={{ ...(tab===t.k ? {background:"#E8B830",color:"#1C0D04",borderColor:"#E8B830"} : {}) }}>
                {t.l}
                <span style={{ marginLeft:4, fontSize:".6rem", fontFamily:"'DM Mono',monospace", background: tab===t.k ? "rgba(0,0,0,.2)" : "rgba(255,255,255,.1)", color: tab===t.k ? "#1C0D04" : "#9B7A40", borderRadius:999, padding:"1px 6px" }}>{t.n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {error ? (
          <div role="alert" style={{ background:"rgba(200,60,40,.08)", border:"1.5px solid rgba(200,60,40,.25)", borderRadius:10, padding:"14px 16px", color:"#A02020", fontSize:".85rem", fontWeight:600 }}>
            {error}
          </div>
        ) : loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-label="Loading admin panel">
            {[...Array(3)].map((_,i) => (
              <div key={i} style={{ height:120, borderRadius:12, background:"rgba(155,122,64,.12)", animation:"pulse 1.4s ease-in-out infinite" }}/>
            ))}
          </div>
        ) : tab === "issues" ? (
          <div className="wood-card" style={{ overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", borderBottom:"1.5px solid #C8A060" }}>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <p style={{ fontSize:".88rem", fontWeight:700, color:"#1C0D04", flex:1 }}>All Reported Issues</p>
                <button onClick={() => downloadReport("csv")} disabled={exporting==="csv"} aria-busy={exporting==="csv"}
                  style={{ fontSize:".76rem", fontWeight:700, color:"#3D1F08", background:"rgba(248,240,220,.75)", border:"1.5px solid #C8A060", borderRadius:8, padding:"6px 12px", cursor: exporting==="csv" ? "default" : "pointer", fontFamily:"inherit" }}>
                  {exporting==="csv" ? "Exporting…" : "⬇ CSV"}
                </button>
                <button onClick={() => downloadReport("pdf")} disabled={exporting==="pdf"} aria-busy={exporting==="pdf"}
                  style={{ fontSize:".76rem", fontWeight:700, color:"#3D1F08", background:"rgba(248,240,220,.75)", border:"1.5px solid #C8A060", borderRadius:8, padding:"6px 12px", cursor: exporting==="pdf" ? "default" : "pointer", fontFamily:"inherit" }}>
                  {exporting==="pdf" ? "Exporting…" : "⬇ PDF"}
                </button>
                <button onClick={runReminders} disabled={reminderBusy} aria-busy={reminderBusy} title="Send pending-repair reminders now instead of waiting for the daily run"
                  style={{ fontSize:".76rem", fontWeight:700, color:"#8B6A08", background:"rgba(200,150,12,.1)", border:"1.5px solid rgba(200,150,12,.3)", borderRadius:8, padding:"6px 12px", cursor: reminderBusy ? "default" : "pointer", fontFamily:"inherit" }}>
                  {reminderBusy ? "Running…" : "🔔 Run Reminders"}
                </button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <label className="sr-only" htmlFor="af-search">Search keyword</label>
                <input id="af-search" name="search" value={filters.search} onChange={ch} placeholder="Search keyword…" style={selectStyle} className="col-span-2 lg:col-span-1"/>
                <label className="sr-only" htmlFor="af-status">Filter by status</label>
                <select id="af-status" name="status" value={filters.status} onChange={ch} style={selectStyle}>
                  <option value="">All Statuses</option>
                  {STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
                <label className="sr-only" htmlFor="af-category">Filter by category</label>
                <select id="af-category" name="category" value={filters.category} onChange={ch} style={selectStyle}>
                  <option value="">All Categories</option>
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
                <label className="sr-only" htmlFor="af-priority">Filter by priority</label>
                <select id="af-priority" name="priority" value={filters.priority} onChange={ch} style={selectStyle}>
                  <option value="">All Priorities</option>
                  {PRIORITIES.map(p=><option key={p}>{p}</option>)}
                </select>
                <label className="sr-only" htmlFor="af-location">Filter by location</label>
                <input id="af-location" name="location" value={filters.location} onChange={ch} placeholder="Location…" style={selectStyle}/>
                <label className="sr-only" htmlFor="af-reporter">Filter by reporter name</label>
                <input id="af-reporter" name="reporter" value={filters.reporter} onChange={ch} placeholder="Reporter name…" style={selectStyle}/>
              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters} style={{ marginTop:8, fontSize:".72rem", fontWeight:700, color:"#8B6A08", background:"none", border:"none", cursor:"pointer", textDecoration:"underline", padding:0 }}>
                  Clear all filters
                </button>
              )}
            </div>

            {issues.length === 0 ? (
              <div style={{ padding:"32px 16px" }}>
                <EmptyState icon="🗂" title="No issues match" subtitle="Try adjusting or clearing the filters above."/>
              </div>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="sm:hidden" style={{ padding:12, display:"flex", flexDirection:"column", gap:10 }}>
                  {issues.map(issue => (
                    <Link key={issue._id} to={`/issues/${issue._id}`} style={{ textDecoration:"none", display:"block", border:"1.5px solid #E8D5A8", borderRadius:10, padding:12, background:"#FDFAF3" }}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:".68rem", color:"#9B7A40" }}>{issue.issueCode}</span>
                        <StatusBadge status={issue.status}/>
                      </div>
                      <p style={{ fontWeight:700, color:"#1C0D04", fontSize:".88rem", marginBottom:6 }}>{issue.title}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <PriorityPill priority={issue.priority}/>
                        <span style={{ fontSize:".72rem", color:"#9B7A40" }}>{issue.category}</span>
                        <span style={{ fontSize:".72rem", color:"#9B7A40" }}>· {issue.reportedBy?.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Desktop/tablet table */}
                <div className="hidden sm:block" style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr><th style={th}>Code</th><th style={th}>Title</th><th style={th} className="hidden lg:table-cell">Category</th><th style={th}>Priority</th><th style={th}>Status</th><th style={th} className="hidden md:table-cell">Reporter</th><th style={th}></th></tr>
                    </thead>
                    <tbody>
                      {issues.map(issue => (
                        <tr key={issue._id} style={{ transition:"background .12s" }} onMouseOver={e=>e.currentTarget.style.background="rgba(248,240,220,.5)"} onMouseOut={e=>e.currentTarget.style.background=""}>
                          <td style={{ ...td, fontFamily:"'DM Mono',monospace", fontSize:".68rem", color:"#9B7A40" }}>{issue.issueCode}</td>
                          <td style={{ ...td, fontWeight:600, maxWidth:180 }}>
                            <span style={{ display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{issue.title}</span>
                          </td>
                          <td style={td} className="hidden lg:table-cell">{issue.category}</td>
                          <td style={td}><PriorityPill priority={issue.priority}/></td>
                          <td style={td}><StatusBadge status={issue.status}/></td>
                          <td style={{ ...td, color:"#9B7A40" }} className="hidden md:table-cell">{issue.reportedBy?.name}</td>
                          <td style={td}>
                            <Link to={`/issues/${issue._id}`}
                              style={{ fontSize:".72rem", fontWeight:700, color:"#8B6A08", background:"rgba(200,150,12,.15)", borderRadius:999, padding:"4px 12px", textDecoration:"none", whiteSpace:"nowrap" }}>
                              Manage →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="wood-card" style={{ overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", borderBottom:"1.5px solid #C8A060" }}>
              <p style={{ fontSize:".88rem", fontWeight:700, color:"#1C0D04" }}>Registered Users</p>
            </div>
            {users.length === 0 ? (
              <div style={{ padding:"32px 16px" }}>
                <EmptyState icon="👥" title="No users registered yet" subtitle="Users will appear here once they sign up."/>
              </div>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="sm:hidden" style={{ padding:12, display:"flex", flexDirection:"column", gap:10 }}>
                  {users.map(u => (
                    <div key={u._id} style={{ border:"1.5px solid #E8D5A8", borderRadius:10, padding:12, background:"#FDFAF3" }}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p style={{ fontWeight:700, color:"#1C0D04", fontSize:".88rem" }}>{u.name}</p>
                        <span style={{ fontSize:".78rem", fontWeight:600, color: u.isActive ? "#0D7A56" : "#A02020" }}>
                          {u.isActive ? "● Active" : "● Inactive"}
                        </span>
                      </div>
                      <p style={{ fontSize:".76rem", color:"#9B7A40", marginBottom:8 }}>{u.email} · <span style={{ textTransform:"capitalize" }}>{u.role}</span></p>
                      <button onClick={() => toggleUser(u._id, u.isActive)} disabled={togglingUserId===u._id} aria-busy={togglingUserId===u._id}
                        style={{ fontSize:".72rem", fontWeight:700, padding:"5px 14px", borderRadius:999, cursor: togglingUserId===u._id ? "default" : "pointer", fontFamily:"inherit", border:"1.5px solid", transition:"all .15s",
                          background: u.isActive ? "rgba(200,60,40,.1)" : "rgba(34,196,154,.1)",
                          color: u.isActive ? "#A02020" : "#0D7A56",
                          borderColor: u.isActive ? "rgba(200,60,40,.25)" : "rgba(34,196,154,.25)" }}>
                        {togglingUserId===u._id ? "Updating…" : u.isActive ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Desktop/tablet table */}
                <div className="hidden sm:block" style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                      <tr><th style={th}>Name</th><th style={th}>Email</th><th style={th}>Role</th><th style={th} className="hidden lg:table-cell">School ID</th><th style={th}>Status</th><th style={th}></th></tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id} onMouseOver={e=>e.currentTarget.style.background="rgba(248,240,220,.5)"} onMouseOut={e=>e.currentTarget.style.background=""}>
                          <td style={{ ...td, fontWeight:600 }}>{u.name}</td>
                          <td style={{ ...td, color:"#9B7A40" }}>{u.email}</td>
                          <td style={td}>
                            <span style={{ fontSize:".72rem", fontWeight:700, background:"#1C0D04", color:"#E8B830", borderRadius:999, padding:"3px 10px", textTransform:"capitalize" }}>{u.role}</span>
                          </td>
                          <td style={{ ...td, fontFamily:"'DM Mono',monospace", fontSize:".72rem" }} className="hidden lg:table-cell">{u.schoolId}</td>
                          <td style={td}>
                            <span style={{ fontSize:".78rem", fontWeight:600, color: u.isActive ? "#0D7A56" : "#A02020" }}>
                              {u.isActive ? "● Active" : "● Inactive"}
                            </span>
                          </td>
                          <td style={td}>
                            <button onClick={() => toggleUser(u._id, u.isActive)} disabled={togglingUserId===u._id} aria-busy={togglingUserId===u._id}
                              style={{ fontSize:".72rem", fontWeight:700, padding:"4px 12px", borderRadius:999, cursor: togglingUserId===u._id ? "default" : "pointer", fontFamily:"inherit", border:"1.5px solid", transition:"all .15s",
                                background: u.isActive ? "rgba(200,60,40,.1)" : "rgba(34,196,154,.1)",
                                color: u.isActive ? "#A02020" : "#0D7A56",
                                borderColor: u.isActive ? "rgba(200,60,40,.25)" : "rgba(34,196,154,.25)" }}>
                              {togglingUserId===u._id ? "Updating…" : u.isActive ? "Deactivate" : "Reactivate"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
