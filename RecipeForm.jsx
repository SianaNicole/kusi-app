import { useState } from "react";
import { P, FONT_DISPLAY, FONT_BODY, btn, inp, fieldLabel } from "../constants.js";
import Icon from "./Icon.jsx";

export default function RecipeForm({ initial, onSave, onCancel }) {
  const blank = {
    title: "", cuisine: "", category: "", prepTime: "", cookTime: "",
    servings: "", spiceLevel: "Mild", image: "", description: "",
    ingredients: [""], steps: [{ instruction: "", timer: 0 }],
    notes: "", favorite: false,
  };

  const [form, setForm] = useState(initial || blank);

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setIng = (i, v) => { const a = [...form.ingredients]; a[i] = v; set("ingredients", a); };
  const setStep = (i, k, v) => { const a = [...form.steps]; a[i] = { ...a[i], [k]: v }; set("steps", a); };
  const addIng  = () => set("ingredients", [...form.ingredients, ""]);
  const addStep = () => set("steps", [...form.steps, { instruction: "", timer: 0 }]);
  const removeIng  = i => set("ingredients", form.ingredients.filter((_, j) => j !== i));
  const removeStep = i => set("steps", form.steps.filter((_, j) => j !== i));

  const submit = () => {
    if (!form.title.trim()) { alert("Recipe title is required."); return; }
    onSave({
      ...form,
      id:        initial?.id || String(Date.now()),
      createdAt: initial?.createdAt || Date.now(),
    });
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: FONT_BODY }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "2rem" }}>
        <button style={{ ...btn("ghost"), padding: "0.5rem 0.8rem" }} onClick={onCancel}>
          <Icon name="back" size={16} />
        </button>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "1.7rem", color: P.textPrimary, margin: 0 }}>
          {initial ? "Edit Recipe" : "New Recipe"}
        </h2>
      </div>

      <div style={{ display: "grid", gap: "1.2rem" }}>

        {/* Title */}
        <div>
          <label style={fieldLabel}>Recipe Title *</label>
          <input style={inp} value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Sinigang na Baboy" />
        </div>

        {/* Cuisine + Category */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={fieldLabel}>Cuisine</label>
            <input style={inp} value={form.cuisine} onChange={e => set("cuisine", e.target.value)} placeholder="e.g. Filipino" />
          </div>
          <div>
            <label style={fieldLabel}>Category</label>
            <input style={inp} value={form.category} onChange={e => set("category", e.target.value)} placeholder="e.g. Soup, Main, Dessert" />
          </div>
        </div>

        {/* Time + Servings + Spice */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={fieldLabel}>Prep (min)</label>
            <input style={inp} type="number" value={form.prepTime} onChange={e => set("prepTime", e.target.value)} placeholder="20" />
          </div>
          <div>
            <label style={fieldLabel}>Cook (min)</label>
            <input style={inp} type="number" value={form.cookTime} onChange={e => set("cookTime", e.target.value)} placeholder="30" />
          </div>
          <div>
            <label style={fieldLabel}>Servings</label>
            <input style={inp} type="number" value={form.servings} onChange={e => set("servings", e.target.value)} placeholder="4" />
          </div>
          <div>
            <label style={fieldLabel}>Spice Level</label>
            <select style={inp} value={form.spiceLevel} onChange={e => set("spiceLevel", e.target.value)}>
              {["Mild", "Low", "Medium", "Hot", "Extra Hot"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Image */}
        <div>
          <label style={fieldLabel}>Image URL (optional)</label>
          <input style={inp} value={form.image} onChange={e => set("image", e.target.value)} placeholder="https://..." />
        </div>

        {/* Description */}
        <div>
          <label style={fieldLabel}>Description</label>
          <textarea style={{ ...inp, resize: "vertical", minHeight: 70 }} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe this dish..." />
        </div>

        {/* Ingredients */}
        <div>
          <label style={fieldLabel}>Ingredients</label>
          {form.ingredients.map((ing, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input style={inp} value={ing} onChange={e => setIng(i, e.target.value)} placeholder={`Ingredient ${i + 1}`} />
              {form.ingredients.length > 1 && (
                <button style={{ ...btn("danger"), padding: "0 0.7rem", flexShrink: 0 }} onClick={() => removeIng(i)}>
                  <Icon name="trash" size={14} />
                </button>
              )}
            </div>
          ))}
          <button style={{ ...btn("ghost"), fontSize: "0.82rem", marginTop: 4 }} onClick={addIng}>
            <Icon name="plus" size={13} /> Add Ingredient
          </button>
        </div>

        {/* Steps */}
        <div>
          <label style={fieldLabel}>Steps</label>
          {form.steps.map((s, i) => (
            <div key={i} style={{ background: P.bgAlt, border: `1px solid ${P.border}`, borderRadius: 10, padding: "1rem", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: P.ember, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: "0.72rem", color: P.textThird, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Step {i + 1}
                </span>
                {form.steps.length > 1 && (
                  <button style={{ ...btn("danger"), padding: "0.2rem 0.5rem", marginLeft: "auto" }} onClick={() => removeStep(i)}>
                    <Icon name="trash" size={13} />
                  </button>
                )}
              </div>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 60, marginBottom: 8 }} value={s.instruction} onChange={e => setStep(i, "instruction", e.target.value)} placeholder="Describe this step..." />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="timer" size={14} color={P.muted} />
                <label style={{ ...fieldLabel, margin: 0 }}>Timer (seconds · 0 = no timer)</label>
                <input style={{ ...inp, width: 80 }} type="number" value={s.timer} min="0" onChange={e => setStep(i, "timer", Number(e.target.value))} placeholder="0" />
              </div>
            </div>
          ))}
          <button style={{ ...btn("ghost"), fontSize: "0.82rem" }} onClick={addStep}>
            <Icon name="plus" size={13} /> Add Step
          </button>
        </div>

        {/* Notes */}
        <div>
          <label style={fieldLabel}>Notes / Tips (optional)</label>
          <textarea style={{ ...inp, resize: "vertical", minHeight: 60 }} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any tips, substitutions, or variations..." />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
          <button style={btn("ghost")} onClick={onCancel}>Cancel</button>
          <button style={btn("primary")} onClick={submit}>
            <Icon name="save" size={15} color="#fff" />
            {initial ? "Save Changes" : "Add Recipe"}
          </button>
        </div>

      </div>
    </div>
  );
}