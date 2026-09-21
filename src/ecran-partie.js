(function (global) {
  // Écran de partie : échauffement, lancers sur le plateau, fenêtres de choix
  // (col, bivouac, duel), effort simultané (une carte par joueur, minuteurs,
  // piolet, étapes collectives) et podium. Reprend la maquette validée
  // (maquettes/ecrans.html, vues 3 à 6). Le flux suit le moteur (src/regles.js).
  var Regles = (typeof require !== "undefined") ? require("./regles.js") : global.Regles;
  var F = (typeof require !== "undefined") ? require("./format.js") : global.Format;
  var RP = (typeof require !== "undefined") ? require("./rendu-plateau.js") : global.RenduPlateau;
  var R = (typeof require !== "undefined") ? require("./referentiel.js") : global.Referentiel;

  var JAUNE = "#E0A526";
  var CIRCONFERENCE = 138.2;          // anneau du minuteur : 2 × π × 22
  var VERROU_MS = 500;                // un double appui ne déclenche qu'une action

  // ------------------------------------------------------------ aides pures (testées sous Node)

  // Espaces insécables : « 30 s », « 2 750 m », « × 12 », « 2 cases » ne se coupent jamais.
  function insecable(t) {
    return String(t).replace(/(\d) (?=\d{3}\b)/g, "$1\u00a0").replace(/(\d) (?=[A-Za-zÀ-ÿ])/g, "$1\u00a0").replace(/× /g, "×\u00a0");
  }

  function altitude(m) { return insecable(String(m).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " m"); }

  // « × 10 / côté » → valeur « × 10 », côté « / côté » (affiché à part, plus petit).
  // Les consignes de duel (« Le plus de répétitions en 30 s ») restent un texte.
  function morceauxDosage(dosage) {
    var d = String(dosage || ""), cote = /\s*\/ côté$/.test(d);
    var valeur = d.replace(/\s*\/ côté$/, "");
    var texte = !/^(× ?\d+|\d+ (s|min))/.test(valeur);
    return { valeur: insecable(valeur), cote: cote ? "/ côté" : "", texte: texte, long: !texte && valeur.length > 6 };
  }

  function rang(n) { return { nombre: String(n), suffixe: n === 1 ? "er" : "e" }; }

  // Groupes du podium dans l'ordre d'affichage : 2e groupe à gauche, 1er au
  // centre, puis les suivants à droite (maquette : 2e ex aequo, 1er, 4e).
  function groupesPodium(classement) {
    var groupes = [];
    classement.forEach(function (j) {
      var g = groupes[groupes.length - 1];
      if (g && g.rang === j.rang) g.joueurs.push(j); else groupes.push({ rang: j.rang, joueurs: [j] });
    });
    if (groupes.length < 2) return groupes;
    return [groupes[1], groupes[0]].concat(groupes.slice(2));
  }

  // Cases vides du centre de la spirale : le premier bloc libre de deux lignes
  // et d'au moins 4 colonnes accueille le lancer, la ligne libre suivante la
  // liste des positions. Les colonnes retenues sont contiguës.
  function zonesLibres(n) {
    var g = RP.grille(n), pris = {};
    RP.spirale(n, g.colonnes, g.lignes).forEach(function (q) { pris[q[0] + "," + q[1]] = true; });
    function libres(l) { var res = []; for (var c = 0; c < g.colonnes; c++) if (!pris[l + "," + c]) res.push(c); return res; }
    function contigues(cols) {
      var res = cols.slice(0, 1);
      for (var i = 1; i < cols.length && cols[i] === cols[i - 1] + 1; i++) res.push(cols[i]);
      return res;
    }
    function bloc(cols, l, h) { return { l: l, c: cols[0], largeur: cols.length, hauteur: h }; }
    var coeur = null, liste = null;
    for (var l = 0; l < g.lignes - 1 && !coeur; l++) {
      var a = libres(l), b = contigues(libres(l + 1).filter(function (c) { return a.indexOf(c) !== -1; }));
      if (b.length >= 4) {
        coeur = bloc(b, l, 2);
        var suivante = l + 2 < g.lignes ? contigues(libres(l + 2)) : [];
        if (suivante.length) liste = bloc(suivante, l + 2, 1);
      }
    }
    return { g: g, coeur: coeur, liste: liste };
  }

  function nomChaine(p, id) { var c = p.ctx.bib.chaine(id); return c ? c.nom : ""; }

  // Ligne sous « X a fait 5 » : ce que la case d'arrivée a déclenché.
  function texteEffet(p, r) {
    var cases = p.plateau.cases, arrivee = r.arrivee, c = cases[arrivee], lieu = "case " + (arrivee + 1) + ", " + altitude(p.plateau.altitudes[arrivee]);
    var saut = r.effets.filter(function (e) { return e.type === "telecabine" || e.type === "avalanche"; })[0];
    var avant = saut ? (saut.type === "telecabine" ? "Télécabine : montée à la " : "Avalanche : descente à la ") + lieu : "";
    var suite;
    switch (c.type) {
      case "flocon": suite = "Flocon : relance le dé !"; break;
      case "col": suite = "Col : choix du passage."; break;
      case "bivouac": suite = "Bivouac : échange de place possible."; break;
      case "duel": suite = "Duel : choix de l'adversaire."; break;
      case "chamois": suite = "Chamois : un défi à l'effort."; break;
      case "crevasse": suite = "Crevasse : pas de lancer au prochain tour."; break;
      case "refuge": suite = "Refuge : repos pendant l'effort."; break;
      case "ravitaillement": suite = "Ravitaillement : pause boisson."; break;
      case "cordee": suite = "Cordée : exercice tous ensemble."; break;
      case "meteo": suite = "Météo : surprise à l'effort."; break;
      case "sommet": suite = "Sommet atteint, bravo !"; break;
      case "exercice": suite = saut ? "" : nomChaine(p, c.chaine) + ", " + lieu + "."; break;
      default: suite = "";
    }
    if (!avant) return suite;
    return avant + (suite && c.type !== "exercice" ? ". " + suite : ".");
  }

  function libelleType(p, c) {
    var j = p.joueurs[c.joueur], NOMS = RP.NOMS;
    if (c.recuperation) return "Récupération";
    // c.chaine (posé par carteExercice) est la chaîne réellement résolue,
    // après substitution éventuelle par un filtre de blessure : c'est elle
    // qu'il faut afficher, pas la chaîne d'origine de la case.
    if (c.type === "exercice") return nomChaine(p, c.chaine || p.plateau.cases[j.caseDuTour].chaine);
    if (c.type === "col") return "Col · " + (j.choixCol === "difficile" ? "difficile +3 cases" : "facile +1 case");
    if (c.type === "chamois") return "Chamois · défi +3 cases";
    if (c.type === "duel") return c.issue === "reussite" ? "Duel · défi +2 cases" : "Duel";
    if (c.type === "cordee") return c.bonus ? "Cordée · +" + c.bonus + " cases" : "Cordée";
    return NOMS[c.type] || "";
  }

  // ------------------------------------------------------------ écran

  function afficher(racine, o) {
    var UI = global.UI, doc = global.document;
    var p = o.partie, son = o.son;
    var tic = null, fermerModal = null, verrouJusqua = 0, dernier = null, quitte = false, panne = false;
    var minuteurs = [];               // { carte, m, bipe } : survivent aux redessins de l'étape

    function depuisHTML(html) { var d = doc.createElement("div"); d.innerHTML = html; return d.firstElementChild; }
    function picto(corps, taille, classe) {
      return depuisHTML('<svg class="picto' + (classe ? " " + classe : "") + '" width="' + taille + '" height="' + taille +
        '" viewBox="0 0 12 12" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' +
        corps + "</g></svg>");
    }
    var ICO = {
      son: '<polygon points="1.5,4.5 3.8,4.5 6.6,2 6.6,10 3.8,7.5 1.5,7.5"/><path d="M8.3,4.2 C9.1,5.2 9.1,6.8 8.3,7.8"/><path d="M9.8,2.9 C11.3,4.6 11.3,7.4 9.8,9.1"/>',
      muet: '<polygon points="1.5,4.5 3.8,4.5 6.6,2 6.6,10 3.8,7.5 1.5,7.5"/><line x1="8.4" y1="4.6" x2="11" y2="7.4"/><line x1="11" y1="4.6" x2="8.4" y2="7.4"/>',
      drapeau: '<line x1="3" y1="11" x2="3" y2="1.2"/><path d="M3,1.6 L9.6,3.4 L3,5.4"/>',
      materiel: '<line x1="1" y1="6" x2="11" y2="6"/><rect x="2.2" y="3.4" width="1.8" height="5.2" rx="0.4"/><rect x="8" y="3.4" width="1.8" height="5.2" rx="0.4"/>',
      piolet: '<line x1="3" y1="11" x2="7.6" y2="2.2"/><path d="M4.4,3 C6.6,1.2 9,1.4 11,3.4"/><line x1="7.6" y1="2.2" x2="8.6" y2="1.2"/>',
      retour: '<polyline points="6.5,2.5 3,6 6.5,9.5"/><line x1="3" y1="6" x2="10" y2="6"/>'
    };
    var POINTS = { 1: [[6, 6]], 2: [[3.2, 3.2], [8.8, 8.8]], 3: [[3.2, 3.2], [6, 6], [8.8, 8.8]],
      4: [[3.2, 3.2], [8.8, 3.2], [3.2, 8.8], [8.8, 8.8]], 5: [[3.2, 3.2], [8.8, 3.2], [6, 6], [3.2, 8.8], [8.8, 8.8]],
      6: [[3.4, 3], [8.6, 3], [3.4, 6], [8.6, 6], [3.4, 9], [8.6, 9]] };
    function de(valeur, taille) {
      var v = POINTS[valeur] ? valeur : 6;
      return depuisHTML('<svg class="de" width="' + taille + '" height="' + taille + '" viewBox="0 0 12 12" aria-label="Dé : ' + v + '">' +
        '<rect x="0.5" y="0.5" width="11" height="11" rx="2.2" fill="#FFFDF8" stroke="#3A2E22" stroke-width="0.45"/>' +
        POINTS[v].map(function (q) { return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="1.05" fill="#3A2E22"/>'; }).join("") + "</svg>");
    }
    function texteJoueur(j) { return String(j.couleur).toUpperCase() === JAUNE ? "#3A2E22" : "#FFFFFF"; }
    function styleJoueur(j) { return "--joueur:" + j.couleur + ";--joueur-texte:" + texteJoueur(j); }
    function pastille(j, taille) { return UI.el("span", { classe: "pastille-joueur", style: "--joueur:" + j.couleur + ";--taille:" + taille + "px" }); }
    function boutonNu(classe, action, enfants) { return UI.el("button", { type: "button", classe: classe, onclick: action }, enfants || []); }

    // ---------------------------------------------------------- sûreté

    function nettoyer() {
      if (tic !== null) { global.clearInterval(tic); tic = null; }
      if (fermerModal) { fermerModal(); fermerModal = null; }
    }

    // Démontage demandé par l'app avant un autre écran : plus de fenêtre,
    // plus d'intervalle, plus aucun rappel (sans appeler surQuitter).
    function detruire() {
      quitte = true;
      nettoyer();
      minuteurs = [];
    }

    function quitter() {
      if (quitte) return;
      quitte = true;
      nettoyer();
      minuteurs = [];
      o.surQuitter();
    }

    // Toute action du moteur passe par ici. Quand l'action change la disposition
    // de l'écran (joueur suivant, étape suivante...), les appuis des 500 ms
    // suivantes sont ignorés : un double appui ne retombe pas sur le bouton
    // redessiné du joueur suivant. Pendant l'effort, plusieurs joueurs peuvent
    // valider leur carte en même temps tant que l'étape ne change pas.
    // Une exception du moteur ne laisse jamais un écran vide ni un bouton
    // muet : l'écran « Petit souci » (Réessayer / Quitter) s'affiche.
    // libre : confirmation d'une fenêtre (Terminer, piolet). Elle demande deux
    // appuis à deux endroits distincts, le verrou ne doit pas l'avaler.
    function signature() {
      return [p.phase, p.tour, p.etape, p.lanceur, p.attente ? p.attente.type + p.attente.joueur : ""].join("|");
    }

    // forcer : verrouille même si la disposition ne change pas (flocon : le
    // même joueur relance, un double appui ne doit pas consommer sa relance).
    function agir(action, forcer, libre) {
      if (quitte || (!libre && Date.now() < verrouJusqua)) return false;
      var avant = signature();
      try { action(); } catch (e) {
        if (global.console) global.console.error(e);
        panne = true;
      }
      if (forcer || signature() !== avant) verrouJusqua = Date.now() + VERROU_MS;
      dessiner();
      return true;
    }

    function ouvrirModal(fermer) {
      if (fermerModal) fermerModal();
      fermerModal = fermer;
    }

    function confirmerQuitter() {
      confirmer("Quitter la partie ?", "La partie en cours sera perdue.", [
        { texte: "Annuler" }, { texte: "Quitter", classe: "bouton-principal", action: quitter }]);
    }

    function confirmer(titre, texte, choix) {
      ouvrirModal(UI.modal(titre, texte, choix.map(function (c) {
        return { texte: c.texte, classe: c.classe, action: c.action ? function () { fermerModal = null; c.action(); } : function () { fermerModal = null; } };
      })));
    }

    // ---------------------------------------------------------- bandeau

    function boutonSon() {
      var b = boutonNu("bouton bouton-discret", function () {
        son.debloquer();
        son.basculer();
        remplir();
      });
      function remplir() {
        UI.vider(b);
        b.appendChild(picto(son.actif() ? ICO.son : ICO.muet, 26));
        b.appendChild(doc.createTextNode(son.actif() ? "Son" : "Muet"));
      }
      remplir();
      return b;
    }

    function boutonTerminer() {
      return boutonNu("bouton", function () {
        confirmer("Terminer la partie ?", "Le classement se fait selon la position de chacun.", [
          { texte: "Annuler" },
          { texte: "Quitter sans podium", action: confirmerQuitter },
          { texte: "Terminer", classe: "bouton-principal", action: function () {
            agir(function () { if (p.phase !== "fini") Regles.terminer(p); }, false, true);
          } }
        ]);
      }, [picto(ICO.drapeau, 24), doc.createTextNode("Terminer")]);
    }

    function boutonQuitter() {
      return boutonNu("bouton bouton-discret", confirmerQuitter, [picto(ICO.retour, 24), doc.createTextNode("Quitter")]);
    }

    function bandeau(gauche, droite) {
      return UI.el("header", { classe: "bandeau" }, [
        UI.el("div", { classe: "bandeau-gauche" }, gauche),
        UI.el("div", { classe: "bandeau-droite" }, droite)
      ]);
    }

    function sousPlateau() { return R.ZONES[p.plateau.zone].libelle + " · Plateau " + p.plateau.niveau; }

    // ---------------------------------------------------------- échauffement

    function ecranEchauffement() {
      var lignes = (p.ctx.ev.echauffements[p.plateau.zone] || []).map(function (l) {
        var k = l.lastIndexOf(" : ");
        var nom = k === -1 ? l : l.slice(0, k), dose = k === -1 ? "" : l.slice(k + 3), m = morceauxDosage(dose);
        return UI.el("li", { classe: "echauffement-ligne" }, [
          UI.el("span", { classe: "echauffement-nom", texte: nom }),
          dose ? UI.el("span", { classe: "echauffement-dose" }, [doc.createTextNode(m.valeur), m.cote ? UI.el("small", { texte: m.cote }) : null]) : null
        ]);
      });
      return UI.el("section", { classe: "ecran ecran-echauffement" }, [
        bandeau([
          UI.el("h2", { classe: "titre-ecran", texte: "Échauffement" }),
          UI.el("p", { classe: "bandeau-sous bandeau-sous-ligne", texte: "Tous ensemble, avant le premier lancer" })
        ], [UI.el("p", { classe: "bandeau-sous", texte: sousPlateau() }), boutonSon(), boutonQuitter()]),
        UI.el("main", { classe: "echauffement" }, [UI.el("ol", { classe: "echauffement-liste" }, lignes)]),
        UI.el("footer", { classe: "pied" }, [
          UI.el("div", { classe: "echauffement-joueurs" }, p.joueurs.map(function (j) {
            return UI.el("span", { classe: "echauffement-joueur" }, [pastille(j, 24), UI.el("b", { texte: j.prenom })]);
          })),
          UI.el("button", { type: "button", classe: "bouton bouton-principal bouton-large", texte: "C'est parti",
            onclick: function () { son.debloquer(); agir(function () { if (p.phase === "echauffement") Regles.demarrer(p); }); } })
        ])
      ]);
    }

    // ---------------------------------------------------------- lancer

    function placer(bloc, g) {
      var T = 170, L = g.colonnes * T, H = g.lignes * T;
      return "left:" + ((bloc.c * T + 5) / L * 100) + "%;top:" + ((bloc.l * T + 5) / H * 100) + "%;width:" +
        ((bloc.largeur * T - 10) / L * 100) + "%;height:" + ((bloc.hauteur * T - 10) / H * 100) + "%";
    }

    function coeurLancer(actif) {
      var enfants = [];
      if (dernier && dernier.tour === p.tour) {
        var j = p.joueurs[dernier.r.joueur];
        enfants.push(UI.el("div", { classe: "lancer-de" }, [de(dernier.r.de, 132)]));
        var effet = dernier.effet;
        var sautOuFlocon = dernier.r.effets.length ? dernier.r.effets[0].type : null;
        enfants.push(UI.el("div", { classe: "lancer-texte" }, [
          UI.el("p", { classe: "lancer-sur", texte: "Dernier lancer" }),
          UI.el("p", { classe: "lancer-res" }, [UI.el("b", { style: "color:" + j.couleur, texte: j.prenom }), doc.createTextNode(" a fait " + dernier.r.de)]),
          effet ? UI.el("p", { classe: "lancer-effet" }, [
            RP.ICONES[sautOuFlocon] ? picto(RP.ICONES[sautOuFlocon], 22) : null, doc.createTextNode(effet)]) : null
        ]));
      } else {
        var bloques = p.joueurs.filter(function (k) { return k.rang === null && k.passeCrevasse; });
        enfants.push(UI.el("div", { classe: "lancer-de" }, [de(6, 132)]));
        enfants.push(UI.el("div", { classe: "lancer-texte" }, [
          UI.el("p", { classe: "lancer-sur", texte: "Tour " + p.tour }),
          UI.el("p", { classe: "lancer-res", texte: p.tour === 1 ? "En route" : "Nouveau tour" }),
          UI.el("p", { classe: "lancer-effet", texte: bloques.length
            ? bloques.map(function (k) { return k.prenom; }).join(", ") + (bloques.length > 1 ? " restent" : " reste") + " dans la crevasse ce tour."
            : "Chacun lance à son tour, puis place à l'effort." })
        ]));
      }
      if (actif) {
        enfants.push(boutonNu("bouton bouton-principal bouton-lancer", function () {
          son.debloquer();
          agir(function () {
            if (Regles.joueurActif(p) !== actif) return;       // état changé entre-temps
            var r = Regles.lancer(p);
            dernier = { tour: p.tour, r: r, effet: insecable(texteEffet(p, r)) };
          }, true);
        }, [de(6, 40), doc.createTextNode("Lancer le dé")]));
      }
      return enfants;
    }

    function listePositions() {
      return p.joueurs.slice().sort(function (a, b) { return b.position - a.position || a.id - b.id; }).map(function (j) {
        return UI.el("p", {}, [pastille(j, 18), UI.el("b", { texte: j.prenom }),
          UI.el("span", { texte: j.rang !== null ? "Sommet" : altitude(p.plateau.altitudes[j.position]) })]);
      });
    }

    function ecranLancer() {
      var actif = Regles.joueurActif(p), z = zonesLibres(p.plateau.cases.length);
      var cadre = UI.el("div", { classe: "plateau-cadre", style: "--colonnes:" + z.g.colonnes + ";--lignes:" + z.g.lignes });
      cadre.innerHTML = RP.svg(p.plateau, p.joueurs, p.ctx.bib, actif ? actif.id : (p.attente ? p.attente.joueur : null));
      if (z.coeur) cadre.appendChild(UI.el("div", { classe: "coeur", style: placer(z.coeur, z.g) }, coeurLancer(actif)));
      if (z.liste) cadre.appendChild(UI.el("div", { classe: "cordee-liste", style: placer(z.liste, z.g) }, listePositions()));

      var gauche, lanceur = p.attente ? p.joueurs[p.attente.joueur] : null;
      if (lanceur && dernier && dernier.tour === p.tour && dernier.r.joueur === lanceur.id) {
        gauche = [pastille(lanceur, 40), UI.el("h2", { classe: "titre-tour" }, [
          UI.el("b", { style: "color:" + lanceur.couleur, texte: lanceur.prenom }), doc.createTextNode(" a fait " + dernier.r.de)])];
      } else if (lanceur) {
        gauche = [pastille(lanceur, 40), UI.el("h2", { classe: "titre-tour" }, [doc.createTextNode("À "),
          UI.el("b", { style: "color:" + lanceur.couleur, texte: lanceur.prenom }), doc.createTextNode(" de choisir")])];
      } else if (actif) {
        gauche = [pastille(actif, 40), UI.el("h2", { classe: "titre-tour" }, [doc.createTextNode("À "),
          UI.el("b", { style: "color:" + actif.couleur, texte: actif.prenom }), doc.createTextNode(" de lancer")])];
      } else {
        gauche = [UI.el("h2", { classe: "titre-ecran", texte: "Le plateau" })];
      }
      var sous = UI.el("p", { classe: "bandeau-sous" }, [doc.createTextNode(sousPlateau()), doc.createElement("br"), doc.createTextNode("Tour " + p.tour)]);
      return UI.el("section", { classe: "ecran ecran-jeu" }, [
        bandeau(gauche, [sous, boutonSon(), boutonTerminer()]),
        UI.el("main", { classe: "plateau" }, [cadre]),
        // Plateau sans centre libre (aucun aujourd'hui) : le lancer reste accessible sous le plateau.
        z.coeur ? null : UI.el("div", { classe: "coeur coeur-secours" }, coeurLancer(actif))
      ]);
    }

    // Fenêtre de choix : une seule à la fois (ouvrirModal ferme la précédente,
    // chaque redessin la reconstruit), et une seule réponse par fenêtre.
    function demanderChoix() {
      var a = p.attente, j = p.joueurs[a.joueur], c = p.plateau.cases[j.caseDuTour];
      var repondu = false, fond;
      function fermer() { if (fond.parentNode) fond.parentNode.removeChild(fond); }
      function choisir(valeur) {
        if (repondu) return;
        repondu = agir(function () {
          if (p.attente !== a) return;
          Regles.choisir(p, valeur);
          if (a.type === "bivouac" && dernier) dernier.effet = "Bivouac : échange de place avec " + p.joueurs[valeur].prenom + ".";
          if (a.type === "duel" && dernier) dernier.effet = "Duel contre " + p.joueurs[valeur].prenom + " à l'effort.";
          if (a.type === "col" && dernier) dernier.effet = valeur === "difficile" ? "Col : passage difficile, +3 cases." : "Col : passage facile, +1 case.";
        });
      }
      var titre, sur = "Case " + (j.caseDuTour + 1) + " · " + altitude(p.plateau.altitudes[j.caseDuTour]), question, boutons;
      if (a.type === "col") {
        titre = "Le col"; sur += " · " + nomChaine(p, c.chaine); question = j.prenom + ", par où passes-tu le col ?";
        boutons = [
          boutonNu("bouton choix-bouton", function () { choisir("facile"); }, [
            UI.el("span", { classe: "choix-titre", texte: "Facile, +1 case" }), UI.el("span", { classe: "choix-detail", texte: "Le dosage normal de ton exercice" })]),
          boutonNu("bouton choix-bouton choix-difficile", function () { choisir("difficile"); }, [
            UI.el("span", { classe: "choix-titre", texte: "Difficile, +3 cases" }), UI.el("span", { classe: "choix-detail", texte: "Même exercice, volume × 1,5" })])
        ];
      } else {
        if (a.type === "duel") {
          var def = p.ctx.ev.duels.filter(function (d) { return d.id === c.duel; })[0];
          titre = "Le duel"; if (def) sur += " · " + def.titre; question = j.prenom + ", qui défies-tu ?";
        } else {
          titre = "Le bivouac"; question = j.prenom + ", avec qui échanges-tu ta place ?";
        }
        boutons = a.options.map(function (id) {
          var k = p.joueurs[id];
          return boutonNu("bouton choix-bouton bouton-joueur", function () { choisir(id); }, [
            UI.el("span", { classe: "choix-titre", style: "--joueur:" + k.couleur, texte: k.prenom }),
            UI.el("span", { classe: "choix-detail", texte: insecable("Case " + (k.position + 1) + ", " + altitude(p.plateau.altitudes[k.position])) })]);
        });
        boutons.forEach(function (b, i) { b.setAttribute("style", "--joueur:" + p.joueurs[a.options[i]].couleur); });
      }
      fond = UI.el("div", { classe: "modal-fond" }, [
        UI.el("div", { classe: "modal", role: "dialog" }, [
          UI.el("div", { classe: "modal-entete" }, [
            picto(RP.ICONES[a.type], 64, "picto-clair"),
            UI.el("div", {}, [UI.el("p", { classe: "modal-sur", texte: insecable(sur) }), UI.el("h2", { classe: "modal-titre", texte: titre })]),
            pastille(j, 44)
          ]),
          UI.el("div", { classe: "modal-corps" }, [
            UI.el("p", { classe: "modal-question", texte: question }),
            UI.el("div", { classe: "choix" }, boutons)
          ])
        ])
      ]);
      doc.body.appendChild(fond);
      ouvrirModal(fermer);
    }

    // ---------------------------------------------------------- effort

    function minuteurDe(c) {
      for (var i = 0; i < minuteurs.length; i++) if (minuteurs[i].carte === c) return minuteurs[i];
      var e = { carte: c, m: global.Minuteur.creer(c.secondes), bipe: false };
      minuteurs.push(e);
      return e;
    }

    function blocMinuteur(c) {
      var e = minuteurDe(c);
      var anneau = depuisHTML('<svg class="minuteur-anneau" viewBox="0 0 52 52" width="52" height="52"><circle cx="26" cy="26" r="22" class="fond"/>' +
        '<circle cx="26" cy="26" r="22" class="reste" stroke-dasharray="' + CIRCONFERENCE + " " + CIRCONFERENCE + '" transform="rotate(-90 26 26)"/></svg>');
      var temps = UI.el("span", { classe: "minuteur-temps" });
      var bloc = UI.el("div", { classe: "minuteur" }, [anneau, temps]);
      var bouton = UI.bouton("", function () {
        son.debloquer();
        var t = Date.now();
        if (e.m.enMarche) e.m.pause(t); else { e.m.demarrer(t); e.bipe = false; }
        e.maj();
      }, "bouton-minuteur");
      bloc.appendChild(bouton);
      e.maj = function () {
        var t = Date.now(), reste = e.m.restant(t);
        if (reste === 0 && e.m.enMarche) {
          e.m.pause(t);
          if (!e.bipe) { e.bipe = true; son.bip(); }
        }
        temps.textContent = insecable(F.duree(reste));
        anneau.lastChild.setAttribute("stroke-dasharray", (CIRCONFERENCE * reste / c.secondes).toFixed(1) + " " + CIRCONFERENCE);
        bloc.className = "minuteur" + (e.m.enMarche ? " en-cours" : "");
        bouton.textContent = e.m.enMarche ? "Pause" : reste === 0 ? "Encore" : reste === c.secondes ? "Démarrer" : "Reprendre";
      };
      e.maj();
      return bloc;
    }

    // Carte encore à valider dans l'étape affichée : un appui sur un bouton
    // périmé (double appui, étape déjà passée) ne touche jamais au moteur.
    function aValider(c) {
      return !c.fait && p.phase === "effort" && p.etapes[p.etape].cartes.indexOf(c) !== -1;
    }

    function valider(c, issue) {
      agir(function () { if (aValider(c)) Regles.valider(p, c.joueur, issue); });
    }

    function actions(c, j) {
      if (c.fait) {
        var bilan = c.piolet ? "Piolet utilisé" : c.type === "sommet" ? "Au sommet" : c.type === "refuge" ? "Au repos"
          : c.issue === "reussite" ? (c.resultat ? "Réussi" : "Raté")
          : c.issue === "gagnant" ? "Gagnant : " + p.joueurs[c.resultat].prenom : "Fait";
        return UI.el("p", { classe: "carte-bilan", texte: bilan });
      }
      var zone = UI.el("div", { classe: "carte-actions" });
      if (c.issue === "reussite") {
        zone.appendChild(UI.bouton("Réussi", function () { valider(c, true); }, "bouton-principal"));
        zone.appendChild(UI.bouton("Raté", function () { valider(c, false); }));
      } else if (c.issue === "gagnant") {
        c.options.forEach(function (id) {
          var k = p.joueurs[id];
          zone.appendChild(UI.el("button", { type: "button", classe: "bouton bouton-joueur", style: "--joueur:" + k.couleur, texte: k.prenom,
            onclick: function () { valider(c, id); } }));
        });
      } else {
        zone.appendChild(UI.bouton("Fait", function () { valider(c); }, "bouton-principal bouton-fait"));
      }
      if (c.pioletPossible && j.piolet) {
        zone.appendChild(boutonNu("lien-piolet", function () {
          confirmer("Piolet de " + j.prenom + " ?", "L'exercice est passé sans être fait. Un seul piolet par partie.", [
            { texte: "Annuler" },
            { texte: "Utiliser", classe: "bouton-principal", action: function () {
              agir(function () { if (aValider(c) && p.joueurs[c.joueur].piolet) Regles.utiliserPiolet(p, c.joueur); }, false, true);
            } }]);
        }, [picto(ICO.piolet, 22), doc.createTextNode("Piolet")]));
      }
      return zone;
    }

    function objectif(c) {
      if (c.issue === "gagnant") {
        var autre = p.joueurs[c.options[0] === c.joueur ? c.options[1] : c.options[0]];
        return "Duel contre " + autre.prenom + " : qui a gagné ?";
      }
      return c.objectif;
    }

    function carte(c) {
      var j = p.joueurs[c.joueur], m = morceauxDosage(c.dosage), type = libelleType(p, c);
      var icone = RP.ICONES[c.type] && c.type !== "exercice" && !c.recuperation ? picto(RP.ICONES[c.type], 18) : UI.el("span", { classe: "puce-exo" });
      var enCours = !c.fait;
      var bas = [
        c.dosage ? UI.el("p", { classe: "carte-dosage" + (m.texte ? " carte-dosage-texte" : "") + (m.long ? " carte-dosage-long" : "") },
          [doc.createTextNode(m.valeur), m.cote ? UI.el("small", { texte: m.cote }) : null]) : null,
        enCours && c.charge ? UI.el("p", { classe: "carte-charge", texte: insecable(c.charge) }) : null,
        enCours && c.secondes ? blocMinuteur(c) : null,
        enCours && objectif(c) ? UI.el("p", { classe: "carte-objectif", texte: insecable(objectif(c)) }) : null,
        actions(c, j)
      ];
      return UI.el("article", { classe: "carte" + (c.fait ? " faite" : ""), style: styleJoueur(j) }, [
        UI.el("header", { classe: "carte-entete" }, [
          UI.el("span", { classe: "carte-prenom", texte: j.prenom }),
          UI.el("span", { classe: "carte-niveau", texte: "Niveau " + j.niveau })
        ]),
        UI.el("div", { classe: "carte-corps" }, [
          type ? UI.el("p", { classe: "carte-type" }, [icone, doc.createTextNode(type)]) : null,
          UI.el("h3", { classe: "carte-titre", texte: c.titre }),
          UI.el("p", { classe: "carte-description", texte: insecable(c.description) }),
          c.materiel ? UI.el("p", { classe: "carte-materiel" }, [picto(ICO.materiel, 18), doc.createTextNode(c.materiel)]) : null,
          UI.el("div", { classe: "carte-bas" }, bas)
        ])
      ]);
    }

    function ecranEffort() {
      var e = p.etapes[p.etape], total = p.etapes.length;
      var suite = total > 1 ? " · étape " + (p.etape + 1) + " sur " + total : "";
      var droite = [boutonSon(), boutonTerminer()];
      // Les cartes déjà validées d'une autre étape n'ont plus de minuteur.
      minuteurs = minuteurs.filter(function (x) { return !x.carte.fait && e.cartes.indexOf(x.carte) !== -1; });

      // Une cordée ou une météo remplace l'effort individuel de tout le monde :
      // un col, un duel ou un chamois déjà atterri ce tour perd son choix et
      // son bonus (cf. p.collectifAnnuleChoixIndividuels, posé par
      // Regles.construireEffort). On ne l'annonce que quand c'est vrai, et
      // une seule fois par tour : quand plusieurs étapes collectives
      // s'enchaînent (cf. « deux événements collectifs le même tour »), seule
      // la première (p.etape === 0) l'affiche.
      var texteAnnulation = "Le col, le duel ou le défi chamois de ce tour sont annulés.";
      var annoncerAnnulation = p.etape === 0 && p.collectifAnnuleChoixIndividuels;

      if (!e.cartes.length) {
        return UI.el("section", { classe: "ecran ecran-effort" }, [
          bandeau([UI.el("h2", { classe: "titre-ecran", texte: "Météo" }),
            UI.el("p", { classe: "bandeau-sous bandeau-sous-ligne", texte: "Tour " + p.tour + suite })], droite),
          UI.el("main", { classe: "etape-seule" }, [
            picto(RP.ICONES.meteo, 110, "etape-picto"),
            UI.el("h1", { classe: "etape-titre", texte: e.titre }),
            UI.el("p", { classe: "etape-texte", texte: insecable(e.texte) }),
            annoncerAnnulation ? UI.el("p", { classe: "etape-annulation", texte: texteAnnulation }) : null,
            UI.el("button", { type: "button", classe: "bouton bouton-principal bouton-large", texte: "Continuer",
              onclick: function () { agir(function () { if (p.phase === "effort" && p.etapes[p.etape] === e) Regles.continuer(p); }); } })
          ])
        ]);
      }

      var titre = e.type === "individuel" ? "L'effort" : e.titre;
      var sous = e.type === "individuel" ? "Tour " + p.tour + " · chacun sa carte, puis « Fait »" : "Tour " + p.tour + suite + " · tous ensemble";
      var enfants = [bandeau([UI.el("h2", { classe: "titre-ecran", texte: titre }),
        UI.el("p", { classe: "bandeau-sous bandeau-sous-ligne", texte: sous })], droite)];
      if (e.type !== "individuel" && e.texte) {
        enfants.push(UI.el("p", { classe: "etape-bandeau" }, [picto(RP.ICONES[e.type], 26), doc.createTextNode(insecable(e.texte))]));
      }
      if (e.type !== "individuel" && annoncerAnnulation) {
        enfants.push(UI.el("p", { classe: "etape-annulation", texte: texteAnnulation }));
      }
      enfants.push(UI.el("main", { classe: "cartes cartes-" + e.cartes.length }, e.cartes.map(carte)));
      var ecran = UI.el("section", { classe: "ecran ecran-effort" }, enfants);
      if (minuteurs.length) {
        tic = global.setInterval(function () {
          // Écran retiré sans passer par Quitter (racine vidée par l'app) : plus aucun bip.
          if (quitte || !doc.documentElement.contains(ecran)) { nettoyer(); minuteurs = []; return; }
          // e.maj() déclenche son.bip() : une exception (Web Audio sur iOS,
          // par exemple) ne doit jamais remonter jusqu'à window.onerror, sinon
          // le filet d'erreur global tue une partie par ailleurs saine.
          minuteurs.forEach(function (x) {
            if (x.carte.fait || !x.maj) return;
            try { x.maj(); } catch (err) { if (global.console) global.console.error(err); }
          });
        }, 200);
      }
      return ecran;
    }

    // ---------------------------------------------------------- podium

    function ecranPodium() {
      minuteurs = [];
      var groupes = groupesPodium(Regles.classement(p)), derniere = Regles.derniere(p);
      var tousAuSommet = p.joueurs.every(function (j) { return j.position === derniere; });
      var marches = groupes.map(function (g) {
        var premier = g.rang === groupes.reduce(function (min, x) { return Math.min(min, x.rang); }, Infinity);
        var base = g.rang === 1 ? 124 : g.rang === 2 ? 96 : 84;
        var taille = g.joueurs.length > 1 ? Math.min(base, 96) : base;
        var largeur = Math.max(groupes.length > 3 ? 200 : 260, g.joueurs.length * (taille + 28));
        var r = rang(g.rang);
        return UI.el("div", { classe: "marche marche-" + Math.min(g.rang, 4), style: "width:" + largeur + "px" }, [
          UI.el("div", { classe: "marche-grimpeurs" }, [premier ? picto(ICO.drapeau, 40, "podium-drapeau") : null].concat(g.joueurs.map(function (j) {
            return UI.el("span", { classe: "grimpeur", style: styleJoueur(j) + ";--taille:" + taille + "px" }, [
              UI.el("i", { texte: j.prenom.charAt(0).toUpperCase() }), UI.el("b", { texte: j.prenom })]);
          }))),
          UI.el("div", { classe: "marche-bloc" }, [
            UI.el("span", { classe: "marche-rang" }, [doc.createTextNode(r.nombre), UI.el("sup", { texte: r.suffixe })]),
            g.joueurs.length > 1 ? UI.el("span", { classe: "marche-note", texte: "ex aequo" }) : null
          ])
        ]);
      });
      var montagne = depuisHTML('<svg class="podium-montagne" viewBox="0 0 1180 520" preserveAspectRatio="none" aria-hidden="true">' +
        '<polyline class="m2" points="0,430 140,330 230,380 380,250 470,300 590,120 700,230 790,190 930,320 1040,270 1180,380"/>' +
        '<polyline class="m1" points="0,520 0,470 180,390 300,440 450,340 590,410 760,320 900,400 1050,350 1180,420 1180,520"/></svg>');
      var tours = p.tour + (p.tour > 1 ? " tours" : " tour");
      return UI.el("section", { classe: "ecran ecran-podium" }, [
        montagne,
        UI.el("header", { classe: "podium-tete" }, [
          UI.el("p", { classe: "surtitre", texte: "Grande Motte · " + altitude(p.plateau.altitudes[derniere]) }),
          UI.el("h1", { classe: "titre-podium", texte: "Au sommet" }),
          UI.el("p", { classe: "sous-titre", texte: (tousAuSommet ? "Partie terminée en " + tours : "Partie arrêtée au tour " + p.tour) +
            " sur le plateau " + sousPlateau().replace(" · Plateau", "") + "." })
        ]),
        UI.el("main", { classe: "podium podium-" + groupes.length }, marches),
        UI.el("footer", { classe: "podium-pied" }, [
          UI.el("button", { type: "button", classe: "bouton bouton-principal bouton-large", texte: "Nouvelle partie", onclick: quitter })
        ])
      ]);
    }

    // ---------------------------------------------------------- secours

    function ecranErreur(texte) {
      return UI.el("section", { classe: "ecran ecran-erreur" }, [
        UI.el("main", { classe: "etape-seule" }, [
          UI.el("h1", { classe: "etape-titre", texte: "Petit souci" }),
          UI.el("p", { classe: "etape-texte", texte: texte || "L'écran n'a pas pu s'afficher. La partie est conservée." }),
          UI.el("div", { classe: "erreur-boutons" }, [
            UI.bouton("Réessayer", function () { dessiner(); }, "bouton-principal bouton-large"),
            UI.bouton("Quitter", confirmerQuitter, "bouton-large")
          ])
        ])
      ]);
    }

    // Carte trop remplie (description longue, charge, minuteur, objectif et
    // piolet) : typographie plus compacte plutôt qu'un bouton rogné en bas.
    function resserrer() {
      [].forEach.call(racine.querySelectorAll(".carte"), function (a) {
        var corps = a.querySelector(".carte-corps");
        if (corps && corps.scrollHeight > corps.clientHeight + 1) a.className += " carte-serree";
      });
    }

    function dessiner() {
      if (quitte) return;
      nettoyer();
      UI.vider(racine);
      if (panne) {
        // Action refusée par le moteur : message visible plutôt qu'un bouton
        // qui ne fait rien. « Réessayer » redessine l'état courant.
        panne = false;
        racine.appendChild(ecranErreur("L'action n'a pas abouti. La partie est conservée."));
        return;
      }
      try {
        var corps = p.phase === "echauffement" ? ecranEchauffement()
          : p.phase === "lancer" ? ecranLancer()
          : p.phase === "effort" ? ecranEffort() : ecranPodium();
        racine.appendChild(corps);
        if (p.phase === "effort") resserrer();
        if (p.phase === "lancer" && p.attente) demanderChoix();
      } catch (e) {
        if (global.console) global.console.error(e);
        nettoyer();
        UI.vider(racine);
        racine.appendChild(ecranErreur());
      }
    }
    dessiner();
    return { detruire: detruire };
  }

  var EcranPartie = { afficher: afficher, insecable: insecable, morceauxDosage: morceauxDosage, rang: rang,
    groupesPodium: groupesPodium, zonesLibres: zonesLibres, texteEffet: texteEffet, libelleType: libelleType };
  if (typeof module !== "undefined" && module.exports) module.exports = EcranPartie;
  else global.EcranPartie = EcranPartie;
})(typeof globalThis !== "undefined" ? globalThis : this);
