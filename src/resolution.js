(function (global) {
  var F = (typeof require !== "undefined") ? require("./format.js") : global.Format;

  function compatible(v, joueur, typeDosage) {
    for (var i = 0; i < joueur.filtres.length; i++) {
      if (v.incompatible.indexOf(joueur.filtres[i]) !== -1) return false;
    }
    if (joueur.seul && v.balle === "passe") return false;
    if (typeDosage && v.dosage.type !== typeDosage) return false;
    return true;
  }

  function chaineEffective(bib, id, joueur) {
    var c = bib.chaine(id);
    var exclue = (c && c.exclueParFiltre) || {};
    for (var i = 0; i < joueur.filtres.length; i++) {
      if (exclue[joueur.filtres[i]]) return bib.chaine(exclue[joueur.filtres[i]]);
    }
    return c;
  }

  // Sûreté : on part du niveau du joueur et on ne fait que descendre.
  function resoudre(bib, idChaine, joueur, options) {
    var c = chaineEffective(bib, idChaine, joueur);
    if (!c) return { recuperation: true };
    for (var n = Math.min(10, joueur.niveau); n >= 1; n--) {
      var candidates = c.niveaux[String(n)].filter(function (v) { return compatible(v, joueur, options.typeDosage); });
      if (!candidates.length) continue;
      if (options.eviter && candidates.length > 1) {
        var autres = candidates.filter(function (v) { return v.nom !== options.eviter; });
        if (autres.length) candidates = autres;
      }
      return { recuperation: false, chaine: c.id, niveau: n, variante: options.alea.parmi(candidates) };
    }
    return { recuperation: true };
  }

  function carte(resultat, evenements, multiplicateur) {
    var m = multiplicateur || 1;
    if (resultat.recuperation) {
      var r = evenements.recuperation;
      return { titre: r.nom, description: r.description, materiel: "", dosage: F.dosage(r.dosage, false),
        charge: null, secondes: r.dosage.valeur, unilateral: false };
    }
    var v = resultat.variante;
    return {
      titre: v.nom, description: v.description, materiel: F.materiel(v.materiel),
      dosage: F.dosage(v.dosage, v.unilateral, m), charge: v.charge,
      secondes: v.dosage.type === "duree" ? Math.round(v.dosage.valeur * m) : null,
      unilateral: v.unilateral
    };
  }

  var Resolution = { resoudre: resoudre, carte: carte };
  if (typeof module !== "undefined" && module.exports) module.exports = Resolution;
  else global.Resolution = Resolution;
})(typeof globalThis !== "undefined" ? globalThis : this);
