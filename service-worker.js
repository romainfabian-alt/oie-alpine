// Numéro de version du cache : à incrémenter (oie-alpine-v2, v3, ...) à
// CHAQUE modification d'un fichier listé dans FICHIERS. Sans ça, l'iPad déjà
// installé continue de servir l'ancienne version indéfiniment.
var CACHE = "oie-alpine-v1";

var FICHIERS = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.webmanifest",
  "./assets/fonts/Italiana-Regular.ttf",
  "./assets/fonts/Jura-Medium.ttf",
  "./assets/fonts/Jura-SemiBold.ttf",
  "./src/aleatoire.js",
  "./src/referentiel.js",
  "./src/format.js",
  "./contenu/chaines-membre-inferieur.js",
  "./contenu/chaines-tronc.js",
  "./contenu/chaines-membre-superieur.js",
  "./contenu/chaines-complexe.js",
  "./contenu/evenements.js",
  "./contenu/plateaux.js",
  "./src/bibliotheque.js",
  "./src/validation.js",
  "./src/resolution.js",
  "./src/regles.js",
  "./src/minuteur.js",
  "./src/audio.js",
  "./src/veille.js",
  "./src/ui.js",
  "./src/rendu-plateau.js",
  "./src/ecran-accueil.js",
  "./src/prenoms.js",
  "./src/ecran-joueurs.js",
  "./src/ecran-partie.js",
  "./src/app.js",
  "./assets/logo-cabinet.png",
  "./assets/logo.svg",
  "./assets/favicon.svg",
  "./assets/icone-180.png",
  "./assets/icone-192.png",
  "./assets/icone-512.png"
];

self.addEventListener("install", function (e) {
  // { cache: "reload" } force chaque requête à repasser par le réseau au lieu
  // du cache HTTP du navigateur : GitHub Pages sert avec max-age=600 plus un
  // CDN, donc sans ça une mise à jour peut stocker des fichiers périmés sous
  // un nouveau numéro de CACHE.
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(FICHIERS.map(function (u) { return new Request(u, { cache: "reload" }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (noms) {
    return Promise.all(noms.map(function (n) { return n === CACHE ? null : caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  // Cache d'abord : au cabinet, le réseau est la partie la moins fiable.
  e.respondWith(caches.match(e.request).then(function (r) { return r || fetch(e.request); }));
});
