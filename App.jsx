import { useState, useEffect } from "react";
import { P, FONT_DISPLAY, FONT_BODY, FONT_ACCENT, SAMPLE_RECIPES, btn, inp } from "./constants.js";
import Icon from "./components/Icon.jsx";
import LoginPage      from "./components/LoginPage.jsx";
import CookingMode    from "./components/CookingMode.jsx";
import RecipeForm     from "./components/RecipeForm.jsx";
import RecipeDetail   from "./components/RecipeDetail.jsx";
import ProfileSettings from "./components/ProfileSettings.jsx";
import MealCalendar   from "./components/MealCalendar.jsx";
import NearbyPlaces   from "./components/NearbyPlaces.jsx";
import KusinaAI       from "./components/KusinaAI.jsx";

// VIEWS: login | list | detail | form | cook | profile | calendar | nearby | ai

export default function App() {
  const [user,     setUser]     = useState(null);
  const [recipes,  setRecipes]  = useState([]);
  const [mealPlan, setMealPlan] = useState({});
  const [view,     setView]     = useState("list");
  const [selected, setSelected] = useState(null);
  const [editing,  setEditing]  = useState(null);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [layout,   setLayout]   = useState("grid");

  // ── Restore user session on mount ──
  useEffect(() => {
    const stored = localStorage.getItem("kusina_active_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch(_) {}
    }
  }, []);

  // ── Load user data when logged in ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) return;
    const sr = localStorage.getItem(`kusina_recipes_${user.email}`);
    const sp = localStorage.getItem(`kusina_mealplan_${user.email}`);
    setRecipes(sr ? JSON.parse(sr) : SAMPLE_RECIPES);
    setMealPlan(sp ? JSON.parse(sp) : {});
  }, [user]);

  // ── Persist on change ──
  useEffect(() => { if (user) localStorage.setItem(`kusina_recipes_${user.email}`, JSON.stringify(recipes)); }, [recipes, user]);
  useEffect(() => { if (user) localStorage.setItem(`kusina_mealplan_${user.email}`, JSON.stringify(mealPlan)); }, [mealPlan, user]);

  // ── Login handler — saves session ──
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("kusina_active_user", JSON.stringify(userData));
    // Restore previously saved profile updates
    const savedProfile = localStorage.getItem(`kusina_user_${userData.email}`);
    if (savedProfile) {
      try {
        const p = JSON.parse(savedProfile);
        setUser(u => ({ ...u, ...p }));
      } catch(_) {}
    }
  };

  const logout = () => {
    localStorage.removeItem("kusina_active_user");
    setUser(null); setRecipes([]); setMealPlan({});
    setView("list"); setSelected(null); setEditing(null);
  };

  // ── CRUD ──
  const saveRecipe = (r) => {
    setRecipes(prev => prev.find(x=>x.id===r.id) ? prev.map(x=>x.id===r.id?r:x) : [r,...prev]);
    setEditing(null); setView("list");
  };

  const deleteRecipe = (id) => {
    if (!window.confirm("Delete this recipe? This cannot be undone.")) return;
    setRecipes(prev => prev.filter(r=>r.id!==id));
    setSelected(null); setView("list");
  };

  const toggleFavorite = (id) =>
    setRecipes(prev => prev.map(r=>r.id===id?{...r,favorite:!r.favorite}:r));

  const updateUser = (updated) => {
    if (updated._clearRecipes) {
      if (window.confirm("Delete ALL your recipes? This cannot be undone.")) {
        setRecipes([]); localStorage.removeItem(`kusina_recipes_${user.email}`);
      }
      return;
    }
    setUser(updated);
    localStorage.setItem(`kusina_user_${updated.email}`, JSON.stringify(updated));
    localStorage.setItem("kusina_active_user", JSON.stringify(updated));
  };

  const handleAITimer = (seconds, label) => {
    if (window.confirm(`Start a ${label} timer now?`)) {
      alert(`Timer started for ${label}! Go to the recipe's cooking mode to use step timers.`);
    }
  };

  const filtered = recipes.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = r.title.toLowerCase().includes(q)||(r.cuisine||"").toLowerCase().includes(q)||(r.category||"").toLowerCase().includes(q);
    const matchFilter = filter==="all"||(filter==="favorites"&&r.favorite);
    return matchSearch && matchFilter;
  });

  const currentRecipe = recipes.find(r=>r.id===selected);

  const NAV = [
    { id:"list",     icon:"book",    label:"Recipes"  },
    { id:"calendar", icon:"timer",   label:"Planner"  },
    { id:"nearby",   icon:"pin",     label:"Nearby"   },
    { id:"ai",       icon:"bot",     label:"Kusi AI"  },
    { id:"profile",  icon:"user",    label:"Profile"  },
  ];

  // ── SHOW LOGIN if not logged in ──
  if (!user) return <LoginPage onLogin={handleLogin}/>;

  // ── COOKING MODE ──
  if (view==="cook" && currentRecipe) return <CookingMode recipe={currentRecipe} onExit={()=>setView("detail")}/>;

  return (
    <div style={{ minHeight:"100vh", background:P.bgGrad, fontFamily:FONT_BODY, color:P.textPrimary, paddingBottom:76 }}>

      {/* ── TOP NAV ── */}
      <nav style={{ position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.8rem 1.5rem", background:"rgba(253,248,242,0.92)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${P.border}`, boxShadow:"0 2px 16px rgba(168,100,60,0.07)" }}>
        <button onClick={()=>setView("list")} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:9, padding:0 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${P.ember},${P.gold})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", boxShadow:`0 2px 10px rgba(232,130,74,0.35)` }}>🫕</div>
          <span style={{ fontFamily:FONT_ACCENT, fontSize:"1.35rem", color:P.textPrimary, fontWeight:700, letterSpacing:"0.1em" }}>KUSINA</span>
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button style={{ ...btn("primary"), padding:"0.5rem 1rem", fontSize:"0.82rem" }} onClick={()=>{setEditing(null);setView("form");}}>
            <Icon name="plus" size={14} color="#fff"/> New Recipe
          </button>
          <button onClick={()=>setView("profile")} style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.05)", border:`1px solid ${P.border}`, borderRadius:10, padding:"0.38rem 0.75rem", cursor:"pointer", transition:"border-color 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=P.ember}
            onMouseLeave={e=>e.currentTarget.style.borderColor=P.border}>
            <div style={{ width:27, height:27, borderRadius:"50%", overflow:"hidden", background:`linear-gradient(135deg,${P.ember},${P.gold})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {user.avatar ? <img src={user.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ fontSize:"0.7rem", fontWeight:700, color:"#fff" }}>{user.initials||user.name?.[0]?.toUpperCase()||"U"}</span>}
            </div>
            <span style={{ fontSize:"0.82rem", color:P.textPrimary, fontWeight:500 }}>{user.name}</span>
          </button>
        </div>
      </nav>

      {/* ── RECIPE LIST ── */}
      {view==="list" && (
        <div style={{ maxWidth:980, margin:"0 auto", padding:"2rem 1.5rem" }}>
          <div style={{ marginBottom:"2rem" }}>
            <p style={{ fontSize:"0.68rem", letterSpacing:"0.16em", textTransform:"uppercase", color:P.ember, fontWeight:700, marginBottom:4 }}>Welcome back, {user.name}</p>
            <h1 style={{ fontFamily:FONT_DISPLAY, fontSize:"clamp(2rem,5vw,3rem)", color:P.textPrimary, margin:"0 0 4px", lineHeight:1.1 }}>
              Your <em style={{ color:P.ember }}>Collection</em>
            </h1>
            <p style={{ color:P.textSecond, fontSize:"0.86rem", margin:0 }}>{recipes.length} recipe{recipes.length!==1?"s":""} saved</p>
          </div>

          {/* Controls */}
          <div style={{ display:"flex", gap:10, marginBottom:"1.75rem", flexWrap:"wrap", alignItems:"center" }}>
            <div style={{ position:"relative", flex:1, minWidth:200 }}>
              <span style={{ position:"absolute", left:"0.85rem", top:"50%", transform:"translateY(-50%)", display:"flex" }}><Icon name="search" size={15} color={P.textThird}/></span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search recipes, cuisine, category..." style={{ ...inp, paddingLeft:"2.4rem" }}/>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {["all","favorites"].map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{ ...btn(filter===f?"primary":"ghost"), padding:"0.52rem 1rem", fontSize:"0.8rem", textTransform:"capitalize" }}>
                  {f==="favorites"&&<Icon name="heartFill" size={12}/>}{f}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", border:`1px solid ${P.border}`, borderRadius:9, overflow:"hidden" }}>
              {[["grid","grid"],["list","list"]].map(([name,icon])=>(
                <button key={name} onClick={()=>setLayout(name)} style={{ background:layout===name?P.ember:"transparent", color:layout===name?"#fff":P.textThird, border:"none", padding:"0.48rem 0.7rem", cursor:"pointer", display:"flex", alignItems:"center", transition:"all 0.15s" }}>
                  <Icon name={icon} size={14}/>
                </button>
              ))}
            </div>
          </div>

          {/* Cards */}
          {filtered.length===0 ? (
            <div style={{ textAlign:"center", padding:"5rem 2rem", color:P.textThird }}>
              <div style={{ fontSize:"3.5rem", marginBottom:"1rem" }}>🍽️</div>
              <p>{search?"No recipes match your search.":"No recipes yet — add your first one!"}</p>
              {!search&&<button style={{ ...btn("primary"), marginTop:"1.5rem" }} onClick={()=>{setEditing(null);setView("form");}}>
                <Icon name="plus" size={14} color="#fff"/> Add Recipe
              </button>}
            </div>
          ) : layout==="grid" ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(255px,1fr))", gap:"1.1rem" }}>
              {filtered.map(r=>(
                <div key={r.id} onClick={()=>{setSelected(r.id);setView("detail");}}
                  style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:16, overflow:"hidden", cursor:"pointer", transition:"transform 0.18s,box-shadow 0.18s,border-color 0.18s" }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 12px 36px rgba(0,0,0,0.4)`;e.currentTarget.style.borderColor=P.ember;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor=P.border;}}>
                  {r.image?<div style={{position:"relative"}}><img src={r.image} alt={r.title} style={{width:"100%",height:168,objectFit:"cover"}}/>{r.favorite&&<span style={{position:"absolute",top:10,right:10,background:"rgba(15,15,20,0.8)",borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="heartFill" size={13}/></span>}</div>
                    :<div style={{height:168,background:`linear-gradient(135deg,#1A0D06,${P.emberDeep})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"3rem",position:"relative"}}>🍽️{r.favorite&&<span style={{position:"absolute",top:10,right:10,background:"rgba(15,15,20,0.8)",borderRadius:"50%",width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center"}}><Icon name="heartFill" size={13}/></span>}</div>}
                  <div style={{padding:"0.95rem 1.1rem"}}>
                    <h3 style={{fontFamily:FONT_DISPLAY,fontSize:"1.05rem",color:P.textPrimary,margin:"0 0 4px"}}>{r.title}</h3>
                    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:"0.5rem",flexWrap:"wrap"}}>
                      {r.cuisine&&<span style={{fontSize:"0.68rem",color:P.textThird,textTransform:"uppercase",letterSpacing:"0.07em"}}>{r.cuisine}</span>}
                      {r.category&&<><span style={{color:P.border}}>·</span><span style={{fontSize:"0.68rem",color:P.textThird}}>{r.category}</span></>}
                    </div>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                      {r.prepTime&&<span style={{fontSize:"0.72rem",color:P.textThird}}>⏱ {r.prepTime}m</span>}
                      {r.servings&&<span style={{fontSize:"0.72rem",color:P.textThird}}>👤 {r.servings}</span>}
                      {r.steps?.length>0&&<span style={{fontSize:"0.72rem",color:P.textThird}}>📋 {r.steps.length}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{display:"grid",gap:8}}>
              {filtered.map(r=>(
                <div key={r.id} onClick={()=>{setSelected(r.id);setView("detail");}}
                  style={{background:P.surface,border:`1px solid ${P.border}`,borderRadius:13,padding:"0.9rem 1.2rem",cursor:"pointer",display:"flex",gap:14,alignItems:"center",transition:"all 0.15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=P.ember;e.currentTarget.style.background=P.surfaceHigh;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=P.border;e.currentTarget.style.background=P.surface;}}>
                  {r.image?<img src={r.image} alt={r.title} style={{width:50,height:50,borderRadius:9,objectFit:"cover",flexShrink:0}}/>:<div style={{width:50,height:50,borderRadius:9,background:`linear-gradient(135deg,#1A0D06,${P.emberDeep})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.4rem",flexShrink:0}}>🍽️</div>}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><h3 style={{fontFamily:FONT_DISPLAY,fontSize:"1rem",color:P.textPrimary,margin:0}}>{r.title}</h3>{r.favorite&&<Icon name="heartFill" size={13}/>}</div>
                    <div style={{display:"flex",gap:10,marginTop:3,flexWrap:"wrap"}}>
                      {r.cuisine&&<span style={{fontSize:"0.73rem",color:P.textThird}}>{r.cuisine}</span>}
                      {r.prepTime&&<span style={{fontSize:"0.73rem",color:P.textThird}}>⏱ {r.prepTime}m</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view==="form"&&<RecipeForm initial={editing} onSave={saveRecipe} onCancel={()=>{setEditing(null);setView(editing?"detail":"list");}}/>}
      {view==="detail"&&currentRecipe&&<RecipeDetail recipe={currentRecipe} onBack={()=>{setSelected(null);setView("list");}} onCook={()=>setView("cook")} onEdit={()=>{setEditing(currentRecipe);setView("form");}} onDelete={deleteRecipe} onToggleFav={()=>toggleFavorite(currentRecipe.id)}/>}
      {view==="profile"&&<ProfileSettings user={user} recipes={recipes} onBack={()=>setView("list")} onUpdateUser={updateUser} onLogout={logout}/>}
      {view==="calendar"&&<MealCalendar recipes={recipes} mealPlan={mealPlan} onSave={setMealPlan} onBack={()=>setView("list")}/>}
      {view==="nearby"&&<NearbyPlaces onBack={()=>setView("list")}/>}
      {view==="ai"&&<KusinaAI recipes={recipes} user={user} onNavigate={v=>setView(v)} onSetTimer={handleAITimer}/>}

      {/* ── BOTTOM NAV ── */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:50, background:"rgba(253,248,242,0.95)", backdropFilter:"blur(20px)", borderTop:`1px solid ${P.border}`, display:"flex", boxShadow:"0 -4px 20px rgba(168,100,60,0.08)" }}>
        {NAV.map(n=>{
          const active = view===n.id||(n.id==="list"&&["detail","form"].includes(view));
          return (
            <button key={n.id} onClick={()=>setView(n.id)}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"0.6rem 0 0.5rem", background:"transparent", border:"none", cursor:"pointer", color:active?P.ember:P.textThird, transition:"color 0.15s" }}>
              <Icon name={n.icon} size={18} color={active?P.ember:P.textThird}/>
              <span style={{ fontSize:"0.6rem", fontWeight:active?700:500, letterSpacing:"0.04em" }}>{n.label}</span>
              {active&&<div style={{ width:20, height:2.5, borderRadius:2, background:P.ember }}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}