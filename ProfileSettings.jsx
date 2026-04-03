import { useState, useRef } from "react";
import { P, FONT_DISPLAY, FONT_BODY, btn, inp, fieldLabel } from "../constants.js";
import Icon from "./Icon.jsx";

export default function ProfileSettings({ user, recipes, onBack, onUpdateUser, onLogout }) {
  const [tab,      setTab]      = useState("profile"); // profile | stats | notifications | account
  const [editMode, setEditMode] = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [form,     setForm]     = useState({
    name:     user.name     || "",
    email:    user.email    || "",
    bio:      user.bio      || "",
    location: user.location || "",
    avatar:   user.avatar   || "",
  });

  // Notification preferences stored in localStorage
  const notifKey = `kusina_notifs_${user.email}`;
  const [notifs, setNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(notifKey)) || { mealReminders:true, loginAlerts:true, emailNotifs:true, soundAlerts:true, browserNotifs:false }; }
    catch { return { mealReminders:true, loginAlerts:true, emailNotifs:true, soundAlerts:true, browserNotifs:false }; }
  });

  const fileRef = useRef(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const saveProfile = () => {
    onUpdateUser({ ...user, ...form });
    setSaved(true); setEditMode(false);
    setTimeout(()=>setSaved(false), 2500);
  };

  const cancelEdit = () => {
    setForm({ name:user.name||"", email:user.email||"", bio:user.bio||"", location:user.location||"", avatar:user.avatar||"" });
    setEditMode(false);
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size>2*1024*1024) { alert("Image must be under 2MB."); return; }
    const reader = new FileReader();
    reader.onload = ev => set("avatar", ev.target.result);
    reader.readAsDataURL(file);
  };

  const saveNotifs = (updated) => {
    setNotifs(updated);
    localStorage.setItem(notifKey, JSON.stringify(updated));
  };

  const toggleNotif = (key) => saveNotifs({ ...notifs, [key]: !notifs[key] });

  const requestBrowserNotif = async () => {
    if (Notification.permission==="default") {
      const perm = await Notification.requestPermission();
      if (perm==="granted") saveNotifs({ ...notifs, browserNotifs:true });
    } else {
      toggleNotif("browserNotifs");
    }
  };

  // Stats
  const totalRecipes = recipes.length;
  const favorites    = recipes.filter(r=>r.favorite).length;
  const cuisines     = [...new Set(recipes.map(r=>r.cuisine).filter(Boolean))];
  const categories   = [...new Set(recipes.map(r=>r.category).filter(Boolean))];
  const avgPrepTime  = totalRecipes>0 ? Math.round(recipes.reduce((s,r)=>s+(Number(r.prepTime)||0),0)/totalRecipes) : 0;

  const TAB = (id,icon,label) => (
    <button onClick={()=>setTab(id)} style={{
      display:"flex", alignItems:"center", gap:6, padding:"0.52rem 1rem",
      borderRadius:9, border:"none", cursor:"pointer", fontFamily:FONT_BODY,
      fontSize:"0.82rem", fontWeight:600, transition:"all 0.18s",
      background: tab===id?`linear-gradient(135deg,${P.ember},${P.emberLight})`:"transparent",
      color:      tab===id?"#fff":P.textSecond,
      boxShadow:  tab===id?`0 3px 10px rgba(212,84,26,0.25)`:"none",
    }}>
      <Icon name={icon} size={13} color={tab===id?"#fff":P.textThird}/> {label}
    </button>
  );

  const Toggle = ({ value, onChange, label, sublabel }) => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.85rem 0", borderBottom:`1px solid ${P.border}` }}>
      <div>
        <div style={{ fontSize:"0.88rem", fontWeight:600, color:P.textPrimary }}>{label}</div>
        {sublabel && <div style={{ fontSize:"0.72rem", color:P.textThird, marginTop:2 }}>{sublabel}</div>}
      </div>
      <button onClick={onChange} style={{
        width:46, height:26, borderRadius:13, border:"none", cursor:"pointer",
        background: value ? `linear-gradient(135deg,${P.ember},${P.emberLight})` : P.bgAlt,
        position:"relative", transition:"background 0.25s", flexShrink:0,
        boxShadow: value?`0 2px 8px rgba(212,84,26,0.3)`:"inset 0 1px 3px rgba(0,0,0,0.08)",
      }}>
        <div style={{ width:20, height:20, borderRadius:"50%", background:"#fff", position:"absolute", top:3, left:value?23:3, transition:"left 0.25s cubic-bezier(0.34,1.56,0.64,1)", boxShadow:"0 1px 4px rgba(0,0,0,0.15)" }}/>
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth:680, margin:"0 auto", padding:"2rem 1.5rem", fontFamily:FONT_BODY }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:"2rem" }}>
        <button style={{ ...btn("ghost"), padding:"0.5rem 0.75rem" }} onClick={onBack}>
          <Icon name="back" size={16} color={P.textSecond}/>
        </button>
        <h2 style={{ fontFamily:FONT_DISPLAY, fontSize:"1.8rem", color:P.textPrimary, margin:0 }}>
          Profile & Settings
        </h2>
      </div>

      {/* Avatar banner */}
      <div style={{ background:`linear-gradient(135deg,#3D1A06,#7C3010,#C87828)`, borderRadius:20, padding:"1.75rem 2rem", marginBottom:"1.75rem", display:"flex", alignItems:"center", gap:"1.5rem", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", width:200, height:200, borderRadius:"50%", background:"radial-gradient(rgba(255,255,255,0.06),transparent)", right:"-5%", top:"-20%", pointerEvents:"none" }}/>
        <div style={{ position:"relative", flexShrink:0 }}>
          <div style={{ width:76, height:76, borderRadius:"50%", border:"3px solid rgba(255,255,255,0.4)", overflow:"hidden", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {form.avatar||user.avatar
              ? <img src={form.avatar||user.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              : <span style={{ fontSize:"1.8rem", fontWeight:700, color:"#fff", fontFamily:FONT_DISPLAY }}>{user.initials||user.name?.[0]?.toUpperCase()||"U"}</span>
            }
          </div>
          {editMode && (
            <div onClick={()=>fileRef.current?.click()} style={{ position:"absolute", bottom:0, right:0, width:24, height:24, borderRadius:"50%", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 2px 6px rgba(0,0,0,0.2)" }}>
              <Icon name="camera" size={12} color={P.ember}/>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhoto}/>
        </div>
        <div style={{ flex:1, zIndex:1 }}>
          <div style={{ fontFamily:FONT_DISPLAY, fontSize:"1.3rem", color:"#fff" }}>{user.name}</div>
          <div style={{ fontSize:"0.8rem", color:"rgba(255,255,255,0.65)", marginTop:2 }}>{user.email}</div>
          {user.location && <div style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.5)", marginTop:4, display:"flex", alignItems:"center", gap:4 }}><Icon name="pin" size={11} color="rgba(255,255,255,0.5)"/>{user.location}</div>}
          {saved && <div style={{ fontSize:"0.72rem", color:"#A8F0C0", marginTop:4, display:"flex", alignItems:"center", gap:4, animation:"fadeIn 0.3s" }}><Icon name="check" size={11} color="#A8F0C0"/> Profile saved!</div>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:5, marginBottom:"1.75rem", background:P.bgAlt, padding:"5px", borderRadius:12, border:`1px solid ${P.border}` }}>
        {TAB("profile","user","Profile")}
        {TAB("stats","grid","My Stats")}
        {TAB("notifications","timer","Notifications")}
        {TAB("account","settings","Account")}
      </div>

      {/* ── PROFILE TAB ── */}
      {tab==="profile" && (
        <div style={{ animation:"fadeIn 0.25s ease" }}>
          {!editMode ? (
            // VIEW MODE
            <div>
              <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:14, overflow:"hidden", marginBottom:"1rem" }}>
                {[
                  { label:"Display Name", value:user.name||"—" },
                  { label:"Email",        value:user.email||"—" },
                  { label:"Location",     value:user.location||"Not set" },
                  { label:"Bio",          value:user.bio||"Not set" },
                ].map((row,i,arr)=>(
                  <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.85rem 1.25rem", borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none" }}>
                    <span style={{ fontSize:"0.78rem", color:P.textThird, textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:700 }}>{row.label}</span>
                    <span style={{ fontSize:"0.9rem", color:P.textPrimary, fontWeight:500, maxWidth:"60%", textAlign:"right" }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <button style={{ ...btn("primary"), display:"flex", alignItems:"center", gap:7 }} onClick={()=>setEditMode(true)}>
                <Icon name="edit" size={14} color="#fff"/> Edit Profile
              </button>
            </div>
          ) : (
            // EDIT MODE
            <div style={{ animation:"scaleIn 0.25s ease" }}>
              <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:14, padding:"1.5rem", marginBottom:"1rem" }}>
                <div style={{ display:"grid", gap:"1rem" }}>
                  <div><label style={fieldLabel}>Display Name</label><input style={inp} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Your name"/></div>
                  <div><label style={fieldLabel}>Email</label><input style={{ ...inp, color:P.textThird, background:"#fafafa" }} value={form.email} readOnly/><p style={{ fontSize:"0.68rem", color:P.textThird, marginTop:4 }}>Linked to your Google account — cannot be changed here.</p></div>
                  <div><label style={fieldLabel}>Location</label><input style={inp} value={form.location} onChange={e=>set("location",e.target.value)} placeholder="e.g. Manila, Philippines"/></div>
                  <div><label style={fieldLabel}>Bio</label><textarea style={{ ...inp, resize:"vertical", minHeight:70 }} value={form.bio} onChange={e=>set("bio",e.target.value)} placeholder="Tell us about yourself..."/></div>
                </div>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button style={btn("primary")} onClick={saveProfile}><Icon name="save" size={14} color="#fff"/> Save Changes</button>
                <button style={btn("ghost")} onClick={cancelEdit}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STATS TAB ── */}
      {tab==="stats" && (
        <div style={{ animation:"fadeIn 0.25s ease" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:"1.25rem" }}>
            {[{label:"Recipes",value:totalRecipes},{label:"Favorites",value:favorites},{label:"Avg Prep",value:`${avgPrepTime}m`}].map(s=>(
              <div key={s.label} style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:14, padding:"1.1rem", textAlign:"center", boxShadow:"0 2px 8px rgba(168,100,60,0.06)" }}>
                <div style={{ fontFamily:FONT_DISPLAY, fontSize:"1.9rem", color:P.ember, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:"0.68rem", color:P.textThird, textTransform:"uppercase", letterSpacing:"0.07em", marginTop:5 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {cuisines.length>0&&(
            <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:14, padding:"1.25rem 1.5rem", marginBottom:12 }}>
              <div style={fieldLabel}>Cuisines</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {cuisines.map(c=><span key={c} style={{ background:P.emberGlow, color:P.ember, border:`1px solid rgba(212,84,26,0.2)`, borderRadius:20, padding:"0.25rem 0.85rem", fontSize:"0.8rem", fontWeight:600 }}>{c}</span>)}
              </div>
            </div>
          )}
          {categories.length>0&&(
            <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:14, padding:"1.25rem 1.5rem" }}>
              <div style={fieldLabel}>Categories</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {categories.map(c=><span key={c} style={{ background:P.goldGlow, color:P.gold, border:`1px solid rgba(200,150,10,0.2)`, borderRadius:20, padding:"0.25rem 0.85rem", fontSize:"0.8rem", fontWeight:600 }}>{c}</span>)}
              </div>
            </div>
          )}
          {totalRecipes===0&&<div style={{ textAlign:"center", padding:"3rem", color:P.textThird }}>Add recipes to see your stats here! 🍽️</div>}
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {tab==="notifications" && (
        <div style={{ animation:"fadeIn 0.25s ease" }}>
          <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:14, padding:"0.5rem 1.5rem", marginBottom:"1.25rem" }}>
            <Toggle value={notifs.mealReminders} onChange={()=>toggleNotif("mealReminders")} label="Meal Calendar Reminders" sublabel="Get notified when a scheduled meal time arrives"/>
            <Toggle value={notifs.soundAlerts}   onChange={()=>toggleNotif("soundAlerts")}   label="Timer Sound Alerts"     sublabel="Play a chime when cooking timers finish"/>
            <Toggle value={notifs.emailNotifs}   onChange={()=>toggleNotif("emailNotifs")}   label="Email Notifications"    sublabel="Receive account updates to your Google email"/>
            <Toggle value={notifs.loginAlerts}   onChange={()=>toggleNotif("loginAlerts")}   label="Login Alerts"           sublabel="Get notified of new sign-ins to your account"/>
            <div style={{ paddingBottom:"0.5rem" }}>
              <Toggle value={notifs.browserNotifs} onChange={requestBrowserNotif} label="Browser Notifications" sublabel="Show pop-up notifications in your browser"/>
            </div>
          </div>

          {Notification.permission==="denied"&&(
            <div style={{ background:"rgba(192,57,43,0.07)", border:"1px solid rgba(192,57,43,0.2)", borderRadius:10, padding:"0.75rem 1rem", fontSize:"0.78rem", color:P.red, lineHeight:1.6 }}>
              🚫 Browser notifications are blocked. Go to your browser settings and allow notifications for this site, then toggle it back on above.
            </div>
          )}

          <div style={{ background:P.goldGlow, border:`1px solid rgba(200,150,10,0.2)`, borderRadius:10, padding:"0.75rem 1rem", fontSize:"0.75rem", color:P.textSecond, lineHeight:1.65, marginTop:12 }}>
            💡 <strong>Email notifications</strong> require EmailJS to be configured. See the setup guide (SETUP_GUIDE.md) for instructions. Browser notifications work immediately once allowed.
          </div>
        </div>
      )}

      {/* ── ACCOUNT TAB ── */}
      {tab==="account" && (
        <div style={{ animation:"fadeIn 0.25s ease", display:"grid", gap:"1rem" }}>
          <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:14, padding:"1.25rem 1.5rem" }}>
            <div style={fieldLabel}>Account Info</div>
            {[{label:"Name",value:user.name},{label:"Email",value:user.email},{label:"Login Method",value:user.loginMethod||"Google"},{label:"Member Since",value:user.joinedAt?new Date(user.joinedAt).toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"}):"—"}].map((row,i,arr)=>(
              <div key={row.label} style={{ display:"flex", justifyContent:"space-between", padding:"0.55rem 0", borderBottom:i<arr.length-1?`1px solid ${P.border}`:"none", fontSize:"0.88rem" }}>
                <span style={{ color:P.textThird }}>{row.label}</span>
                <span style={{ color:P.textPrimary, fontWeight:500 }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:14, padding:"1.25rem 1.5rem" }}>
            <div style={{ fontSize:"0.92rem", fontWeight:600, color:P.textPrimary, marginBottom:4 }}>Sign Out</div>
            <p style={{ fontSize:"0.8rem", color:P.textSecond, marginBottom:"1rem", lineHeight:1.65 }}>Your recipes are saved. Sign back in anytime to restore everything.</p>
            <button style={btn("ghost")} onClick={onLogout}><Icon name="logout" size={15} color={P.textSecond}/> Sign Out</button>
          </div>

          <div style={{ background:"rgba(192,57,43,0.06)", border:"1px solid rgba(192,57,43,0.18)", borderRadius:14, padding:"1.25rem 1.5rem" }}>
            <div style={{ fontSize:"0.92rem", fontWeight:600, color:P.red, marginBottom:4 }}>⚠️ Delete All Recipes</div>
            <p style={{ fontSize:"0.8rem", color:P.textSecond, marginBottom:"1rem", lineHeight:1.65 }}>Permanently removes all your recipes. This cannot be undone.</p>
            <button style={btn("danger")} onClick={()=>{ if(window.confirm("Delete ALL recipes? This cannot be undone.")) onUpdateUser({...user,_clearRecipes:true}); }}>
              <Icon name="trash" size={14}/> Delete All Recipes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}