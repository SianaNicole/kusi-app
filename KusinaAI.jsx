import { useState, useRef, useEffect } from "react";
import { P, FONT_DISPLAY, FONT_BODY, FONT_ACCENT, btn, inp } from "../constants.js";
import Icon from "./Icon.jsx";

// ─────────────────────────────────────────────────────────────
//  KUSINA AI AGENT — Powered by Google Gemini (Free API)
//
//  Get your FREE Gemini API key at:
//  https://aistudio.google.com/app/apikey
//
//  Architecture:
//    User → Rule-based engine (instant, no key needed)
//         → Google Gemini API (if key added)
//         → Memory: last 12 messages sent per request
//         → Actions: timer, navigate, recipe search
// ─────────────────────────────────────────────────────────────

const AGENT_NAME = "Kusi";
const AGENT_EMOJI = "🫕";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const QUICK_PROMPTS = [
  { label: "Suggest a recipe", icon: "chef", text: "Suggest a Filipino dish I can make tonight" },
  { label: "What can I cook?", icon: "sparkle", text: "I have chicken, garlic, onion and soy sauce. What can I make?" },
  { label: "Set a timer", icon: "timer", text: "Set a 15 minute timer for my pasta" },
  { label: "Nearby restaurants", icon: "pin", text: "Find me nearby restaurants and cafés" },
  { label: "Plan my meals", icon: "star", text: "Help me plan meals for the week" },
  { label: "Cooking tips", icon: "info", text: "What are tips for making perfect adobo?" },
];

