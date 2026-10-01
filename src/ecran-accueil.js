(function (global) {
  // Écran d'accueil : choix de la zone puis du plateau (10 niveaux, groupés
  // par phase). Reprend la mise en page de la maquette validée (tâche 11) ;
  // pas de sous-titre ni de phrase d'accroche explicative (écrans opérés par
  // les kinés, décision du 13/09/2026), seule l'accroche sous le titre reste.
  var R = global.Referentiel, UI = global.UI;

  // Ordre d'affichage des zones : celui validé sur la maquette (inférieur,
  // tronc, supérieur, full body), distinct de l'ordre de Referentiel.ZONES_PLATEAU.
  var ORDRE_ZONES = ["membre_inferieur", "tronc", "membre_superieur", "full_body"];

  var ICONES_ZONES = {
    membre_inferieur: '<circle cx="6" cy="1.9" r="1.1"/><path d="M6,3.4 L6,6.2"/><path d="M6,6.2 L4.2,8.4 L5.2,11"/>' +
      '<path d="M6,6.2 L7.9,8.6 L7.4,11"/><line x1="4" y1="11" x2="5.6" y2="11"/><line x1="7" y1="11" x2="8.6" y2="11"/>',
    tronc: '<path d="M3.2,1.6 C4.2,2.6 7.8,2.6 8.8,1.6"/><path d="M3.2,1.6 C3,5 4.2,7 4,10.4"/>' +
      '<path d="M8.8,1.6 C9,5 7.8,7 8,10.4"/><line x1="4" y1="10.4" x2="8" y2="10.4"/><line x1="6" y1="3.6" x2="6" y2="8.6"/>',
    membre_superieur: '<path d="M1.5,10.8 L1.5,7.8 C1.5,5.6 3,4.6 5,4.6 L6.8,4.6"/><path d="M6.8,4.6 L9.6,2"/>' +
      '<path d="M3.2,6.2 C4.4,5.4 6,5.6 6.8,6.6"/><circle cx="10.1" cy="1.6" r="0.9"/>',
    full_body: '<circle cx="6" cy="1.9" r="1.1"/><line x1="6" y1="3.4" x2="6" y2="7.2"/>' +
      '<polyline points="2.6,2.6 6,4.6 9.4,2.6"/><polyline points="3.8,11 6,7.2 8.2,11"/>'
  };

  // Convertit une chaîne de balisage SVG de confiance (icônes de l'app, pas
  // de texte utilisateur) en véritable nœud SVG : document.createElement ne
  // respecte pas l'espace de noms SVG, il faut passer par innerHTML.
  function depuisHTML(html) {
    var conteneur = global.document.createElement("div");
    conteneur.innerHTML = html;
    return conteneur.firstElementChild;
  }

  function pictoZone(id) {
    return depuisHTML('<svg class="picto" width="40" height="40" viewBox="0 0 12 12" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' +
      ICONES_ZONES[id] + "</g></svg>");
  }

  function icoRegles() {
    return depuisHTML('<svg class="picto" width="22" height="22" viewBox="0 0 12 12" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="2.2" y="1.4" width="7.6" height="9.2" rx="1"/><line x1="4" y1="4" x2="8" y2="4"/>' +
      '<line x1="4" y1="6" x2="8" y2="6"/><line x1="4" y1="8" x2="6.6" y2="8"/></g></svg>');
  }

  function crete() {
    return depuisHTML('<svg class="crete" viewBox="0 0 300 40" aria-hidden="true">' +
      '<polyline points="0,38 60,24 92,31 150,4 186,20 214,12 300,38"/><line x1="150" y1="4" x2="150" y2="-6"/></svg>');
  }

  // Profil de relief décoratif : plus le niveau est élevé, plus le sommet
  // dessiné est haut (même principe visuel que la maquette, sans reprendre
  // ses points au pixel près).
  function relief(niveau) {
    var base = [[22, 5.1], [38, 3.2], [62, 9.7], [80, 5.5], [98, 7.4]];
    var f = 1 + 0.344 * (niveau - 1);
    var pts = base.map(function (p) { return p[0] + "," + (44 - p[1] * f).toFixed(1); });
    return depuisHTML('<svg class="tuile-relief" viewBox="0 0 120 44" preserveAspectRatio="none" aria-hidden="true">' +
      '<polyline points="0,44 ' + pts.join(" ") + ' 120,44"/></svg>');
  }

  function compte(plateau, type) { return plateau.cases.filter(function (c) { return c.type === type; }).length; }
  function pluriel(n, mot) { return n + " " + mot + (n > 1 ? "s" : ""); }

  // Bouton nu (pas de classe .bouton) : les tuiles de la maquette ont leur
  // propre habillage complet, distinct des boutons tactiles génériques.
  function boutonNu(classe, action, enfants) {
    return UI.el("button", { type: "button", classe: classe, onclick: action }, enfants || []);
  }

  function afficher(racine, o) {
    // Une zone est toujours affichée par défaut (la première de la liste) :
    // la maquette valide ne montre jamais l'écran d'accueil sans plateau.
    var zonesDisponibles = ORDRE_ZONES.filter(function (z) { return R.ZONES_PLATEAU.indexOf(z) !== -1; });
    var zoneChoisie = zonesDisponibles[0] || null;

    function tuileZone(z) {
      return boutonNu("tuile-zone" + (z === zoneChoisie ? " choisie" : ""), function () { zoneChoisie = z; dessiner(); },
        [pictoZone(z), UI.el("span", { texte: R.ZONES[z].libelle })]);
    }

    // Ce qui aide le kiné à choisir (retour du 01/10) : la durée estimée,
    // seul et à quatre, et le matériel à sortir. Les pièges suivent, en petit.
    function tuilePlateau(p) {
      var E = global.Estimation, d = (global.DUREES || {})[p.id];
      var lignes = [];
      if (E && d) {
        lignes.push(UI.el("span", { classe: "tuile-duree" }, [
          UI.el("b", { texte: E.texteDuree(E.minutes(d[0], 1)) }), global.document.createTextNode(" seul"),
          global.document.createElement("br"),
          UI.el("b", { texte: E.texteDuree(E.minutes(d[3], 4)) }), global.document.createTextNode(" à 4")
        ]));
      }
      if (E && o.bib) lignes.push(UI.el("span", { classe: "tuile-materiel", texte: E.texteMateriel(E.materiel(p, o.bib)) }));
      lignes.push(UI.el("span", { classe: "tuile-pieges",
        texte: pluriel(compte(p, "avalanche"), "avalanche") + " · " + pluriel(compte(p, "crevasse"), "crevasse") }));
      var meta = UI.el("span", { classe: "tuile-meta" }, lignes);
      return boutonNu("tuile-plateau", function () { o.surChoix(p); }, [
        UI.el("span", { classe: "tuile-num", texte: String(p.niveau) }), meta, relief(p.niveau)
      ]);
    }

    function sectionPhase(phase, plateaux) {
      var n = plateaux.length;
      var h3 = UI.el("h3", { classe: "phase-titre" });
      h3.appendChild(global.document.createTextNode(phase.libelle));
      h3.appendChild(UI.el("span", { texte: "niveaux " + phase.min + (n === 2 ? " et " : " à ") + phase.max }));
      return UI.el("section", { classe: "phase phase-" + n }, [h3].concat(plateaux.map(tuilePlateau)));
    }

    function dessiner() {
      UI.vider(racine);
      var ecran = UI.el("section", { classe: "ecran ecran-accueil" }, [
        UI.el("aside", { classe: "accueil-gauche" }, [
          UI.el("img", { classe: "logo-cabinet", src: "./assets/logo-cabinet.png", alt: "Kiné Sport Tignes" }),
          UI.el("p", { classe: "surtitre", texte: "Kiné Sport Tignes" }),
          UI.el("h1", { classe: "titre-jeu" }, [global.document.createTextNode("L'Oie"), global.document.createElement("br"),
            global.document.createTextNode("Alpine")]),
          crete(),
          UI.el("p", { classe: "accroche", texte: "De 2 100 m à la Grande Motte, 3 656 m. Un plateau, un dé, et chacun grimpe à son niveau." }),
          // Le bouton des règles vit dans la même colonne que les tuiles de
          // zone (et non après le <nav>) pour rester collé sous la dernière
          // tuile : les tuiles sont plafonnées en hauteur, et l'espace libre
          // de la colonne doit retomber sous le bouton, pas au-dessus.
          UI.el("nav", { classe: "zones" }, zonesDisponibles.map(tuileZone).concat([
            o.surRegles ? boutonNu("lien-regles", o.surRegles,
              [icoRegles(), global.document.createTextNode("Règles du jeu")]) : null
          ]))
        ])
      ]);
      if (zoneChoisie) {
        var parNiveau = {};
        o.plateaux.filter(function (p) { return p.zone === zoneChoisie; }).forEach(function (p) { parNiveau[p.niveau] = p; });
        var phases = R.PHASES.map(function (phase) {
          var plateaux = [];
          for (var niv = phase.min; niv <= phase.max; niv++) if (parNiveau[niv]) plateaux.push(parNiveau[niv]);
          return sectionPhase(phase, plateaux);
        });
        ecran.appendChild(UI.el("main", { classe: "accueil-droite" }, [
          UI.el("div", { classe: "accueil-titre" }, [UI.el("h2", { classe: "titre-ecran", texte: R.ZONES[zoneChoisie].libelle })]),
          UI.el("div", { classe: "phases" }, phases)
        ]));
      }
      racine.appendChild(ecran);
    }
    dessiner();
  }

  global.EcranAccueil = { afficher: afficher };
})(typeof globalThis !== "undefined" ? globalThis : this);
