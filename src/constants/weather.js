export const WEATHER_CATEGORIES = [
  { name: "Orages", color: "#f59e0b" },
  { name: "Pluie", color: "#45b7e8" },
  { name: "Neige", color: "#c5a6ff" },
  { name: "Vent", color: "#35cf9b" },
  { name: "Risque", color: "#fa6687" },
];

export const SNOWFALL_LEVELS = [
  { label: "0–5", max: 5, color: "#a9d8e8" },
  { label: "5–10", max: 10, color: "#62b9dd" },
  { label: "10–20", max: 20, color: "#737adc" },
  { label: "20+", color: "#833bb8" },
];

export function getSnowfallColor(value) {
  if (value === "" || value === null || value === undefined) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return SNOWFALL_LEVELS.find((level) => level.max === undefined || amount < level.max).color;
}
