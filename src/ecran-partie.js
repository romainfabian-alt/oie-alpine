(function (global) {
  // Écran de partie : échauffement, lancers sur le plateau, fenêtres de choix
  // (col, bivouac, duel), effort simultané (une carte par joueur, minuteurs,
  // piolet, étapes collectives) et podium. Reprend la maquette validée
  // (maquettes/ecrans.html, vues 3 à 6). Le flux suit le moteur (src/regles.js).
  var Regles = (typeof require !== "undefined") ? require("./regles.js") : global.Regles;
  var F = (typeof require !== "undefined") ? require("./format.js") : global.Format;
  var RP = (typeof require !== "undefined") ? require("./rendu-plateau.js") : global.RenduPlateau;
  var R = (typeof require !== "undefined") ? require("./referentiel.js") : global.Referentiel;
  var DP = (typeof require !== "undefined") ? require("./deplacement.js") : global.Deplacement;
  var A = (typeof require !== "undefined") ? require("./aleatoire.js") : global.Aleatoire;

  var JAUNE = "#E0A526";
  var ROULE_MS = 640;                 // durée du roulé du dé, cf. « de-roule » en CSS
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
    var anim = null;                  // animation du pion en cours, cf. presentation()
    var animDe = null;                // recherche de la face du dé pendant le roulé
    var deNode = null, deBloc = null; // face du dé et bloc animé du cœur
    var ligneEffet = null;            // phrase d'effet du cœur, révélée à l'arrivée
    // Hasard de l'affichage seulement : surtout pas celui du moteur, qui
    // tire les exercices et ne doit pas dépendre de ce qui est animé.
    var aleaEcran = A.creer(Date.now() % 4294967296);
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
    // Le dé porte toujours six pastilles : changer de face ne fait que
    // déplacer celles qui servent et mettre les autres à un rayon nul. Aucun
    // nœud n'est recréé, donc le roulé CSS en cours n'est jamais relancé.
    function poserFace(svgDe, valeur) {
      var v = POINTS[valeur] ? valeur : 6, pts = POINTS[v], cercles = svgDe.getElementsByTagName("circle"), i;
      for (i = 0; i < 6; i++) {
        if (i < pts.length) {
          cercles[i].setAttribute("cx", pts[i][0]);
          cercles[i].setAttribute("cy", pts[i][1]);
          cercles[i].setAttribute("r", "1.05");
        } else {
          cercles[i].setAttribute("r", "0");
        }
      }
      svgDe.setAttribute("aria-label", "Dé : " + v);
    }

    function de(valeur, taille) {
      var pastilles = "", i;
      for (i = 0; i < 6; i++) pastilles += '<circle cx="6" cy="6" r="0" fill="#3A2E22"/>';
      var svgDe = depuisHTML('<svg class="de" width="' + taille + '" height="' + taille + '" viewBox="0 0 12 12">' +
        '<rect x="0.5" y="0.5" width="11" height="11" rx="2.2" fill="#FFFDF8" stroke="#3A2E22" stroke-width="0.45"/>' +
        pastilles + "</svg>");
      poserFace(svgDe, valeur);
      return svgDe;
    }
    function texteJoueur(j) { return String(j.couleur).toUpperCase() === JAUNE ? "#3A2E22" : "#FFFFFF"; }
    function styleJoueur(j) { return "--joueur:" + j.couleur + ";--joueur-texte:" + texteJoueur(j); }
    function pastille(j, taille) { return UI.el("span", { classe: "pastille-joueur", style: "--joueur:" + j.couleur + ";--taille:" + taille + "px" }); }
    function boutonNu(classe, action, enfants) { return UI.el("button", { type: "button", classe: classe, onclick: action }, enfants || []); }

    // ---------------------------------------------------------- sûreté

    function nettoyer() {
      if (tic !== null) { global.clearInterval(tic); tic = null; }
      // L'animation du pion est simplement suspendue : dernier.i garde l'image
      // atteinte, et ecranLancer la reprend là où elle en était si l'écran est
      // redessiné entre-temps (son coupé, fenêtre fermée...).
      if (anim) { anim.arreter(); anim = null; }
      // Le dé : le cœur est reconstruit par le redessin qui suit, avec la
      // vraie face et sans classe d'animation, donc arrêter suffit.
      if (animDe) { animDe.arreter(); animDe = null; }
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

    // Chrono des lignes d'échauffement en secondes (« 45 s ») : une fausse
    // carte par ligne, gardée d'un redessin à l'autre pour que le temps
    // écoulé survive (son coupé, fenêtre fermée...). Retour de Romain du 29/09.
    var chronosEchauffement = {};
    function chronoEchauffement(i, dose) {
      var s = /^(\d+) s$/.exec(dose);
      if (!s) return null;
      if (!chronosEchauffement[i]) chronosEchauffement[i] = { secondes: Number(s[1]), fait: false };
      return chronosEchauffement[i];
    }

    // Rafraîchit les minuteurs affichés tant que l'écran est en place.
    function lancerTic(ecran) {
      if (!minuteurs.length) return;
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

    function ecranEchauffement() {
      var lignes = (p.ctx.ev.echauffements[p.plateau.zone] || []).map(function (l, i) {
        var k = l.lastIndexOf(" : ");
        var nom = k === -1 ? l : l.slice(0, k), dose = k === -1 ? "" : l.slice(k + 3), m = morceauxDosage(dose);
        var chrono = chronoEchauffement(i, dose);
        return UI.el("li", { classe: "echauffement-ligne" + (chrono ? " echauffement-ligne-chrono" : "") }, [
          UI.el("span", { classe: "echauffement-nom", texte: nom }),
          chrono ? blocMinuteur(chrono)
            : dose ? UI.el("span", { classe: "echauffement-dose" }, [doc.createTextNode(m.valeur), m.cote ? UI.el("small", { texte: m.cote }) : null]) : null
        ]);
      });
      var ecran = UI.el("section", { classe: "ecran ecran-echauffement" }, [
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
      lancerTic(ecran);
      return ecran;
    }

    // ---------------------------------------------------------- présentation du lancer

    // Après un lancer, l'écran reste sur le plateau : le dé se lit, le pion
    // avance case par case, puis seulement la partie continue. Trois vues :
    //   "anime"  : le pion se déplace, aucun bouton, aucune fenêtre de choix ;
    //   "cartes" : déplacement fini et effort commencé côté moteur, un grand
    //              bouton fait passer aux cartes ;
    //   null     : écran de lancer habituel (au suivant de lancer, ou choix).
    function presentation() {
      if (!dernier || dernier.tour !== p.tour || !dernier.vue) return null;
      if (p.phase !== "lancer" && p.phase !== "effort") return null;   // terminé, podium
      return dernier.vue;
    }

    function mouvementReduit() {
      try { return !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches); }
      catch (e) { return false; }
    }

    // La phrase d'effet n'est montrée qu'une fois le pion posé : pendant la
    // marche, annoncer « Télécabine : montée à la case 19 » dirait l'arrivée
    // avant qu'elle ait lieu. La place reste réservée (visibilité seulement),
    // donc le cœur ne saute pas quand la phrase apparaît.
    function effetVisible() {
      if (!dernier || !dernier.images) return true;
      return DP.effetVisible(dernier.i, dernier.images.length);
    }

    function classeEffet() { return "lancer-effet" + (effetVisible() ? "" : " lancer-effet-cache"); }

    // Vue qui suit la fin d'un déplacement : bouton vers les cartes si le
    // moteur est passé à l'effort, sinon écran de lancer habituel.
    function vueApres() { return p.phase === "effort" ? "cartes" : null; }

    function libelleCartes() {
      var e = p.etapes && p.etapes[p.etape];
      if (e && !e.cartes.length) return "Voir la suite";
      return Regles.enCourse(p).length === 1 ? "Voir ma carte" : "Voir les cartes";
    }

    // Le dé roule environ 640 ms avant de se poser : le pion reste sur sa case
    // de départ pendant ce temps, sinon la fin d'un petit déplacement
    // redessinerait le cœur et couperait le roulé en plein vol. Répéter la
    // première image suffit, sans minuterie supplémentaire.
    function attendreLeDe(suite) {
      var res = [], n = Math.round(ROULE_MS / DP.PAS_MS) - 1, i;
      for (i = 0; i < n; i++) res.push(suite[0]);
      return res.concat(suite);
    }

    // Le dé cherche son résultat : la face change toutes les 100 ms, sans
    // jamais se poser sur le vrai résultat ni répéter la même valeur, puis
    // s'arrête dessus. Rien n'en dépend : sans animation, la face montre le
    // résultat dès le premier tracé.
    function chercherFace() {
      animDe = DP.animer({
        images: DP.facesDe(dernier.r.de, DP.FACES_DE, aleaEcran), depuis: 0, pas: DP.PAS_DE_MS,
        poser: function (fn, ms) { return global.setInterval(fn, ms); },
        annuler: function (id) { global.clearInterval(id); },
        rendre: function (i, face) { if (deNode) poserFace(deNode, face); },
        fin: function () { animDe = null; }
      });
    }

    // Appui pendant l'animation : le dé se pose sur son résultat et le gros
    // chiffre s'affiche, les animations CSS du cœur étant retirées d'un coup.
    function finirDe() {
      var a = animDe;
      animDe = null;
      if (a) a.finir();
      if (deNode && dernier) poserFace(deNode, dernier.r.de);
      if (deBloc) deBloc.className = "lancer-de";
    }

    // Prépare la présentation d'une suite d'images. Mouvement réduit demandé
    // par le système : pas d'animation, le pion est déjà à l'arrivée et le
    // bouton s'affiche tout de suite.
    // attendreDe : suite qui suit un lancer, le pion laisse le dé se poser.
    function presenter(suite, attendreDe) {
      if (attendreDe && !mouvementReduit()) suite = attendreLeDe(suite);
      dernier.images = suite;
      if (mouvementReduit() || suite.length < 2) {
        dernier.i = suite.length - 1;
        dernier.vue = vueApres();
      } else {
        dernier.i = 0;
        dernier.vue = "anime";
      }
    }

    // Fin du déplacement (dernière image atteinte, ou appui pour passer).
    function finPresentation() {
      if (quitte || !dernier) return;
      dernier.vue = vueApres();
      dessiner();
    }

    // ---------------------------------------------------------- lancer

    function placer(bloc, g) {
      var T = 170, L = g.colonnes * T, H = g.lignes * T;
      return "left:" + ((bloc.c * T + 5) / L * 100) + "%;top:" + ((bloc.l * T + 5) / H * 100) + "%;width:" +
        ((bloc.largeur * T - 10) / L * 100) + "%;height:" + ((bloc.hauteur * T - 10) / H * 100) + "%";
    }

    function coeurLancer(actif) {
      var enfants = [];
      ligneEffet = null; deNode = null; deBloc = null;
      if (dernier && dernier.tour === p.tour) {
        var j = p.joueurs[dernier.r.joueur];
        // Le résultat s'affiche aussi en gros chiffre à côté de la face, pour
        // être lu à 2 m. L'animation (CSS seule) ne joue qu'une fois par
        // lancer : le drapeau est consommé ici, un simple redessin (son,
        // fenêtre de choix) ne la rejoue pas. Rien n'attend l'animation et
        // l'état affiché est déjà le bon si elle ne tourne pas.
        var anime = dernier.anime;
        dernier.anime = false;
        deNode = de(dernier.r.de, 96);
        deBloc = UI.el("div", { classe: "lancer-de" + (anime ? " lancer-de-anime" : "") }, [
          deNode,
          UI.el("span", { classe: "de-nombre", texte: String(dernier.r.de) })
        ]);
        enfants.push(deBloc);
        if (anime && !mouvementReduit()) chercherFace();
        var effet = dernier.effet;
        var sautOuFlocon = dernier.r.effets.length ? dernier.r.effets[0].type : null;
        if (effet) {
          ligneEffet = UI.el("p", { classe: classeEffet() }, [
            RP.ICONES[sautOuFlocon] ? picto(RP.ICONES[sautOuFlocon], 22) : null, doc.createTextNode(effet)]);
        }
        enfants.push(UI.el("div", { classe: "lancer-texte" }, [
          UI.el("p", { classe: "lancer-sur", texte: "Dernier lancer" }),
          UI.el("p", { classe: "lancer-res" }, [UI.el("b", { style: "color:" + j.couleur, texte: j.prenom }), doc.createTextNode(" a\u00a0fait\u00a0"), chiffreDe(dernier.r.de)]),
          ligneEffet
        ]));
      } else {
        var bloques = p.joueurs.filter(function (k) { return k.rang === null && k.passeCrevasse; });
        enfants.push(UI.el("div", { classe: "lancer-de lancer-de-attente" }, [de(6, 96)]));
        enfants.push(UI.el("div", { classe: "lancer-texte" }, [
          UI.el("p", { classe: "lancer-sur", texte: "Tour " + p.tour }),
          UI.el("p", { classe: "lancer-res", texte: p.tour === 1 ? "En route" : "Nouveau tour" }),
          UI.el("p", { classe: "lancer-effet", texte: bloques.length
            ? bloques.map(function (k) { return k.prenom; }).join(", ") + (bloques.length > 1 ? " restent" : " reste") + " dans la crevasse ce tour."
            : "Chacun lance à son tour, puis place à l'effort." })
        ]));
      }
      if (presentation() === "cartes") {
        // Le pion est arrivé et l'effort a commencé côté moteur : les cartes
        // n'apparaissent qu'à la demande, pour laisser voir la case atteinte.
        enfants.push(boutonNu("bouton bouton-principal bouton-lancer bouton-continuer", function () {
          if (!dernier) return;
          dernier.vue = null;
          dessiner();
        }, [doc.createTextNode(libelleCartes())]));
      } else if (actif) {
        enfants.push(boutonNu("bouton bouton-principal bouton-lancer", function () {
          son.debloquer();
          agir(function () {
            if (Regles.joueurActif(p) !== actif) return;       // état changé entre-temps
            var r = Regles.lancer(p);
            dernier = { tour: p.tour, r: r, effet: insecable(texteEffet(p, r)), anime: true, images: [], i: 0, vue: null };
            presenter(DP.images(r, Regles.derniere(p)), true);
          }, true);
        }, [de(6, 40), doc.createTextNode("Lancer le dé")]));
      }
      return enfants;
    }

    // joueurs : ceux de l'image courante pendant un déplacement, pour que la
    // liste des altitudes suive le pion case par case au lieu d'afficher tout
    // de suite celle de la case d'arrivée.
    function listePositions(joueurs) {
      return joueurs.slice().sort(function (a, b) { return b.position - a.position || a.id - b.id; }).map(function (j) {
        return UI.el("p", {}, [pastille(j, 18), UI.el("b", { texte: j.prenom }),
          UI.el("span", { texte: j.rang !== null ? "Sommet" : altitude(p.plateau.altitudes[j.position]) })]);
      });
    }

    function ecranLancer() {
      var vue = presentation();
      // Pendant la présentation, personne ne lance : le bouton du joueur
      // suivant n'apparaît qu'une fois le pion arrivé.
      var actif = vue ? null : Regles.joueurActif(p), z = zonesLibres(p.plateau.cases.length);
      var cadre = UI.el("div", { classe: "plateau-cadre", style: "--colonnes:" + z.g.colonnes + ";--lignes:" + z.g.lignes });

      // Image courante du déplacement : les pions concernés sont dessinés à la
      // position de l'image, pas à celle du moteur (déjà à l'arrivée).
      function imageCourante() {
        return dernier && dernier.tour === p.tour && dernier.images && dernier.images.length
          ? dernier.images[Math.min(dernier.i, dernier.images.length - 1)] : null;
      }

      function joueursDessines() {
        var img = vue ? imageCourante() : null;
        if (!img) return p.joueurs;
        var places = {};
        places[dernier.r.joueur] = img.position;
        if (img.autre) places[img.autre.id] = img.autre.position;
        return p.joueurs.map(function (j) {
          if (places[j.id] === undefined) return j;
          return { id: j.id, prenom: j.prenom, couleur: j.couleur, position: places[j.id], rang: j.rang };
        });
      }

      function cercle() {
        if (vue) return dernier.r.joueur;
        return actif ? actif.id : (p.attente ? p.attente.joueur : null);
      }

      // Case atteinte : mise en valeur une fois le pion posé (dernière image),
      // pour que la case se repère d'un coup d'œil à 2 m.
      function marquerArrivee(racineSvg) {
        var img = imageCourante();
        if (!img || !dernier.images || dernier.i < dernier.images.length - 1) return;
        var cases = racineSvg.querySelectorAll(".case"), c = cases[img.position];
        if (c) c.setAttribute("class", c.getAttribute("class") + " case-arrivee");
      }

      function nouveauSvg() {
        var n = depuisHTML(RP.svg(p.plateau, joueursDessines(), p.ctx.bib, cercle()));
        marquerArrivee(n);
        return n;
      }

      cadre.appendChild(nouveauSvg());
      if (z.coeur) cadre.appendChild(UI.el("div", { classe: "coeur", style: placer(z.coeur, z.g) }, coeurLancer(actif)));
      var liste = z.liste
        ? UI.el("div", { classe: "cordee-liste", style: placer(z.liste, z.g) }, listePositions(joueursDessines())) : null;
      if (liste) cadre.appendChild(liste);

      // À chaque case : le plateau, la liste des altitudes et la visibilité de
      // la phrase d'effet. Le dé, son chiffre et sa petite animation CSS ne
      // sont pas reconstruits, ils restent intacts pendant tout le déplacement.
      function rafraichir() {
        var vieux = cadre.firstElementChild;
        if (vieux) cadre.replaceChild(nouveauSvg(), vieux);
        if (liste) {
          UI.vider(liste);
          listePositions(joueursDessines()).forEach(function (n) { liste.appendChild(n); });
        }
        if (ligneEffet) ligneEffet.className = classeEffet();
      }

      // Pendant la présentation, le bandeau annonce le résultat du lanceur,
      // même si le moteur est déjà passé à l'effort.
      var gauche, lanceur = p.attente ? p.joueurs[p.attente.joueur] : (vue ? p.joueurs[dernier.r.joueur] : null);
      if (lanceur && dernier && dernier.tour === p.tour && dernier.r.joueur === lanceur.id) {
        gauche = [pastille(lanceur, 40), UI.el("h2", { classe: "titre-tour" }, [
          UI.el("b", { style: "color:" + lanceur.couleur, texte: lanceur.prenom }), doc.createTextNode(" a\u00a0fait\u00a0"), chiffreDe(dernier.r.de)])];
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
      var zone = UI.el("main", { classe: "plateau" }, [cadre]);

      if (vue === "anime" && dernier.i < dernier.images.length - 1) {
        // Un appui n'importe où sur le plateau saute la fin du déplacement :
        // l'animation ne retient jamais la partie.
        zone.addEventListener("click", function () {
          finirDe();
          var a = anim;
          if (!a) return;
          anim = null;
          a.finir();
        });
        anim = DP.animer({
          images: dernier.images, depuis: dernier.i, pas: DP.PAS_MS,
          poser: function (fn, ms) { return global.setInterval(fn, ms); },
          annuler: function (id) { global.clearInterval(id); },
          rendre: function (i) { dernier.i = i; rafraichir(); },
          fin: function () { anim = null; finPresentation(); }
        });
      }

      return UI.el("section", { classe: "ecran ecran-jeu" }, [
        bandeau(gauche, [sous, boutonSon(), boutonTerminer()]),
        zone,
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
          if (a.type === "bivouac" && dernier) {
            dernier.effet = "Bivouac : échange de place avec " + p.joueurs[valeur].prenom + ".";
            // Le moteur a déjà permuté les deux pions : on rejoue l'avant puis
            // l'après pour que l'échange se voie sur le plateau.
            presenter(DP.imagesEchange(p.joueurs[valeur].position, valeur, p.joueurs[a.joueur].position));
          }
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

    // Le chiffre du dé : en Italiana, un « 1 » se lit comme un « I ». Il passe
    // en Jura, comme les prénoms, et reste collé à « a fait » (retour du 01/10).
    function chiffreDe(n) { return UI.el("b", { classe: "chiffre-de", texte: String(n) }); }

    // ---------------------------------------------------------- effort

    function minuteurDe(c) {
      for (var i = 0; i < minuteurs.length; i++) if (minuteurs[i].carte === c) return minuteurs[i];
      var e = { carte: c, m: global.Minuteur.creer(c.secondes), bipe: false };
      minuteurs.push(e);
      return e;
    }

    // `principal` : le minuteur tient lieu de dosage (« 20 s » ne s'affiche plus
    // deux fois, retour du 01/10) ; il prend alors la taille du dosage et
    // garde la mention « / côté » s'il y en a une.
    function blocMinuteur(c, principal, cote) {
      var e = minuteurDe(c);
      var anneau = depuisHTML('<svg class="minuteur-anneau" viewBox="0 0 52 52" width="52" height="52"><circle cx="26" cy="26" r="22" class="fond"/>' +
        '<circle cx="26" cy="26" r="22" class="reste" stroke-dasharray="' + CIRCONFERENCE + " " + CIRCONFERENCE + '" transform="rotate(-90 26 26)"/></svg>');
      var temps = UI.el("span", { classe: "minuteur-temps" });
      // « 1 min 30 s » en gros chiffres remplit à lui seul une colonne de
      // quatre joueurs : dans ce cas l'anneau, décoratif, s'efface au profit
      // des chiffres (cf. .minuteur-long en CSS). « 30 s » ou « 1 min »
      // laissent la place et gardent l'anneau.
      var classeBloc = "minuteur" + (F.duree(c.secondes).length > 6 ? " minuteur-long" : "") +
        (principal ? " minuteur-principal" : "");
      var bloc = UI.el("div", { classe: classeBloc }, [anneau, temps,
        principal && cote ? UI.el("small", { classe: "minuteur-cote", texte: cote }) : null]);
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
        bloc.className = classeBloc + (e.m.enMarche ? " en-cours" : "");
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

    // Distance au sommet, pour que chacun voie où il en est pendant l'effort
    // (retour de Romain du 29/09).
    function texteReste(j) {
      var n = Regles.derniere(p) - j.position;
      return n <= 0 ? "Au sommet" : "Sommet dans " + n + (n === 1 ? " case" : " cases");
    }

    function carte(c) {
      var j = p.joueurs[c.joueur], m = morceauxDosage(c.dosage), type = libelleType(p, c);
      var icone = RP.ICONES[c.type] && c.type !== "exercice" && !c.recuperation ? picto(RP.ICONES[c.type], 18) : UI.el("span", { classe: "puce-exo" });
      var enCours = !c.fait;
      // Un dosage qui n'est qu'une durée (« 20 s », « 1 min / côté ») est
      // porté par le minuteur lui-même ; une consigne (« Le plus de
      // répétitions en 30 s ») reste écrite au-dessus.
      var chronoSeul = enCours && c.secondes && !m.texte;
      var bas = [
        c.dosage && !chronoSeul ? UI.el("p", { classe: "carte-dosage" + (m.texte ? " carte-dosage-texte" : "") + (m.long ? " carte-dosage-long" : "") },
          [doc.createTextNode(m.valeur), m.cote ? UI.el("small", { texte: m.cote }) : null]) : null,
        enCours && c.charge ? UI.el("p", { classe: "carte-charge", texte: insecable(c.charge) }) : null,
        enCours && c.secondes ? blocMinuteur(c, chronoSeul, m.cote) : null,
        enCours && objectif(c) ? UI.el("p", { classe: "carte-objectif", texte: insecable(objectif(c)) }) : null,
        actions(c, j)
      ];
      return UI.el("article", { classe: "carte" + (c.fait ? " faite" : ""), style: styleJoueur(j) }, [
        UI.el("header", { classe: "carte-entete" }, [
          UI.el("span", { classe: "carte-prenom", texte: j.prenom }),
          UI.el("span", { classe: "carte-niveau", texte: "Niveau " + j.niveau })
        ]),
        UI.el("p", { classe: "carte-reste" }, [picto(RP.ICONES.sommet, 20), doc.createTextNode(insecable(texteReste(j)))]),
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
      lancerTic(ecran);
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
    // piolet) : c'est la description, lue de près avant de commencer, qui se
    // resserre. Le dosage, le nom de l'exercice, le prénom et les boutons
    // gardent leur taille, ils doivent rester lisibles à 2 m. La description
    // est le seul bloc à pouvoir se réduire (voir .carte-description en CSS) :
    // si elle déborde encore une fois resserrée, elle défile dans la carte.
    // Deux crans depuis le 01/10 : la description a grandi (24 px de base), elle
    // revient d'abord à son ancienne taille, puis à la plus petite.
    function resserrer() {
      [].forEach.call(racine.querySelectorAll(".carte"), function (a) {
        if (a.className.indexOf("carte-tres-serree") !== -1) return;
        var d = a.querySelector(".carte-description");
        if (!d || d.scrollHeight <= d.clientHeight + 1) return;
        if (a.className.indexOf("carte-serree") === -1) {
          a.className += " carte-serree";
          if (d.scrollHeight <= d.clientHeight + 1) return;
        }
        a.className += " carte-tres-serree";
      });
    }

    // Les polices peuvent arriver après le premier tracé : la mesure faite
    // avant leur chargement sous-estime la hauteur du texte et la carte
    // resterait large alors qu'elle déborde. On refait la mesure une fois les
    // polices prêtes, sur les cartes encore à l'écran.
    function resserrerApresPolices() {
      if (!doc.fonts || !doc.fonts.ready || !doc.fonts.ready.then) return;
      doc.fonts.ready.then(function () {
        if (quitte || p.phase !== "effort") return;
        resserrer();
      })["catch"](function () {});
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
        // Présentation d'un lancer : l'écran reste sur le plateau même si le
        // moteur est déjà passé à l'effort, et la fenêtre de choix (col, duel,
        // bivouac) attend la fin du déplacement pour s'ouvrir.
        var vue = presentation();
        var corps = p.phase === "echauffement" ? ecranEchauffement()
          : (p.phase === "lancer" || vue) ? ecranLancer()
          : p.phase === "effort" ? ecranEffort() : ecranPodium();
        racine.appendChild(corps);
        if (p.phase === "effort" && !vue) { resserrer(); resserrerApresPolices(); }
        if (!vue && p.phase === "lancer" && p.attente) demanderChoix();
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
