import { SNOWFALL_LEVELS, WEATHER_CATEGORIES } from "../constants/weather.js";

export default function MapLegend() {
  return (
    <section className="map-legend" aria-label="Légende de la carte">
      <div className="map-legend-heading">LÉGENDE</div>
      <div className="weather-legend">
        {WEATHER_CATEGORIES.map(({ name, color }) => (
          <div className="weather-legend-item" key={name}>
            <span className="weather-legend-dot" style={{ "--legend-color": color }} />
            <span>{name}</span>
          </div>
        ))}
      </div>
      <div className="snow-legend">
        <div className="snow-legend-heading">
          <span>NEIGE ACCUMULÉE</span><span className="snow-legend-unit">cm</span>
        </div>
        <div className="snow-legend-levels">
          {SNOWFALL_LEVELS.map(({ label, color }) => (
            <div className="snow-legend-item" key={label}>
              <span className="snow-legend-swatch" style={{ "--legend-color": color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
