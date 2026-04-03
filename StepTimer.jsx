import { useState, useEffect, useRef, useCallback } from "react";
import { P, FONT_BODY, btn } from "../constants.js";
import Icon from "./Icon.jsx";

// ── Web Audio API: generates a pleasant 3-beep chime when timer ends ──
function playDoneSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beeps = [
      { freq: 880, start: 0,    dur: 0.18 },
      { freq: 1046, start: 0.22, dur: 0.18 },
      { freq: 1318, start: 0.44, dur: 0.35 },
    ];
    beeps.forEach(({ freq, start, dur }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type      = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + start + 0.03);
      gain.gain.linearRampToValueAtTime(0,    ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime  + start + dur + 0.05);
    });
  } catch (_) { /* silently fail if Web Audio not supported */ }
}

export default function StepTimer({ seconds }) {
  const [left,    setLeft]    = useState(seconds);
  const [running, setRunning] = useState(false);
  const [notified, setNotified] = useState(false);
  const ref = useRef(null);

  const pct  = ((seconds - left) / seconds) * 100;
  const R    = 20;
  const circ = 2 * Math.PI * R;
  const done = left === 0;
  const fmt  = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Countdown tick
  useEffect(() => {
    if (running && left > 0) {
      ref.current = setInterval(() => setLeft(t => t - 1), 1000);
    } else {
      clearInterval(ref.current);
      if (left === 0) setRunning(false);
    }
    return () => clearInterval(ref.current);
  }, [running, left]);

  // Fire sound + browser notification when done
  useEffect(() => {
    if (done && !notified) {
      setNotified(true);
      playDoneSound();
      // Browser notification (if user granted permission)
      if (Notification.permission === "granted") {
        new Notification("⏱️ Kusina Timer Done!", {
          body: "Your cooking step timer has finished.",
          icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🫕</text></svg>",
        });
      }
    }
  }, [done, notified]);

  const reset = useCallback(() => {
    setLeft(seconds);
    setRunning(false);
    setNotified(false);
  }, [seconds]);

  // Request notification permission on first start
  const handleStart = () => {
    if (!running && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setRunning(r => !r);
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.75rem",
      background: done ? "rgba(46,125,69,0.08)" : "rgba(181,72,26,0.07)",
      border: `1px solid ${done ? "rgba(46,125,69,0.2)" : "transparent"}`,
      borderRadius: 10, padding: "0.65rem 1rem",
      marginTop: "0.6rem", flexWrap: "wrap",
      transition: "background 0.4s, border 0.4s",
    }}>

      {/* Circular progress ring */}
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={R} fill="none" stroke={P.border} strokeWidth="3.5"/>
        <circle
          cx="26" cy="26" r={R} fill="none"
          stroke={done ? P.green : P.ember} strokeWidth="3.5"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          style={{ transition: "stroke-dashoffset 0.5s, stroke 0.4s" }}
        />
        <text x="26" y="30" textAnchor="middle" fontSize="10" fontWeight="700"
          fill={done ? P.green : P.ember} fontFamily={FONT_BODY}>
          {done ? "✓" : fmt(left)}
        </text>
      </svg>

      {/* Time readout */}
      <span style={{
        fontSize: "1.1rem", fontWeight: 700,
        color: done ? P.green : P.dark,
        minWidth: 50, fontFamily: FONT_BODY,
        transition: "color 0.4s",
      }}>
        {fmt(left)}
      </span>

      {/* Controls */}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          style={{
            ...btn(running ? "ghost" : done ? "ghost" : "primary"),
            padding: "0.35rem 0.9rem", fontSize: "0.8rem",
            ...(done && { background: P.green, color: "#fff", border: "none" }),
          }}
          onClick={handleStart}
          disabled={done}
        >
          <Icon name={running ? "pause" : "play"} size={13} color={done ? "#fff" : undefined} />
          {running ? "Pause" : left < seconds && left > 0 ? "Resume" : "Start"}
        </button>
        <button style={{ ...btn("ghost"), padding: "0.35rem 0.6rem" }} onClick={reset}>
          <Icon name="reset" size={13} />
        </button>
      </div>

      {/* Done badge */}
      {done && (
        <span style={{
          fontSize: "0.78rem", color: P.green, fontWeight: 700,
          display: "flex", alignItems: "center", gap: 4,
          animation: "fadeIn 0.4s ease",
        }}>
          <Icon name="check" size={13} color={P.green} /> Timer done! 🔔
        </span>
      )}
    </div>
  );
}