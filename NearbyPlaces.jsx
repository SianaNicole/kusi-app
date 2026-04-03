import { useState, useEffect, useRef } from "react";
import { P, FONT_DISPLAY, FONT_BODY, btn } from "../constants.js";
import Icon from "./Icon.jsx";

// ─────────────────────────────────────────────────────────────
//  NearbyPlaces.jsx — Embedded map using Leaflet + OpenStreetMap
//  No Google Maps redirect needed — routes drawn inside the app
// ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id:"restaurant", label:"Restaurants", emoji:"🍽️", amenity:"restaurant" },
  { id:"cafe",       label:"Cafés",       emoji:"☕", amenity:"cafe"        },
  { id:"fastfood",   label:"Fast Food",   emoji:"🍔", amenity:"fast_food"   },
  { id:"bakery",     label:"Bakeries",    emoji:"🥐", amenity:"bakery"      },
];
const CAT_COLOR = { restaurant:P.ember, cafe:"#7B5EA7", fastfood:P.gold, bakery:"#C2663A" };
const TRAVEL_MODES = [
  { id:"walk",    label:"Walk",    emoji:"🚶", profile:"foot-walking"   },
  { id:"bike",    label:"Bike",    emoji:"🚲", profile:"cycling-regular" },
  { id:"drive",   label:"Drive",   emoji:"🚗", profile:"driving-car"    },
];

