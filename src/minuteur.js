(function (global) {
  // Horloge fournie par l'appelant : le minuteur reste juste même si l'iPad
  // saute des images (onglet en arrière-plan, écran chargé).
  function creer(secondes) {
    var total = secondes * 1000, ecoule = 0, depuis = null;
    var m = {
      enMarche: false,
      demarrer: function (t) {
        if (m.fini(t)) ecoule = 0;
        depuis = t; m.enMarche = true;
      },
      pause: function (t) {
        if (!m.enMarche) return;
        ecoule += t - depuis; depuis = null; m.enMarche = false;
      },
      restant: function (t) {
        var e = ecoule + (m.enMarche ? t - depuis : 0);
        return Math.max(0, Math.ceil((total - e) / 1000 - 1e-9));
      },
      fini: function (t) { return m.restant(t) === 0; }
    };
    return m;
  }

  var Minuteur = { creer: creer };
  if (typeof module !== "undefined" && module.exports) module.exports = Minuteur;
  else global.Minuteur = Minuteur;
})(typeof globalThis !== "undefined" ? globalThis : this);
