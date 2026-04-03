// ─────────────────────────────────────────────────────────────
//  KUSINA DESIGN SYSTEM — Aurora Spice Theme
//  Soft gradient base: warm ivory → blush, ember accents
// ─────────────────────────────────────────────────────────────

export const P = {
  // Page backgrounds — warm gradient layers
  bg:         "#FDF8F2",
  bgAlt:      "#F6EEE4",
  bgGrad:     "linear-gradient(145deg, #FDF8F2 0%, #F9EFE4 40%, #F5E8DB 100%)",
  surface:    "#FFFFFF",
  surfaceHigh:"#FFF9F5",
  glassLight: "rgba(255,255,255,0.72)",

  // Primary ember-spice palette
  ember:      "#D4541A",
  emberLight: "#F07240",
  emberDeep:  "#A63D10",
  emberGlow:  "rgba(212,84,26,0.12)",

  // Gold accent
  gold:       "#C8960A",
  goldLight:  "#EAB520",
  goldGlow:   "rgba(200,150,10,0.12)",

  // Rose accent
  rose:       "#C8506A",
  roseLight:  "#E86882",
  roseGlow:   "rgba(200,80,106,0.1)",

  // Teal accent
  teal:       "#2A8C78",
  tealLight:  "#3AADA0",

  // Text
  textPrimary:"#1A0E06",
  textSecond: "#6B4E38",
  textThird:  "#A07860",
  textInverse:"#FFFFFF",

  // Borders
  border:     "#E8D5C0",
  borderHigh: "#D4B898",

  // Semantic
  green:      "#2A7B52",
  red:        "#C0392B",
  blue:       "#2563EB",

  // Hero gradient (login, headers)
  heroGrad:   "linear-gradient(135deg, #3D1A06 0%, #6B2D0E 40%, #A0481A 70%, #C87828 100%)",
};

export const FONT_DISPLAY = "'Cormorant Garamond', serif";
export const FONT_BODY    = "'Inter', 'Lato', sans-serif";
export const FONT_ACCENT  = "'Playfair Display', serif";

export const DEMO_USER = {
  name: "Guest User", email: "guest@kusina.app",
  avatar: null, initials: "GU", bio: "", location: "", joinedAt: Date.now(),
};

export const SAMPLE_RECIPES = [
  {
    id: "sample-1", title: "Tom Yum Goong", cuisine: "Thai", category: "Soup",
    prepTime: 20, cookTime: 15, servings: 4, spiceLevel: "Medium",
    image: "https://edube.org/uploads/media/default/0001/04/thai-soup.jpg",
    description: "A bold, aromatic Thai soup bursting with lemongrass, galangal, and succulent shrimp.",
    ingredients: ["Lemongrass – 2 stalks","Thai basil – 1 cup","Kaffir Lime Leaves – 3 leaves","Shrimp – 500g","Fish sauce – 1/4 cup","Lime juice – 2 tbsp","Chili paste – 1 tbsp","Galangal – 3 slices"],
    steps: [
      { instruction: "Bring 4 cups of broth to a gentle boil in a medium pot.", timer: 300 },
      { instruction: "Bruise lemongrass and galangal, add to broth with kaffir lime leaves. Simmer.", timer: 600 },
      { instruction: "Add shrimp and cook until they curl and turn pink.", timer: 240 },
      { instruction: "Season with fish sauce, lime juice, and chili paste.", timer: 0 },
      { instruction: "Garnish with Thai basil and chilies. Serve hot.", timer: 0 },
    ],
    notes: "Bruise lemongrass before adding — it releases the oils.",
    favorite: true, createdAt: Date.now() - 172800000,
  },
];

// ── BUTTON FACTORY ──
export const btn = (variant = "primary") => ({
  display: "inline-flex", alignItems: "center", gap: 7,
  padding: "0.6rem 1.25rem", borderRadius: 12, border: "none",
  cursor: "pointer", fontFamily: FONT_BODY, fontSize: "0.875rem",
  fontWeight: 600, letterSpacing: "0.01em",
  transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
  ...(variant === "primary" && {
    background: `linear-gradient(135deg, ${P.ember} 0%, ${P.emberLight} 100%)`,
    color: "#fff", boxShadow: `0 4px 16px rgba(212,84,26,0.32)`,
  }),
  ...(variant === "gold" && {
    background: `linear-gradient(135deg, ${P.gold} 0%, ${P.goldLight} 100%)`,
    color: "#fff", boxShadow: `0 4px 16px rgba(200,150,10,0.28)`,
  }),
  ...(variant === "rose" && {
    background: `linear-gradient(135deg, ${P.rose} 0%, ${P.roseLight} 100%)`,
    color: "#fff", boxShadow: `0 4px 16px rgba(200,80,106,0.28)`,
  }),
  ...(variant === "teal" && {
    background: `linear-gradient(135deg, ${P.teal} 0%, ${P.tealLight} 100%)`,
    color: "#fff", boxShadow: `0 4px 16px rgba(42,140,120,0.28)`,
  }),
  ...(variant === "ghost" && {
    background: "transparent", color: P.textSecond, border: `1.5px solid ${P.border}`,
  }),
  ...(variant === "glass" && {
    background: "rgba(255,255,255,0.65)", color: P.textPrimary,
    border: `1px solid rgba(255,255,255,0.8)`,
    backdropFilter: "blur(8px)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  }),
  ...(variant === "danger" && {
    background: "rgba(192,57,43,0.08)", color: P.red,
    border: `1.5px solid rgba(192,57,43,0.22)`,
  }),
  ...(variant === "dark" && {
    background: "rgba(255,255,255,0.15)", color: "#fff",
    border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(8px)",
  }),
  ...(variant === "saffron" && {
    background: `linear-gradient(135deg, ${P.gold}, ${P.goldLight})`,
    color: "#fff", boxShadow: `0 4px 16px rgba(200,150,10,0.28)`,
  }),
});

export const inp = {
  width: "100%", padding: "0.72rem 1rem",
  border: `1.5px solid ${P.border}`, borderRadius: 12,
  fontFamily: FONT_BODY, fontSize: "0.9rem",
  color: P.textPrimary, background: P.surface,
  outline: "none", boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

export const fieldLabel = {
  display: "block", fontSize: "0.7rem", fontWeight: 700,
  color: P.textThird, letterSpacing: "0.1em",
  textTransform: "uppercase", marginBottom: "0.45rem",
};

export const card = (elevated = false) => ({
  background: P.surface,
  border: `1px solid ${P.border}`,
  borderRadius: 16,
  boxShadow: elevated ? "0 8px 32px rgba(168,100,60,0.10)" : "0 2px 8px rgba(168,100,60,0.06)",
});