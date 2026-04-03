import { P, FONT_DISPLAY, FONT_BODY, btn } from "../constants.js";
import Icon from "./Icon.jsx";
import StepTimer from "./StepTimer.jsx";

const SPICE_COLOR = {
  Mild: "#2E7D45", Low: "#50A050", Medium: "#D4900A",
  Hot: "#D04A10", "Extra Hot": "#B5481A",
};

export default function RecipeDetail({ recipe, onBack, onCook, onEdit, onDelete, onToggleFav }) {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: FONT_BODY }}>

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 10 }}>
        <button style={{ ...btn("ghost"), padding: "0.5rem 0.9rem" }} onClick={onBack}>
          <Icon name="back" size={15} /> Recipes
        </button>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            style={{ ...btn("ghost"), padding: "0.5rem 0.65rem" }}
            onClick={onToggleFav}
            title={recipe.favorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Icon name={recipe.favorite ? "heartFill" : "heart"} size={16} />
          </button>
          <button style={btn("ghost")} onClick={onEdit}>
            <Icon name="edit" size={14} /> Edit
          </button>
          {/* ── DELETE BUTTON — calls onDelete directly ── */}
          <button
            style={btn("danger")}
            onClick={() => onDelete(recipe.id)}
          >
            <Icon name="trash" size={14} /> Delete
          </button>
          <button style={btn("primary")} onClick={onCook}>
            <Icon name="chef" size={14} color="#fff" /> Cook Now
          </button>
        </div>
      </div>

      {/* Image */}
      {recipe.image && (
        <img
          src={recipe.image} alt={recipe.title}
          style={{ width: "100%", height: 300, objectFit: "cover", borderRadius: 16, marginBottom: "1.5rem", boxShadow: "0 12px 40px rgba(181,72,26,0.15)" }}
        />
      )}

      {/* Title + meta */}
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "2.1rem", color: P.textPrimary, margin: "0 0 6px" }}>
        {recipe.title}
      </h1>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        {recipe.cuisine  && <span style={{ fontSize: "0.78rem", color: P.textThird, textTransform: "uppercase", letterSpacing: "0.08em" }}>{recipe.cuisine}</span>}
        {recipe.category && <><span style={{ color: P.border }}>·</span><span style={{ fontSize: "0.78rem", color: P.textThird }}>{recipe.category}</span></>}
      </div>
      {recipe.description && (
        <p style={{ color: P.textSecond, lineHeight: 1.7, marginBottom: "1.5rem" }}>{recipe.description}</p>
      )}

      {/* Stats row */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: "2rem" }}>
        {[
          { label: "Prep",   value: recipe.prepTime  ? `${recipe.prepTime}m`  : "—" },
          { label: "Cook",   value: recipe.cookTime  ? `${recipe.cookTime}m`  : "—" },
          { label: "Serves", value: recipe.servings  || "—" },
        ].map(s => (
          <div key={s.label} style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, padding: "0.7rem 1.2rem" }}>
            <div style={{ fontSize: "0.67rem", color: P.textThird, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: P.textPrimary }}>{s.value}</div>
          </div>
        ))}
        {recipe.spiceLevel && (
          <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, padding: "0.7rem 1.2rem" }}>
            <div style={{ fontSize: "0.67rem", color: P.textThird, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Spice</div>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: SPICE_COLOR[recipe.spiceLevel] || P.gold }}>{recipe.spiceLevel}</div>
          </div>
        )}
      </div>

      {/* Ingredients */}
      {recipe.ingredients?.filter(Boolean).length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, color: P.ember, marginBottom: "0.75rem", fontSize: "1.2rem" }}>Ingredients</h3>
          <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 12, overflow: "hidden" }}>
            {recipe.ingredients.filter(Boolean).map((ing, i, arr) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.65rem 1.25rem", borderBottom: i < arr.length - 1 ? `1px solid ${P.border}` : "none", fontSize: "0.92rem", color: P.textPrimary }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: P.ember, flexShrink: 0 }} />
                {ing}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      {recipe.steps?.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, color: P.ember, marginBottom: "0.75rem", fontSize: "1.2rem" }}>Preparation</h3>
          {recipe.steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 14, marginBottom: 12, background: P.surface, border: `1px solid ${P.border}`, borderRadius: 12, padding: "1rem 1.25rem" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: P.ember, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.92rem", color: P.textPrimary, lineHeight: 1.65, margin: 0 }}>{s.instruction}</p>
                {s.timer > 0 && <StepTimer seconds={s.timer} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {recipe.notes && (
        <div style={{ background: `linear-gradient(135deg,${P.emberDeep},${P.ember})`, borderRadius: 12, padding: "1.25rem 1.5rem" }}>
          <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Notes</div>
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.9rem", lineHeight: 1.65, margin: 0 }}>{recipe.notes}</p>
        </div>
      )}

    </div>
  );
}