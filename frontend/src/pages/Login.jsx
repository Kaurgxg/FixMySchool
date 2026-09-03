import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Admins cannot self-register, so the signup role picker only ever offers
// Student/Teacher/Parent - matching what the backend actually allows.
const ROLES = [
  { id: "student", label: "Student",  sub: "Scholar",  icon: "🎒" },
  { id: "teacher", label: "Teacher",  sub: "Educator", icon: "📚" },
  { id: "parent",  label: "Parent",   sub: "Guardian", icon: "👪" },
];

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [tab,  setTab]  = useState("login");
  const [portal, setPortal] = useState("user"); // "user" | "admin" - which login experience is active
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({ name:"", email:"", password:"", schoolId:"" });
  const [error, setError] = useState("");
  const [busy,  setBusy]  = useState(false);

  // Bus animation refs
  const sceneRef   = useRef(null);
  const panelRef   = useRef(null);
  const busRef     = useRef(null);
  const wfRef      = useRef(null);
  const wrRef      = useRef(null);
  const rafRef     = useRef(null);
  const puffTimerRef = useRef(null);

  // Detect mobile (skip animation)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  useEffect(() => {
    if (isMobile) {
      if (panelRef.current) panelRef.current.style.clipPath = "inset(0 0% 0 0)";
      return;
    }
    const BW = 212, SPD = 295;
    let x = -BW - 60, lt = null, deg = 0, pT = 0;

    function getW() { return sceneRef.current?.offsetWidth || 680; }

    function addPuff() {
      const sc = sceneRef.current; if (!sc) return;
      const el = document.createElement("div");
      el.style.cssText = `position:absolute;width:14px;height:14px;border-radius:50%;background:rgba(110,100,80,.45);z-index:9;left:${x + 5}px;bottom:88px;animation:puff 1.3s ease-out forwards;pointer-events:none`;
      sc.appendChild(el);
      setTimeout(() => { try { sc.removeChild(el); } catch (_) {} }, 1300);
    }

    function frame(t) {
      const SW = getW();
      if (!lt) lt = t;
      const dt = Math.min((t - lt) / 1000, 0.05); lt = t;
      x += SPD * dt; deg += (SPD * dt / (2 * Math.PI * 18)) * 360;
      if (busRef.current) busRef.current.style.left = x + "px";
      if (wfRef.current)  wfRef.current.setAttribute("transform", `rotate(${deg},154,76)`);
      if (wrRef.current)  wrRef.current.setAttribute("transform", `rotate(${deg},36,76)`);
      const front = x + BW;
      const pct = Math.max(0, Math.min(100, (front / SW) * 100));
      if (panelRef.current) panelRef.current.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      pT += dt; if (pT > 0.18) { addPuff(); pT = 0; }
      if (x < SW + 60) { rafRef.current = requestAnimationFrame(frame); }
      else { if (panelRef.current) panelRef.current.style.clipPath = "inset(0 0% 0 0)"; }
    }

    const timer = setTimeout(() => {
      if (panelRef.current) panelRef.current.style.clipPath = "inset(0 100% 0 0)";
      rafRef.current = requestAnimationFrame(frame);
    }, 700);

    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Road dash animation
  useEffect(() => {
    if (isMobile) return;
    let off = 0, r = null;
    const runner = document.getElementById("dash-runner");
    function tick() { off -= 2.4; if (off <= -48) off = 0; if (runner) runner.style.transform = `translateX(${off}px)`; r = requestAnimationFrame(tick); }
    r = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(r);
  }, []);

  function ch(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  // Placed after all hooks (rules-of-hooks requires hooks to run
  // unconditionally on every render), but still before any other logic
  // that assumes a logged-out user.
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;

  async function doLogin(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const loggedInUser = await login(form.email, form.password, portal);
      navigate(loggedInUser.role === "admin" ? "/admin" : "/dashboard");
    }
    catch (err) { setError(err.response?.data?.message || "Invalid email or password."); }
    finally { setBusy(false); }
  }

  async function doSignup(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, schoolId: form.schoolId, role });
      navigate("/dashboard");
    } catch (err) { setError(err.response?.data?.message || "Could not create account."); }
    finally { setBusy(false); }
  }

  /* ── Form panel (shared between mobile-direct and desktop-revealed) ── */
  const FormPanel = (
    <div style={{ display:"flex", width:"100%", height:"100%", overflow:"hidden" }}>

      {/* LEFT DECO — hidden on mobile */}
      <div className="hidden sm:flex" style={{ width:252, minWidth:252, background:"#0F0702", borderRight:"2px solid #3D1F08", flexDirection:"column", alignItems:"center", padding:"24px 18px 20px", position:"relative", overflow:"hidden", justifyContent:"space-between" }}>
        {/* wood grain */}
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:.06 }} viewBox="0 0 252 530" preserveAspectRatio="none">
          {[40,95,152,210,268,328,385,444].map(y => <line key={y} x1="0" y1={y} x2="252" y2={y+12} stroke="#C8960C" strokeWidth="1"/>)}
        </svg>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
          <div style={{ width:54, height:54, borderRadius:"50%", background:"#1C0D04", border:"2px solid #C8960C", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="34" height="34" viewBox="0 0 36 36"><polygon points="18,3 22,14 34,14 24,21 28,33 18,26 8,33 12,21 2,14 14,14" fill="none" stroke="#C8960C" strokeWidth="1.5"/><text x="18" y="23" textAnchor="middle" fontSize="13" fontWeight="800" fill="#E8B830" fontFamily="system-ui">F</text></svg>
          </div>
          <div style={{ fontSize:17, fontWeight:800, color:"#E8B830", textAlign:"center" }}>FixMySchool</div>
          <div style={{ fontSize:10, fontWeight:700, color:"#7B5A28", textTransform:"uppercase", letterSpacing:".1em", textAlign:"center" }}>Facility Portal</div>
        </div>

        {/* Books SVG */}
        <svg width="184" height="120" viewBox="0 0 184 120" style={{ flexShrink:0 }}>
          <ellipse cx="92" cy="118" rx="76" ry="5" fill="rgba(0,0,0,.4)"/>
          <rect x="20" y="64" width="148" height="20" rx="3" fill="#1A3A1A" transform="rotate(-4,96,74)"/>
          <rect x="20" y="64" width="12" height="20" rx="2" fill="#244A24" transform="rotate(-4,96,74)"/>
          <rect x="14" y="82" width="156" height="20" rx="3" fill="#1A1A3A"/>
          <rect x="14" y="82" width="12" height="20" rx="2" fill="#222268"/>
          <text x="96" y="96" textAnchor="middle" fontSize="7" fill="rgba(180,180,255,.42)" fontFamily="serif" fontStyle="italic">Maintenance Log</text>
          <rect x="10" y="100" width="164" height="20" rx="3" fill="#3A1010"/>
          <rect x="10" y="100" width="12" height="20" rx="2" fill="#5A1818"/>
          <text x="102" y="113" textAnchor="middle" fontSize="7" fill="rgba(255,180,180,.42)" fontFamily="serif" fontStyle="italic">Inspection Records</text>
          <rect x="6" y="78" width="172" height="20" rx="3" fill="#3D2008" transform="rotate(2,92,88)"/>
          <rect x="6" y="78" width="12" height="20" rx="2" fill="#5A3010" transform="rotate(2,92,88)"/>
          <rect x="22" y="54" width="140" height="22" rx="3" fill="#2A1804" transform="rotate(-7,92,65)"/>
          <rect x="22" y="54" width="13" height="22" rx="2" fill="#3D2A10" transform="rotate(-7,92,65)"/>
          <path d="M 148,54 L 148,74 L 142,70 L 136,74 L 136,54" fill="#C8960C" transform="rotate(-7,92,65)" opacity=".7"/>
        </svg>

        <div style={{ width:"100%", height:1, background:"linear-gradient(90deg,transparent,#3D1F08,transparent)" }}/>
        <p style={{ fontSize:11, color:"#6B4A20", textAlign:"center", lineHeight:1.6, fontStyle:"italic", padding:"0 4px" }}>"A well-maintained school is a promise kept to every child."</p>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center" }}>
          {["Report","Track","Resolve"].map(b => <span key={b} style={{ fontSize:9, fontWeight:700, color:"#C8960C", border:"1px solid #3D1F08", borderRadius:4, padding:"3px 8px", textTransform:"uppercase", letterSpacing:".07em" }}>{b}</span>)}
        </div>

        <svg width="38" height="52" viewBox="0 0 40 56" style={{ flexShrink:0, animation:"float 3s ease-in-out infinite" }}>
          <rect x="15" y="0" width="10" height="8" rx="2" fill="#4A2810"/>
          <rect x="8" y="10" width="24" height="34" rx="4" fill="#2A1804" stroke="#5A3010" strokeWidth="1.5"/>
          <rect x="10" y="12" width="8" height="30" rx="2" fill="rgba(240,160,40,.12)"/>
          <rect x="22" y="12" width="8" height="30" rx="2" fill="rgba(240,160,40,.12)"/>
          <ellipse cx="20" cy="28" rx="7" ry="10" fill="#F8A828" opacity=".65" style={{ animation:"lampglow 2s ease-in-out infinite" }}/>
          <rect x="6" y="44" width="28" height="6" rx="3" fill="#3D1F08"/>
          <rect x="4" y="48" width="32" height="6" rx="3" fill="#2A1404"/>
        </svg>
      </div>

      {/* RIGHT FORM */}
      <div style={{ flex:1, background:"#F2E5C4", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"16px 20px", overflowY:"auto", minWidth:0 }}>
        {/* Mobile logo */}
        <div className="flex sm:hidden items-center gap-2 mb-5">
          <div style={{ width:36, height:36, borderRadius:"50%", background:"#1C0D04", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"#E8B830", fontWeight:800, fontSize:14 }}>F</span>
          </div>
          <span style={{ fontWeight:800, fontSize:17, color:"#1C0D04" }}>FixMySchool</span>
        </div>

        {error && <div role="alert" style={{ width:"100%", maxWidth:300, background:"rgba(200,60,40,.1)", border:"1.5px solid rgba(200,60,40,.22)", color:"#A02020", borderRadius:9, padding:"8px 12px", fontSize:12, fontWeight:600, textAlign:"center", marginBottom:10 }}>{error}</div>}

        {/* Portal toggle - Admin Login vs Student/Teacher/Parent Login */}
        <div role="tablist" aria-label="Choose login portal" style={{ display:"flex", width:"100%", maxWidth:300, borderRadius:9, overflow:"hidden", border:"2px solid #3D1F08", marginBottom:10, flexShrink:0 }}>
          {[{ id:"user", label:"Student / Teacher / Parent" }, { id:"admin", label:"Admin Login" }].map(p => (
            <button key={p.id} type="button" role="tab" aria-selected={portal===p.id}
              onClick={() => { setPortal(p.id); setError(""); if (p.id === "admin") setTab("login"); }}
              style={{ flex:1, padding:"9px 6px", fontSize:10.5, fontWeight:800, cursor:"pointer", border:"none", fontFamily:"inherit", letterSpacing:".04em", textTransform:"uppercase", transition:"all .15s", background: portal===p.id ? "#3D1F08" : "rgba(255,248,220,.5)", color: portal===p.id ? "#E8B830" : "#7B4A1E" }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Tabs (Sign Up hidden for the Admin portal - admins can't self-register) */}
        <div role="tablist" aria-label="Log in or sign up" style={{ display:"flex", width:"100%", maxWidth:300, borderRadius:9, overflow:"hidden", border:"2px solid #8B6030", marginBottom:14, flexShrink:0 }}>
          {(portal === "admin" ? ["login"] : ["login","signup"]).map(t => (
            <button key={t} type="button" role="tab" aria-selected={tab===t} onClick={() => { setTab(t); setError(""); }}
              style={{ flex:1, padding:"8px 0", fontSize:11, fontWeight:700, cursor:"pointer", border:"none", fontFamily:"inherit", letterSpacing:".08em", textTransform:"uppercase", transition:"all .15s", background: tab===t ? "#1C0D04" : "transparent", color: tab===t ? "#E8B830" : "#8B6030" }}>
              {t === "login" ? (portal === "admin" ? "Admin Log In" : "Log In") : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Role selector - signup only, and never includes Admin (admins can't self-register) */}
        {tab === "signup" && (
          <div style={{ display:"flex", gap:7, width:"100%", maxWidth:300, marginBottom:14, flexShrink:0 }}>
            {ROLES.map(r => (
              <div key={r.id} onClick={() => setRole(r.id)} role="button" tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setRole(r.id); }}
                aria-pressed={role===r.id} aria-label={`Register as ${r.label}`}
                style={{ flex:1, border: role===r.id ? "2px solid #E8B830" : "2px solid #C8A060", borderRadius:10, padding:"9px 4px 7px", textAlign:"center", cursor:"pointer", background: role===r.id ? "#1C0D04" : "rgba(255,248,220,.55)", transform: role===r.id ? "translateY(-3px)" : "none", transition:"all .18s", position:"relative" }}>
                {role===r.id && <div style={{ position:"absolute", top:-7, right:-7, width:16, height:16, background:"#E8B830", borderRadius:"50%", fontSize:9, fontWeight:900, color:"#1C0D04", display:"flex", alignItems:"center", justifyContent:"center" }}>✓</div>}
                <span style={{ fontSize:20, display:"block", marginBottom:3 }}>{r.icon}</span>
                <div style={{ fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:".07em", color: role===r.id ? "#E8B830" : "#3D1F08" }}>{r.label}</div>
                <div style={{ fontSize:9, color: role===r.id ? "rgba(232,184,48,.6)" : "#9B7A40", marginTop:1 }}>{r.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* LOGIN */}
        {tab === "login" && (
          <form onSubmit={doLogin} style={{ width:"100%", display:"flex", flexDirection:"column", alignItems:"center" }}>
            <div style={{ width:"100%", maxWidth:300, marginBottom:9 }}>
              <label htmlFor="login-email" style={{ display:"block", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#7B4A1E", marginBottom:4 }}>Email</label>
              <input id="login-email" className="field" name="email" type="email" required value={form.email} onChange={ch} placeholder="you@school.edu"/>
            </div>
            <div style={{ width:"100%", maxWidth:300, marginBottom:12 }}>
              <label htmlFor="login-password" style={{ display:"block", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#7B4A1E", marginBottom:4 }}>Password</label>
              <input id="login-password" className="field" name="password" type="password" required value={form.password} onChange={ch} placeholder="••••••••"/>
            </div>
            <button type="submit" disabled={busy} aria-busy={busy} style={{ width:"100%", maxWidth:300, background:"#1C0D04", color:"#E8B830", border:"none", borderRadius:999, padding:11, fontSize:13, fontWeight:800, cursor: busy ? "default" : "pointer", fontFamily:"inherit", letterSpacing:".07em", textTransform:"uppercase", marginBottom:10, opacity: busy ? .6 : 1 }}>
              {busy ? "Entering portal…" : portal === "admin" ? "Enter Admin Portal →" : "Enter Portal →"}
            </button>
            {portal === "user" && (
              <p style={{ fontSize:12, color:"#9B7A40", marginTop:9, textAlign:"center" }}>
                No account?{" "}
                <span onClick={() => { setTab("signup"); setError(""); }} style={{ color:"#1C0D04", fontWeight:700, cursor:"pointer", textDecoration:"underline" }}>Sign Up</span>
              </p>
            )}
          </form>
        )}

        {/* SIGNUP */}
        {tab === "signup" && (
          <form onSubmit={doSignup} style={{ width:"100%", display:"flex", flexDirection:"column", alignItems:"center" }}>
            {[{n:"name",l:"Full Name",t:"text",p:"Your full name"},{n:"email",l:"Email",t:"email",p:"you@school.edu"},{n:"password",l:"Password",t:"password",p:"Min. 6 characters"},{n:"schoolId",l:"School ID",t:"text",p:"e.g. SCH-001"}].map(f => (
              <div key={f.n} style={{ width:"100%", maxWidth:300, marginBottom:9 }}>
                <label htmlFor={`signup-${f.n}`} style={{ display:"block", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#7B4A1E", marginBottom:4 }}>{f.l}</label>
                <input id={`signup-${f.n}`} className="field" name={f.n} type={f.t} required value={form[f.n]} onChange={ch} placeholder={f.p}/>
              </div>
            ))}
            <button type="submit" disabled={busy} aria-busy={busy} style={{ width:"100%", maxWidth:300, background:"#1C0D04", color:"#E8B830", border:"none", borderRadius:999, padding:11, fontSize:13, fontWeight:800, cursor: busy ? "default" : "pointer", fontFamily:"inherit", letterSpacing:".07em", textTransform:"uppercase", marginBottom:8, opacity: busy ? .6 : 1 }}>
              {busy ? "Joining…" : "Join the School →"}
            </button>
            <p style={{ fontSize:12, color:"#9B7A40", textAlign:"center" }}>
              Already enrolled?{" "}
              <span onClick={() => { setTab("login"); setError(""); }} style={{ color:"#1C0D04", fontWeight:700, cursor:"pointer", textDecoration:"underline" }}>Log In</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );

  /* ── MOBILE: no animation, show form directly ── */
  if (isMobile) {
    return (
      <div className="min-h-screen" style={{ background:"#F2E5C4" }}>
        {FormPanel}
      </div>
    );
  }

  /* ── DESKTOP: bus animation ── */
  return (
    <div ref={sceneRef} style={{ position:"relative", height:"100vh", overflow:"hidden" }}>

      {/* NIGHT BG */}
      <div style={{ position:"absolute", inset:0, background:"#040508", zIndex:1 }}>
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          {/* stars */}
          {[[70,35,1.2,2.8,.3],[210,55,1,3.4,.9],[380,20,1.4,2.2,.1],[520,48,1,4,.7],[680,15,1.3,3.1,1.1],[820,55,1,2.6,.4],[960,28,1.5,3.6,1.5],[1100,62,1,2.9,.2],[120,105,.9,4.2,1.6],[280,138,1.1,2.5,.8],[440,90,1,3.8,.5],[620,130,1.5,3.2,1.3],[880,100,1,2.7,.6],[1060,122,1.5,4.4,1.8],[50,168,1,3,1],[760,155,1,2.4,.2],[1140,44,1,3.5,1.2]].map(([cx,cy,r,dur,delay], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="white" style={{ animation:`tw ${dur}s ${delay}s infinite`, opacity:.18 }}/>
          ))}
          {/* moon */}
          <circle cx="1050" cy="90" r="56" fill="#2A3040"/>
          <circle cx="1066" cy="80" r="46" fill="#1A2030"/>
          <circle cx="1038" cy="86" r="54" fill="#F5C848"/>
          <circle cx="1054" cy="76" r="46" fill="#F8D860"/>
          <circle cx="1038" cy="86" r="72" fill="rgba(245,200,72,.06)"/>
          {/* school building */}
          <rect x="300" y="200" width="600" height="380" fill="#111826"/>
          <rect x="200" y="260" width="140" height="320" fill="#0E131C"/>
          <rect x="860" y="260" width="140" height="320" fill="#0E131C"/>
          <rect x="380" y="380" width="440" height="200" fill="#0D1220"/>
          {[400,440,480,520,560,600,640,680,720,760].map((x,i) => <rect key={i} x={x} y="380" width="12" height="198" fill="#161E2E"/>)}
          <rect x="375" y="374" width="450" height="10" fill="#1A2438"/>
          {/* entrance door */}
          <path d="M600,434 A32,32 0 0 1 632,466 L632,550 A4,4 0 0 1 628,554 L572,554 A4,4 0 0 1 568,550 L568,466 A32,32 0 0 1 600,434 Z" fill="#0A0F18"/>
          <rect x="572" y="444" width="24" height="108" fill="#080D14"/>
          <rect x="600" y="444" width="24" height="108" fill="#080D14"/>
          {/* roofs */}
          <polygon points="285,205 600,110 915,205" fill="#0A0F1A"/>
          <polygon points="190,265 270,220 350,265" fill="#0A0F1A"/>
          <polygon points="850,265 930,220 1010,265" fill="#0A0F1A"/>
          {/* clock tower */}
          <rect x="568" y="56" width="64" height="60" fill="#0A0D14"/>
          <polygon points="560,60 600,28 640,60" fill="#08090F"/>
          <circle cx="600" cy="90" r="22" fill="#0E1420" stroke="#2A3848" strokeWidth="2"/>
          <text x="600" y="96" textAnchor="middle" fontSize="8" fill="#C8960C" fontFamily="serif">XII</text>
          <line x1="600" y1="90" x2="600" y2="74" stroke="#E8B830" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="600" y1="90" x2="614" y2="84" stroke="#E8B830" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="600" cy="90" r="2.5" fill="#E8B830"/>
          {/* windows glowing */}
          {[[330,240],[430,240],[730,240],[830,240],[330,310],[430,310],[730,310],[830,310]].map(([x,y],i) => (
            <g key={i}>
              <rect x={x} y={y} width="46" height="56" fill="#F08020" opacity=".85" style={{ animation:`flicker ${6+i}s ${i*.4}s infinite` }}/>
              <ellipse cx={x+23} cy={y} rx={23} ry={23} fill="#F08020" opacity=".85" style={{ animation:`flicker ${6+i}s ${i*.4}s infinite` }}/>
              <rect x={x-4} y={y-4} width="54" height="68" rx="30" fill="rgba(240,128,32,.12)"/>
            </g>
          ))}
          {/* wing windows */}
          {[[218,298],[218,368],[878,298],[878,368]].map(([x,y],i) => (
            <g key={i}>
              <rect x={x} y={y} width="34" height="42" fill="#D06010" opacity=".7" style={{ animation:`flicker ${8+i*2}s ${i*.8}s infinite` }}/>
              <ellipse cx={x+17} cy={y} rx={17} ry={17} fill="#D06010" opacity=".7"/>
            </g>
          ))}
          {/* steps */}
          <rect x="540" y="574" width="120" height="10" rx="3" fill="#0D1220"/>
          <rect x="528" y="580" width="144" height="8" rx="2" fill="#0B1018"/>
          {/* fence */}
          <rect x="0" y="558" width="1200" height="6" fill="#0C1018"/>
          <rect x="0" y="572" width="1200" height="5" fill="#0C1018"/>
          {Array.from({length:30}, (_,i) => i*40).map(px => (
            <g key={px}>
              <rect x={px} y="538" width="5" height="36" rx="2" fill="#0E1420"/>
              <ellipse cx={px+2} cy="537" rx="4" ry="5" fill="#0C1018"/>
            </g>
          ))}
          {/* trees */}
          <path d="M 95,580 L 95,340" stroke="#04060A" strokeWidth="22" strokeLinecap="round"/>
          <path d="M 95,430 Q 42,384 18,320" stroke="#04060A" strokeWidth="11" fill="none" strokeLinecap="round"/>
          <path d="M 95,400 Q 148,354 172,290" stroke="#04060A" strokeWidth="9" fill="none" strokeLinecap="round"/>
          <path d="M 95,380 Q 60,330 38,276" stroke="#04060A" strokeWidth="7" fill="none" strokeLinecap="round"/>
          <path d="M 18,320 Q 5,278 10,236" stroke="#04060A" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <path d="M 18,320 Q 30,280 38,238" stroke="#04060A" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M 1105,580 L 1105,335" stroke="#04060A" strokeWidth="22" strokeLinecap="round"/>
          <path d="M 1105,428 Q 1158,380 1182,316" stroke="#04060A" strokeWidth="11" fill="none" strokeLinecap="round"/>
          <path d="M 1105,398 Q 1052,350 1028,286" stroke="#04060A" strokeWidth="9" fill="none" strokeLinecap="round"/>
          <path d="M 1182,316 Q 1196,274 1190,230" stroke="#04060A" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <path d="M 1028,286 Q 1014,244 1022,200" stroke="#04060A" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
          {/* lamps */}
          <rect x="270" y="450" width="5" height="130" fill="#0E1420"/>
          <path d="M 272,454 Q 292,444 300,432" stroke="#0E1420" strokeWidth="6" fill="none" strokeLinecap="round"/>
          <ellipse cx="302" cy="429" rx="12" ry="6" fill="#F8C848" opacity=".75" style={{ animation:"lampglow 3s ease-in-out infinite" }}/>
          <ellipse cx="302" cy="429" rx="24" ry="15" fill="rgba(248,200,72,.07)" style={{ animation:"lampglow 3s ease-in-out infinite" }}/>
          <rect x="925" y="450" width="5" height="130" fill="#0E1420"/>
          <path d="M 928,454 Q 908,444 900,432" stroke="#0E1420" strokeWidth="6" fill="none" strokeLinecap="round"/>
          <ellipse cx="898" cy="429" rx="12" ry="6" fill="#F8C848" opacity=".75" style={{ animation:"lampglow 3s 1s ease-in-out infinite" }}/>
          <ellipse cx="898" cy="429" rx="24" ry="15" fill="rgba(248,200,72,.07)" style={{ animation:"lampglow 3s 1s ease-in-out infinite" }}/>
          {/* ground */}
          <rect x="0" y="586" width="1200" height="214" fill="#04050A"/>
          <ellipse cx="600" cy="588" rx="440" ry="14" fill="rgba(245,200,72,.04)"/>
          {/* branding */}
          <text x="600" y="650" textAnchor="middle" fontSize="20" fontWeight="700" fill="rgba(200,150,12,.65)" fontFamily="system-ui" letterSpacing=".2em">FIXMYSCHOOL</text>
          <text x="600" y="674" textAnchor="middle" fontSize="13" fill="rgba(120,90,40,.55)" fontFamily="system-ui" letterSpacing=".12em">FACILITY · REPORT · RESOLVE</text>
        </svg>
      </div>

      {/* REVEALED LOGIN PANEL */}
      <div ref={panelRef} style={{ position:"absolute", inset:0, zIndex:4, display:"flex", overflow:"hidden" }}>
        {FormPanel}
      </div>

      {/* ROAD */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:80, background:"#07070A", borderTop:"2px solid #111", zIndex:8 }}>
        <div style={{ position:"absolute", top:36, left:0, right:0, height:6, overflow:"hidden" }}>
          <div id="dash-runner" style={{ display:"flex", gap:20, width:"max-content" }}>
            {Array.from({length:60}, (_,i) => <div key={i} style={{ flexShrink:0, width:28, height:6, background:"rgba(255,210,40,.38)", borderRadius:3 }}/>)}
          </div>
        </div>
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:7, background:"#0C0C0E" }}/>
      </div>

      {/* BUS */}
      <div ref={busRef} style={{ position:"absolute", bottom:76, zIndex:10, left:"-260px" }}>
        {/* Speed lines */}
        <svg style={{ position:"absolute", right:"100%", top:"50%", transform:"translateY(-60%)" }} width="76" height="62" viewBox="0 0 76 62">
          <line x1="76" y1="8" x2="16" y2="8" stroke="#E8B830" strokeWidth="2.8" strokeLinecap="round" opacity=".62"/>
          <line x1="76" y1="22" x2="4" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity=".2"/>
          <line x1="76" y1="37" x2="22" y2="37" stroke="#E8B830" strokeWidth="2.2" strokeLinecap="round" opacity=".5"/>
          <line x1="76" y1="51" x2="10" y2="51" stroke="white" strokeWidth="1" strokeLinecap="round" opacity=".15"/>
        </svg>
        <svg width="210" height="90" viewBox="0 0 210 90">
          <ellipse cx="105" cy="89" rx="94" ry="4.5" fill="rgba(0,0,0,.28)"/>
          <rect x="10" y="8" width="149" height="56" rx="8" fill="#FFD700"/>
          <rect x="10" y="8" width="149" height="14" rx="8" fill="#E0B000"/>
          <rect x="10" y="17" width="149" height="5" fill="#E0B000"/>
          <rect x="27" y="1" width="12" height="8" rx="3" fill="#D63F3F"/>
          <rect x="45" y="1" width="12" height="8" rx="3" fill="#5584EE"/>
          <rect x="63" y="1" width="12" height="8" rx="3" fill="#D63F3F"/>
          <rect x="0" y="30" width="8" height="18" rx="3" fill="#C83232"/>
          <rect x="0" y="58" width="13" height="8" rx="4" fill="#AAAAAA"/>
          <rect x="13" y="40" width="22" height="24" rx="3" fill="#C89800"/>
          <line x1="24" y1="40" x2="24" y2="64" stroke="#FFD700" strokeWidth="2"/>
          {[[38,20,28,20],[72,20,28,20],[106,20,28,20],[140,20,19,20]].map(([x,y,w,h],i) => (
            <g key={i}><rect x={x} y={y} width={w} height={h} rx="4" fill="#C0DFF2" opacity=".88"/><ellipse cx={x+w/2} cy={y+13} rx="5" ry="6" fill="#1A1A18" opacity=".3"/><rect x={x+2} y={y+2} width={w/2} height="7" rx="2" fill="white" opacity=".36"/></g>
          ))}
          <rect x="10" y="60" width="149" height="4" fill="#C89800"/>
          <text x="98" y="55" textAnchor="middle" fontSize="9" fontWeight="700" fill="rgba(26,26,24,.4)" fontFamily="system-ui" letterSpacing=".5">FixMySchool</text>
          <path d="M 159,8 C 178,8 186,17 186,26 L 186,58 Q 186,64 178,64 L 159,64 Z" fill="#C89800"/>
          <path d="M 159,15 C 175,15 181,22 181,28 L 181,46 L 159,46 Z" fill="#B0D4EE" opacity=".88"/>
          <rect x="175" y="48" width="11" height="10" rx="3" fill="#FFFCD0"/>
          <rect x="159" y="60" width="30" height="8" rx="4" fill="#AAAAAA"/>
          <g ref={wrRef}><circle cx="36" cy="76" r="18" fill="#101018"/><circle cx="36" cy="76" r="12" fill="#333340"/><line x1="36" y1="58" x2="36" y2="94" stroke="#555564" strokeWidth="2.5"/><line x1="18" y1="76" x2="54" y2="76" stroke="#555564" strokeWidth="2.5"/><line x1="23.3" y1="63.3" x2="48.7" y2="88.7" stroke="#555564" strokeWidth="1.8"/><line x1="48.7" y1="63.3" x2="23.3" y2="88.7" stroke="#555564" strokeWidth="1.8"/><circle cx="36" cy="76" r="5" fill="#888898"/></g>
          <g ref={wfRef}><circle cx="154" cy="76" r="18" fill="#101018"/><circle cx="154" cy="76" r="12" fill="#333340"/><line x1="154" y1="58" x2="154" y2="94" stroke="#555564" strokeWidth="2.5"/><line x1="136" y1="76" x2="172" y2="76" stroke="#555564" strokeWidth="2.5"/><line x1="141.3" y1="63.3" x2="166.7" y2="88.7" stroke="#555564" strokeWidth="1.8"/><line x1="166.7" y1="63.3" x2="141.3" y2="88.7" stroke="#555564" strokeWidth="1.8"/><circle cx="154" cy="76" r="5" fill="#888898"/></g>
        </svg>
      </div>
    </div>
  );
}
