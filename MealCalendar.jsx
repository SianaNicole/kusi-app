import { useState, useEffect, useRef } from "react";
import { P, FONT_DISPLAY, FONT_BODY, btn, inp } from "../constants.js";
import Icon from "./Icon.jsx";

const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MEAL_SLOTS = ["Breakfast","Lunch","Dinner","Snack","Dessert","Other"];
const SLOT_COLORS = { Breakfast:"#D4A843",Lunch:"#4CAF82",Dinner:"#E8824A",Snack:"#6B9FE8",Dessert:"#E05C7A",Other:"#A89888" };

function getDays(year, month) {
  return { first: new Date(year, month, 1).getDay(), total: new Date(year, month + 1, 0).getDate() };
}

function dateKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[523,0],[659,0.15],[784,0.3],[1047,0.45]].forEach(([f,t]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0, ctx.currentTime+t);
      g.gain.linearRampToValueAtTime(0.3, ctx.currentTime+t+0.04);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime+t+0.22);
      o.start(ctx.currentTime+t); o.stop(ctx.currentTime+t+0.25);
    });
  } catch(_) {}
}

export default function MealCalendar({ recipes, mealPlan, onSave, onBack }) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selKey, setSelKey] = useState(null);
  const [plans,  setPlans]  = useState(mealPlan || {});
  const [panel,  setPanel]  = useState(false);

  // Dish editor state for selected day
  const [newDish,    setNewDish]    = useState("");
  const [newSlot,    setNewSlot]    = useState("Dinner");
  const [newTime,    setNewTime]    = useState("");
  const [newNote,    setNewNote]    = useState("");
  const [editIndex,  setEditIndex]  = useState(null);

  // Notification scheduler
  const timerRefs = useRef({});

  useEffect(() => { setPlans(mealPlan || {}); }, [mealPlan]);

  // ── Notification scheduler: check every minute ──
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const todayK = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
      const dishes = plans[todayK] || [];
      dishes.forEach((dish, i) => {
        if (!dish.time) return;
        const [h, m] = dish.time.split(":").map(Number);
        if (now.getHours() === h && now.getMinutes() === m) {
          const notifKey = `${todayK}-${i}-${dish.time}`;
          if (!timerRefs.current[notifKey]) {
            timerRefs.current[notifKey] = true;
            playNotifSound();
            if (Notification.permission === "granted") {
              new Notification(`🍽️ Meal Time: ${dish.meal}`, {
                body: `It's time for your ${dish.slot || "meal"}! ${dish.note || ""}`,
                icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🫕</text></svg>",
              });
            } else {
              alert(`🔔 Meal reminder: ${dish.meal} (${dish.slot || "meal"}) is now!`);
            }
          }
        }
      });
    };
    const id = setInterval(check, 30000); // check every 30s
    return () => clearInterval(id);
  }, [plans]);

  const requestNotifPermission = () => {
    if (Notification.permission === "default") Notification.requestPermission();
  };

  const { first, total } = getDays(year, month);
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const prevMonth = () => { if (month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if (month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };

  const selectDay = (d) => {
    const k = dateKey(year, month, d);
    setSelKey(k);
    setPanel(true);
    setNewDish(""); setNewSlot("Dinner"); setNewTime(""); setNewNote(""); setEditIndex(null);
    requestNotifPermission();
  };

  const dayDishes = (k) => plans[k] || [];

  const addDish = () => {
    if (!newDish.trim()) return;
    const updated = { ...plans };
    const list = [...(updated[selKey] || [])];
    const dish = { meal:newDish.trim(), slot:newSlot, time:newTime, note:newNote.trim(), id:Date.now() };
    if (editIndex !== null) { list[editIndex] = dish; } else { list.push(dish); }
    updated[selKey] = list;
    setPlans(updated); onSave(updated);
    setNewDish(""); setNewSlot("Dinner"); setNewTime(""); setNewNote(""); setEditIndex(null);
  };

  const removeDish = (k, i) => {
    const updated = { ...plans };
    updated[k] = (updated[k] || []).filter((_,j)=>j!==i);
    if (updated[k].length === 0) delete updated[k];
    setPlans(updated); onSave(updated);
  };

  const startEdit = (dish, i) => {
    setNewDish(dish.meal); setNewSlot(dish.slot||"Dinner");
    setNewTime(dish.time||""); setNewNote(dish.note||"");
    setEditIndex(i);
  };

  // Upcoming meals (next 14 days)
  const upcoming = [];
  for (let i=0; i<14; i++) {
    const d = new Date(today); d.setDate(today.getDate()+i);
    const k = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
    (plans[k]||[]).forEach(dish => upcoming.push({ ...dish, key:k, date:d }));
  }

  return (
    <div style={{ maxWidth:960, margin:"0 auto", padding:"2rem 1.5rem", fontFamily:FONT_BODY }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:"2rem" }}>
        <button style={{ ...btn("ghost"), padding:"0.5rem 0.8rem" }} onClick={onBack}><Icon name="back" size={16} color={P.textSecond}/></button>
        <div>
          <h2 style={{ fontFamily:FONT_DISPLAY, fontSize:"1.8rem", color:P.textPrimary, margin:0 }}>Meal Calendar</h2>
          <p style={{ color:P.textSecond, fontSize:"0.8rem", margin:0 }}>Plan your dishes · Manage notification alerts in Profile → Notifications</p>
        </div>
        {/* Notification settings moved to Profile → Notifications tab */}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:"1.5rem", alignItems:"start" }}>

        {/* ── CALENDAR ── */}
        <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:20, overflow:"hidden" }}>
          {/* Nav */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.1rem 1.5rem", background:`linear-gradient(135deg,#1A0D06,${P.emberDeep})` }}>
            <button onClick={prevMonth} style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, width:34, height:34, cursor:"pointer", color:P.textPrimary, fontSize:"1.1rem" }}>‹</button>
            <span style={{ fontFamily:FONT_DISPLAY, fontSize:"1.2rem", color:P.textPrimary }}>{MONTHS[month]} {year}</span>
            <button onClick={nextMonth} style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, width:34, height:34, cursor:"pointer", color:P.textPrimary, fontSize:"1.1rem" }}>›</button>
          </div>

          {/* Day labels */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:P.bgAlt, borderBottom:`1px solid ${P.border}` }}>
            {DAYS.map(d=><div key={d} style={{ textAlign:"center", padding:"0.6rem 0", fontSize:"0.68rem", fontWeight:700, color:P.textThird, letterSpacing:"0.08em" }}>{d}</div>)}
          </div>

          {/* Days */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", padding:"0.5rem", gap:"2px" }}>
            {Array.from({length:first},(_,i)=><div key={`e${i}`}/>)}
            {Array.from({length:total},(_,i)=>{
              const d = i+1;
              const k = dateKey(year, month, d);
              const isToday  = k === todayKey;
              const isSel    = k === selKey;
              const dishes   = dayDishes(k);
              const hasMeals = dishes.length > 0;
              return (
                <div key={d} onClick={()=>selectDay(d)}
                  style={{ borderRadius:10, padding:"0.35rem 0.2rem", minHeight:58, cursor:"pointer", position:"relative",
                    background: isSel ? P.ember : isToday ? "rgba(232,130,74,0.12)" : "transparent",
                    border: `1.5px solid ${isSel ? P.ember : isToday ? "rgba(232,130,74,0.4)" : "transparent"}`,
                    transition:"all 0.15s" }}
                  onMouseEnter={e=>{ if(!isSel) e.currentTarget.style.background="rgba(232,130,74,0.08)"; }}
                  onMouseLeave={e=>{ if(!isSel) e.currentTarget.style.background=isToday?"rgba(232,130,74,0.12)":"transparent"; }}>
                  <span style={{ display:"block", textAlign:"center", fontSize:"0.82rem", fontWeight:isToday||isSel?700:400, color:isSel?"#fff":isToday?P.ember:P.textPrimary }}>{d}</span>
                  {/* Dish pills */}
                  {dishes.slice(0,2).map((dish,di)=>(
                    <div key={di} style={{ margin:"1px 2px", padding:"1px 4px", borderRadius:4, background: SLOT_COLORS[dish.slot]||P.ember }}>
                      <span style={{ fontSize:"0.56rem", color:"#fff", fontWeight:700, display:"block", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{dish.meal}</span>
                    </div>
                  ))}
                  {dishes.length > 2 && (
                    <div style={{ margin:"1px 2px", fontSize:"0.56rem", color:P.textThird, textAlign:"center" }}>+{dishes.length-2} more</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ display:"grid", gap:"1rem" }}>

          {/* Day panel */}
          {panel && selKey && (
            <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:16, padding:"1.25rem", boxShadow:`0 8px 32px rgba(0,0,0,0.3)` }}>
              <div style={{ fontSize:"0.72rem", color:P.ember, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.75rem", fontWeight:700 }}>
                📅 {new Date(selKey+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
              </div>

              {/* Existing dishes */}
              {dayDishes(selKey).length > 0 && (
                <div style={{ marginBottom:"1rem" }}>
                  {dayDishes(selKey).map((dish,i)=>(
                    <div key={dish.id||i} style={{ display:"flex", alignItems:"center", gap:8, padding:"0.55rem 0.65rem", background:P.bgAlt, borderRadius:8, marginBottom:6, border:`1px solid ${P.border}` }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:SLOT_COLORS[dish.slot]||P.ember, flexShrink:0 }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"0.85rem", fontWeight:600, color:P.textPrimary, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{dish.meal}</div>
                        <div style={{ fontSize:"0.7rem", color:P.textThird, display:"flex", gap:8 }}>
                          <span>{dish.slot}</span>
                          {dish.time && <span>⏰ {dish.time}</span>}
                          {dish.note && <span>· {dish.note}</span>}
                        </div>
                      </div>
                      <button onClick={()=>startEdit(dish,i)} style={{ background:"none", border:"none", cursor:"pointer", color:P.textThird, padding:"2px" }}><Icon name="edit" size={12}/></button>
                      <button onClick={()=>removeDish(selKey,i)} style={{ background:"none", border:"none", cursor:"pointer", color:P.red, padding:"2px" }}><Icon name="trash" size={12}/></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add / edit form */}
              <div style={{ background:P.bgAlt, borderRadius:10, padding:"0.9rem", border:`1px solid ${P.border}` }}>
                <div style={{ fontSize:"0.68rem", color:P.textThird, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.6rem", fontWeight:700 }}>
                  {editIndex !== null ? "Edit Dish" : "Add Dish"}
                </div>

                {/* Quick pick from recipes */}
                {recipes.length > 0 && (
                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:6 }}>
                      {recipes.slice(0,5).map(r=>(
                        <button key={r.id} onClick={()=>setNewDish(r.title)}
                          style={{ background:newDish===r.title?P.ember:"rgba(232,130,74,0.08)", color:newDish===r.title?"#fff":P.ember, border:`1px solid rgba(232,130,74,0.2)`, borderRadius:20, padding:"0.2rem 0.65rem", fontSize:"0.72rem", cursor:"pointer", fontFamily:FONT_BODY, fontWeight:600, transition:"all 0.15s" }}>
                          {r.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <input style={{ ...inp, marginBottom:8, fontSize:"0.85rem", background:P.surface, color:P.textPrimary, borderColor:P.border }} value={newDish} onChange={e=>setNewDish(e.target.value)} placeholder="Dish name e.g. Adobo, Sinigang..."/>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                  <select style={{ ...inp, fontSize:"0.82rem", background:P.surface, color:P.textPrimary, borderColor:P.border }} value={newSlot} onChange={e=>setNewSlot(e.target.value)}>
                    {MEAL_SLOTS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  <input type="time" style={{ ...inp, fontSize:"0.82rem", background:P.surface, color:P.textPrimary, borderColor:P.border }} value={newTime} onChange={e=>setNewTime(e.target.value)} title="Set notification time"/>
                </div>

                <input style={{ ...inp, marginBottom:10, fontSize:"0.82rem", background:P.surface, color:P.textPrimary, borderColor:P.border }} value={newNote} onChange={e=>setNewNote(e.target.value)} placeholder="Notes (optional)"/>

                <div style={{ display:"flex", gap:8 }}>
                  <button style={{ ...btn("primary"), flex:1, justifyContent:"center", padding:"0.55rem" }} onClick={addDish} disabled={!newDish.trim()}>
                    <Icon name="plus" size={13} color="#fff"/> {editIndex!==null?"Update":"Add Dish"}
                  </button>
                  {editIndex !== null && (
                    <button style={{ ...btn("ghost"), padding:"0.55rem 0.8rem" }} onClick={()=>{setEditIndex(null);setNewDish("");setNewSlot("Dinner");setNewTime("");setNewNote("");}}>
                      Cancel
                    </button>
                  )}
                </div>

                {newTime && (
                  <p style={{ fontSize:"0.68rem", color:P.gold, marginTop:6, display:"flex", alignItems:"center", gap:4 }}>
                    <Icon name="timer" size={11} color={P.gold}/> Notification will fire at {newTime} on this date
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Upcoming meals */}
          <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:16, overflow:"hidden" }}>
            <div style={{ padding:"0.9rem 1.25rem", borderBottom:`1px solid ${P.border}`, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:"1rem" }}>📋</span>
              <span style={{ fontFamily:FONT_DISPLAY, fontSize:"1rem", color:P.textPrimary }}>Upcoming Meals</span>
              <span style={{ marginLeft:"auto", fontSize:"0.72rem", color:P.textThird }}>Next 14 days</span>
            </div>
            <div style={{ maxHeight:280, overflowY:"auto" }}>
              {upcoming.length === 0 ? (
                <div style={{ padding:"1.5rem", textAlign:"center", color:P.textThird, fontSize:"0.82rem" }}>No meals planned yet.<br/>Click a date to add dishes.</div>
              ) : upcoming.map((item,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"0.6rem 1.25rem", borderBottom:`1px solid ${P.border}` }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:`linear-gradient(135deg,${P.ember},${P.gold})`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:"0.56rem", color:"rgba(255,255,255,0.7)", lineHeight:1 }}>{item.date.toLocaleDateString("en-US",{month:"short"})}</span>
                    <span style={{ fontSize:"0.85rem", fontWeight:700, color:"#fff", lineHeight:1 }}>{item.date.getDate()}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"0.84rem", fontWeight:600, color:P.textPrimary, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{item.meal}</div>
                    <div style={{ fontSize:"0.7rem", color:P.textThird, display:"flex", gap:6 }}>
                      <span style={{ color:SLOT_COLORS[item.slot]||P.ember }}>{item.slot}</span>
                      {item.time && <span>⏰ {item.time}</span>}
                    </div>
                  </div>
                  <button onClick={()=>removeDish(item.key, (plans[item.key]||[]).findIndex(d=>d.id===item.id))}
                    style={{ background:"none", border:"none", cursor:"pointer", color:P.textThird }}>
                    <Icon name="trash" size={12}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:"1.25rem", marginTop:"1rem", flexWrap:"wrap" }}>
        {Object.entries(SLOT_COLORS).map(([slot,color])=>(
          <div key={slot} style={{ display:"flex", alignItems:"center", gap:5, fontSize:"0.72rem", color:P.textThird }}>
            <div style={{ width:10, height:10, borderRadius:3, background:color }}/>
            {slot}
          </div>
        ))}
      </div>
    </div>
  );
}