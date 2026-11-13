import { useEffect, useRef } from "react";
import { AttributionControl, Map, NavigationControl } from "maplibre-gl";

const EMPTY_COLLECTION = { type: "FeatureCollection", features: [] };

const QUEBEC_PLACES = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Montréal", kind: "city" },
      geometry: { type: "Point", coordinates: [-73.5673, 45.5019] },
    },
    {
      type: "Feature",
      properties: { name: "Québec", kind: "city" },
      geometry: { type: "Point", coordinates: [-71.208, 46.8139] },
    },
    {
      type: "Feature",
      properties: { name: "QUÉBEC", kind: "province" },
      geometry: { type: "Point", coordinates: [-71.8, 49.2] },
    },
  ],
};

export default function MapCanvas({
  features = [],
  draft = EMPTY_COLLECTION,
  drawing = false,
  onMapClick = () => {},
  onSelect = () => {},
  preview = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const handlersRef = useRef({ onMapClick, onSelect, drawing });
  const dataRef = useRef({ features, draft });

  useEffect(() => {
    handlersRef.current = { onMapClick, onSelect, drawing };
  }, [onMapClick, onSelect, drawing]);

  useEffect(() => {
    dataRef.current = { features, draft };
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const zonesSource = map.getSource("zones");
    const draftSource = map.getSource("draft");
    zonesSource?.setData({ type: "FeatureCollection", features });
    draftSource?.setData(draft ?? EMPTY_COLLECTION);
  }, [features, draft]);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const map = new Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: [-72.6, 47.1],
      zoom: preview ? 4.8 : 5.2,
      minZoom: 2,
      maxZoom: 18,
      doubleClickZoom: false,
      attributionControl: false,
    });
    mapRef.current = map;
    if (!preview) {
      map.addControl(new NavigationControl({ showCompass: true }), "top-right");
    }
    map.addControl(
      new AttributionControl({ compact: true }),
      "bottom-right",
    );

    map.on("load", () => {
      const paint = (layerId, property, value) => {
        if (map.getLayer(layerId)) map.setPaintProperty(layerId, property, value);
      };

      paint("background", "background-color", "#cfc8ba");
      paint("water", "fill-color", "#dce7eb");
      paint("waterway", "line-color", "#b8d0d8");
      paint("park", "fill-color", "#ddd7ca");
      paint("landuse_residential", "fill-color", "#f0eadf");
      paint("landcover_wood", "fill-color", "#d8d1c3");
      paint("boundary_2", "line-color", "#827767");
      paint("boundary_2", "line-width", [
        "interpolate",
        ["linear"],
        ["zoom"],
        3,
        1,
        5,
        1.4,
        12,
        2.5,
      ]);
      paint("boundary_3", "line-color", "#a49a89");
      paint("boundary_3", "line-width", [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        0.7,
        10,
        1.5,
      ]);
      if (map.getLayer("boundary_3")) {
        map.setFilter("boundary_3", [
          "all",
          ["==", ["typeof", ["get", "admin_level"]], "number"],
          [">=", ["get", "admin_level"], 3],
          ["<=", ["get", "admin_level"], 4],
          ["!=", ["get", "maritime"], 1],
          ["!=", ["get", "disputed"], 1],
          ["!", ["has", "claimed_by"]],
        ]);
        map.setLayerZoomRange("boundary_3", 4.5, 24);
      }

      map.addSource("quebec-places", {
        type: "geojson",
        data: QUEBEC_PLACES,
      });
      map.addSource("zones", {
        type: "geojson",
        data: { type: "FeatureCollection", features: dataRef.current.features },
      });
      map.addSource("draft", {
        type: "geojson",
        data: dataRef.current.draft ?? EMPTY_COLLECTION,
      });
      map.addLayer({
        id: "zone-fills",
        type: "fill",
        source: "zones",
        paint: {
          "fill-color": ["coalesce", ["get", "color"], "#f59e0b"],
          "fill-opacity": 0.22,
        },
      });
      map.addLayer({
        id: "zone-outlines",
        type: "line",
        source: "zones",
        paint: {
          "line-color": ["coalesce", ["get", "color"], "#f59e0b"],
          "line-width": ["case", ["get", "selected"], 3.5, 2],
          "line-dasharray": [2, 1],
        },
      });
      map.addLayer({
        id: "zone-labels",
        type: "symbol",
        source: "zones",
        layout: {
          "text-field": ["coalesce", ["get", "name"], "Zone"],
          "text-size": 11,
          "text-font": ["Open Sans Semibold"],
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": ["coalesce", ["get", "color"], "#f59e0b"],
          "text-halo-color": "#101923",
          "text-halo-width": 1.5,
        },
      });
      map.addLayer({
        id: "draft-fill",
        type: "fill",
        source: "draft",
        paint: { "fill-color": "#f59e0b", "fill-opacity": 0.15 },
      });
      map.addLayer({
        id: "draft-outline",
        type: "line",
        source: "draft",
        paint: { "line-color": "#f59e0b", "line-width": 2.5, "line-dasharray": [2, 1] },
      });
      map.addLayer({
        id: "draft-points",
        type: "circle",
        source: "draft",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": 5,
          "circle-color": "#f59e0b",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });
      map.addLayer({
        id: "quebec-city-markers",
        type: "circle",
        source: "quebec-places",
        filter: ["==", ["get", "kind"], "city"],
        paint: {
          "circle-radius": 5,
          "circle-color": "#cc6550",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });
      map.addLayer({
        id: "quebec-place-labels",
        type: "symbol",
        source: "quebec-places",
        filter: ["==", ["get", "kind"], "city"],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 12,
          "text-offset": [0.7, 0],
          "text-anchor": "left",
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#433d34",
          "text-halo-color": "#f4efe6",
          "text-halo-width": 2,
        },
      });
      map.addLayer({
        id: "quebec-province-label",
        type: "symbol",
        source: "quebec-places",
        filter: ["==", ["get", "kind"], "province"],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 14,
          "text-letter-spacing": 0.18,
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#766d60",
          "text-halo-color": "#cfc8ba",
          "text-halo-width": 1,
        },
      });
    });

    map.on("click", (event) => {
      if (preview) return;
      const { drawing: isDrawing, onMapClick: handleMapClick, onSelect: handleSelect } = handlersRef.current;
      if (isDrawing) {
        handleMapClick([event.lngLat.lng, event.lngLat.lat]);
        return;
      }
      const hit = map.queryRenderedFeatures(event.point, { layers: ["zone-fills"] })[0];
      handleSelect(hit?.properties?.id ?? null);
    });

    map.on("mousemove", (event) => {
      if (preview) return;
      const isDrawing = handlersRef.current.drawing;
      map.getCanvas().style.cursor = isDrawing
        ? "crosshair"
        : map.queryRenderedFeatures(event.point, { layers: ["zone-fills"] }).length
          ? "pointer"
          : "";
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [preview]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;
    const resize = () => map.resize();
    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return <div className="map-canvas" ref={containerRef} />;
}
