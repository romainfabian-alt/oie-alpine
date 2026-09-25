(function (global) {
  // Écran des règles : affiché après « Commencer » sur l'écran des joueurs et
  // juste avant l'échauffement, puis consultable à tout moment depuis
  // l'accueil. Le contenu (SECTIONS, CASES) est une donnée pure, exportée et
  // testable sous Node : il doit rester le reflet fidèle du moteur
  // (src/regles.js) et du README, d'où le test qui exige que chaque type de
  // case géré par le moteur apparaisse ici.
  var RP = (typeof require !== "undefined") ? require("./rendu-plateau.js") : global.RenduPlateau;

  // Sections de texte, colonne de gauche. Un point = une phrase courte.
  var SECTIONS = [
    { titre: "Un tour de jeu", points: [
      "Chacun son tour, un joueur lance le dé et avance d'autant de cases.",
      "Ensuite, les cartes s'affichent, une par joueur, toutes en même temps.",
      "Chacun touche « Fait » quand il a fini. Le tour suivant démarre quand tous ont validé."
    ] },
    { titre: "Chacun à son niveau", points: [
      "Jamais d'exercice au-dessus du niveau du joueur, ni écarté par un de ses filtres de blessure."
    ] },
    { titre: "Le piolet", points: [
      "Un piolet par joueur et par partie : il passe l'exercice du tour, sans le bonus de la case. Pas de piolet dans un duel entre deux joueurs."
    ] },
    { titre: "Cases collectives", points: [
      "Une cordée ou une météo remplace la carte de tout le monde pour ce tour. Le col, le duel ou le chamois du même tour est annulé, avec son bonus."
    ] },
    { titre: "Fin de partie", points: [
      "Dépasser la dernière case suffit pour être arrivé. Arrivés le même tour, les joueurs sont ex aequo.",
      "« Terminer » classe les joueurs restants sur leur position, cases déjà gagnées comprises."
    ] }
  ];

  // Cases spéciales, dans l'ordre du plateau et du README. « solo » n'est
  // renseigné que lorsque la case se comporte autrement en solo (ou pour le
  // dernier joueur encore en course).
  var CASES = [
    { type: "flocon", nom: "Flocon", effet: "Relance le dé tout de suite.", solo: "" },
    { type: "telecabine", nom: "Télécabine", effet: "Monte directement à la case indiquée.", solo: "" },
    { type: "avalanche", nom: "Avalanche", effet: "Redescend à la case indiquée.", solo: "" },
    { type: "crevasse", nom: "Crevasse", effet: "Gainage à son niveau. Au tour suivant, pas de lancer : un gainage de plus.", solo: "" },
    { type: "refuge", nom: "Refuge", effet: "Pause. Aucun effort ce tour.", solo: "" },
    { type: "ravitaillement", nom: "Ravitaillement", effet: "60 s d'hydratation.", solo: "" },
    { type: "col", nom: "Col", effet: "Facile : dosage normal, +1 case. Difficile : même exercice, volume × 1,5, +3 cases.", solo: "" },
    { type: "chamois", nom: "Chamois", effet: "Défi d'agilité à son niveau. Réussi : +3 cases.", solo: "" },
    { type: "duel", nom: "Duel", effet: "Choisit un adversaire. Les deux font le duel au lieu de leur exercice, le gagnant avance de 2 cases.",
      solo: "Objectif chronométré, atteint : +2 cases." },
    { type: "cordee", nom: "Cordée", effet: "Tout le monde fait le même exercice, chacun à son niveau.",
      solo: "L'exercice fait rapporte 2 cases au dernier joueur en course." },
    { type: "meteo", nom: "Météo", effet: "Carte au hasard : tout le monde avance ou recule, ou le premier ou le dernier, ou tout le monde fait un exercice.", solo: "" },
    { type: "bivouac", nom: "Bivouac", effet: "Échange sa place avec le joueur de son choix, puis 60 s de ravitaillement.",
      solo: "Un simple ravitaillement, sans échange." },
    { type: "sommet", nom: "Sommet", effet: "L'arrivée, à 3 656 m.", solo: "" }
  ];

  // Convertit une chaîne de balisage SVG de confiance (icônes de l'app) en
  // véritable nœud SVG : cf. ecran-accueil.js, même contrainte d'espace de noms.
  function depuisHTML(html) {
    var conteneur = global.document.createElement("div");
    conteneur.innerHTML = html;
    return conteneur.firstElementChild;
  }

  function picto(type, taille, classe) {
    return depuisHTML('<svg class="' + classe + '" width="' + taille + '" height="' + taille + '" viewBox="0 0 12 12" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' +
      RP.ICONES[type] + "</g></svg>");
  }

  function icoRetour() {
    return depuisHTML('<svg class="picto" width="24" height="24" viewBox="0 0 12 12" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' +
      '<polyline points="6.5,2.5 3,6 6.5,9.5"/><line x1="3" y1="6" x2="10" y2="6"/></g></svg>');
  }

  function afficher(racine, o) {
    var UI = global.UI, doc = global.document;
    o = o || {};

    function boutonNu(classe, action, enfants) {
      return UI.el("button", { type: "button", classe: classe, onclick: action }, enfants || []);
    }

    function bloc(s) {
      return UI.el("section", { classe: "regles-bloc" }, [
        UI.el("h3", { classe: "regles-titre", texte: s.titre }),
        UI.el("ul", { classe: "regles-points" }, s.points.map(function (t) {
          return UI.el("li", { texte: t });
        }))
      ]);
    }

    function ligneCase(c) {
      var corps = [UI.el("b", { classe: "case-nom", texte: c.nom }),
        UI.el("span", { classe: "case-effet", texte: c.effet })];
      if (c.solo) corps.push(UI.el("span", { classe: "case-solo", texte: "En solo : " + c.solo }));
      return UI.el("li", { classe: "case-ligne" }, [
        UI.el("span", { classe: "case-picto" }, [picto(c.type, 26, "picto")]),
        UI.el("span", { classe: "case-corps" }, corps)
      ]);
    }

    var gauche = [
      boutonNu("bouton bouton-discret", o.surRetour || function () {}, [icoRetour(), doc.createTextNode("Retour")]),
      UI.el("div", { classe: "bandeau-titre" }, [
        UI.el("h2", { classe: "titre-ecran", texte: "Règles du jeu" }),
        UI.el("p", { classe: "bandeau-sous", texte: "Tout le monde grimpe ensemble, chacun à son niveau." })
      ])
    ];
    if (!o.surRetour) gauche.shift();

    var actions = [];
    if (o.surSuite) {
      actions.push(boutonNu("bouton bouton-discret", o.surSuite, [doc.createTextNode("Passer")]));
      actions.push(UI.el("button", { type: "button", classe: "bouton bouton-principal bouton-suite",
        texte: "Commencer l'échauffement", onclick: o.surSuite }));
    } else if (o.surRetour) {
      actions.push(UI.el("button", { type: "button", classe: "bouton bouton-principal bouton-suite",
        texte: "Retour à l'accueil", onclick: o.surRetour }));
    }

    UI.vider(racine);
    racine.appendChild(UI.el("section", { classe: "ecran ecran-regles" }, [
      UI.el("header", { classe: "bandeau" }, [
        UI.el("div", { classe: "bandeau-gauche" }, gauche),
        UI.el("div", { classe: "bandeau-droite" })
      ]),
      UI.el("main", { classe: "regles" }, [
        UI.el("div", { classe: "regles-texte" }, SECTIONS.map(bloc)),
        UI.el("section", { classe: "regles-cases" }, [
          UI.el("h3", { classe: "regles-titre", texte: "Les cases spéciales" }),
          // Deux listes côte à côte plutôt qu'une seule en multi-colonnes :
          // chaque colonne garde ses propres hauteurs de ligne (pas de blancs
          // imposés par la colonne voisine) et un débordement éventuel reste
          // vertical, donc visible, au lieu de filer dans une colonne hors cadre.
          UI.el("div", { classe: "cases-liste" }, [
            UI.el("ul", { classe: "cases-colonne" }, CASES.slice(0, 7).map(ligneCase)),
            UI.el("ul", { classe: "cases-colonne" }, CASES.slice(7).map(ligneCase))
          ])
        ])
      ]),
      UI.el("footer", { classe: "pied pied-regles" }, [
        // La note n'a de sens qu'avant la partie : venu de l'accueil, le kiné
        // sait déjà d'où il arrive.
        o.surSuite ? UI.el("p", { classe: "pied-note", texte: "Ces règles restent consultables depuis l'accueil." }) : null,
        UI.el("div", { classe: "pied-actions" }, actions)
      ])
    ]));
  }

  var EcranRegles = { afficher: afficher, SECTIONS: SECTIONS, CASES: CASES };
  if (typeof module !== "undefined" && module.exports) module.exports = EcranRegles;
  else global.EcranRegles = EcranRegles;
})(typeof globalThis !== "undefined" ? globalThis : this);
