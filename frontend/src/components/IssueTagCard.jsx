import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import PriorityPill from "./PriorityPill";

const CAT_ICONS = {
  "Furniture":"🪑","Electrical":"⚡","Sanitation/Toilets":"🚿",
  "Structural/Building":"🏗","Water Supply":"💧","Safety Hazard":"⚠️",
  "Playground/Outdoor":"🏃","Other":"🔧",
};

function Sparkline({ status }) {
  const colors = { Pending:"#C8960C","In Progress":"#4A7EE8",Resolved:"#22C49A",Rejected:"#E05252" };
  const col = colors[status] || "#9B7A40";
  const h = [10,6,14,5,16,9,13,7,15,10,12,6,11];
  return (
    <svg viewBox="0 0 78 20" style={{ width:"100%", height:22 }} preserveAspectRatio="none">
      <polyline fill="none" stroke={col} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity=".65"
        points={h.map((v,i)=>`${i*6.5},${20-v}`).join(" ")}/>
      <polyline fill={col} stroke="none" opacity=".1"
        points={`0,20 ${h.map((v,i)=>`${i*6.5},${20-v}`).join(" ")} 78,20`}/>
    </svg>
  );
}

export default function IssueTagCard({ issue }) {
  return (
    <Link to={`/issues/${issue._id}`} className="wood-card block" style={{ textDecoration:"none", padding:0, overflow:"hidden" }}>
      {/* Category colour strip */}
      <div style={{ height:3, background:"#C8960C", borderRadius:"14px 14px 0 0" }}/>
      <div style={{ padding:"12px 14px 14px" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div style={{ width:30, height:30, borderRadius:8, background:"rgba(200,150,12,.1)", border:"1px solid #C8A060", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
              {CAT_ICONS[issue.category] || "🔧"}
            </div>
            <div>
              <p style={{ fontFamily:"'DM Mono',monospace", fontSize:".6rem", color:"#9B7A40", marginBottom:1 }}>{issue.issueCode}</p>
              <h3 style={{ fontWeight:700, color:"#1C0D04", fontSize:".85rem", lineHeight:1.3 }}>{issue.title}</h3>
            </div>
          </div>
        </div>

        <Sparkline status={issue.status}/>

        <div className="flex items-center justify-between mt-2">
          <StatusBadge status={issue.status}/>
          <PriorityPill priority={issue.priority}/>
        </div>

        <p style={{ fontSize:".68rem", color:"#9B7A40", marginTop:8, display:"flex", alignItems:"center", gap:4 }}>
          <span>📍</span> {issue.location}
        </p>

        {issue.reportedBy && (
          <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid #C8A060", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <p style={{ fontSize:".68rem", color:"#9B7A40" }}>{issue.reportedBy.name}</p>
            <span style={{ fontSize:".6rem", fontWeight:700, background:"rgba(200,150,12,.1)", color:"#8B6A08", borderRadius:4, padding:"2px 7px", textTransform:"capitalize" }}>{issue.reportedBy.role}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
