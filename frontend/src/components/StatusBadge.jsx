const CFG = {
  Pending:      { color: "#B87A0A", bg: "rgba(200,150,12,.12)",  dot: "#C8960C" },
  "In Progress":{ color: "#2A5DB5", bg: "rgba(74,126,232,.12)",  dot: "#4A7EE8" },
  Resolved:     { color: "#0D7A56", bg: "rgba(34,196,154,.12)",  dot: "#22C49A" },
  Rejected:     { color: "#A02020", bg: "rgba(224,82,82,.12)",   dot: "#E05252" },
};
export default function StatusBadge({ status }) {
  const c = CFG[status] || { color: "#9B7A40", bg: "rgba(155,122,64,.12)", dot: "#9B7A40" };
  return (
    <span className="stamp" style={{ color: c.color, background: c.bg, borderColor: c.color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display:"inline-block", flexShrink:0 }}/>
      {status}
    </span>
  );
}