function haversine(lat1,lon1,lat2,lon2) {
  const R=6371, dL=((lat2-lat1)*Math.PI)/180, dl=((lon2-lon1)*Math.PI)/180;
  const a=Math.sin(dL/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dl/2)**2;
  return parseFloat((R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(2));
}

export default function NearbyPlaces({ onBack }) {
  const [status,   setStatus]   = useState("idle");
  const [coords,   setCoords]   = useState(null);
  const [category, setCategory] = useState("restaurant");
  const [places,   setPlaces]   = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(null);
  const [route,    setRoute]    = useState(null);
  const [travelMode, setTravelMode] = useState("walk");
  const [routeLoading, setRouteLoading] = useState(false);
  const [error,    setError]    = useState("");
  const mapRef      = useRef(null);
  const leafletMap  = useRef(null);
  const markersRef  = useRef([]);
  const routeLayer  = useRef(null);
  const userMarker  = useRef(null);

  // ── Load Leaflet CSS once ──
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const l = document.createElement("link");
      l.id="leaflet-css"; l.rel="stylesheet";
      l.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(l);
    }
  }, []);

  // ── Init Leaflet map when coords ready ──
  useEffect(() => {
    if (!coords || !mapRef.current) return;
    if (leafletMap.current) return; // already init

    const init = async () => {
      const L = await import("https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js");
      leafletMap.current = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView([coords.lat, coords.lng], 15);

      // Dark tile layer
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 19,
      }).addTo(leafletMap.current);

      // User location marker
      const userIcon = L.divIcon({ html:`<div style="width:16px;height:16px;background:${P.ember};border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(232,130,74,0.6)"></div>`, className:"", iconSize:[16,16], iconAnchor:[8,8] });
      userMarker.current = L.marker([coords.lat, coords.lng], { icon: userIcon })
        .addTo(leafletMap.current)
        .bindPopup("<b style='font-family:Inter;font-size:12px'>📍 You are here</b>");
    };
    init();
  }, [coords]);

  // ── Update place markers when places change ──
  useEffect(() => {
    if (!leafletMap.current || !places.length) return;
    const addMarkers = async () => {
      const L = await import("https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js");
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      const color = CAT_COLOR[category] || P.ember;
      places.forEach((place, i) => {
        if (!place.lat || !place.lng) return;
        const icon = L.divIcon({
          html: `<div style="width:26px;height:26px;background:${color};border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:pointer">${i+1}</div>`,
          className:"", iconSize:[26,26], iconAnchor:[13,13],
        });
        const m = L.marker([place.lat, place.lng], { icon })
          .addTo(leafletMap.current)
          .bindPopup(`<div style="font-family:Inter;min-width:150px"><b style="font-size:13px">${place.name}</b><br/><span style="font-size:11px;color:#888">${place.address||""}</span>${place.dist?`<br/><span style="font-size:11px;color:${color}">📍 ${place.dist} km</span>`:""}</div>`)
          .on("click", () => setSelected(place));
        markersRef.current.push(m);
      });
    };
    addMarkers();
  }, [places, category]);

  // ── Draw route when selected + mode changes ──
  useEffect(() => {
    if (!selected || !coords || !leafletMap.current) return;
    drawRoute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, travelMode]);

  const drawRoute = async () => {
    if (!selected || !coords) return;
    setRouteLoading(true);
    setRoute(null);
    try {
      const L = await import("https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js");
      const mode = TRAVEL_MODES.find(t=>t.id===travelMode);
      // OpenRouteService free API — no key needed for basic use
      const res = await fetch(
        `https://api.openrouteservice.org/v2/directions/${mode.profile}?api_key=5b3ce3597851110001cf6248a7e97e9b0b374c7fbd3e5e7be02c3e79&start=${coords.lng},${coords.lat}&end=${selected.lng},${selected.lat}`
      );
      if (!res.ok) throw new Error("route failed");
      const data = await res.json();
      const coords2 = data.features[0].geometry.coordinates.map(c=>[c[1],c[0]]);
      const summary = data.features[0].properties.summary;

      if (routeLayer.current) routeLayer.current.remove();
      routeLayer.current = L.polyline(coords2, { color:P.ember, weight:4, opacity:0.85, dashArray:"8,4" }).addTo(leafletMap.current);

      const bounds = L.latLngBounds([[coords.lat,coords.lng],[selected.lat,selected.lng]]);
      leafletMap.current.fitBounds(bounds, { padding:[60,60] });

      setRoute({
        distance: (summary.distance / 1000).toFixed(1),
        duration: Math.round(summary.duration / 60),
      });
    } catch {
      // Fallback: draw straight dashed line
      const L = await import("https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js");
      if (routeLayer.current) routeLayer.current.remove();
      routeLayer.current = L.polyline([[coords.lat,coords.lng],[selected.lat,selected.lng]], { color:P.gold, weight:3, opacity:0.6, dashArray:"6,6" }).addTo(leafletMap.current);
      const dist = haversine(coords.lat, coords.lng, selected.lat, selected.lng);
      setRoute({ distance: dist, duration: null, approximate: true });
    }
    setRouteLoading(false);
  };

  const getLocation = () => {
    setStatus("locating"); setError("");
    if (!navigator.geolocation) { setError("Geolocation not supported."); setStatus("error"); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat:pos.coords.latitude, lng:pos.coords.longitude }); setStatus("ready"); },
      () => { setError("Could not get your location. Please allow location access."); setStatus("error"); },
      { timeout:12000 }
    );
  };

  useEffect(() => { if (coords) fetchPlaces(coords, category); }, [coords, category]);

  const fetchPlaces = async ({ lat, lng }, cat) => {
    setLoading(true); setPlaces([]); setSelected(null); setRoute(null);
    if (routeLayer.current) { routeLayer.current.remove(); routeLayer.current = null; }
    const amenity = CATEGORIES.find(c=>c.id===cat)?.amenity || cat;
    const query = `[out:json][timeout:20];(node["amenity"="${amenity}"](around:3000,${lat},${lng});way["amenity"="${amenity}"](around:3000,${lat},${lng}););out center 25;`;
    try {
      const res  = await fetch("https://overpass-api.de/api/interpreter",{ method:"POST", body:"data="+encodeURIComponent(query) });
      const data = await res.json();
      const results = (data.elements||[]).map(el=>{
        const eLat=el.lat??el.center?.lat, eLng=el.lon??el.center?.lon;
        return { id:el.id, name:el.tags?.name||"Unnamed Place", address:[el.tags?.["addr:street"],el.tags?.["addr:housenumber"],el.tags?.["addr:city"]].filter(Boolean).join(", ")||"Address unavailable", phone:el.tags?.phone||null, hours:el.tags?.opening_hours||null, cuisine:el.tags?.cuisine||null, lat:eLat, lng:eLng, dist:eLat&&eLng?haversine(lat,lng,eLat,eLng):null };
      }).filter(p=>p.lat&&p.lng).sort((a,b)=>(a.dist??99)-(b.dist??99));
      setPlaces(results);
    } catch { setError("Could not load nearby places."); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"1.5rem 1.5rem 0", fontFamily:FONT_BODY }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:"1.25rem" }}>
        <button style={{ ...btn("ghost"), padding:"0.5rem 0.8rem" }} onClick={onBack}><Icon name="back" size={16} color={P.textSecond}/></button>
        <div>
          <h2 style={{ fontFamily:FONT_DISPLAY, fontSize:"1.8rem", color:P.textPrimary, margin:0 }}>Nearby Places</h2>
          <p style={{ color:P.textSecond, fontSize:"0.8rem", margin:0 }}>Find restaurants, cafés & more — routes shown inside the app</p>
        </div>
      </div>

      {/* IDLE */}
      {status==="idle" && (
        <div style={{ textAlign:"center", padding:"4rem 2rem", background:P.surface, border:`1px solid ${P.border}`, borderRadius:20 }}>
          <div style={{ fontSize:"4rem", marginBottom:"1rem" }}>📍</div>
          <h3 style={{ fontFamily:FONT_DISPLAY, fontSize:"1.5rem", color:P.textPrimary, marginBottom:"0.75rem" }}>Discover Places Near You</h3>
          <p style={{ color:P.textSecond, fontSize:"0.9rem", lineHeight:1.7, maxWidth:380, margin:"0 auto 2rem" }}>
            Enable location to find nearby dining spots — with walking, cycling, and driving routes shown directly in Kusina.
          </p>
          <button style={{ ...btn("primary"), padding:"0.85rem 2.5rem", fontSize:"1rem" }} onClick={getLocation}>
            <Icon name="pin" size={16} color="#fff"/> Enable Location
          </button>
        </div>
      )}

      {status==="locating" && (
        <div style={{ textAlign:"center", padding:"4rem", color:P.textSecond }}>
          <div style={{ width:40, height:40, borderRadius:"50%", border:`3px solid ${P.border}`, borderTopColor:P.ember, animation:"spin 0.8s linear infinite", margin:"0 auto 1rem" }}/>
          <p>Getting your location...</p>
        </div>
      )}

      {status==="error" && (
        <div style={{ textAlign:"center", padding:"3rem 2rem", background:"rgba(224,92,92,0.08)", border:`1px solid rgba(224,92,92,0.2)`, borderRadius:16 }}>
          <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>⚠️</div>
          <p style={{ color:P.red, fontWeight:600, marginBottom:"1rem" }}>{error}</p>
          <button style={btn("primary")} onClick={getLocation}>Try Again</button>
        </div>
      )}

      {status==="ready" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:"1.25rem", alignItems:"start" }}>

          {/* Left — map + categories */}
          <div>
            {/* Category tabs */}
            <div style={{ display:"flex", gap:8, marginBottom:"1rem", flexWrap:"wrap" }}>
              {CATEGORIES.map(c=>(
                <button key={c.id} onClick={()=>setCategory(c.id)}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"0.5rem 1.1rem", borderRadius:10, border:`1.5px solid ${category===c.id?CAT_COLOR[c.id]:P.border}`, background:category===c.id?CAT_COLOR[c.id]:"transparent", color:category===c.id?"#fff":P.textSecond, cursor:"pointer", fontFamily:FONT_BODY, fontSize:"0.83rem", fontWeight:600, transition:"all 0.15s" }}>
                  <span>{c.emoji}</span>{c.label}
                </button>
              ))}
              <button style={{ ...btn("ghost"), marginLeft:"auto", padding:"0.5rem 0.8rem", fontSize:"0.8rem" }} onClick={()=>{ setSelected(null); setRoute(null); if(routeLayer.current){routeLayer.current.remove();routeLayer.current=null;} if(leafletMap.current)leafletMap.current.setView([coords.lat,coords.lng],15); }}>
                Reset Map
              </button>
            </div>

            {/* Map */}
            <div style={{ position:"relative", borderRadius:16, overflow:"hidden", border:`1px solid ${P.border}`, marginBottom:"0.75rem" }}>
              <div ref={mapRef} style={{ height:420, width:"100%", background:P.bgAlt }}/>
              {loading && (
                <div style={{ position:"absolute", inset:0, background:"rgba(15,15,20,0.6)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", border:`3px solid ${P.border}`, borderTopColor:P.ember, animation:"spin 0.8s linear infinite" }}/>
                  <span style={{ color:P.textSecond, fontSize:"0.85rem" }}>Searching nearby...</span>
                </div>
              )}
            </div>

            {/* Route info bar */}
            {selected && (
              <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:12, padding:"0.9rem 1.25rem", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"0.88rem", fontWeight:600, color:P.textPrimary, marginBottom:2 }}>Route to {selected.name}</div>
                  {routeLoading && <div style={{ fontSize:"0.75rem", color:P.textThird, animation:"pulse 1.2s ease infinite" }}>Calculating route...</div>}
                  {route && !routeLoading && (
                    <div style={{ fontSize:"0.78rem", color:P.textSecond, display:"flex", gap:12 }}>
                      <span>📏 {route.distance} km</span>
                      {route.duration && <span>⏱ ~{route.duration} min</span>}
                      {route.approximate && <span style={{ color:P.gold }}>· Approximate straight-line</span>}
                    </div>
                  )}
                </div>
                {/* Travel mode selector */}
                <div style={{ display:"flex", gap:6 }}>
                  {TRAVEL_MODES.map(m=>(
                    <button key={m.id} onClick={()=>setTravelMode(m.id)}
                      style={{ ...btn(travelMode===m.id?"primary":"ghost"), padding:"0.4rem 0.7rem", fontSize:"0.8rem" }}>
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — place list */}
          <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:16, overflow:"hidden" }}>
            <div style={{ padding:"0.9rem 1.25rem", borderBottom:`1px solid ${P.border}` }}>
              <span style={{ fontFamily:FONT_DISPLAY, fontSize:"1rem", color:P.textPrimary }}>{loading?"Searching...":places.length > 0 ? `${places.length} places found` : "No results"}</span>
            </div>
            <div style={{ maxHeight:480, overflowY:"auto" }}>
              {places.length===0 && !loading && (
                <div style={{ padding:"2rem", textAlign:"center", color:P.textThird, fontSize:"0.85rem" }}>
                  No {category} found within 3km.<br/>Try a different category.
                </div>
              )}
              {places.map((place,i)=>{
                const isSel = selected?.id===place.id;
                return (
                  <div key={place.id}
                    onClick={()=>{ setSelected(isSel?null:place); if(isSel&&routeLayer.current){routeLayer.current.remove();routeLayer.current=null;setRoute(null);} }}
                    style={{ padding:"0.85rem 1.25rem", borderBottom:`1px solid ${P.border}`, cursor:"pointer", background:isSel?`rgba(232,130,74,0.08)`:"transparent", borderLeft:`3px solid ${isSel?P.ember:"transparent"}`, transition:"all 0.15s" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:`rgba(232,130,74,0.12)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", fontWeight:700, color:P.ember, flexShrink:0 }}>{i+1}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"0.88rem", fontWeight:600, color:P.textPrimary, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", marginBottom:2 }}>{place.name}</div>
                        <div style={{ fontSize:"0.72rem", color:P.textThird, marginBottom:3, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{place.address}</div>
                        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                          {place.dist!==null&&<span style={{ fontSize:"0.7rem", color:P.ember, fontWeight:600 }}>📍 {place.dist}km</span>}
                          {place.hours&&<span style={{ fontSize:"0.7rem", color:P.green }}>🕐 Open</span>}
                          {place.cuisine&&<span style={{ fontSize:"0.7rem", color:P.textThird }}>🍴 {place.cuisine.replace(/_/g," ")}</span>}
                        </div>
                        {isSel && (
                          <div style={{ marginTop:8, display:"flex", gap:6 }}>
                            <span style={{ fontSize:"0.72rem", color:P.ember, fontWeight:600 }}>
                              👆 Select travel mode above to get directions
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}