(function (global) {
  var Res = (typeof require !== "undefined") ? require("./resolution.js") : global.Resolution;
  var F = (typeof require !== "undefined") ? require("./format.js") : global.Format;

  function derniere(p) { return p.plateau.cases.length - 1; }
  function enCourse(p) { return p.joueurs.filter(function (j) { return j.rang === null; }); }
  function engage(p, id) {
    return p.duels.some(function (d) { return d.initiateur === id || d.adversaire === id; });
  }

  function creerPartie(plateau, joueurs, ctx) {
    return {
      plateau: plateau, ctx: ctx, tour: 0, phase: "echauffement", lanceur: null, attente: null,
      duels: [], bonus: {}, etapes: null, etape: 0, collectifAnnuleChoixIndividuels: false,
      joueurs: joueurs.map(function (j, i) {
        return { id: i, prenom: j.prenom || ("Joueur " + (i + 1)), couleur: j.couleur, niveau: j.niveau,
          filtres: j.filtres.slice(), position: 0, rang: null, piolet: true, crevasseAVenir: false,
          passeCrevasse: false, caseDuTour: null, lanceFait: false, choixCol: null, dernieres: {} };
      })
    };
  }

  function demarrer(p) {
    if (p.phase !== "echauffement") throw new Error("La partie a déjà commencé");
    nouveauTour(p);
  }

  function nouveauTour(p) {
    p.tour++;
    p.phase = "lancer";
    p.duels = [];
    p.bonus = {};
    p.etapes = null;
    p.etape = 0;
    p.attente = null;
    p.collectifAnnuleChoixIndividuels = false;
    enCourse(p).forEach(function (j) {
      j.lanceFait = false; j.caseDuTour = null; j.choixCol = null; j.passeCrevasse = false;
      // Crevasse : pas de lancer au tour suivant, le gainage est refait sur place.
      if (j.crevasseAVenir) {
        j.crevasseAVenir = false; j.passeCrevasse = true; j.lanceFait = true; j.caseDuTour = j.position;
      }
    });
    passerAuSuivant(p);
  }

  function passerAuSuivant(p) {
    var restants = enCourse(p).filter(function (j) { return !j.lanceFait; });
    if (restants.length) { p.lanceur = restants[0].id; return; }
    p.lanceur = null;
    p.phase = "effort";
    construireEffort(p);
  }

  function joueurActif(p) {
    if (p.phase !== "lancer" || p.attente || p.lanceur === null) return null;
    return p.joueurs[p.lanceur];
  }

  function lancer(p, de) {
    var j = joueurActif(p);
    if (!j) throw new Error("Aucun lancer possible maintenant");
    if (de === undefined) de = p.ctx.alea.entier(6) + 1;
    var res = { joueur: j.id, de: de, depart: j.position, arrivee: null, effets: [], relance: false, attente: null };
    j.position = Math.min(j.position + de, derniere(p));
    appliquerCase(p, j, res);
    return res;
  }

  function appliquerCase(p, j, res) {
    var c = p.plateau.cases[j.position];
    if (c.type === "telecabine" || c.type === "avalanche") {
      res.effets.push({ type: c.type, de: j.position, vers: c.cible });
      j.position = c.cible;
      c = p.plateau.cases[j.position];
    }
    res.arrivee = j.position;
    if (c.type === "flocon") { res.relance = true; res.effets.push({ type: "flocon" }); return; }
    j.caseDuTour = j.position;
    j.lanceFait = true;
    if (c.type === "crevasse") j.crevasseAVenir = true;
    var autres = enCourse(p).filter(function (o) { return o.id !== j.id && o.position !== derniere(p); });
    if (c.type === "col") {
      p.attente = { joueur: j.id, type: "col", options: ["facile", "difficile"] };
    } else if (c.type === "bivouac" && autres.length) {
      p.attente = { joueur: j.id, type: "bivouac", options: autres.map(function (o) { return o.id; }) };
    } else if (c.type === "duel" && !engage(p, j.id)) {
      var libres = autres.filter(function (o) { return !engage(p, o.id); });
      if (libres.length) p.attente = { joueur: j.id, type: "duel", options: libres.map(function (o) { return o.id; }) };
    }
    res.attente = p.attente;
    if (!p.attente) passerAuSuivant(p);
  }

  function choisir(p, valeur) {
    var a = p.attente;
    if (!a) throw new Error("Aucun choix en attente");
    if (a.options.indexOf(valeur) === -1) throw new Error("Choix impossible : " + valeur);
    var j = p.joueurs[a.joueur];
    if (a.type === "col") j.choixCol = valeur;
    if (a.type === "bivouac") {
      var o = p.joueurs[valeur], t = j.position;
      j.position = o.position; o.position = t;
    }
    if (a.type === "duel") {
      p.duels.push({ initiateur: j.id, adversaire: valeur, duel: p.plateau.cases[j.caseDuTour].duel });
    }
    p.attente = null;
    passerAuSuivant(p);
  }

  function joueurRes(p, j) { return { niveau: j.niveau, filtres: j.filtres, seul: enCourse(p).length === 1 }; }

  function carteExercice(p, j, idChaine, type, o) {
    o = o || {};
    var r = Res.resoudre(p.ctx.bib, idChaine, joueurRes(p, j),
      { alea: p.ctx.alea, typeDosage: o.typeDosage, eviter: j.dernieres[idChaine] });
    if (!r.recuperation) j.dernieres[idChaine] = r.variante.nom;
    var c = Res.carte(r, p.ctx.ev, o.multiplicateur || 1);
    c.joueur = j.id; c.type = type; c.valeur = r.recuperation ? null : r.variante.dosage.valeur;
    // Chaîne réellement résolue (après substitution éventuelle par un filtre
    // de blessure, cf. chaineEffective) : l'écran doit afficher celle-ci, pas
    // la chaîne d'origine de la case, sinon un joueur filtré voit un libellé
    // qui ne correspond pas à l'exercice affiché.
    c.chaine = r.recuperation ? null : r.chaine;
    c.objectif = null; c.issue = null; c.options = null; c.pioletPossible = true;
    c.bonus = o.bonus || 0; c.fait = false; c.piolet = false; c.resultat = null; c.recuperation = r.recuperation;
    return c;
  }

  function carteSimple(j, type, titre, description, secondes, fait) {
    return { joueur: j.id, type: type, titre: titre, description: description, materiel: "",
      dosage: secondes ? F.duree(secondes) : "", charge: null, secondes: secondes || null, unilateral: false,
      valeur: null, objectif: null, issue: null, options: null, pioletPossible: false, bonus: 0,
      fait: !!fait, piolet: false, resultat: null, recuperation: false };
  }

  function duelDef(p, id) { return p.ctx.ev.duels.filter(function (d) { return d.id === id; })[0]; }

  function carteDuel(p, j, def) {
    var tenue = def.format === "tenue";
    var c = carteExercice(p, j, def.chaine, "duel", { typeDosage: tenue ? "duree" : "reps" });
    if (c.recuperation) return c;
    c.titre = def.titre + " : " + c.titre;
    if (tenue) { c.dosage = "Tenir le plus longtemps possible"; c.secondes = null; }
    else { c.dosage = "Le plus de répétitions en 30 s"; c.secondes = 30; }
    return c;
  }

  function carteDuelSolo(p, j, idDuel) {
    var def = duelDef(p, idDuel);
    var c = carteDuel(p, j, def);
    if (c.recuperation) return c;
    c.issue = "reussite"; c.bonus = 2;
    c.objectif = def.format === "tenue"
      ? "Objectif : tenir " + F.duree(Math.round(c.valeur * 1.5))
      : "Objectif : " + c.valeur + " répétitions en 30 s";
    return c;
  }

  function carteIndividuelle(p, j) {
    var ev = p.ctx.ev;
    if (j.position === derniere(p)) return carteSimple(j, "sommet", "Au sommet !", "Bravo, tu as terminé l'ascension.", null, true);
    // Reprise de crevasse : le gainage est refait quelle que soit la case où le
    // joueur se trouve alors, car un événement météo « tous / premier / dernier »
    // a pu le déplacer entre l'atterrissage sur la crevasse et ce tour de reprise
    // (caseDuTour = j.position pour ce tour, cf. nouveauTour, ne désigne alors
    // plus la case crevasse).
    if (j.passeCrevasse) return carteExercice(p, j, ev.chaineCrevasse, "crevasse");
    var c = p.plateau.cases[j.caseDuTour];
    if (c.type === "exercice") return carteExercice(p, j, c.chaine, "exercice");
    if (c.type === "col") {
      return carteExercice(p, j, c.chaine, "col", j.choixCol === "difficile" ? { multiplicateur: 1.5, bonus: 3 } : { bonus: 1 });
    }
    if (c.type === "crevasse") return carteExercice(p, j, ev.chaineCrevasse, "crevasse");
    if (c.type === "chamois") {
      var k = carteExercice(p, j, ev.chaineChamois, "chamois");
      if (!k.recuperation) { k.issue = "reussite"; k.bonus = 3; k.objectif = "Défi réussi : avance de 3 cases"; }
      return k;
    }
    if (c.type === "duel") return carteDuelSolo(p, j, c.duel);
    if (c.type === "refuge") return carteSimple(j, "refuge", ev.refuge.nom, ev.refuge.description, null, true);
    if (c.type === "ravitaillement" || c.type === "bivouac") {
      // bivouac : soit aucun échange n'était possible (cas solo), soit un
      // échange a eu lieu (cf. choisir) et ce joueur en est l'initiateur ;
      // dans les deux cas caseDuTour reste la case bivouac (l'échange ne
      // déplace que les positions, pas caseDuTour), donc ce joueur reçoit
      // le ravitaillement de 60 s.
      return carteSimple(j, "ravitaillement", ev.ravitaillement.nom, ev.ravitaillement.description, ev.ravitaillement.dosage.valeur, false);
    }
    throw new Error("Type de case inattendu à l'effort : " + c.type);
  }

  function cartesIndividuelles(p) {
    return enCourse(p).map(function (j) {
      var d = p.duels.filter(function (x) { return x.initiateur === j.id || x.adversaire === j.id; })[0];
      var duelActif = d && p.joueurs[d.initiateur].position !== derniere(p) && p.joueurs[d.adversaire].position !== derniere(p);
      if (!duelActif) return carteIndividuelle(p, j);
      var c = carteDuel(p, j, duelDef(p, d.duel));
      c.pioletPossible = false;
      if (j.id === d.initiateur) {
        c.issue = "gagnant"; c.options = [d.initiateur, d.adversaire]; c.bonus = 2;
        c.objectif = "Duel contre " + p.joueurs[d.adversaire].prenom + " : désigne le gagnant, il avance de 2 cases";
      } else {
        c.objectif = "Duel contre " + p.joueurs[d.initiateur].prenom;
      }
      return c;
    });
  }

  function participants(p) {
    return enCourse(p).filter(function (j) { return j.position !== derniere(p); });
  }

  function etapeCollective(p, type) {
    var ctx = p.ctx, qui = participants(p);
    if (type === "cordee") {
      var chaine = ctx.alea.parmi(ctx.bib.idsZone(p.plateau.zone));
      // Dernier joueur encore en course (les autres ont atteint le sommet) :
      // même traitement solo que le duel et le bivouac, qui se basent aussi
      // sur les participants encore en jeu (qui) plutôt que sur l'effectif
      // de départ de la partie.
      var solo = qui.length === 1;
      return { type: "cordee", titre: "Cordée",
        texte: solo ? "Exercice de cordée : +2 cases une fois fait." : "Tout le monde fait l'exercice ensemble, chacun à son niveau.",
        continue: false,
        cartes: qui.map(function (j) { return carteExercice(p, j, chaine, "cordee", { bonus: solo ? 2 : 0 }); }) };
    }
    var m = ctx.alea.parmi(ctx.ev.meteo);
    var etape = { type: "meteo", titre: m.titre, texte: m.texte, continue: false, cartes: [] };
    if (m.effet.type === "exercice") {
      etape.cartes = qui.map(function (j) { return carteExercice(p, j, m.effet.chaine, "meteo"); });
      return etape;
    }
    var positions = qui.map(function (j) { return j.position; });
    var extreme = m.effet.cible === "dernier" ? Math.min.apply(null, positions) : Math.max.apply(null, positions);
    // Les positions ne bougent pas pendant la phase d'effort (les bonus ne
    // sont appliqués qu'à la fin du tour ou par un Terminer explicite), donc
    // les cibles calculées ici resteront valables. Mais le déplacement lui-
    // même n'est PAS appliqué ici : tant que l'écran météo n'a pas été vu et
    // validé par « Continuer », personne n'a vu ce déplacement, et Romain
    // veut que « Terminer » ne compte que les cases déjà gagnées à ce
    // moment-là. On mémorise donc les cibles sur l'étape, et continuer() les
    // appliquera juste avant de marquer l'étape comme franchie (cf. plus
    // bas). Si Terminer est appelé pendant que cet écran météo est encore
    // affiché (pas de Continuer), le déplacement n'est délibérément PAS
    // compté : conforme à « une météo compte une fois son écran passé avec
    // Continuer ».
    var deplacements = [];
    qui.forEach(function (j) {
      if (m.effet.cible === "tous" || j.position === extreme) deplacements.push({ id: j.id, valeur: m.effet.valeur });
    });
    etape.deplacements = deplacements;
    return etape;
  }

  // Un joueur qui a atterri ce tour sur un col, un duel ou un chamois a un
  // choix ou un bonus en attente (choixCol, duel initié, +3 cases du défi).
  // Si une cordée ou une météo remplace ensuite l'effort individuel de tout
  // le monde, ce choix ou ce bonus est annulé : pure, testable indépendamment
  // de l'écran.
  function participantAAnnulerSiCollectif(p) {
    return participants(p).filter(function (j) {
      if (j.passeCrevasse) return false;
      var t = p.plateau.cases[j.caseDuTour].type;
      return t === "col" || t === "duel" || t === "chamois";
    });
  }

  function construireEffort(p) {
    var declencheurs = participants(p).filter(function (j) {
      if (j.passeCrevasse) return false;
      var t = p.plateau.cases[j.caseDuTour].type;
      return t === "cordee" || t === "meteo";
    });
    // Une étape collective par case déclenchante, pas par joueur : si plusieurs
    // joueurs tombent sur la même case, on ne déduplique que la case (ordre des
    // joueurs conservé pour l'enchaînement de cases différentes le même tour).
    var casesVues = [];
    var declencheursParCase = declencheurs.filter(function (j) {
      if (casesVues.indexOf(j.caseDuTour) !== -1) return false;
      casesVues.push(j.caseDuTour);
      return true;
    });
    // Événements individuels annulés par une case collective ce tour (col,
    // duel, chamois) : mémorisé pour que l'écran l'annonce sur l'étape
    // collective, cf. participantAAnnulerSiCollectif ci-dessus.
    p.collectifAnnuleChoixIndividuels = declencheursParCase.length > 0 && participantAAnnulerSiCollectif(p).length > 0;
    p.etapes = declencheursParCase.length
      ? declencheursParCase.map(function (j) { return etapeCollective(p, p.plateau.cases[j.caseDuTour].type); })
      : [{ type: "individuel", titre: null, texte: null, continue: false, cartes: cartesIndividuelles(p) }];
    p.etape = 0;
    verifierFinEtape(p);
  }

  function continuer(p) {
    if (p.phase !== "effort") throw new Error("Pas de phase d'effort en cours");
    var e = p.etapes[p.etape];
    if (e.cartes.length) throw new Error("Cette étape attend la validation des cartes");
    // Météo de déplacement : le déplacement calculé à la construction de
    // l'étape (cf. etapeCollective) n'est appliqué qu'ici, juste avant de
    // marquer l'étape franchie, une fois l'écran météo vu et validé.
    if (e.deplacements) e.deplacements.forEach(function (d) { ajouterBonus(p, d.id, d.valeur); });
    e.continue = true;
    verifierFinEtape(p);
  }

  function carteDe(p, id) {
    if (p.phase !== "effort") throw new Error("Pas de phase d'effort en cours");
    var c = p.etapes[p.etape].cartes.filter(function (k) { return k.joueur === id; })[0];
    if (!c) throw new Error("Aucune carte pour ce joueur");
    return c;
  }

  function ajouterBonus(p, id, n) { if (n) p.bonus[id] = (p.bonus[id] || 0) + n; }

  function valider(p, id, issue) {
    var c = carteDe(p, id);
    if (c.fait) throw new Error("Carte déjà validée");
    if (c.issue === "reussite") {
      if (typeof issue !== "boolean") throw new Error("Réussi ou raté attendu");
      c.resultat = issue;
      if (issue) ajouterBonus(p, id, c.bonus);
    } else if (c.issue === "gagnant") {
      if (!c.options || c.options.indexOf(issue) === -1) throw new Error("Gagnant attendu parmi les duellistes");
      c.resultat = issue;
      ajouterBonus(p, issue, c.bonus);
    } else {
      ajouterBonus(p, id, c.bonus);
    }
    c.fait = true;
    verifierFinEtape(p);
  }

  function utiliserPiolet(p, id) {
    var c = carteDe(p, id), j = p.joueurs[id];
    if (c.fait || !c.pioletPossible || !j.piolet) throw new Error("Piolet impossible");
    j.piolet = false; c.fait = true; c.piolet = true;
    verifierFinEtape(p);
  }

  function verifierFinEtape(p) {
    var e = p.etapes[p.etape];
    if (e.cartes.length === 0 && !e.continue) return;          // météo : attendre « Continuer »
    if (!e.cartes.every(function (k) { return k.fait; })) return;
    if (p.etape < p.etapes.length - 1) { p.etape++; verifierFinEtape(p); return; }
    finirTour(p);
  }

  function prochainRang(p) { return p.joueurs.filter(function (j) { return j.rang !== null; }).length + 1; }

  // Applique le bonus accumulé ce tour aux positions (écrêté comme une
  // case normale) puis classe au rang courant, ex aequo, ceux que ce
  // bonus amène au sommet. Partagé par finirTour et par terminer appelé
  // pendant la phase d'effort, pour que les cases déjà gagnées ce tour
  // (col, chamois, duel, cordée solo, météo) comptent dans les deux cas.
  function appliquerBonusEtArrivees(p) {
    Object.keys(p.bonus).forEach(function (id) {
      var j = p.joueurs[Number(id)];
      if (j.rang === null) j.position = Math.max(0, Math.min(derniere(p), j.position + p.bonus[id]));
    });
    var arrives = enCourse(p).filter(function (j) { return j.position === derniere(p); });
    if (arrives.length) {
      var rang = prochainRang(p);
      arrives.forEach(function (j) { j.rang = rang; });
    }
  }

  function finirTour(p) {
    appliquerBonusEtArrivees(p);
    if (!enCourse(p).length) { p.phase = "fini"; return; }
    nouveauTour(p);
  }

  function terminer(p) {
    // Appelé pendant l'effort : les bonus déjà gagnés ce tour (cartes
    // validées mais tour pas encore terminé) doivent compter dans le
    // classement final, comme s'ils avaient été appliqués par finirTour.
    if (p.phase === "effort") appliquerBonusEtArrivees(p);
    var restants = enCourse(p).sort(function (a, b) { return b.position - a.position; });
    var base = prochainRang(p);
    restants.forEach(function (j, i) {
      j.rang = (i > 0 && restants[i - 1].position === j.position) ? restants[i - 1].rang : base + i;
    });
    p.phase = "fini";
  }

  function classement(p) { return p.joueurs.slice().sort(function (a, b) { return a.rang - b.rang || a.id - b.id; }); }

  var Regles = {
    creerPartie: creerPartie, demarrer: demarrer, joueurActif: joueurActif, lancer: lancer,
    choisir: choisir, enCourse: enCourse, derniere: derniere, carteDe: carteDe, valider: valider,
    utiliserPiolet: utiliserPiolet, terminer: terminer, classement: classement, continuer: continuer,
    _nouveauTour: nouveauTour
  };
  if (typeof module !== "undefined" && module.exports) module.exports = Regles;
  else global.Regles = Regles;
})(typeof globalThis !== "undefined" ? globalThis : this);
