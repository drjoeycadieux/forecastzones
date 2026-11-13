import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "@firebase/auth";
import { ArrowLeft, Cloud, Eye, EyeOff } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { auth, isFirebaseConfigured } from "../firebase.js";

function firebaseMessage(error) {
  const messages = {
    "auth/email-already-in-use": "Cette adresse courriel possède déjà un compte.",
    "auth/invalid-email": "Veuillez entrer une adresse courriel valide.",
    "auth/invalid-credential": "Adresse courriel ou mot de passe incorrect.",
    "auth/weak-password": "Choisissez un mot de passe d’au moins 6 caractères.",
    "auth/too-many-requests": "Trop de tentatives. Veuillez réessayer plus tard.",
    "auth/network-request-failed": "Connexion impossible. Vérifiez votre accès à Internet.",
  };
  return messages[error.code] ?? "Une erreur est survenue. Veuillez réessayer.";
}

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/editor" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (!auth) throw new Error("Firebase n’est pas configuré.");
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      navigate("/editor", { replace: true });
    } catch (submitError) {
      setError(
        submitError.code ? firebaseMessage(submitError) : submitError.message,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <Link to="/" className="auth-back"><ArrowLeft size={16} /> Retour à l’accueil</Link>
      <section className="auth-card">
        <Link to="/" className="brand auth-brand">
          <span className="brand-mark"><Cloud size={19} /></span>
          <span>forecast<span className="brand-accent">zones</span></span>
        </Link>
        <span className="eyebrow">{isSignup ? "REJOIGNEZ L’ESPACE" : "ESPACE SÉCURISÉ"}</span>
        <h1>{isSignup ? "Créer votre compte" : "Bon retour."}</h1>
        <p className="auth-intro">
          {isSignup
            ? "Enregistrez-vous pour accéder à l’éditeur cartographique."
            : "Connectez-vous pour accéder à votre éditeur de cartes."}
        </p>

        {!isFirebaseConfigured && (
          <div className="form-alert" role="alert">
            Firebase n’est pas encore configuré. Ajoutez vos paramètres dans le
            fichier <code>.env</code> en suivant le guide du dépôt.
          </div>
        )}
        {error && <div className="form-alert" role="alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Adresse courriel</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="password">Mot de passe</label>
          <div className="password-wrap">
            <input
              id="password"
              type={passwordVisible ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder={isSignup ? "6 caractères minimum" : "Votre mot de passe"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={isSignup ? 6 : undefined}
              required
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={passwordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              onClick={() => setPasswordVisible((visible) => !visible)}
            >
              {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <button
            className="button button-primary auth-submit"
            type="submit"
            disabled={submitting || !isFirebaseConfigured}
          >
            {submitting ? "Connexion…" : isSignup ? "Créer mon compte" : "Se connecter"}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? "Vous avez déjà un compte ?" : "Vous n’avez pas de compte ?"}{" "}
          <Link to={isSignup ? "/signin" : "/signup"}>
            {isSignup ? "Se connecter" : "Créer un compte"}
          </Link>
        </p>
        <p className="auth-security">Authentification sécurisée par Firebase</p>
      </section>
    </main>
  );
}
