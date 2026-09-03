const CFG = {
  Low:      { bg: "rgba(155,122,64,.12)", color: "#9B7A40" },
  Medium:   { bg: "rgba(200,150,12,.15)", color: "#8B6A08" },
  High:     { bg: "rgba(224,82,82,.12)",  color: "#A02020" },
  Critical: { bg: "#E05252",              color: "#fff"    },
};
export default function PriorityPill({ priority }) {
  const c = CFG[priority] || CFG.Low;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", fontSize:".62rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", padding:"2px 8px", borderRadius:999, background:c.bg, color:c.color }}>
      {priority}
    </span>
  );
}
