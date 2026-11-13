import { useCallback, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  CircleHelp,
  Cloud,
  Crosshair,
  Download,
  Layers3,
  LogOut,
  Map as MapIcon,
  MousePointer2,
  Plus,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { signOut } from "@firebase/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { auth } from "../firebase.js";
import MapCanvas from "./MapCanvas.jsx";

const PALETTE = [
  { name: "Orages", color: "#f59e0b" },
  { name: "Pluie", color: "#45b7e8" },
  { name: "Neige", color: "#c5a6ff" },
  { name: "Vent", color: "#35cf9b" },
  { name: "Risque", color: "#fa6687" },
];

const emptyCollection = { type: "FeatureCollection", features: [] };
const newId = () => globalThis.crypto?.randomUUID?.() ?? `zone-${Date.now()}`;

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
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const selectedFeature = features.find((feature) => feature.properties.id === selectedId);
  const nextZoneNumber = features.length + 1;
  const draft = useMemo(() => {
    if (!points.length) return emptyCollection;
    const draftFeatures = points.map((coordinates, index) => ({
      type: "Feature",
      properties: { id: `draft-point-${index}` },
      geometry: { type: "Point", coordinates },
    }));
    if (points.length > 1) {
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
  }, [points]);

  const handleMapClick = useCallback((coordinate) => {
    setPoints((previous) => [...previous, coordinate]);
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

  function startDrawing() {
    setPoints([]);
    setDrawing(true);
    setSelectedId(null);
    setFeatures((previous) =>
      previous.map((feature) => ({
        ...feature,
        properties: { ...feature.properties, selected: false },
      })),
    );
  }

  function finishDrawing() {
    if (points.length < 3) return;
    const number = String(nextZoneNumber).padStart(2, "0");
    const feature = {
      type: "Feature",
      id: newId(),
      properties: {
        id: newId(),
        name: `Zone ${number}`,
        category: PALETTE[0].name,
        color: PALETTE[0].color,
        validTime: "",
        selected: true,
      },
      geometry: { type: "Polygon", coordinates: [[...points, points[0]]] },
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
    setDrawing(false);
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
    setDrawing(false);
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
          <button className={`tool-button ${!drawing ? "tool-button-active" : ""}`} onClick={() => setDrawing(false)} title="Sélectionner">
            <MousePointer2 size={16} /><span>Sélection</span>
          </button>
          <span className="toolbar-separator" />
          <button className={`tool-button ${drawing ? "tool-button-active draw-active" : ""}`} onClick={startDrawing}>
            <Plus size={16} /><span>Dessiner un polygone</span>
          </button>
          {drawing && (
            <>
              <span className="toolbar-separator" />
              <button className="tool-button" onClick={undoPoint} disabled={!points.length} title="Annuler le dernier point">
                <Undo2 size={16} /><span>Annuler</span>
              </button>
              <button className="tool-button" onClick={clearDraft} title="Abandonner le dessin">
                <X size={16} /><span>Annuler le dessin</span>
              </button>
              <button className="button button-primary button-finish" onClick={finishDrawing} disabled={points.length < 3}>
                <Check size={15} /> Terminer <span className="point-count">{points.length}</span>
              </button>
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
            drawing={drawing}
            onMapClick={handleMapClick}
            onSelect={handleSelect}
          />
          <div className="map-info-pill"><MapIcon size={14} /> Fond de carte Liberty</div>
          {drawing && (
            <div className="draw-instruction">
              <Crosshair size={16} />
              <span>
                <strong>Dessin de polygone</strong>
                Cliquez sur la carte pour ajouter des sommets
              </span>
              <span className="draw-vertex-count">{points.length} points</span>
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
                      color: PALETTE.find((item) => item.name === category).color,
                    });
                  }}
                >
                  {PALETTE.map(({ name }) => <option key={name}>{name}</option>)}
                </select>
                <label className="field-label" htmlFor="zone-valid-time">Validité / période</label>
                <input
                  id="zone-valid-time"
                  className="property-input"
                  placeholder="Ex. 13 nov. · 18–21 UTC"
                  value={selectedFeature.properties.validTime}
                  onChange={(event) => updateSelected({ validTime: event.target.value })}
                />
                <div className="color-row">
                  {PALETTE.map(({ name, color }) => (
                    <button
                      key={name}
                      className={`color-swatch ${selectedFeature.properties.color === color ? "color-swatch-active" : ""}`}
                      style={{ "--zone-color": color }}
                      onClick={() => updateSelected({ color, category: name })}
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
