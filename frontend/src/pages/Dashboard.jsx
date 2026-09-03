import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import IssueTagCard from "../components/IssueTagCard";
import EmptyState from "../components/EmptyState";

const CAT_ICONS = { "Furniture":"🪑","Electrical":"⚡","Sanitation/Toilets":"🚿","Structural/Building":"🏗","Water Supply":"💧","Safety Hazard":"⚠️","Playground/Outdoor":"🏃","Other":"🔧" };
const PRIORITY_ORDER = ["Critical","High","Medium","Low"];
const PRIORITY_COLOR = { Critical:"#E05252", High:"#E8862B", Medium:"#C8960C", Low:"#4A9E7E" };

const STATS = [
  { key:"total",      label:"Total Issues",  icon:"🗂",  col:"rgba(200,150,12,.12)",  txt:"#8B6A08" },
  { key:"pending",    label:"Pending",        icon:"⏳", col:"rgba(200,150,12,.18)",  txt:"#8B6A08" },
  { key:"inProgress", label:"In Progress",   icon:"🔧", col:"rgba(74,126,232,.12)",  txt:"#2A5DB5" },
  { key:"resolved",   label:"Resolved",       icon:"✅", col:"rgba(34,196,154,.12)", txt:"#0D7A56" },
];

function DonutRing({ pct }) {
  const r = 28, c = 2 * Math.PI * r, dash = (pct / 100) * c;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76">
      <circle cx="38" cy="38" r={r} fill="none" stroke="#E8D5A8" strokeWidth="7"/>
      <circle cx="38" cy="38" r={r} fill="none" stroke="#22C49A" strokeWidth="7"
        strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={c * 0.25} strokeLinecap="round"/>
      <text x="38" y="43" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1C0D04" fontFamily="DM Sans">{pct}%</text>
    </svg>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/summary").then(r => setSummary(r.data)).finally(() => setLoading(false));
  }, []);

  const maxCat = summary?.byCategory?.length ? Math.max(...summary.byCategory.map(c => c.count)) : 1;

  return (
    <div style={{ minHeight:"100vh", background:"#F2E5C4" }}>
      {/* Dark wood header */}
      <div style={{ background:"#1C0D04", padding:"20px 24px 24px", borderBottom:"2px solid #3D1F08" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div style={{ width:56, height:56, borderRadius:12, background:"#0F0702", border:"1.5px solid #3D1F08", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🏫</div>
              <div>
                <p style={{ fontSize:".62rem", color:"#7B4A1E", textTransform:"uppercase", letterSpacing:".1em", marginBottom:3 }}>School ID · {user.schoolId}</p>
                <h1 style={{ color:"#F2E5C4", fontWeight:800, fontSize:"1.4rem", lineHeight:1.2 }}>
                  {user.role === "admin" ? "School Overview" : `Welcome, ${user.name.split(" ")[0]}`}
                </h1>
                <p style={{ color:"#7B4A1E", fontSize:".8rem", marginTop:2, textTransform:"capitalize" }}>{user.role} · Facility Portal</p>
              </div>
            </div>
            {summary && (
              <div className="flex gap-6 sm:gap-8 flex-wrap">
                {STATS.map(s => (
                  <div key={s.key} style={{ textAlign:"right" }}>
                    <p style={{ color:"#7B4A1E", fontSize:".6rem", textTransform:"uppercase", letterSpacing:".08em" }}>{s.label}</p>
                    <p style={{ color:"#F2E5C4", fontWeight:800, fontSize:"1.8rem", lineHeight:1 }}>{summary[s.key]}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Category quick-filter pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 flex-wrap">
            {Object.entries(CAT_ICONS).map(([cat, icon]) => (
              <Link key={cat} to={`/issues?category=${encodeURIComponent(cat)}`}
                style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:999, border:"1.5px solid rgba(200,150,12,.25)", color:"rgba(242,229,196,.5)", fontSize:".75rem", textDecoration:"none", whiteSpace:"nowrap" }}
                onMouseOver={e=>e.currentTarget.style.color="#F2E5C4"} onMouseOut={e=>e.currentTarget.style.color="rgba(242,229,196,.5)"}>
                {icon} {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <p style={{ fontFamily:"'DM Mono',monospace", fontSize:".85rem", color:"#9B7A40" }}>Loading dashboard…</p>
        ) : !summary ? null : (
          <>
            {/* Stat cards row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {STATS.map(s => (
                <div key={s.key} className="wood-card" style={{ padding:"14px 16px" }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:s.col, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, marginBottom:8 }}>{s.icon}</div>
                  <p style={{ fontSize:"1.6rem", fontWeight:800, color:"#1C0D04", lineHeight:1 }}>{summary[s.key]}</p>
                  <p style={{ fontSize:".72rem", color:"#9B7A40", marginTop:3 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {/* Donut */}
              <div className="wood-card" style={{ padding:"20px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
                <p style={{ fontWeight:700, color:"#1C0D04", fontSize:".88rem" }}>Resolution Rate</p>
                <DonutRing pct={summary.resolvedPercentage}/>
                <p style={{ fontSize:".72rem", color:"#9B7A40", textAlign:"center" }}>{summary.resolved} resolved of {summary.total} total</p>
                {summary.avgResolutionDays > 0 && (
                  <p style={{ fontSize:".72rem", color:"#9B7A40" }}>Avg: <strong style={{ color:"#1C0D04" }}>{summary.avgResolutionDays} days</strong></p>
                )}
              </div>

              {/* Category bars */}
              <div className="wood-card md:col-span-2" style={{ padding:"20px" }}>
                <p style={{ fontWeight:700, color:"#1C0D04", fontSize:".88rem", marginBottom:14 }}>Issues by Category</p>
                {summary.byCategory.length === 0 ? (
                  <p style={{ fontSize:".82rem", color:"#9B7A40" }}>No data yet.</p>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {[...summary.byCategory].sort((a,b)=>b.count-a.count).map(c => (
                      <Link key={c.category} to={`/issues?category=${encodeURIComponent(c.category)}`} className="flex items-center gap-3" style={{ textDecoration:"none" }}>
                        <span style={{ fontSize:".85rem", width:18 }}>{CAT_ICONS[c.category]||"🔧"}</span>
                        <div style={{ flex:1 }}>
                          <div className="flex justify-between" style={{ fontSize:".72rem", marginBottom:3 }}>
                            <span style={{ color:"#3D1F08" }}>{c.category}</span>
                            <span style={{ fontFamily:"'DM Mono',monospace", color:"#1C0D04", fontWeight:600 }}>{c.count}</span>
                          </div>
                          <div style={{ height:6, borderRadius:999, background:"#E8D5A8", overflow:"hidden" }}>
                            <div style={{ height:"100%", borderRadius:999, background:"#1C0D04", width:`${(c.count/maxCat)*100}%` }}/>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Priority breakdown */}
            <div className="wood-card mb-6" style={{ padding:"20px" }}>
              <p style={{ fontWeight:700, color:"#1C0D04", fontSize:".88rem", marginBottom:14 }}>Issues by Priority</p>
              {!summary.byPriority || summary.byPriority.length === 0 ? (
                <p style={{ fontSize:".82rem", color:"#9B7A40" }}>No data yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PRIORITY_ORDER.map(p => {
                    const entry = summary.byPriority.find(x => x.priority === p);
                    const count = entry ? entry.count : 0;
                    return (
                      <Link key={p} to={`/issues?priority=${encodeURIComponent(p)}`}
                        style={{ display:"block", textDecoration:"none", border:`1.5px solid ${PRIORITY_COLOR[p]}33`, borderRadius:10, padding:"10px 12px", background:`${PRIORITY_COLOR[p]}0F` }}>
                        <p style={{ fontSize:".68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".05em", color:PRIORITY_COLOR[p], marginBottom:4 }}>{p}</p>
                        <p style={{ fontSize:"1.3rem", fontWeight:800, color:"#1C0D04", lineHeight:1 }}>{count}</p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent issues */}
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontWeight:700, color:"#1C0D04", fontSize:".95rem" }}>Recent Issues</h2>
              <div className="flex items-center gap-3">
                <Link to="/issues" style={{ fontSize:".8rem", color:"#9B7A40", textDecoration:"none", fontWeight:600 }}>View all →</Link>
                <Link to="/issues/new" className="btn-primary" style={{ fontSize:".8rem", padding:"8px 18px" }}>+ Report Issue</Link>
              </div>
            </div>

            {summary.recentIssues.length === 0 ? (
              <EmptyState icon="🗂" title="No issues yet"
                subtitle="Start by reporting a facility problem — it takes under a minute."
                action={<Link to="/issues/new" className="btn-primary">Report first issue</Link>}/>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.recentIssues.map(issue => <IssueTagCard key={issue._id} issue={issue}/>)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