function ruleBasedResponse(text, recipes) {
  const t = text.toLowerCase();
  const timerMatch = t.match(/(\d+)\s*(minute|min|second|sec|hour|hr)/);
  if ((t.includes("timer") || t.includes("set") || t.includes("remind")) && timerMatch) {
    const val = parseInt(timerMatch[1]);
    const unit = timerMatch[2].startsWith("sec") ? "second" : timerMatch[2].startsWith("hour") || timerMatch[2].startsWith("hr") ? "hour" : "minute";
    const secs = unit === "second" ? val : unit === "hour" ? val * 3600 : val * 60;
    return { text: `⏱️ Timer set for **${val} ${unit}${val > 1 ? "s" : ""}**!`, action: { type: "timer", seconds: secs, label: `${val} ${unit}${val > 1 ? "s" : ""}` } };
  }
  if (t.includes("nearby") || t.includes("restaurant") || t.includes("café") || t.includes("cafe") || (t.includes("find") && (t.includes("eat") || t.includes("food") || t.includes("place")))) {
    return { text: "📍 Opening **Nearby Places** — I'll show restaurants, cafés and more near you with routes.", action: { type: "navigate", view: "nearby" } };
  }
  if (t.includes("calendar") || t.includes("meal plan") || t.includes("schedule") || t.includes("planner")) {
    return { text: "📅 Opening your **Meal Planner** — assign dishes to dates and get reminders!", action: { type: "navigate", view: "calendar" } };
  }
  if ((t.includes("my recipe") || t.includes("show recipe") || t.includes("view recipe")) && recipes.length > 0) {
    return { text: `📖 You have **${recipes.length} recipe${recipes.length > 1 ? "s" : ""}** saved:\n\n${recipes.slice(0, 4).map((r, i) => `${i + 1}. **${r.title}** ${r.cuisine ? `(${r.cuisine})` : ""}`).join("\n")}\n\nTap any recipe in your collection to view it.`, action: { type: "navigate", view: "list" } };
  }
  if (t.match(/^(hi|hello|hey|good morning|good evening|good afternoon|kumusta|kamusta)/)) {
    return { text: `Hello! 👋 I'm **${AGENT_NAME}**, your AI cooking assistant powered by Google Gemini. Ask me for recipe ideas, cooking tips, meal plans, or just say what ingredients you have!` };
  }
  if (t.match(/(bye|goodbye|thanks|thank you|salamat)/)) {
    return { text: "You're welcome! 🫕 Happy cooking! Come back anytime. Kain na!" };
  }
  return null;
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: P.ember, opacity: 0.5, animation: `kusiDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
      <style>{`@keyframes kusiDot{0%,80%,100%{transform:scale(0.7);opacity:0.4}40%{transform:scale(1.1);opacity:1}}`}</style>
    </div>
  );
}

function MsgText({ text, isUser }) {
  const lines = text.split("\n");
  return (
    <div style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "inherit" }}>
      {lines.map((line, i) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p);
        return <div key={i} style={{ marginBottom: line === "" ? "0.35rem" : 0 }}>{rendered}</div>;
      })}
    </div>
  );
}

export default function KusinaAI({ recipes, user, onNavigate, onSetTimer }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("kusina_gemini_key") || "");
  const [showSetup, setShowSetup] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [showKey, setShowKey] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const addMsg = (role, text, action = null) =>
    setMessages(prev => [...prev, { role, text, action, id: Date.now() + Math.random() }]);

  const saveKey = () => {
    localStorage.setItem("kusina_gemini_key", keyDraft.trim());
    setApiKey(keyDraft.trim());
    setShowSetup(false);
    addMsg("agent", "✅ Gemini API key saved! I'm now fully powered by Google Gemini AI. Ask me anything about cooking!");
  };

  const removeKey = () => {
    localStorage.removeItem("kusina_gemini_key");
    setApiKey(""); setKeyDraft("");
    addMsg("agent", "API key removed. I'm now in rule-based mode. Add your Gemini key to unlock full AI.");
  };

  const handleAction = (action) => {
    if (!action) return;
    if (action.type === "navigate") onNavigate(action.view);
    if (action.type === "timer") onSetTimer(action.seconds, action.label);
  };

  const buildSystemPrompt = () =>
    `You are Kusi, the friendly AI cooking assistant in the Kusina recipe app. 
The user's name is ${user?.name || "there"}. They have ${recipes.length} recipes saved: ${recipes.slice(0, 6).map(r => r.title).join(", ")}${recipes.length > 6 ? "..." : ""}.
Personality: warm, encouraging, knowledgeable, uses occasional Filipino food references.
Always respond in English. Keep answers under 220 words unless a full recipe is asked.
For timers: clearly state the time (e.g. "Setting a 15-minute timer").
For nearby places: suggest they use the Nearby tab in the app.
For meal planning: suggest using the Planner/Calendar tab.
Format tips as numbered lists. Format recipes clearly with Ingredients and Steps.`.trim();

  const sendMessage = async (text = input.trim()) => {
    if (!text || loading) return;
    setInput("");
    setLoading(true);

    // Rule-based first
    const rule = ruleBasedResponse(text, recipes);

    // Build conversation history for Gemini (from prior messages only)
    const history = messages.slice(-10).map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    // Add user message to UI
    addMsg("user", text);

    if (apiKey) {
      try {
        const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: buildSystemPrompt() }] },
            contents: [
              ...history,
              { role: "user", parts: [{ text }] },
            ],
            generationConfig: {
              maxOutputTokens: 500,
              temperature: 0.75,
              topP: 0.9,
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
            ],
          }),
        });

        if (!res.ok) throw new Error(`Gemini error ${res.status}`);
        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I didn't get a response. Please try again.";

        // Detect if AI response implies a timer or navigation
        const tm = reply.match(/(\d+)[- ](minute|min|second|sec|hour)/i);
        const hasTimer = (reply.toLowerCase().includes("timer") || reply.toLowerCase().includes("setting")) && tm;
        const hasNearby = reply.toLowerCase().includes("nearby") || reply.toLowerCase().includes("nearby tab");
        const hasCalendar = reply.toLowerCase().includes("planner") || reply.toLowerCase().includes("calendar tab");

        let action = null;
        if (hasTimer && tm) {
          const val = parseInt(tm[1]), unit = tm[2].toLowerCase().startsWith("sec") ? "second" : tm[2].toLowerCase().startsWith("hour") ? "hour" : "minute";
          action = { type: "timer", seconds: unit === "second" ? val : unit === "hour" ? val * 3600 : val * 60, label: `${val} ${unit}${val > 1 ? "s" : ""}` };
        } else if (hasNearby) action = { type: "navigate", view: "nearby" };
        else if (hasCalendar) action = { type: "navigate", view: "calendar" };

        addMsg("agent", reply, action);
      } catch (err) {
        if (rule) { addMsg("agent", rule.text, rule.action); }
        else addMsg("agent", "I had trouble connecting to Gemini. Check your API key in ⚙️ settings, or ask a simpler question and I'll do my best! 🫕");
      }
    } else {
      if (rule) { addMsg("agent", rule.text, rule.action); }
      else {
        const fallbacks = [
          `Great question! Add your free **Gemini API key** via ⚙️ to get full AI answers. In the meantime I can help with timers ⏱️, meal planning 📅, and nearby places 📍!`,
          `For detailed AI answers, tap ⚙️ and add your Google Gemini API key (free at aistudio.google.com). I can still help with timers, recipes, and navigation right now!`,
        ];
        addMsg("agent", fallbacks[Math.floor(Math.random() * fallbacks.length)]);
      }
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  const isWelcome = messages.length === 0;

  const BUBBLE_USER = {
    background: `linear-gradient(135deg,${P.ember},${P.emberLight})`,
    color: "#fff", borderRadius: "18px 18px 4px 18px",
    boxShadow: `0 3px 12px rgba(212,84,26,0.2)`,
  };
  const BUBBLE_AGENT = {
    background: P.surface, color: P.textPrimary,
    border: `1px solid ${P.border}`, borderRadius: "18px 18px 18px 4px",
    boxShadow: "0 2px 8px rgba(168,100,60,0.08)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 130px)", maxWidth: 720, margin: "0 auto", padding: "0 1rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.9rem 0 0.75rem", borderBottom: `1px solid ${P.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${P.ember},${P.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", boxShadow: `0 3px 12px rgba(212,84,26,0.28)` }}>{AGENT_EMOJI}</div>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: "1rem", color: P.textPrimary, fontWeight: 600 }}>{AGENT_NAME} — Kusina AI</div>
            <div style={{ fontSize: "0.68rem", display: "flex", alignItems: "center", gap: 4, color: apiKey ? P.green : P.textThird }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: apiKey ? P.green : P.textThird }} />
              {apiKey ? "Powered by Google Gemini ✨" : "Rule-based mode · Add Gemini key for AI"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {messages.length > 0 && <button style={{ ...btn("ghost"), padding: "0.38rem 0.7rem", fontSize: "0.75rem" }} onClick={() => setMessages([])}>Clear</button>}
          <button style={{ ...btn("ghost"), padding: "0.38rem 0.7rem", fontSize: "0.75rem" }} onClick={() => setShowSetup(s => !s)}>
            <Icon name="settings" size={13} /> API Key
          </button>
        </div>
      </div>

      {/* API Key setup */}
      {showSetup && (
        <div style={{ background: P.emberGlow, border: `1px solid rgba(212,84,26,0.2)`, borderRadius: 12, padding: "1rem 1.25rem", margin: "0.75rem 0" }}>
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: "0.8rem", color: P.textSecond, lineHeight: 1.65, marginBottom: 4 }}>
              Get your <strong>free</strong> Google Gemini API key at{" "}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: P.ember, fontWeight: 600 }}>aistudio.google.com/app/apikey</a>
            </p>
            <p style={{ fontSize: "0.72rem", color: P.textThird }}>Free tier: 15 requests/min · 1 million tokens/day — more than enough!</p>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input type={showKey ? "text" : "password"} value={keyDraft} onChange={e => setKeyDraft(e.target.value)} placeholder="Paste your Gemini API key here..." style={{ ...inp, flex: 1, fontSize: "0.82rem", background: "rgba(255,255,255,0.85)" }} />
            <button style={{ ...btn("ghost"), padding: "0.45rem 0.7rem", fontSize: "0.75rem" }} onClick={() => setShowKey(s => !s)}>{showKey ? "Hide" : "Show"}</button>
            <button style={{ ...btn("primary"), padding: "0.45rem 1rem", fontSize: "0.82rem" }} onClick={saveKey} disabled={!keyDraft.trim()}>Save</button>
          </div>
          {apiKey && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.72rem", color: P.green, fontWeight: 600 }}>✅ Gemini key active</span>
              <button onClick={removeKey} style={{ background: "none", border: "none", cursor: "pointer", color: P.red, fontSize: "0.72rem" }}>Remove key</button>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "0.5rem" }}>

        {isWelcome && (
          <div style={{ textAlign: "center", padding: "2rem 1rem 1.5rem", animation: "fadeUp 0.5s ease" }}>
            <div style={{ width: 68, height: 68, borderRadius: "50%", background: `linear-gradient(135deg,${P.ember},${P.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.9rem", margin: "0 auto 1rem", boxShadow: `0 6px 24px rgba(212,84,26,0.3)` }}>{AGENT_EMOJI}</div>
            <h3 style={{ fontFamily: FONT_ACCENT, fontSize: "1.4rem", color: P.textPrimary, margin: "0 0 6px" }}>Hi, I'm {AGENT_NAME}!</h3>
            <p style={{ color: P.textSecond, fontSize: "0.86rem", lineHeight: 1.65, maxWidth: 360, margin: "0 auto 1.5rem" }}>
              Your AI-powered cooking assistant. Ask me for recipe ideas, cooking help, meal planning, or anything food-related!
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {QUICK_PROMPTS.map(qp => (
                <button
                  key={qp.label}
                  onClick={() => sendMessage(qp.text)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: P.surface,
                    border: `1px solid ${P.border}`,
                    borderRadius: 20,
                    padding: "0.45rem 1rem",
                    cursor: "pointer",
                    fontFamily: FONT_BODY,
                    fontSize: "0.78rem",
                    color: P.textSecond,
                    boxShadow: "0 1px 4px rgba(168,100,60,0.06)",
                    transition: "all 0.18s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = P.ember;
                    e.currentTarget.style.color = P.ember;
                    e.currentTarget.style.boxShadow = `0 3px 12px rgba(212,84,26,0.12)`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = P.border;
                    e.currentTarget.style.color = P.textSecond;
                    e.currentTarget.style.boxShadow = "0 1px 4px rgba(168,100,60,0.06)";
                  }}
                >
                  <Icon name={qp.icon} size={13} color={P.ember} /> {qp.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} style={{ display: "flex", gap: 10, marginBottom: "1rem", flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-end", animation: "fadeUp 0.3s ease" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: msg.role === "agent" ? `linear-gradient(135deg,${P.ember},${P.gold})` : `linear-gradient(135deg,${P.textSecond},${P.textThird})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: msg.role === "agent" ? "0.85rem" : "0.7rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {msg.role === "agent" ? AGENT_EMOJI : (user?.initials || user?.name?.[0]?.toUpperCase() || "U")}
            </div>
            <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", gap: 7, alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ ...msg.role === "user" ? BUBBLE_USER : BUBBLE_AGENT, padding: "0.7rem 1rem" }}>
                <MsgText text={msg.text} isUser={msg.role === "user"} />
              </div>
              {msg.action && (
                <button
                  onClick={() => handleAction(msg.action)}
                  style={{ ...btn("saffron"), fontSize: "0.77rem", padding: "0.38rem 0.9rem", borderRadius: 20 }}>
                  {msg.action.type === "timer" && <><Icon name="timer" size={13} color="#fff" /> Start {msg.action.label} Timer</>}
                  {msg.action.type === "navigate" && msg.action.view === "nearby" && <><Icon name="pin" size={13} color="#fff" /> Open Nearby</>}
                  {msg.action.type === "navigate" && msg.action.view === "calendar" && <><Icon name="timer" size={13} color="#fff" /> Open Planner</>}
                  {msg.action.type === "navigate" && msg.action.view === "list" && <><Icon name="book" size={13} color="#fff" /> View Recipes</>}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: "1rem" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${P.ember},${P.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem" }}>{AGENT_EMOJI}</div>
            <div style={{ ...BUBBLE_AGENT, padding: "0.7rem 1rem" }}><TypingDots /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: `1px solid ${P.border}`, paddingTop: "0.75rem", paddingBottom: "0.5rem" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask Kusi anything... (Enter to send, Shift+Enter for new line)"
            rows={1}
            style={{
              ...inp,
              flex: 1,
              resize: "none",
              minHeight: 44,
              maxHeight: 120,
              lineHeight: 1.55,
              paddingTop: "0.62rem",
              paddingBottom: "0.62rem",
              borderRadius: 14,
              fontSize: "0.88rem"
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              ...btn("primary"),
              padding: "0.68rem 1rem",
              borderRadius: 14,
              flexShrink: 0,
              opacity: (!input.trim() || loading) ? 0.5 : 1,
              transition: "all 0.18s"
            }}>
            <Icon name="send" size={16} color="#fff" />
          </button>
        </div>
        <p style={{ fontSize: "0.62rem", color: P.textThird, textAlign: "center", marginTop: 5 }}>
          Kusi uses Google Gemini AI · Free API · May make mistakes
        </p>
      </div>
    </div>
  );
}