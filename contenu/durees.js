(function (global) {
  // GÉNÉRÉ par outils/generer-durees.js : ne pas modifier à la main.
  // Nombre médian de tours d'une partie, pour 1, 2, 3 et 4 joueurs
  // (300 parties simulées par cas).
  var DUREES = {
    "membre_inferieur-1": [20, 21, 22, 23],
    "membre_inferieur-2": [19, 21, 22, 22],
    "membre_inferieur-3": [19, 21, 21, 22],
    "membre_inferieur-4": [21, 22, 23, 23],
    "membre_inferieur-5": [21, 22, 24, 25],
    "membre_inferieur-6": [20, 22, 23, 24],
    "membre_inferieur-7": [20, 22, 24, 24],
    "membre_inferieur-8": [19, 22, 22, 23],
    "membre_inferieur-9": [19, 22, 23, 24],
    "membre_inferieur-10": [20, 22, 23, 24],
    "membre_superieur-1": [19, 21, 22, 23],
    "membre_superieur-2": [20, 21, 21, 22],
    "membre_superieur-3": [19, 21, 22, 22],
    "membre_superieur-4": [20, 22, 23, 23],
    "membre_superieur-5": [19, 21, 22, 23],
    "membre_superieur-6": [20, 22, 23, 23],
    "membre_superieur-7": [20, 22, 23, 23],
    "membre_superieur-8": [20, 21, 23, 24],
    "membre_superieur-9": [20, 22, 23, 24],
    "membre_superieur-10": [20, 22, 23, 23],
    "tronc-1": [19, 21, 22, 23],
    "tronc-2": [19, 21, 22, 22],
    "tronc-3": [19, 21, 22, 23],
    "tronc-4": [21, 23, 24, 24],
    "tronc-5": [20, 22, 23, 24],
    "tronc-6": [20, 22, 23, 24],
    "tronc-7": [19, 22, 22, 23],
    "tronc-8": [19, 22, 23, 23],
    "tronc-9": [20, 23, 23, 25],
    "tronc-10": [20, 22, 24, 24],
    "full_body-1": [19, 20, 21, 22],
    "full_body-2": [19, 21, 21, 22],
    "full_body-3": [19, 21, 21, 22],
    "full_body-4": [20, 22, 23, 23],
    "full_body-5": [20, 23, 23, 24],
    "full_body-6": [20, 22, 23, 24],
    "full_body-7": [19, 21, 23, 23],
    "full_body-8": [20, 22, 23, 24],
    "full_body-9": [20, 22, 23, 24],
    "full_body-10": [20, 22, 23, 23]
  };
  if (typeof module !== "undefined" && module.exports) module.exports = DUREES;
  else global.DUREES = DUREES;
})(typeof globalThis !== "undefined" ? globalThis : this);
