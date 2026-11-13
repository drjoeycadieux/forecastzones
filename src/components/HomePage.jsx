import { ArrowDownRight, ArrowRight, Cloud, Layers3, LockKeyhole, PencilRuler } from "lucide-react";
import { Link } from "react-router-dom";

const capabilities = [
  {
    icon: PencilRuler,
    title: "Dessinez vos perspectives",
    description: "Tracez et organisez plusieurs polygones directement sur la carte.",
  },
  {
    icon: Layers3,
    title: "Un flux de travail PGEN",
    description: "Définissez une catégorie, une couleur et des détails pour chaque zone.",
  },
  {
    icon: LockKeyhole,
    title: "Un espace privé",
    description: "L’éditeur est réservé aux utilisateurs connectés par courriel.",
  },
];

export default function HomePage() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link to="/" className="brand">
          <span className="brand-mark"><Cloud size={19} /></span>
          <span>forecast<span className="brand-accent">zones</span></span>
        </Link>
        <div className="nav-actions">
          <Link className="nav-link" to="/signin">Connexion</Link>
          <Link className="button button-small button-light" to="/signup">
            Créer un compte <ArrowRight size={15} />
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> OUTILS DE CARTOGRAPHIE MÉTÉO</div>
          <h1>Tracez les conditions.<br /><span>Partagez la perspective.</span></h1>
          <p>
            Un espace de travail cartographique inspiré des outils opérationnels
            AWIPS et PGEN. Dessinez vos zones météo, organisez votre analyse et
            exportez vos perspectives.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="button button-primary">
              Accéder à l’éditeur <ArrowRight size={17} />
            </Link>
            <span className="hero-note">Accès réservé aux comptes enregistrés</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="Aperçu de zones météo dessinées sur une carte">
          <div className="visual-topbar">
            <span><span className="status-dot" /> ÉDITEUR DE PERSPECTIVES</span>
            <span className="visual-date">43.4° N&nbsp; · &nbsp;79.2° O</span>
          </div>
          <div className="map-preview">
            <div className="map-grid" />
            <svg className="weather-zones" viewBox="0 0 640 410" role="img" aria-label="Polygones météo">
              <path className="zone zone-one" d="M92 235 L160 149 L252 164 L282 239 L224 301 L128 290 Z" />
              <path className="zone zone-two" d="M319 94 L412 107 L445 177 L407 243 L327 221 L294 151 Z" />
              <path className="zone zone-three" d="M413 259 L480 212 L548 243 L532 314 L460 337 L410 306 Z" />
              <path className="map-river" d="M40 118 C155 146 159 213 275 196 S425 141 603 181" />
              <path className="map-road" d="M61 342 C160 302 194 315 278 271 S424 290 591 231" />
              <circle cx="294" cy="151" r="4" className="map-point" />
              <circle cx="445" cy="177" r="4" className="map-point" />
            </svg>
            <span className="map-label label-one">ZONE 01 · ORAGE</span>
            <span className="map-label label-two">ZONE 02 · PRÉCIPITATIONS</span>
            <span className="map-scale">50 km&nbsp; ━━━━━</span>
          </div>
          <div className="visual-footer">
            <span><span className="legend-dot legend-orange" /> Orages</span>
            <span><span className="legend-dot legend-blue" /> Précipitations</span>
            <span className="visual-footer-right">3 zones · Brouillon</span>
          </div>
          <div className="visual-corner"><ArrowDownRight size={18} /></div>
        </div>
      </section>

      <section className="capabilities">
        <div className="section-heading">
          <span className="eyebrow">VOTRE ESPACE DE TRAVAIL</span>
          <h2>Tout ce qu’il faut pour bâtir une perspective.</h2>
        </div>
        <div className="capability-grid">
          {capabilities.map(({ icon: Icon, title, description }, index) => (
            <article className="capability-card" key={title}>
              <div className="capability-icon"><Icon size={19} /></div>
              <span className="capability-number">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <Link to="/" className="brand">
          <span className="brand-mark"><Cloud size={16} /></span>
          <span>forecast<span className="brand-accent">zones</span></span>
        </Link>
        <span>Un outil cartographique pour les passionnés de météo.</span>
      </footer>
    </main>
  );
}
