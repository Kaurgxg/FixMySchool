import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import EmptyState from "../components/EmptyState";

const TYPE_CFG = {
  status_update: { icon:"🔄", bg:"rgba(74,126,232,.12)",   color:"#2A5DB5" },
  resolved:      { icon:"✅", bg:"rgba(34,196,154,.12)",  color:"#0D7A56" },
  reminder:      { icon:"⏰", bg:"rgba(200,150,12,.12)",   color:"#8B6A08" },
  assigned:      { icon:"🧰", bg:"rgba(155,122,64,.12)",   color:"#7B4A1E" },
  general:       { icon:"🔔", bg:"rgba(155,122,64,.12)",   color:"#7B4A1E" },
};
const ago = d => { const s=Math.floor((Date.now()-new Date(d))/1000); if(s<60)return"just now"; if(s<3600)return`${Math.floor(s/60)}m ago`; if(s<86400)return`${Math.floor(s/3600)}h ago`; return`${Math.floor(s/86400)}d ago`; };

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); api.get("/notifications").then(r=>setNotifs(r.data.notifications)).finally(()=>setLoading(false)); };
  useEffect(load, []);

  const unread = notifs.filter(n=>!n.read).length;

  return (
    <div style={{ minHeight:"100vh", background:"#F2E5C4" }}>
      <div style={{ background:"#1C0D04", padding:"20px 24px", borderBottom:"2px solid #3D1F08" }}>
        <div className="max-w-2xl mx-auto flex items-end justify-between gap-4">
          <div>
            <p style={{ fontSize:".62rem", color:"#7B4A1E", textTransform:"uppercase", letterSpacing:".1em", marginBottom:3 }}>Alerts</p>
            <h1 style={{ color:"#F2E5C4", fontWeight:800, fontSize:"1.35rem" }}>Notifications</h1>
          </div>
          {unread > 0 && (
            <button onClick={() => api.patch("/notifications/read-all").then(load)} className="btn-ghost-wood" style={{ fontSize:".78rem", marginBottom:2 }}>
              Mark all read ({unread})
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <p style={{ fontFamily:"'DM Mono',monospace", fontSize:".85rem", color:"#9B7A40" }}>Loading…</p>
        ) : notifs.length === 0 ? (
          <EmptyState icon="🔔" title="No notifications yet" subtitle="You'll be notified whenever an issue you reported is updated."/>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {notifs.map(n => {
              const t = TYPE_CFG[n.type] || TYPE_CFG.general;
              return (
                <div key={n._id} className="wood-card" style={{ padding:"14px 16px", display:"flex", alignItems:"flex-start", gap:12, opacity: n.read ? .62 : 1, outline: !n.read ? "1.5px solid rgba(200,150,12,.3)" : "none" }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:t.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>{t.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:".85rem", color:"#1C0D04", lineHeight:1.4 }}>{n.message}</p>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:5 }}>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:".68rem", color:"#9B7A40" }}>{ago(n.createdAt)}</span>
                      {n.issue && (
                        <Link to={`/issues/${n.issue._id}`} style={{ fontSize:".72rem", fontWeight:700, color:"#8B6A08", textDecoration:"none" }}>
                          View {n.issue.issueCode} →
                        </Link>
                      )}
                    </div>
                  </div>
                  {!n.read && (
                    <button onClick={() => api.patch(`/notifications/${n._id}/read`).then(load)}
                      style={{ flexShrink:0, fontSize:".68rem", fontWeight:700, color:"#9B7A40", background:"rgba(200,150,12,.1)", border:"1px solid #C8A060", borderRadius:999, padding:"3px 10px", cursor:"pointer", fontFamily:"inherit" }}>
                      Read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
