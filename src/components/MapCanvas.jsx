import { useEffect, useRef } from "react";
import { AttributionControl, Map, NavigationControl } from "maplibre-gl";

const EMPTY_COLLECTION = { type: "FeatureCollection", features: [] };

export default function MapCanvas({ features, draft, drawing, onMapClick, onSelect }) {
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
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [-72.8, 46.2],
      zoom: 6.8,
      minZoom: 2,
      maxZoom: 18,
      doubleClickZoom: false,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: true }), "top-right");
    map.addControl(
      new AttributionControl({ compact: true }),
      "bottom-right",
    );

    map.on("load", () => {
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
    });

    map.on("click", (event) => {
      const { drawing: isDrawing, onMapClick: handleMapClick, onSelect: handleSelect } = handlersRef.current;
      if (isDrawing) {
        handleMapClick([event.lngLat.lng, event.lngLat.lat]);
        return;
      }
      const hit = map.queryRenderedFeatures(event.point, { layers: ["zone-fills"] })[0];
      handleSelect(hit?.properties?.id ?? null);
    });

    map.on("mousemove", (event) => {
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
  }, []);

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
