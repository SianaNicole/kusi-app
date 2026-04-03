import { useState } from "react";
import { P, FONT_DISPLAY, FONT_BODY, btn } from "../constants.js";
import Icon from "./Icon.jsx";
import StepTimer from "./StepTimer.jsx";

export default function CookingMode({ recipe, onExit }) {
  const [step, setStep]       = useState(0);
  const [checked, setChecked] = useState([]);
  const total = recipe.steps.length;
  const cur   = recipe.steps[step];

  const toggle = i =>
    setChecked(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);

  return (
    <div style={{ minHeight: "100vh", background: "#140C04", color: "#F9F4EE", fontFamily: FONT_BODY }}>

      {/* ── Top bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)",
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(20,12,4,0.95)", backdropFilter: "blur(12px)",
      }}>
        <button style={{ ...btn("dark") }} onClick={onExit}>
          <Icon name="back" size={15} color="#F9F4EE" /> Exit
        </button>
        <span style={{ fontFamily: FONT_DISPLAY, color: "#D4900A", fontSize: "1rem" }}>
          {recipe.title}
        </span>
        <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)" }}>
          {step + 1} / {total}
        </span>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.08)" }}>
        <div style={{
          height: "100%",
          background: `linear-gradient(90deg,${P.ember},${P.gold})`,
          width: `${((step + 1) / total) * 100}%`,
          transition: "width 0.4s ease",
        }}/>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1.5rem", display: "grid", gap: "1.5rem" }}>

        {/* ── Current step ── */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16, padding: "1.75rem 2rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1rem" }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: `linear-gradient(135deg,${P.ember},${P.gold})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: "0.95rem", flexShrink: 0,
            }}>{step + 1}</div>
            <span style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
              Current Step
            </span>
          </div>
          <p style={{ fontSize: "1.15rem", lineHeight: 1.7, color: "#F9F4EE", margin: 0 }}>
            {cur.instruction}
          </p>
          {cur.timer > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Timer for this step
              </div>
              <StepTimer seconds={cur.timer} />
            </div>
          )}
        </div>

        {/* ── Nav buttons ── */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            disabled={step === 0}
            onClick={() => setStep(s => s - 1)}
            style={{
              ...btn("dark"),
              opacity: step === 0 ? 0.3 : 1,
              cursor: step === 0 ? "not-allowed" : "pointer",
            }}>← Prev</button>
          {step < total - 1
            ? <button style={btn("primary")} onClick={() => setStep(s => s + 1)}>Next Step →</button>
            : <button style={{ ...btn("primary"), background: P.green }} onClick={onExit}>🎉 Finished!</button>
          }
        </div>

        {/* ── Step checklist ── */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12, padding: "1.25rem 1.5rem",
        }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, color: P.gold, fontSize: "0.95rem", margin: "0 0 0.9rem" }}>
            Step Checklist
          </h3>
          {recipe.steps.map((s, i) => (
            <div
              key={i}
              onClick={() => toggle(i)}
              style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                padding: "0.55rem 0",
                borderBottom: i < total - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                cursor: "pointer",
                opacity: checked.includes(i) ? 0.4 : 1,
                transition: "opacity 0.2s",
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 5, marginTop: 2, flexShrink: 0,
                border: `2px solid ${checked.includes(i) ? P.green : "rgba(255,255,255,0.25)"}`,
                background: checked.includes(i) ? P.green : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}>
                {checked.includes(i) && <Icon name="check" size={10} color="#fff" />}
              </div>
              <span style={{
                fontSize: "0.85rem", color: "rgba(255,255,255,0.75)",
                lineHeight: 1.5,
                textDecoration: checked.includes(i) ? "line-through" : "none",
              }}>
                <strong style={{ color: i === step ? P.gold : "rgba(255,255,255,0.3)", marginRight: 6 }}>
                  {i + 1}.
                </strong>
                {s.instruction}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}