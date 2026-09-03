import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import PriorityPill from "../components/PriorityPill";
import ProtectedMedia, { getShareableMediaUrl } from "../components/ProtectedMedia";
import { useToast } from "../context/ToastContext";

const fmt = d => new Date(d).toLocaleString("en-IN",{ day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
const STEPS = ["Pending","In Progress","Resolved"];

const fld = { width:"100%", background:"rgba(248,240,220,.75)", border:"2px solid #C8A060", borderRadius:9, padding:"9px 13px", fontSize:".85rem", color:"#1C0D04", outline:"none", fontFamily:"inherit", transition:"border-color .15s" };

export default function IssueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const showToast = useToast();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sf, setSf] = useState({ status:"", note:"" });
  const [af, setAf] = useState({ assignedStaff:"", estimatedResolutionDate:"" });
  const [actionErr, setActionErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Opens a full-size image in a new tab using a short-lived (2 min),
  // media-scoped token minted just for this click - never the long-lived
  // session token, and never sitting around in a stored URL.
  async function openFullSize(src) {
    try {
      const url = await getShareableMediaUrl(src);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setActionErr("Could not open the image. Please try again.");
    }
  }

  function load() {
    setLoading(true);
    api.get(`/issues/${id}`)
      .then(r => {
        setIssue(r.data.issue);
        setSf({ status: r.data.issue.status, note:"" });
        setAf({ assignedStaff: r.data.issue.assignedStaff||"", estimatedResolutionDate: r.data.issue.estimatedResolutionDate?.slice(0,10)||"" });
      })
      .catch(() => setError("Issue not found or access denied."))
      .finally(() => setLoading(false));
  }
  useEffect(load, [id]);

  async function doStatus(e) {
    e.preventDefault(); setActionErr(""); setBusy(true);
    try { await api.patch(`/issues/${id}/status`, sf); load(); showToast(`Status updated to ${sf.status}.`, "success"); }
    catch(err) { const msg = err.response?.data?.message || "Could not update."; setActionErr(msg); showToast(msg, "error"); }
    finally { setBusy(false); }
  }
  async function doAssign(e) {
    e.preventDefault(); setActionErr(""); setBusy(true);
    try { await api.patch(`/issues/${id}/assign`, af); load(); showToast(`Assigned to ${af.assignedStaff}.`, "success"); }
    catch(err) { const msg = err.response?.data?.message || "Could not assign."; setActionErr(msg); showToast(msg, "error"); }
    finally { setBusy(false); }
  }

  const dotColor = { Pending:"#C8960C","In Progress":"#4A7EE8",Resolved:"#22C49A",Rejected:"#E05252" };

  if (loading) return (
    <div style={{ padding:"32px 24px" }} aria-busy="true" aria-label="Loading issue">
      <div style={{ height:24, width:180, borderRadius:6, background:"rgba(155,122,64,.15)", marginBottom:14, animation:"pulse 1.4s ease-in-out infinite" }}/>
      <div style={{ height:120, borderRadius:12, background:"rgba(155,122,64,.12)", animation:"pulse 1.4s ease-in-out infinite" }}/>
    </div>
  );
  if (error) return <div role="alert" style={{ margin:24, background:"rgba(200,60,40,.1)", border:"1.5px solid rgba(200,60,40,.22)", color:"#A02020", borderRadius:10, padding:"12px 16px", fontSize:13 }}>{error}</div>;
  if (!issue) return null;

  const stepIdx = STEPS.indexOf(issue.status);

  return (
    <div style={{ minHeight:"100vh", background:"#F2E5C4" }}>
      {/* Dark header */}
      <div style={{ background:"#1C0D04", padding:"18px 24px", borderBottom:"2px solid #3D1F08" }}>
        <div className="max-w-5xl mx-auto">
          <Link to="/issues" style={{ fontSize:".72rem", color:"#7B4A1E", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:4, marginBottom:10 }}>← Back to Issues</Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p style={{ fontFamily:"'DM Mono',monospace", fontSize:".68rem", color:"#7B4A1E", marginBottom:3 }}>{issue.issueCode}</p>
              <h1 style={{ color:"#F2E5C4", fontWeight:800, fontSize:"1.25rem", lineHeight:1.2 }}>{issue.title}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <StatusBadge status={issue.status}/>
                <PriorityPill priority={issue.priority}/>
                <span style={{ fontSize:".72rem", color:"#7B4A1E" }}>📍 {issue.location}</span>
                <span style={{ fontSize:".72rem", color:"#7B4A1E" }}>🗂 {issue.category}</span>
              </div>
            </div>
          </div>

          {/* Status stepper */}
          {issue.status !== "Rejected" && (
            <div className="flex items-center gap-0 mt-5">
              {STEPS.map((s,i) => {
                const done = i <= stepIdx, active = i === stepIdx;
                return (
                  <div key={s} className="flex items-center">
                    <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:999, fontSize:".72rem", fontWeight:700,
                      background: active ? "#E8B830" : done ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.07)",
                      color: active ? "#1C0D04" : done ? "#fff" : "#7B4A1E" }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background: active ? "#1C0D04" : done ? "#fff" : "#7B4A1E" }}/>
                      {s}
                    </div>
                    {i < STEPS.length-1 && <div style={{ width:24, height:1.5, background: i < stepIdx ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.1)" }}/>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid md:grid-cols-3 gap-5">

          {/* Main col */}
          <div className="md:col-span-2 flex flex-col gap-5">
            {/* Description */}
            <div className="wood-card" style={{ padding:"20px" }}>
              <p style={{ fontSize:".65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#9B7A40", marginBottom:10 }}>Description</p>
              <p style={{ fontSize:".88rem", color:"#3D1F08", lineHeight:1.6 }}>{issue.description}</p>
              {issue.images?.length > 0 && (
                <div className="flex gap-3 mt-4 flex-wrap">
                  {issue.images.map((src,i) => (
                    <button key={i} type="button" onClick={() => openFullSize(src)}
                      style={{ padding:0, border:"none", background:"none", cursor:"pointer" }}
                      aria-label={`Open image ${i+1} full size in a new tab`}>
                      <ProtectedMedia src={src} type="image" alt={`Issue photo ${i+1}`}
                        style={{ width:88, height:88, objectFit:"cover", borderRadius:10, border:"1.5px solid #C8A060" }}/>
                    </button>
                  ))}
                </div>
              )}
              {issue.videos?.length > 0 && (
                <div className="flex gap-3 mt-4 flex-wrap">
                  {issue.videos.map((src,i) => (
                    <ProtectedMedia key={i} src={src} type="video"
                      style={{ width:180, height:112, objectFit:"cover", borderRadius:10, border:"1.5px solid #C8A060" }}/>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="wood-card" style={{ padding:"20px" }}>
              <p style={{ fontSize:".65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#9B7A40", marginBottom:16 }}>Activity Timeline</p>
              <ol style={{ display:"flex", flexDirection:"column", gap:0 }}>
                {issue.timeline.map((entry,i) => (
                  <li key={i} style={{ display:"flex", gap:12 }}>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                      <div style={{ width:12, height:12, borderRadius:"50%", background: dotColor[entry.status]||"#C8960C", marginTop:2, border:"2px solid #F2E5C4", flexShrink:0 }}/>
                      {i < issue.timeline.length-1 && <div style={{ width:2, flex:1, background:"#C8A060", margin:"2px 0" }}/>}
                    </div>
                    <div style={{ paddingBottom:16 }}>
                      <p style={{ fontSize:".88rem", fontWeight:700, color:"#1C0D04" }}>{entry.status}</p>
                      {entry.note && <p style={{ fontSize:".8rem", color:"#7B4A1E", marginTop:2 }}>{entry.note}</p>}
                      <p style={{ fontFamily:"'DM Mono',monospace", fontSize:".62rem", color:"#9B7A40", marginTop:4 }}>{fmt(entry.date)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            <div className="wood-card" style={{ padding:"16px" }}>
              <p style={{ fontSize:".65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#9B7A40", marginBottom:12 }}>Details</p>
              {[
                { label:"Reported by", val:issue.reportedBy?.name },
                { label:"Role", val:issue.reportedBy?.role },
                { label:"Assigned to", val:issue.assignedStaff||"—" },
                issue.estimatedResolutionDate && { label:"ETA", val:fmt(issue.estimatedResolutionDate) },
                issue.resolvedAt && { label:"Resolved", val:fmt(issue.resolvedAt) },
              ].filter(Boolean).map(row => (
                <div key={row.label} style={{ display:"flex", justifyContent:"space-between", fontSize:".8rem", padding:"5px 0", borderBottom:"1px solid #E8D5A8" }}>
                  <span style={{ color:"#9B7A40" }}>{row.label}</span>
                  <span style={{ fontWeight:600, color:"#1C0D04", textAlign:"right", textTransform:"capitalize" }}>{row.val}</span>
                </div>
              ))}
            </div>

            {user.role === "admin" && (
              <>
                {actionErr && <div role="alert" style={{ background:"rgba(200,60,40,.1)", border:"1.5px solid rgba(200,60,40,.22)", color:"#A02020", borderRadius:9, padding:"8px 12px", fontSize:12, fontWeight:600 }}>{actionErr}</div>}
                <form onSubmit={doStatus} className="wood-card" style={{ padding:"16px", display:"flex", flexDirection:"column", gap:8 }}>
                  <label htmlFor="status-select" style={{ fontSize:".65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#9B7A40" }}>Update Status</label>
                  <select id="status-select" value={sf.status} onChange={e=>setSf(s=>({...s,status:e.target.value}))} style={{ ...fld }}>
                    {["Pending","In Progress","Resolved","Rejected"].map(s=><option key={s}>{s}</option>)}
                  </select>
                  <label htmlFor="status-note" className="sr-only">Status note</label>
                  <textarea id="status-note" value={sf.note} onChange={e=>setSf(s=>({...s,note:e.target.value}))} placeholder="Add a note (optional)" rows={2} style={{ ...fld, resize:"none" }}/>
                  <button disabled={busy} aria-busy={busy} className="btn-primary" style={{ width:"100%", justifyContent:"center" }}>{busy ? "Updating…" : "Update Status"}</button>
                </form>
                <form onSubmit={doAssign} className="wood-card" style={{ padding:"16px", display:"flex", flexDirection:"column", gap:8 }}>
                  <label htmlFor="assign-staff" style={{ fontSize:".65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#9B7A40" }}>Assign Task</label>
                  <input id="assign-staff" value={af.assignedStaff} onChange={e=>setAf(a=>({...a,assignedStaff:e.target.value}))} placeholder="Staff or vendor name" style={fld}/>
                  <div>
                    <label htmlFor="assign-eta" style={{ fontSize:".72rem", color:"#9B7A40", display:"block", marginBottom:4 }}>Est. resolution date</label>
                    <input id="assign-eta" type="date" value={af.estimatedResolutionDate} onChange={e=>setAf(a=>({...a,estimatedResolutionDate:e.target.value}))} style={fld}/>
                  </div>
                  <button disabled={busy} aria-busy={busy} className="btn-gold" style={{ width:"100%", justifyContent:"center" }}>{busy ? "Saving…" : "Save Assignment"}</button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
