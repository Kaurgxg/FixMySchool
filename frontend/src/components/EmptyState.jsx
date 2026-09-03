export default function EmptyState({ icon = "📋", title, subtitle, action }) {
  return (
    <div style={{ textAlign:"center", padding:"48px 24px", border:"2px dashed #C8A060", borderRadius:14, background:"rgba(248,240,220,.4)" }}>
      <div style={{ width:52, height:52, margin:"0 auto 12px", borderRadius:"50%", background:"rgba(200,150,12,.1)", border:"1.5px solid #C8A060", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{icon}</div>
      <h3 style={{ fontWeight:700, color:"#1C0D04", fontSize:15 }}>{title}</h3>
      {subtitle && <p style={{ fontSize:13, color:"#9B7A40", marginTop:5, maxWidth:280, margin:"6px auto 0" }}>{subtitle}</p>}
      {action && <div style={{ marginTop:16 }}>{action}</div>}
    </div>
  );
}
