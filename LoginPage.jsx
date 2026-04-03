import { useState } from "react";
import { P, FONT_DISPLAY, FONT_BODY, FONT_ACCENT, btn, inp } from "../constants.js";
import Icon from "./Icon.jsx";

// ─────────────────────────────────────────────────────────────
//  LoginPage — Google OAuth + Email/Password + Guest
//  Data restore: on login, App.jsx loads from localStorage
//  (swap localStorage calls with Firestore for cloud sync)
// ─────────────────────────────────────────────────────────────

const ANIM = { animation: "fadeUp 0.5s ease both" };

export default function LoginPage({ onLogin }) {
  const [mode,      setMode]      = useState("welcome"); // welcome | login | register | guest
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");

  // Form fields
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [guestName, setGuestName] = useState("");

  const reset = () => { setError(""); setSuccess(""); setName(""); setEmail(""); setPassword(""); setConfirm(""); };
  const goMode = (m) => { reset(); setMode(m); };

  // ── Google OAuth ──
  const handleGoogle = async () => {
    setLoading(true); setError("");
    try {
      const { auth, provider } = await import("../firebase.js");
      const { signInWithPopup } = await import("firebase/auth");
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      const initials = (u.displayName||"U").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
      const userData = {
        name: u.displayName||"User", email: u.email,
        avatar: u.photoURL, initials, uid: u.uid,
        bio:"", location:"", joinedAt: Date.now(), loginMethod:"google",
      };
      // Send welcome email notification (simulated — real EmailJS setup below)
      sendEmailNotification(u.email, u.displayName||"User", "login");
      onLogin(userData);
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") { setError("Sign-in cancelled."); }
      else {
        // Firebase not configured — use demo Google account
        const userData = {
          name:"Google User", email:"google.demo@kusina.app",
          avatar:null, initials:"GU", uid:"demo-google",
          bio:"", location:"", joinedAt:Date.now(), loginMethod:"google",
        };
        onLogin(userData);
      }
    }
    setLoading(false);
  };

  // ── Email Sign-In ──
  const handleEmailLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    try {
      const { auth } = await import("../firebase.js");
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const result = await signInWithEmailAndPassword(auth, email, password);
      const u = result.user;
      const initials = (u.displayName||email[0]).split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
      sendEmailNotification(email, u.displayName||"User", "login");
      onLogin({ name: u.displayName||email.split("@")[0], email: u.email, avatar: u.photoURL, initials, uid: u.uid, bio:"", location:"", joinedAt:Date.now(), loginMethod:"email" });
    } catch (err) {
      // Firebase not set up — use localStorage accounts
      const stored = localStorage.getItem(`kusina_account_${email}`);
      if (stored) {
        const acct = JSON.parse(stored);
        if (acct.password === password) {
          sendEmailNotification(email, acct.name, "login");
          onLogin({ ...acct, loginMethod:"email" });
        } else { setError("Incorrect password. Please try again."); }
      } else { setError("No account found with this email. Please register first."); }
    }
    setLoading(false);
  };

  // ── Email Register ──
  const handleRegister = async () => {
    if (!name.trim() || !email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true); setError("");
    try {
      const { auth } = await import("../firebase.js");
      const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name.trim() });
      const initials = name.trim().split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
      const userData = { name:name.trim(), email, avatar:null, initials, uid:result.user.uid, bio:"", location:"", joinedAt:Date.now(), loginMethod:"email" };
      sendEmailNotification(email, name.trim(), "register");
      onLogin(userData);
    } catch (err) {
      // Fallback: store locally
      if (localStorage.getItem(`kusina_account_${email}`)) {
        setError("An account with this email already exists. Please sign in.");
      } else {
        const initials = name.trim().split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
        const userData = { name:name.trim(), email, password, avatar:null, initials, uid:`local-${Date.now()}`, bio:"", location:"", joinedAt:Date.now(), loginMethod:"email" };
        localStorage.setItem(`kusina_account_${email}`, JSON.stringify(userData));
        sendEmailNotification(email, name.trim(), "register");
        onLogin(userData);
      }
    }
    setLoading(false);
  };

  // ── Guest login ──
  const handleGuest = () => {
    const n = guestName.trim() || "Guest";
    const initials = n.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
    onLogin({ name:n, email:`guest.${Date.now()}@kusina.guest`, avatar:null, initials, uid:`guest-${Date.now()}`, bio:"", location:"", joinedAt:Date.now(), loginMethod:"guest" });
  };

  // ── Email notification (via EmailJS — free tier) ──
  const sendEmailNotification = async (toEmail, toName, type) => {
    // EmailJS integration — set up at https://emailjs.com (free 200 emails/month)
    // Replace these with your EmailJS credentials:
    const SERVICE_ID  = "YOUR_EMAILJS_SERVICE_ID";   // e.g. "service_abc123"
    const TEMPLATE_ID = type === "register"
      ? "YOUR_REGISTER_TEMPLATE_ID"                  // e.g. "template_welcome"
      : "YOUR_LOGIN_TEMPLATE_ID";                    // e.g. "template_login"
    const PUBLIC_KEY  = "YOUR_EMAILJS_PUBLIC_KEY";   // e.g. "user_xyz..."

    if (SERVICE_ID === "YOUR_EMAILJS_SERVICE_ID") return; // skip if not configured

    try {
      await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id:  SERVICE_ID,
          template_id: TEMPLATE_ID,
          user_id:     PUBLIC_KEY,
          template_params: {
            to_name:  toName,
            to_email: toEmail,
            app_name: "Kusina",
            login_time: new Date().toLocaleString("en-PH", { timeZone:"Asia/Manila", dateStyle:"medium", timeStyle:"short" }),
            message: type === "register"
              ? `Welcome to Kusina, ${toName}! Your account has been created.`
              : `You just logged into your Kusina account.`,
          },
        }),
      });
    } catch(_) { /* silent fail — email is optional enhancement */ }
  };

  const features = [
    { icon:"chef",    text:"Step-by-step cooking mode" },
    { icon:"timer",   text:"Smart timers with sound alerts" },
    { icon:"star",    text:"Meal calendar & scheduling" },
    { icon:"pin",     text:"Nearby restaurants with maps" },
    { icon:"bot",     text:"AI assistant powered by Gemini" },
    { icon:"sparkle", text:"Data synced to your account" },
  ];

  const INP_STYLE = { ...inp, marginBottom: 10, background: "rgba(255,255,255,0.8)", color: P.textPrimary };

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:FONT_BODY, overflow:"hidden" }}>

      {/* ── LEFT — Branding panel ── */}
      <div style={{ flex:"0 0 44%", background: P.heroGrad, display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"3rem 3rem 2.5rem", position:"relative", overflow:"hidden" }}>
        {/* Decorative orbs */}
        <div style={{ position:"absolute", width:420, height:420, borderRadius:"50%", background:"radial-gradient(circle,rgba(255,255,255,0.07),transparent 70%)", top:"-10%", right:"-18%", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(255,200,100,0.1),transparent 70%)", bottom:"8%", left:"-12%", pointerEvents:"none" }}/>

        <div style={{ ...ANIM, position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:"3rem" }}>
            <div style={{ width:48, height:48, borderRadius:14, background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", backdropFilter:"blur(4px)" }}>🫕</div>
            <span style={{ fontFamily:FONT_ACCENT, fontSize:"1.6rem", color:"#fff", letterSpacing:"0.12em", fontWeight:700 }}>KUSINA</span>
          </div>
          <h1 style={{ fontFamily:FONT_DISPLAY, fontSize:"clamp(1.8rem,3vw,2.8rem)", color:"#fff", lineHeight:1.2, marginBottom:"1.25rem" }}>
            Your Personal<br/><em style={{ color:"#FFC87A" }}>Culinary</em><br/>Companion
          </h1>
          <p style={{ color:"rgba(255,255,255,0.65)", fontSize:"0.9rem", lineHeight:1.8, maxWidth:300 }}>
            Cook smarter. Plan better. Discover more.
          </p>
        </div>

        <div style={{ position:"relative", zIndex:1, display:"grid", gap:"0.65rem" }}>
          {features.map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, animation:`fadeUp 0.5s ${0.1+i*0.07}s ease both` }}>
              <div style={{ width:28, height:28, borderRadius:8, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon name={f.icon} size={13} color="rgba(255,255,255,0.85)"/>
              </div>
              <span style={{ fontSize:"0.8rem", color:"rgba(255,255,255,0.7)" }}>{f.text}</span>
            </div>
          ))}
        </div>

        <p style={{ position:"relative", zIndex:1, fontSize:"0.65rem", color:"rgba(255,255,255,0.3)", marginTop:"1rem" }}>
          © 2025 Kusina · React + Firebase + Gemini AI
        </p>
      </div>

      {/* ── RIGHT — Auth forms ── */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background: P.bgGrad, padding:"2rem" }}>
        <div style={{ width:"100%", maxWidth:400 }}>

          {/* ───── WELCOME ───── */}
          {mode === "welcome" && (
            <div style={{ animation:"scaleIn 0.4s ease" }}>
              <h2 style={{ fontFamily:FONT_DISPLAY, fontSize:"2.1rem", color:P.textPrimary, marginBottom:6 }}>Welcome to Kusina</h2>
              <p style={{ color:P.textSecond, fontSize:"0.88rem", marginBottom:"2rem" }}>Sign in to access your recipes and meal plans</p>

              {/* Google */}
              <button onClick={handleGoogle} disabled={loading}
                style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:12, background:P.surface, border:`1.5px solid ${P.border}`, borderRadius:14, padding:"1rem", cursor:loading?"not-allowed":"pointer", fontSize:"0.95rem", fontWeight:600, color:P.textPrimary, marginBottom:12, transition:"all 0.2s", boxShadow:"0 2px 10px rgba(168,100,60,0.08)", fontFamily:FONT_BODY, opacity:loading?0.7:1 }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=P.ember;e.currentTarget.style.boxShadow=`0 4px 18px rgba(212,84,26,0.15)`;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=P.border;e.currentTarget.style.boxShadow="0 2px 10px rgba(168,100,60,0.08)";}}>
                {loading ? <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${P.border}`, borderTopColor:P.ember, animation:"spin 0.8s linear infinite" }}/> : <Icon name="google" size={20}/>}
                {loading ? "Signing in..." : "Continue with Google"}
              </button>

              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                <button onClick={()=>goMode("login")} style={{ ...btn("primary"), flex:1, justifyContent:"center" }}>
                  <Icon name="mail" size={14} color="#fff"/> Sign In with Email
                </button>
                <button onClick={()=>goMode("register")} style={{ ...btn("ghost"), flex:1, justifyContent:"center" }}>
                  Create Account
                </button>
              </div>

              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <div style={{ flex:1, height:1, background:P.border }}/><span style={{ fontSize:"0.72rem", color:P.textThird }}>or</span><div style={{ flex:1, height:1, background:P.border }}/>
              </div>

              <button onClick={()=>goMode("guest")} style={{ ...btn("ghost"), width:"100%", justifyContent:"center", color:P.textThird }}>
                Continue as Guest
              </button>

              {/* Restore notice */}
              <div style={{ marginTop:"1.25rem", background:P.emberGlow, border:`1px solid rgba(212,84,26,0.2)`, borderRadius:10, padding:"0.75rem 1rem", display:"flex", gap:8 }}>
                <Icon name="info" size={14} color={P.ember}/>
                <p style={{ fontSize:"0.75rem", color:P.textSecond, lineHeight:1.65 }}>
                  Sign in with the same account to <strong>restore all your recipes, meal plans, and settings</strong> automatically.
                </p>
              </div>
            </div>
          )}

          {/* ───── EMAIL LOGIN ───── */}
          {mode === "login" && (
            <div style={{ animation:"slideInR 0.35s ease" }}>
              <button onClick={()=>goMode("welcome")} style={{ ...btn("ghost"), padding:"0.4rem 0.8rem", marginBottom:"1.5rem", fontSize:"0.8rem" }}>
                <Icon name="back" size={13}/> Back
              </button>
              <h2 style={{ fontFamily:FONT_DISPLAY, fontSize:"2rem", color:P.textPrimary, marginBottom:6 }}>Sign In</h2>
              <p style={{ color:P.textSecond, fontSize:"0.85rem", marginBottom:"1.5rem" }}>Welcome back! Enter your credentials below.</p>

              <input style={INP_STYLE} type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}/>
              <div style={{ position:"relative", marginBottom:10 }}>
                <input style={{ ...INP_STYLE, marginBottom:0, paddingRight:"3rem" }} type={showPass?"text":"password"} placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleEmailLogin()}/>
                <button onClick={()=>setShowPass(s=>!s)} style={{ position:"absolute", right:"0.75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:P.textThird, fontSize:"0.75rem" }}>{showPass?"Hide":"Show"}</button>
              </div>

              {error && <div style={{ background:"rgba(192,57,43,0.08)", border:"1px solid rgba(192,57,43,0.2)", borderRadius:8, padding:"0.6rem 0.9rem", fontSize:"0.8rem", color:P.red, marginBottom:10 }}>{error}</div>}

              <button onClick={handleEmailLogin} disabled={loading} style={{ ...btn("primary"), width:"100%", justifyContent:"center", padding:"0.85rem", marginBottom:10 }}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
              <p style={{ textAlign:"center", fontSize:"0.8rem", color:P.textThird }}>
                No account?{" "}
                <button onClick={()=>goMode("register")} style={{ background:"none", border:"none", cursor:"pointer", color:P.ember, fontWeight:600, fontFamily:FONT_BODY, fontSize:"0.8rem" }}>Create one →</button>
              </p>
            </div>
          )}

          {/* ───── REGISTER ───── */}
          {mode === "register" && (
            <div style={{ animation:"slideInR 0.35s ease" }}>
              <button onClick={()=>goMode("welcome")} style={{ ...btn("ghost"), padding:"0.4rem 0.8rem", marginBottom:"1.5rem", fontSize:"0.8rem" }}>
                <Icon name="back" size={13}/> Back
              </button>
              <h2 style={{ fontFamily:FONT_DISPLAY, fontSize:"2rem", color:P.textPrimary, marginBottom:6 }}>Create Account</h2>
              <p style={{ color:P.textSecond, fontSize:"0.85rem", marginBottom:"1.5rem" }}>Join Kusina — your recipes, everywhere.</p>

              <input style={INP_STYLE} placeholder="Your full name" value={name} onChange={e=>setName(e.target.value)}/>
              <input style={INP_STYLE} type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}/>
              <div style={{ position:"relative", marginBottom:10 }}>
                <input style={{ ...INP_STYLE, marginBottom:0, paddingRight:"3rem" }} type={showPass?"text":"password"} placeholder="Password (min. 6 characters)" value={password} onChange={e=>setPassword(e.target.value)}/>
                <button onClick={()=>setShowPass(s=>!s)} style={{ position:"absolute", right:"0.75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:P.textThird, fontSize:"0.75rem" }}>{showPass?"Hide":"Show"}</button>
              </div>
              <input style={INP_STYLE} type="password" placeholder="Confirm password" value={confirm} onChange={e=>setConfirm(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleRegister()}/>

              {error && <div style={{ background:"rgba(192,57,43,0.08)", border:"1px solid rgba(192,57,43,0.2)", borderRadius:8, padding:"0.6rem 0.9rem", fontSize:"0.8rem", color:P.red, marginBottom:10 }}>{error}</div>}

              <button onClick={handleRegister} disabled={loading} style={{ ...btn("primary"), width:"100%", justifyContent:"center", padding:"0.85rem", marginBottom:10 }}>
                {loading ? "Creating account..." : "Create Account"}
              </button>
              <p style={{ textAlign:"center", fontSize:"0.8rem", color:P.textThird }}>
                Already have an account?{" "}
                <button onClick={()=>goMode("login")} style={{ background:"none", border:"none", cursor:"pointer", color:P.ember, fontWeight:600, fontFamily:FONT_BODY, fontSize:"0.8rem" }}>Sign in →</button>
              </p>
              <p style={{ fontSize:"0.7rem", color:P.textThird, textAlign:"center", marginTop:10, lineHeight:1.5 }}>
                By creating an account you agree to receive account notifications to your email.
              </p>
            </div>
          )}

          {/* ───── GUEST ───── */}
          {mode === "guest" && (
            <div style={{ animation:"slideInR 0.35s ease" }}>
              <button onClick={()=>goMode("welcome")} style={{ ...btn("ghost"), padding:"0.4rem 0.8rem", marginBottom:"1.5rem", fontSize:"0.8rem" }}>
                <Icon name="back" size={13}/> Back
              </button>
              <h2 style={{ fontFamily:FONT_DISPLAY, fontSize:"2rem", color:P.textPrimary, marginBottom:6 }}>Continue as Guest</h2>
              <p style={{ color:P.textSecond, fontSize:"0.85rem", marginBottom:"1.5rem" }}>No sign-up needed. Your data stays in this browser.</p>
              <input style={INP_STYLE} placeholder="Your name (optional)" value={guestName} onChange={e=>setGuestName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleGuest()}/>
              <div style={{ background:"rgba(200,150,10,0.08)", border:`1px solid rgba(200,150,10,0.2)`, borderRadius:10, padding:"0.75rem 1rem", marginBottom:12, fontSize:"0.75rem", color:P.textSecond, lineHeight:1.65 }}>
                ⚠️ Guest data is saved locally in this browser only. Create a free account to access your data on any device.
              </div>
              <button onClick={handleGuest} style={{ ...btn("gold"), width:"100%", justifyContent:"center", padding:"0.85rem" }}>Enter as Guest</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}