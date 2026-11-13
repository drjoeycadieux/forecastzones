import { useCallback, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  Check,
  Circle,
  ChevronDown,
  CircleHelp,
  Cloud,
  Crosshair,
  Download,
  Layers3,
  LogOut,
  Map as MapIcon,
  MousePointer2,
  Pencil,
  Plus,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { signOut } from "@firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { auth } from "../firebase.js";
import { getSnowfallColor, WEATHER_CATEGORIES } from "../constants/weather.js";
import MapCanvas from "./LeafletMap.jsx";
import MapLegend from "./MapLegend.jsx";

const emptyCollection = { type: "FeatureCollection", features: [] };
const newId = () => globalThis.crypto?.randomUUID?.() ?? `zone-${Date.now()}`;

function getCategoryColor(category, snowfallCm) {
  const defaultColor = WEATHER_CATEGORIES.find((item) => item.name === category).color;
  return category === "Neige"
    ? getSnowfallColor(snowfallCm) ?? defaultColor
    : defaultColor;
}

function downloadGeoJSON(features) {
  const blob = new Blob(
    [JSON.stringify({ type: "FeatureCollection", features }, null, 2)],
    { type: "application/geo+json" },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `forecastzones-${new Date().toISOString().slice(0, 10)}.geojson`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function EditorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [features, setFeatures] = useState([]);
  const [drawMode, setDrawMode] = useState(null);
  const [points, setPoints] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const drawing = drawMode !== null;
  const selectedFeature = features.find((feature) => feature.properties.id === selectedId);
  const nextZoneNumber = features.length + 1;
  const draft = useMemo(() => {
    if (!points.length) return emptyCollection;
    const draftFeatures = drawMode === "polygon"
      ? points.map((coordinates, index) => ({
          type: "Feature",
          properties: { id: `draft-point-${index}` },
          geometry: { type: "Point", coordinates },
        }))
      : [];
    if (points.length > 1 && points.length < 3) {
      draftFeatures.push({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: points },
      });
    }
    if (points.length >= 3) {
      draftFeatures.push({
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [[...points, points[0]]] },
      });
    }
    return { type: "FeatureCollection", features: draftFeatures };
  }, [points, drawMode]);

  const handleMapClick = useCallback((coordinate) => {
    setPoints((previous) => [...previous, coordinate]);
  }, []);

  const handleStrokeChange = useCallback((coordinates) => {
    setPoints(coordinates);
  }, []);

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
    setFeatures((previous) =>
      previous.map((feature) => ({
        ...feature,
        properties: { ...feature.properties, selected: feature.properties.id === id },
      })),
    );
  }, []);

  function startDrawing(mode = "polygon") {
    setPoints([]);
    setDrawMode(mode);
    setSelectedId(null);
    setFeatures((previous) =>
      previous.map((feature) => ({
        ...feature,
        properties: { ...feature.properties, selected: false },
      })),
    );
  }

  function finishDrawing(coordinates = points) {
    if (coordinates.length < 3) return;
    const number = String(nextZoneNumber).padStart(2, "0");
    const feature = {
      type: "Feature",
      id: newId(),
      properties: {
        id: newId(),
        name: `Zone ${number}`,
        category: WEATHER_CATEGORIES[0].name,
        color: WEATHER_CATEGORIES[0].color,
        snowfallCm: "",
        validTime: "",
        selected: true,
      },
      geometry: { type: "Polygon", coordinates: [[...coordinates, coordinates[0]]] },
    };
    setFeatures((previous) => [
      ...previous.map((item) => ({
        ...item,
        properties: { ...item.properties, selected: false },
      })),
      feature,
    ]);
    setSelectedId(feature.properties.id);
    setPoints([]);
    setDrawMode(null);
  }

  function finishStroke(coordinates) {
    if (coordinates.length < 3) {
      setPoints([]);
      return;
    }
    finishDrawing(coordinates);
  }

  function updateSelected(changes) {
    setFeatures((previous) =>
      previous.map((feature) =>
        feature.properties.id === selectedId
          ? { ...feature, properties: { ...feature.properties, ...changes } }
          : feature,
      ),
    );
  }

  function deleteSelected() {
    setFeatures((previous) => previous.filter((feature) => feature.properties.id !== selectedId));
    setSelectedId(null);
  }

  function undoPoint() {
    setPoints((previous) => previous.slice(0, -1));
  }

  function clearDraft() {
    setPoints([]);
    setDrawMode(null);
  }

  async function handleSignOut() {
    await signOut(auth);
    navigate("/", { replace: true });
  }

  return (
    <main className="editor-shell">
      <header className="editor-header">
        <div className="editor-brand">
          <span className="brand-mark"><Cloud size={17} /></span>
          <span className="editor-brand-name">forecast<span className="brand-accent">zones</span></span>
          <span className="header-divider" />
          <span className="workspace-label">ÉDITEUR MÉTÉO</span>
        </div>
        <div className="header-user">
          <span className="user-avatar">{user?.email?.[0]?.toUpperCase() ?? "U"}</span>
          <span className="user-email">{user?.email}</span>
          <button className="icon-button" onClick={handleSignOut} title="Se déconnecter" aria-label="Se déconnecter">
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <div className="editor-toolbar">
        <div className="toolbar-group">
          <button className={`tool-button ${!drawing ? "tool-button-active" : ""}`} onClick={() => setDrawMode(null)} title="Sélectionner">
            <MousePointer2 size={16} /><span>Sélection</span>
          </button>
          <span className="toolbar-separator" />
          <button className={`tool-button ${drawMode === "polygon" ? "tool-button-active draw-active" : ""}`} onClick={() => startDrawing("polygon")}>
            <Plus size={16} /><span>Polygone</span>
          </button>
          <button className={`tool-button ${drawMode === "freehand" ? "tool-button-active draw-active" : ""}`} onClick={() => startDrawing("freehand")} title="Maintenir le clic et dessiner à main levée">
            <Pencil size={15} /><span>Crayon</span>
          </button>
          <button className={`tool-button ${drawMode === "circle" ? "tool-button-active draw-active" : ""}`} onClick={() => startDrawing("circle")} title="Maintenir le clic et tirer pour dessiner un cercle">
            <Circle size={15} /><span>Cercle</span>
          </button>
          {drawing && (
            <>
              <span className="toolbar-separator" />
              {drawMode === "polygon" && (
                <button className="tool-button" onClick={undoPoint} disabled={!points.length} title="Annuler le dernier point">
                  <Undo2 size={16} /><span>Annuler</span>
                </button>
              )}
              <button className="tool-button" onClick={clearDraft} title="Abandonner le dessin">
                <X size={16} /><span>Annuler le dessin</span>
              </button>
              {drawMode === "polygon" && (
                <button className="button button-primary button-finish" onClick={finishDrawing} disabled={points.length < 3}>
                  <Check size={15} /> Terminer <span className="point-count">{points.length}</span>
                </button>
              )}
            </>
          )}
        </div>
        <div className="toolbar-group toolbar-right">
          <span className="map-status"><span className="status-dot" /> CARTE EN DIRECT</span>
          <button
            className="tool-button export-button"
            onClick={() => downloadGeoJSON(features)}
            disabled={!features.length}
            title="Exporter les perspectives en GeoJSON"
          >
            <Download size={16} /><span>Exporter</span>
          </button>
          <button className="icon-button sidebar-toggle" onClick={() => setSidebarOpen((open) => !open)} title="Afficher ou masquer le panneau">
            <Layers3 size={17} />
          </button>
        </div>
      </div>

      <div className="editor-body">
        <div className="map-area">
          <MapCanvas
            features={features}
            draft={draft}
            drawMode={drawMode}
            onMapClick={handleMapClick}
            onStrokeChange={handleStrokeChange}
            onStrokeEnd={finishStroke}
            onSelect={handleSelect}
          />
          <div className="map-info-pill"><MapIcon size={14} /> Carte OpenStreetMap</div>
          <MapLegend />
          {drawing && (
            <div className="draw-instruction">
              <Crosshair size={16} />
              <span>
                <strong>
                  {drawMode === "polygon"
                    ? "Dessin de polygone"
                    : drawMode === "freehand"
                      ? "Crayon à main levée"
                      : "Dessin de cercle"}
                </strong>
                {drawMode === "polygon"
                  ? "Cliquez sur la carte pour ajouter des sommets"
                  : drawMode === "freehand"
                    ? "Maintenez le clic et dessinez votre forme"
                    : "Maintenez le clic et tirez pour définir le rayon"}
              </span>
              <span className="draw-vertex-count">
                {drawMode === "circle" ? "Relâchez pour terminer" : `${points.length} points`}
              </span>
            </div>
          )}
          {!sidebarOpen && (
            <button className="open-sidebar" onClick={() => setSidebarOpen(true)}>
              <Layers3 size={16} /> Zones <span>{features.length}</span>
            </button>
          )}
        </div>

        {sidebarOpen && (
          <aside className="editor-sidebar">
            <div className="sidebar-heading">
              <div>
                <span className="eyebrow">ESPACE DE TRAVAIL</span>
                <h2>Perspectives</h2>
              </div>
              <button className="icon-button" onClick={() => setSidebarOpen(false)} aria-label="Fermer le panneau">
                <X size={17} />
              </button>
            </div>

            <button className="new-zone-button" onClick={startDrawing} disabled={drawing}>
              <Plus size={16} /> Nouvelle zone <span>+</span>
            </button>

            <div className="zone-section-head">
              <span>OBJETS DE LA CARTE</span><span className="object-count">{features.length}</span>
            </div>

            <div className="zone-list">
              {features.length === 0 ? (
                <div className="empty-zones">
                  <div className="empty-map-icon"><MapIcon size={22} /></div>
                  <strong>Aucune zone pour le moment</strong>
                  <p>Commencez par dessiner un polygone sur la carte.</p>
                  <button onClick={startDrawing}><Plus size={14} /> Créer une zone</button>
                </div>
              ) : (
                features.map((feature) => {
                  const { id, name, category, color, selected } = feature.properties;
                  return (
                    <button
                      className={`zone-row ${selected ? "zone-row-selected" : ""}`}
                      key={id}
                      onClick={() => handleSelect(id)}
                    >
                      <span className="zone-swatch" style={{ "--zone-color": color }} />
                      <span className="zone-row-copy">
                        <strong>{name}</strong><span>{category}</span>
                      </span>
                      <ChevronDown size={14} className={selected ? "zone-chevron-open" : ""} />
                    </button>
                  );
                })
              )}
            </div>

            {selectedFeature && (
              <div className="properties-panel">
                <div className="properties-heading">
                  <div><span className="eyebrow">PROPRIÉTÉS</span><strong>Zone sélectionnée</strong></div>
                  <button className="icon-button delete-zone" onClick={deleteSelected} aria-label="Supprimer la zone" title="Supprimer la zone">
                    <Trash2 size={15} />
                  </button>
                </div>
                <label className="field-label" htmlFor="zone-name">Nom</label>
                <input
                  id="zone-name"
                  className="property-input"
                  value={selectedFeature.properties.name}
                  onChange={(event) => updateSelected({ name: event.target.value })}
                />
                <label className="field-label" htmlFor="zone-category">Catégorie PGEN</label>
                <select
                  id="zone-category"
                  className="property-input property-select"
                  value={selectedFeature.properties.category}
                  onChange={(event) => {
                    const category = event.target.value;
                    updateSelected({
                      category,
                      color: getCategoryColor(
                        category,
                        selectedFeature.properties.snowfallCm,
                      ),
                    });
                  }}
                >
                  {WEATHER_CATEGORIES.map(({ name }) => <option key={name}>{name}</option>)}
                </select>
                {selectedFeature.properties.category === "Neige" && (
                  <>
                    <label className="field-label" htmlFor="zone-snowfall">
                      Accumulation de neige
                    </label>
                    <div className="unit-input-wrap">
                      <input
                        id="zone-snowfall"
                        className="property-input"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Ex. 8"
                        value={selectedFeature.properties.snowfallCm}
                        onChange={(event) => {
                          const snowfallCm = event.target.value;
                          updateSelected({
                            snowfallCm,
                            color: getCategoryColor("Neige", snowfallCm),
                          });
                        }}
                      />
                      <span>cm</span>
                    </div>
                    <p className="field-hint">La couleur suit la tranche indiquée dans la légende.</p>
                  </>
                )}
                <label className="field-label" htmlFor="zone-valid-time">Validité / période</label>
                <input
                  id="zone-valid-time"
                  className="property-input"
                  placeholder="Ex. 13 nov. · 18–21 UTC"
                  value={selectedFeature.properties.validTime}
                  onChange={(event) => updateSelected({ validTime: event.target.value })}
                />
                <div className="color-row">
                  {WEATHER_CATEGORIES.map(({ name, color }) => (
                    <button
                      key={name}
                      className={`color-swatch ${selectedFeature.properties.color === color ? "color-swatch-active" : ""}`}
                      style={{ "--zone-color": color }}
                      onClick={() =>
                        updateSelected({
                          color: getCategoryColor(
                            name,
                            selectedFeature.properties.snowfallCm,
                          ),
                          category: name,
                        })
                      }
                      aria-label={`Couleur ${name}`}
                      title={name}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="sidebar-bottom">
              <div className="export-hint"><ArrowDownToLine size={15} /><span>Exportez les zones en GeoJSON pour les utiliser ailleurs.</span></div>
              <button className="sidebar-export" onClick={() => downloadGeoJSON(features)} disabled={!features.length}>
                <Download size={15} /> Exporter GeoJSON
              </button>
            </div>
          </aside>
        )}
      </div>

      <footer className="editor-statusbar">
        <span><span className="status-dot" /> PRÊT</span>
        <span>{drawing ? "DESSIN EN COURS" : "SÉLECTION"}</span>
        <span>{features.length} {features.length > 1 ? "zones" : "zone"}</span>
        <span className="statusbar-right"><CircleHelp size={13} /> {drawing ? "Cliquez pour ajouter des points · 3 minimum pour fermer" : "Sélectionnez une zone pour modifier ses propriétés"}</span>
        <span>ForecastZones</span>
      </footer>
    </main>
  );
}
