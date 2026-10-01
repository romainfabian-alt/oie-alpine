(function (global) {
  // Durée estimée et matériel d'un plateau, pour les tuiles de l'accueil.
  var R = (typeof require !== "undefined") ? require("./referentiel.js") : global.Referentiel;

  // Mesuré au cabinet le 29/09 : une partie seule de 44 cases a duré 30 min,
  // soit environ 2,4 min par tour. À plusieurs, chaque tour s'allonge : les
  // lancers se suivent et l'effort attend le plus lent. Estimation : +14 %
  // par joueur en plus. À recaler sur les prochaines parties chronométrées.
  var MINUTES_PAR_TOUR = 2.4;
  var SURCOUT_PAR_JOUEUR = 0.14;

  function minutes(tours, nbJoueurs) {
    return Math.round(tours * MINUTES_PAR_TOUR * (1 + SURCOUT_PAR_JOUEUR * (nbJoueurs - 1)) * 10) / 10;
  }

  function texteDuree(min) {
    var arrondi = Math.max(5, Math.round(min / 5) * 5);
    if (arrondi < 60) return "≈ " + arrondi + " min";
    var h = Math.floor(arrondi / 60), reste = arrondi % 60;
    return "≈ " + h + " h" + (reste ? " " + (reste < 10 ? "0" : "") + reste : "");
  }

  // « Seul ≈ 50 min · à 4 ≈ 1 h 10 ». Vide si le plateau n'a pas de durée
  // calculée : mieux vaut rien qu'un chiffre inventé.
  function resume(plateau, durees) {
    var d = durees && durees[plateau.id];
    if (!d || d.length < 4) return "";
    return "Seul " + texteDuree(minutes(d[0], 1)) + " · à 4 " + texteDuree(minutes(d[3], 4));
  }

  // Le matériel à sortir pour ce plateau, joué à son niveau : celui de toutes
  // les variantes des chaînes présentes, du plus utilisé au moins utilisé.
  function materiel(plateau, bib) {
    var compte = {};
    (plateau.cases || []).forEach(function (c) {
      if (c.type !== "exercice" || !c.chaine) return;
      var ch = bib.chaine(c.chaine);
      var variantes = ch && ch.niveaux ? ch.niveaux[String(plateau.niveau)] || [] : [];
      variantes.forEach(function (v) {
        (v.materiel || []).forEach(function (m) {
          if (m === "aucun") return;
          compte[m] = (compte[m] || 0) + 1;
        });
      });
    });
    return Object.keys(compte).sort(function (a, b) { return compte[b] - compte[a] || (a < b ? -1 : 1); })
      .map(function (m) { return R.MATERIEL[m] || m; });
  }

  function texteMateriel(libelles) {
    if (!libelles.length) return "Sans matériel";
    var tete = libelles.slice(0, 4).map(function (l, i) { return i ? l.charAt(0).toLowerCase() + l.slice(1) : l; });
    return tete.join(", ") + (libelles.length > 4 ? " + " + (libelles.length - 4) : "");
  }

  var Estimation = { minutes: minutes, texteDuree: texteDuree, resume: resume, materiel: materiel,
    texteMateriel: texteMateriel, MINUTES_PAR_TOUR: MINUTES_PAR_TOUR };
  if (typeof module !== "undefined" && module.exports) module.exports = Estimation;
  else global.Estimation = Estimation;
})(typeof globalThis !== "undefined" ? globalThis : this);
