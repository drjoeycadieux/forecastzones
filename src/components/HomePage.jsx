import { lazy, Suspense } from "react";
import { ArrowDownRight, ArrowRight, Cloud, Layers3, LockKeyhole, PencilRuler } from "lucide-react";
import { Link } from "react-router-dom";

const MapCanvas = lazy(() => import("./LeafletMap.jsx"));

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
            <span className="visual-date">QUÉBEC · CANADA</span>
          </div>
          <div className="map-preview">
            <Suspense fallback={<div className="map-preview-loading">Chargement de la carte…</div>}>
              <MapCanvas preview />
            </Suspense>
          </div>
          <div className="visual-footer">
            <span><span className="legend-dot legend-city" /> Montréal</span>
            <span><span className="legend-dot legend-city" /> Québec</span>
            <span className="visual-footer-right">CARTE INTERACTIVE</span>
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
