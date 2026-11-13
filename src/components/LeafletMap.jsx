import { useEffect, useRef } from "react";
import {
  CircleMarker,
  MapContainer,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";

const CITIES = [
  { name: "Montréal", position: [45.5019, -73.5673] },
  { name: "Québec", position: [46.8139, -71.208] },
];

function MapClickEvents({ drawMode, onMapClick }) {
  useMapEvents({
    click(event) {
      if (drawMode === "polygon") onMapClick([event.latlng.lng, event.latlng.lat]);
    },
  });
  return null;
}

function DrawingInteraction({ drawMode, onStrokeChange, onStrokeEnd }) {
  const map = useMap();
  const callbacksRef = useRef({ onStrokeChange, onStrokeEnd });

  useEffect(() => {
    callbacksRef.current = { onStrokeChange, onStrokeEnd };
  }, [onStrokeChange, onStrokeEnd]);

  useEffect(() => {
    const container = map.getContainer();
    const wasDraggingEnabled = map.dragging.enabled();
    const wasScrollZoomEnabled = map.scrollWheelZoom.enabled();
    const wasTouchZoomEnabled = map.touchZoom.enabled();

    if (drawMode) {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.touchZoom.disable();
      container.style.cursor = "crosshair";
    } else {
      container.style.cursor = "";
      return undefined;
    }

    let activePointer = null;
    let points = [];
    let center = null;
    let lastPixel = null;

    function getPixel(event) {
      const bounds = container.getBoundingClientRect();
      return [event.clientX - bounds.left, event.clientY - bounds.top];
    }

    function getCoordinate(pixel) {
      const point = map.containerPointToLatLng(pixel);
      return [point.lng, point.lat];
    }

    function handlePointerDown(event) {
      if (drawMode === "polygon" || event.button !== 0) return;
      event.preventDefault();
      activePointer = event.pointerId;
      container.setPointerCapture?.(event.pointerId);
      lastPixel = getPixel(event);
      center = lastPixel;
      points = drawMode === "freehand" ? [getCoordinate(lastPixel)] : [];
      callbacksRef.current.onStrokeChange(points);
    }

    function handlePointerMove(event) {
      if (event.pointerId !== activePointer) return;
      event.preventDefault();
      const pixel = getPixel(event);

      if (drawMode === "freehand") {
        const distance = Math.hypot(pixel[0] - lastPixel[0], pixel[1] - lastPixel[1]);
        if (distance < 3 || points.length >= 1500) return;
        points = [...points, getCoordinate(pixel)];
        lastPixel = pixel;
      } else {
        const radius = Math.hypot(pixel[0] - center[0], pixel[1] - center[1]);
        if (radius < 4) return;
        points = Array.from({ length: 48 }, (_, index) => {
          const angle = (index / 48) * Math.PI * 2;
          return getCoordinate([
            center[0] + Math.cos(angle) * radius,
            center[1] + Math.sin(angle) * radius,
          ]);
        });
      }

      callbacksRef.current.onStrokeChange(points);
    }

    function handlePointerUp(event) {
      if (event.pointerId !== activePointer) return;
      activePointer = null;
      if (points.length >= 3) callbacksRef.current.onStrokeEnd(points);
      else callbacksRef.current.onStrokeChange([]);
    }

    function handlePointerCancel(event) {
      if (event.pointerId !== activePointer) return;
      activePointer = null;
      points = [];
      callbacksRef.current.onStrokeChange([]);
    }

    container.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      if (wasDraggingEnabled) map.dragging.enable();
      if (wasScrollZoomEnabled) map.scrollWheelZoom.enable();
      if (wasTouchZoomEnabled) map.touchZoom.enable();
      container.style.cursor = "";
    };
  }, [drawMode, map]);

  return null;
}

function ResizeMap() {
  const map = useMap();

  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  return null;
}

function toLatLng([longitude, latitude]) {
  return [latitude, longitude];
}

function renderFeature(feature, onSelect, isDraft = false, index = 0) {
  const { geometry, properties = {} } = feature;
  const key = properties.id ?? feature.id ?? `${isDraft ? "draft" : "zone"}-${index}`;

  if (geometry.type === "Polygon") {
    return (
      <Polygon
        key={key}
        positions={geometry.coordinates.map((ring) => ring.map(toLatLng))}
        pathOptions={{
          color: properties.color ?? "#f59e0b",
          fillColor: properties.color ?? "#f59e0b",
          fillOpacity: isDraft ? 0.15 : 0.22,
          weight: properties.selected ? 3.5 : 2,
          dashArray: "7 5",
        }}
        eventHandlers={
          isDraft ? undefined : { click: () => onSelect(properties.id ?? feature.id) }
        }
      />
    );
  }

  if (geometry.type === "LineString") {
    return (
      <Polyline
        key={key}
        positions={geometry.coordinates.map(toLatLng)}
        pathOptions={{ color: "#f59e0b", weight: 2.5, dashArray: "7 5" }}
      />
    );
  }

  if (geometry.type === "Point" && isDraft) {
    return (
      <CircleMarker
        key={key}
        center={toLatLng(geometry.coordinates)}
        radius={5}
        pathOptions={{ color: "#fff", weight: 2, fillColor: "#f59e0b", fillOpacity: 1 }}
      />
    );
  }

  return null;
}

export default function LeafletMap({
  features = [],
  draft = { features: [] },
  drawMode = null,
  onMapClick = () => {},
  onSelect = () => {},
  onStrokeChange = () => {},
  onStrokeEnd = () => {},
  preview = false,
}) {
  return (
    <MapContainer
      center={[46.2, -72.8]}
      zoom={preview ? 5.2 : 5.8}
      minZoom={3}
      maxZoom={18}
      zoomControl={!preview}
      doubleClickZoom={false}
      scrollWheelZoom={!preview}
      className="leaflet-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        url="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <MapClickEvents drawMode={drawMode} onMapClick={onMapClick} />
      <DrawingInteraction
        drawMode={drawMode}
        onStrokeChange={onStrokeChange}
        onStrokeEnd={onStrokeEnd}
      />
      <ResizeMap />
      {CITIES.map(({ name, position }) => (
        <CircleMarker
          key={name}
          center={position}
          radius={5}
          pathOptions={{ color: "#fff", weight: 2, fillColor: "#cc6550", fillOpacity: 1 }}
        >
          <Tooltip direction="top" offset={[0, -5]} permanent>
            {name}
          </Tooltip>
        </CircleMarker>
      ))}
      {features.map((feature, index) => renderFeature(feature, onSelect, false, index))}
      {(draft.features ?? []).map((feature, index) =>
        renderFeature(feature, onSelect, true, index),
      )}
    </MapContainer>
  );
}
