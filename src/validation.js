(function (global) {
  var R = (typeof require !== "undefined") ? require("./referentiel.js") : global.Referentiel;

  // Mots qui trahissent un exercice concerné par un filtre : si la variante les
  // contient, elle doit déclarer le filtre dans « incompatible ». C'est le filet
  // qui empêche un saut d'arriver chez un patient « sans saut » par oubli de saisie.
  var INDICES_FILTRES = {
    sans_saut: /saut|sauté|\bbond|\bhops?\b|pogo|skater|réception|corde à sauter|box jump|drop jump|burpee/i,
    sans_overhead: /au-dessus de la tête|overhead|bras tendus vers le haut|développé militaire|traction à la barre|suspendu à la barre/i,
    sans_genoux_sol: /à genoux|genou au sol|genoux au sol|quadrupédie|chevalier servant/i,
    sans_flexion_profonde: /squat profond|pistol|fente profonde|accroupi complet/i,
    sans_charge_dos: /(halt[eè]res?|kettlebells?|charge|lest\w*)[^.]*sur (les [ée]paules|le dos|la nuque)|gilet lest[ée]|sac lest[ée]|back squat/i
  };

  function texte(v) { return (v.nom || "") + " " + (v.description || ""); }
  // « sans saut », « sans décoller » décrivent justement l'absence d'impact : on les
  // retire avant de chercher les indices de filtres, pour éviter les faux positifs.
  function texteIndices(v) { return texte(v).replace(/sans (saut|sauter|sautiller|impact|décoll\w*)/gi, ""); }

  function varianteErreurs(v, ou) {
    var e = [];
    if (!v.nom || v.nom.length > 40) e.push(ou + " : nom absent ou plus de 40 caractères");
    if (!v.description || v.description.length < 20 || v.description.length > 220) {
      e.push(ou + " : description entre 20 et 220 caractères");
    }
    if (!Array.isArray(v.materiel) || v.materiel.length === 0) e.push(ou + " : matériel absent");
    else v.materiel.forEach(function (m) { if (!(m in R.MATERIEL)) e.push(ou + " : matériel non autorisé « " + m + " »"); });
    var d = v.dosage || {};
    var dosageOk = (d.type === "reps" && d.valeur >= 1 && d.valeur <= 50) ||
                   (d.type === "duree" && d.valeur >= 5 && d.valeur <= 180);
    if (!dosageOk || Math.round(d.valeur) !== d.valeur) e.push(ou + " : dosage invalide");
    if (typeof v.unilateral !== "boolean") e.push(ou + " : unilateral doit être true ou false");
    var chargee = (v.materiel || []).some(function (m) { return m === "halteres" || m === "kettlebells"; });
    if (chargee && !v.charge) e.push(ou + " : consigne de charge obligatoire avec haltères ou kettlebell");
    if (!Array.isArray(v.incompatible)) e.push(ou + " : incompatible doit être un tableau");
    else v.incompatible.forEach(function (f) { if (!(f in R.FILTRES)) e.push(ou + " : filtre inconnu « " + f + " »"); });
    if (["aucune", "tenue", "passe"].indexOf(v.balle) === -1) e.push(ou + " : balle doit valoir aucune, tenue ou passe");
    if (v.balle === "passe" && (v.materiel || []).indexOf("medecine_ball") === -1) {
      e.push(ou + " : une passe exige un médecine-ball");
    }
    R.MOTS_INTERDITS.forEach(function (re) {
      if (re.test(texte(v))) e.push(ou + " : formulation interdite (rebond de balle) « " + re + " »");
    });
    Object.keys(INDICES_FILTRES).forEach(function (f) {
      if (INDICES_FILTRES[f].test(texteIndices(v)) && (v.incompatible || []).indexOf(f) === -1) {
        e.push(ou + " : semble concerné par " + f + " sans le déclarer incompatible");
      }
    });
    return e;
  }

  function chaine(c) {
    var e = [];
    var zone = R.zoneDeChaine(c.id);
    if (!zone) return ["chaîne « " + c.id + " » : id inconnu du référentiel"];
    if (c.zone !== zone) e.push(c.id + " : zone « " + c.zone + " » au lieu de « " + zone + " »");
    if (!c.nom) e.push(c.id + " : nom absent");
    var exclue = c.exclueParFiltre || {};
    Object.keys(exclue).forEach(function (f) {
      if (!(f in R.FILTRES)) e.push(c.id + " : exclueParFiltre, filtre inconnu « " + f + " »");
      if (!R.zoneDeChaine(exclue[f])) e.push(c.id + " : substitut inconnu « " + exclue[f] + " »");
      if (exclue[f] === c.id) e.push(c.id + " : une chaîne ne peut pas se substituer à elle-même");
    });
    for (var n = 1; n <= 10; n++) {
      var liste = (c.niveaux || {})[String(n)];
      if (!Array.isArray(liste) || liste.length < 1 || liste.length > 3) {
        e.push(c.id + " niveau " + n + " : 1 à 3 variantes attendues");
        continue;
      }
      liste.forEach(function (v, i) { e = e.concat(varianteErreurs(v, c.id + " niveau " + n + " variante " + (i + 1))); });
    }
    if (e.length) return e;
    // Couverture : pour chaque filtre pris seul, à chaque niveau, une variante
    // compatible doit exister à ce niveau ou en dessous (la résolution descend).
    Object.keys(R.FILTRES).forEach(function (f) {
      if (exclue[f]) return;
      var trouve = false;
      for (var niv = 1; niv <= 10; niv++) {
        trouve = trouve || c.niveaux[String(niv)].some(function (v) { return v.incompatible.indexOf(f) === -1; });
        if (!trouve) { e.push(c.id + " niveau " + niv + " : aucune variante compatible " + f + " à ce niveau ou en dessous"); break; }
      }
    });
    return e;
  }

  function uniques(liste, quoi, e) {
    var vus = {};
    liste.forEach(function (x) {
      if (vus[x.id]) e.push(quoi + " : id « " + x.id + " » non unique");
      vus[x.id] = true;
    });
  }

  function aVarianteDeType(chaine, type) {
    return chaine.niveaux["1"].some(function (v) { return v.dosage.type === type; });
  }

  // Contrôle des cartes du jeu : météo, duels, échauffements et cases de repos.
  // Une carte qui pointe vers une chaîne absente ou un duel « tenue » sur une
  // chaîne sans variante en durée bloquerait la partie au cabinet.
  function evenements(ev, bib) {
    var e = [];
    function chaineConnue(id, ou) {
      if (!bib.chaine(id)) { e.push(ou + " : chaîne inconnue « " + id + " »"); return false; }
      return true;
    }
    if (!Array.isArray(ev.meteo) || ev.meteo.length < 10) e.push("météo : au moins 10 cartes attendues");
    else {
      uniques(ev.meteo, "météo", e);
      ev.meteo.forEach(function (m) {
        var ou = "météo « " + m.id + " »";
        if (!m.titre || !m.texte || m.texte.length > 120) e.push(ou + " : titre et texte (120 caractères max) obligatoires");
        R.MOTS_INTERDITS.forEach(function (re) { if (re.test(m.texte)) e.push(ou + " : formulation interdite"); });
        var f = m.effet || {};
        if (f.type === "deplacement") {
          var okCible = ["tous", "dernier", "premier"].indexOf(f.cible) !== -1;
          var okValeur = f.valeur === Math.round(f.valeur) && f.valeur !== 0 && Math.abs(f.valeur) <= 3;
          if (!okCible || !okValeur) e.push(ou + " : effet de déplacement invalide");
        } else if (f.type === "exercice") {
          chaineConnue(f.chaine, ou);
        } else e.push(ou + " : type d'effet invalide");
      });
    }
    if (!Array.isArray(ev.duels) || ev.duels.length < 6) e.push("duels : au moins 6 duels attendus");
    else {
      uniques(ev.duels, "duels", e);
      ev.duels.forEach(function (d) {
        var ou = "duel « " + d.id + " »";
        if (!d.titre) e.push(ou + " : titre absent");
        if (d.format !== "tenue" && d.format !== "reps30") { e.push(ou + " : format tenue ou reps30"); return; }
        if (!chaineConnue(d.chaine, ou)) return;
        var type = d.format === "tenue" ? "duree" : "reps";
        if (!aVarianteDeType(bib.chaine(d.chaine), type)) {
          e.push(ou + " : la chaîne n'a pas de variante en " + type + " au niveau 1");
        }
      });
    }
    R.ZONES_PLATEAU.forEach(function (z) {
      var liste = (ev.echauffements || {})[z];
      if (!Array.isArray(liste) || liste.length < 3 || liste.length > 6) e.push("échauffement " + z + " : 3 à 6 lignes attendues");
    });
    ["recuperation", "ravitaillement", "refuge"].forEach(function (k) {
      if (!ev[k] || !ev[k].nom || !ev[k].description) e.push(k + " : nom et description obligatoires");
    });
    chaineConnue(ev.chaineCrevasse, "crevasse");
    chaineConnue(ev.chaineChamois, "chamois");
    return e;
  }

  var TYPES_CASES = ["depart", "exercice", "flocon", "telecabine", "avalanche", "crevasse", "refuge",
    "ravitaillement", "col", "chamois", "duel", "cordee", "meteo", "bivouac", "sommet"];

  function plateau(pl, bib, ev) {
    var e = [], cases = pl.cases || [], fin = cases.length - 1;
    var ou = "plateau « " + pl.id + " »";
    if (R.ZONES_PLATEAU.indexOf(pl.zone) === -1) e.push(ou + " : zone inconnue");
    if (!(pl.niveau >= 1 && pl.niveau <= 10)) e.push(ou + " : niveau hors 1-10");
    if (cases.length < 10) return e.concat([ou + " : trop court"]);
    if (cases[0].type !== "depart") e.push(ou + " : la première case doit être le départ");
    if (cases[fin].type !== "sommet") e.push(ou + " : la dernière case doit être le sommet");
    var zoneIds = bib.idsZone(pl.zone), precedente = null;
    cases.forEach(function (c, i) {
      var ici = ou + " case " + i;
      if (TYPES_CASES.indexOf(c.type) === -1) e.push(ici + " : type inconnu « " + c.type + " »");
      if ((c.type === "depart" && i !== 0) || (c.type === "sommet" && i !== fin)) e.push(ici + " : départ ou sommet mal placé");
      if (c.type === "exercice" || c.type === "col") {
        if (zoneIds.indexOf(c.chaine) === -1) e.push(ici + " : chaîne « " + c.chaine + " » hors zone");
        if (c.chaine === precedente) e.push(ici + " : même chaîne deux fois de suite");
        precedente = c.chaine;
      }
      if (c.type === "telecabine" || c.type === "avalanche") {
        var okSens = c.type === "telecabine" ? c.cible > i : c.cible < i;
        var cible = cases[c.cible];
        if (!okSens || !cible || cible.type !== "exercice" || c.cible <= 0 || c.cible >= fin) e.push(ici + " : cible invalide");
      }
      if (c.type === "duel" && !ev.duels.some(function (d) { return d.id === c.duel; })) e.push(ici + " : duel inconnu « " + c.duel + " »");
    });
    var alt = pl.altitudes || [];
    if (alt.length !== cases.length) e.push(ou + " : une altitude par case attendue");
    for (var k = 1; k < alt.length; k++) if (!(alt[k] > alt[k - 1])) e.push(ou + " : altitudes non croissantes en " + k);
    return e;
  }

  var Validation = { chaine: chaine, evenements: evenements, plateau: plateau, INDICES_FILTRES: INDICES_FILTRES };
  if (typeof module !== "undefined" && module.exports) module.exports = Validation;
  else global.Validation = Validation;
})(typeof globalThis !== "undefined" ? globalThis : this);
