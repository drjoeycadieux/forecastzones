# ForecastZones

Application React pour créer des perspectives météo sur une carte MapLibre.
L’éditeur, inspiré d’un flux de travail AWIPS/PGEN, permet de dessiner plusieurs
polygones, de les organiser par catégorie et d’exporter les données en GeoJSON.

## Démarrage

Prérequis : Node.js 20 ou plus récent.

```sh
npm install
cp .env.example .env
```

Renseignez les paramètres Firebase du projet dans `.env`, puis activez
**Authentification > Adresse e-mail/Mot de passe** dans la console Firebase.
Les variables requises sont `VITE_FIREBASE_API_KEY`,
`VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` et
`VITE_FIREBASE_APP_ID`. Le stockage et l’identifiant d’expéditeur sont aussi
configurés dans `.env.example`. Les comptes sont créés par l’application à
l’aide de Firebase Authentication. Ne placez jamais de clé privée ou de compte
de service Firebase dans les variables client.

```sh
npm run dev
```

L’éditeur est disponible sur `/editor` et exige une session Firebase. Les
utilisateurs peuvent créer un compte sur `/signup` ou se connecter sur
`/signin`. Les polygones dessinés et leurs propriétés sont exportables au format
GeoJSON; ils sont conservés dans le navigateur pendant la session, mais ne sont
pas enregistrés sur un serveur.

La carte politique utilise le style Positron hébergé par OpenFreeMap, avec les
frontières administratives mises en évidence. Elle est visible sur l’accueil et
dans l’éditeur, et nécessite une connexion Internet. La carte s’ouvre centrée
sur le Québec, avec des repères pour Montréal et Québec.
