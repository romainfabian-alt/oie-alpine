(function (global) {
  // Mise en forme des dosages et du matériel, partagée par les écrans du jeu et
  // par le document de relecture. Un seul endroit décide de « × 12 » ou « 1 min 30 s ».
  var R = (typeof require !== "undefined") ? require("./referentiel.js") : global.Referentiel;

  function duree(s) {
    if (s < 60) return s + " s";
    var m = Math.floor(s / 60), r = s % 60;
    return r ? m + " min " + r + " s" : m + " min";
  }

  // multiplicateur facultatif (défaut 1) : les cases « col difficile » majorent le
  // dosage. Le résultat est toujours arrondi à l'entier, jamais affiché en décimal.
  function dosage(d, unilateral, multiplicateur) {
    var valeur = Math.round(d.valeur * (multiplicateur || 1));
    var base = d.type === "reps" ? "× " + valeur : duree(valeur);
    return unilateral ? base + " / côté" : base;
  }

  function materiel(cles) {
    return cles.map(function (c) { return R.MATERIEL[c] || c; }).join(", ");
  }

  var Format = { dosage: dosage, materiel: materiel, duree: duree };
  if (typeof module !== "undefined" && module.exports) module.exports = Format;
  else global.Format = Format;
})(typeof globalThis !== "undefined" ? globalThis : this);
