import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

const CATS = [
  { v:"Furniture",          icon:"🪑" },
  { v:"Electrical",         icon:"⚡" },
  { v:"Sanitation/Toilets", icon:"🚿" },
  { v:"Structural/Building",icon:"🏗" },
  { v:"Water Supply",       icon:"💧" },
  { v:"Safety Hazard",      icon:"⚠️" },
  { v:"Playground/Outdoor", icon:"🏃" },
  { v:"Other",              icon:"🔧" },
];
const PRIS = ["Low","Medium","High","Critical"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const fld = { width:"100%", background:"rgba(248,240,220,.75)", border:"2px solid #C8A060", borderRadius:9, padding:"9px 13px", fontSize:".88rem", color:"#1C0D04", outline:"none", fontFamily:"inherit" };

export default function ReportIssue() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [form, setForm] = useState({ title:"", description:"", category:"", location:"", priority:"Medium" });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const ch = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  function handleImages(e) {
    const all = Array.from(e.target.files).slice(0,5);
    const oversized = all.find(f => f.size > MAX_IMAGE_BYTES);
    if (oversized) { setError(`"${oversized.name}" is over 5 MB. Please choose a smaller image.`); return; }
    setError("");
    setImages(all); setPreviews(all.map(f => URL.createObjectURL(f)));
  }

  function handleVideos(e) {
    const all = Array.from(e.target.files).slice(0,2);
    const oversized = all.find(f => f.size > MAX_VIDEO_BYTES);
    if (oversized) { setError(`"${oversized.name}" is over 50 MB. Please choose a smaller video.`); return; }
    setError("");
    setVideos(all); setVideoPreviews(all.map(f => URL.createObjectURL(f)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.category) { setError("Please select a category."); return; }
    setError(""); setBusy(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k,v]) => data.append(k,v));
      images.forEach(img => data.append("images", img));
      videos.forEach(vid => data.append("videos", vid));
      const res = await api.post("/issues", data);
      showToast("Issue reported successfully.", "success");
      navigate(`/issues/${res.data.issue._id}`);
    } catch(err) { setError(err.response?.data?.message || "Could not submit. Try again."); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ minHeight:"100vh", background:"#F2E5C4" }}>
      {/* Header */}
      <div style={{ background:"#1C0D04", padding:"20px 24px", borderBottom:"2px solid #3D1F08" }}>
        <div className="max-w-2xl mx-auto">
          <p style={{ fontSize:".62rem", color:"#7B4A1E", textTransform:"uppercase", letterSpacing:".1em", marginBottom:3 }}>New Report</p>
          <h1 style={{ color:"#F2E5C4", fontWeight:800, fontSize:"1.35rem" }}>Report a Facility Issue</h1>
          <p style={{ color:"#7B4A1E", fontSize:".82rem", marginTop:3 }}>Be descriptive — clear details help the school respond faster.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {error && <div role="alert" style={{ background:"rgba(200,60,40,.1)", border:"1.5px solid rgba(200,60,40,.22)", color:"#A02020", borderRadius:10, padding:"9px 14px", fontSize:13, fontWeight:600, marginBottom:14 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Details card */}
          <div className="wood-card" style={{ padding:"20px" }}>
            <p style={{ fontSize:".65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#9B7A40", marginBottom:14 }}>Issue Details</p>
            <label htmlFor="ri-title" style={{ display:"block", fontSize:".72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#7B4A1E", marginBottom:4 }}>Title</label>
            <input id="ri-title" name="title" required value={form.title} onChange={ch} placeholder="e.g. Broken bench in Class 6-B" style={{ ...fld, marginBottom:12 }}/>
            <label htmlFor="ri-description" style={{ display:"block", fontSize:".72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#7B4A1E", marginBottom:4 }}>Description</label>
            <textarea id="ri-description" name="description" required rows={4} value={form.description} onChange={ch} placeholder="Describe what's wrong, when you noticed it, and any safety risk." style={{ ...fld, resize:"none" }}/>
          </div>

          {/* Category card */}
          <div className="wood-card" style={{ padding:"20px" }}>
            <p id="ri-category-label" style={{ fontSize:".65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#9B7A40", marginBottom:14 }}>Category</p>
            <div role="group" aria-labelledby="ri-category-label" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATS.map(c => (
                <button type="button" key={c.v} onClick={() => setForm(f=>({...f,category:c.v}))} aria-pressed={form.category===c.v}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, padding:"10px 4px", borderRadius:10, border:`2px solid ${form.category===c.v ? "#1C0D04" : "#C8A060"}`, background: form.category===c.v ? "#1C0D04" : "rgba(248,240,220,.55)", cursor:"pointer", transition:"all .15s", minWidth:0 }}>
                  <span style={{ fontSize:20 }}>{c.icon}</span>
                  <span style={{ fontSize:".6rem", fontWeight:600, color: form.category===c.v ? "#E8B830" : "#3D1F08", textAlign:"center", lineHeight:1.2, overflowWrap:"break-word", wordBreak:"break-word", maxWidth:"100%" }}>{c.v}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location + Priority */}
          <div className="wood-card" style={{ padding:"20px" }}>
            <p style={{ fontSize:".65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#9B7A40", marginBottom:14 }}>Location & Priority</p>
            <label htmlFor="ri-location" style={{ display:"block", fontSize:".72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#7B4A1E", marginBottom:4 }}>Location within school</label>
            <input id="ri-location" name="location" required value={form.location} onChange={ch} placeholder="e.g. Class 6-B, First Floor" style={{ ...fld, marginBottom:14 }}/>
            <p id="ri-priority-label" style={{ display:"block", fontSize:".72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#7B4A1E", marginBottom:8 }}>Priority level</p>
            <div role="group" aria-labelledby="ri-priority-label" style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {PRIS.map(p => (
                <button type="button" key={p} onClick={() => setForm(f=>({...f,priority:p}))} aria-pressed={form.priority===p}
                  style={{ padding:"7px 16px", borderRadius:999, fontSize:".82rem", fontWeight:600, border:`2px solid ${form.priority===p ? "#1C0D04" : "#C8A060"}`, background: form.priority===p ? "#1C0D04" : "rgba(248,240,220,.55)", color: form.priority===p ? "#E8B830" : "#3D1F08", cursor:"pointer" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div className="wood-card" style={{ padding:"20px" }}>
            <label htmlFor="ri-images" style={{ display:"block", fontSize:".65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#9B7A40", marginBottom:12 }}>Photos (optional, max 5)</label>
            <label htmlFor="ri-images" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:"2px dashed #C8A060", borderRadius:10, padding:"24px", cursor:"pointer", background:"rgba(248,240,220,.4)", transition:"border-color .15s" }}>
              <span style={{ fontSize:28, marginBottom:6 }}>📷</span>
              <span style={{ fontSize:".82rem", fontWeight:600, color:"#3D1F08" }}>Click to upload photos</span>
              <span style={{ fontSize:".72rem", color:"#9B7A40", marginTop:3 }}>JPG, PNG, WebP — up to 5 MB each</span>
              <input id="ri-images" type="file" accept="image/*" multiple onChange={handleImages} style={{ display:"none" }}/>
            </label>
            {previews.length > 0 && (
              <div style={{ display:"flex", gap:10, marginTop:12, flexWrap:"wrap" }}>
                {previews.map((src,i) => <img key={i} src={src} alt="" style={{ width:72, height:72, objectFit:"cover", borderRadius:9, border:"1.5px solid #C8A060" }}/>)}
              </div>
            )}
          </div>

          {/* Videos */}
          <div className="wood-card" style={{ padding:"20px" }}>
            <label htmlFor="ri-videos" style={{ display:"block", fontSize:".65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#9B7A40", marginBottom:12 }}>Videos (optional, max 2)</label>
            <label htmlFor="ri-videos" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:"2px dashed #C8A060", borderRadius:10, padding:"24px", cursor:"pointer", background:"rgba(248,240,220,.4)", transition:"border-color .15s" }}>
              <span style={{ fontSize:28, marginBottom:6 }}>🎥</span>
              <span style={{ fontSize:".82rem", fontWeight:600, color:"#3D1F08" }}>Click to upload videos</span>
              <span style={{ fontSize:".72rem", color:"#9B7A40", marginTop:3 }}>MP4, MOV, WebM, AVI, MKV — up to 50 MB each</span>
              <input id="ri-videos" type="file" accept="video/*" multiple onChange={handleVideos} style={{ display:"none" }}/>
            </label>
            {videoPreviews.length > 0 && (
              <div style={{ display:"flex", gap:10, marginTop:12, flexWrap:"wrap" }}>
                {videoPreviews.map((src,i) => (
                  <video key={i} src={src} controls style={{ width:140, height:88, objectFit:"cover", borderRadius:9, border:"1.5px solid #C8A060" }}/>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={busy} aria-busy={busy} className="btn-primary" style={{ justifyContent:"center", padding:"13px", fontSize:".9rem" }}>
            {busy ? "Submitting report…" : "Submit Report →"}
          </button>
        </form>
      </div>
    </div>
  );
}
