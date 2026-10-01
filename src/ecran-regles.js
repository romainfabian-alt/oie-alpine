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

  // Version illustrée, pour les patients (retour de Romain du 01/10) : elle
  // remplace le texte avant l'échauffement. Quatre étapes dessinées, puis les
  // cases spéciales en pictogrammes et en trois mots. Le texte complet reste
  // consultable depuis l'accueil, pour le kiné.
  var ETAPES = [
    { titre: "Lance le dé", phrase: "Chacun son tour.", dessin: "de" },
    { titre: "Avance", phrase: "Ton pion monte d'autant de cases.", dessin: "pion" },
    { titre: "Fais ta carte", phrase: "Tous en même temps, chacun à son niveau.", dessin: "carte" },
    { titre: "Touche « Fait »", phrase: "Quand tout le monde a fini, on relance.", dessin: "fait" }
  ];

  var EN_BREF = {
    flocon: "Relance tout de suite", telecabine: "Monte d'un coup", avalanche: "Redescend",
    crevasse: "Gainage, sans lancer au tour suivant", refuge: "Pause, aucun effort", ravitaillement: "60 s pour boire",
    col: "Facile +1, difficile +3", chamois: "Défi d'agilité, +3", duel: "Contre un adversaire, +2",
    cordee: "Tous le même exercice", meteo: "Carte surprise pour tous", bivouac: "Échange de place",
    sommet: "L'arrivée, 3 656 m"
  };

  // Dessins au trait, dans la palette du jeu : cacao pour le trait, cuivre
  // pour le mouvement, couleurs des joueurs pour les pions et les cartes.
  var DESSINS = {
    de: '<svg viewBox="0 0 220 150" aria-hidden="true">' +
      '<path class="ill-mouv" d="M28 104 C40 70 64 52 92 46"/><path class="ill-mouv" d="M22 76 C34 50 52 38 74 34"/>' +
      '<g transform="translate(132 78) rotate(-14)"><rect class="ill-de" x="-44" y="-44" width="88" height="88" rx="18"/>' +
      '<circle class="ill-point" cx="-22" cy="-22" r="8"/><circle class="ill-point" cx="22" cy="-22" r="8"/>' +
      '<circle class="ill-point" cx="0" cy="0" r="8"/><circle class="ill-point" cx="-22" cy="22" r="8"/>' +
      '<circle class="ill-point" cx="22" cy="22" r="8"/></g></svg>',
    pion: '<svg viewBox="0 0 220 150" aria-hidden="true">' +
      '<rect class="ill-case" x="10" y="70" width="60" height="60" rx="8" style="fill:#D7E5CF"/>' +
      '<rect class="ill-case" x="80" y="70" width="60" height="60" rx="8" style="fill:#DED9C9"/>' +
      '<rect class="ill-case" x="150" y="70" width="60" height="60" rx="8" style="fill:#E8E1D3"/>' +
      '<text class="ill-num" x="18" y="90">4</text><text class="ill-num" x="88" y="90">5</text><text class="ill-num" x="158" y="90">6</text>' +
      '<circle class="ill-fantome" cx="40" cy="104" r="15"/>' +
      '<path class="ill-mouv ill-pointille" d="M44 70 C70 18 150 18 176 64"/><polyline class="ill-mouv" points="166,56 177,66 181,51"/>' +
      '<circle class="ill-pion" cx="180" cy="104" r="17" style="fill:#2E6FB0"/><text class="ill-lettre" x="180" y="111">L</text></svg>',
    carte: '<svg viewBox="0 0 220 150" aria-hidden="true">' +
      '<g transform="translate(64 8) rotate(-6 46 66)"><rect class="ill-carte" x="0" y="0" width="92" height="132" rx="12"/>' +
      '<rect x="0" y="0" width="92" height="28" rx="12" style="fill:#3F9A5B"/><rect x="0" y="16" width="92" height="12" style="fill:#3F9A5B"/></g>' +
      '<g transform="translate(72 12) rotate(4 46 66)"><rect class="ill-carte" x="0" y="0" width="92" height="132" rx="12"/>' +
      '<rect x="0" y="0" width="92" height="28" rx="12" style="fill:#D9483B"/><rect x="0" y="16" width="92" height="12" style="fill:#D9483B"/>' +
      '<rect class="ill-ligne" x="12" y="42" width="62" height="7" rx="3.5"/><rect class="ill-ligne ill-ligne-douce" x="12" y="56" width="50" height="5" rx="2.5"/>' +
      '<rect class="ill-ligne ill-ligne-douce" x="12" y="66" width="56" height="5" rx="2.5"/>' +
      '<text class="ill-dosage" x="12" y="114">× 10</text></g></svg>',
    fait: '<svg viewBox="0 0 220 150" aria-hidden="true">' +
      '<g class="ill-coches"><circle cx="58" cy="34" r="13" style="fill:#D9483B"/><circle cx="94" cy="34" r="13" style="fill:#2E6FB0"/>' +
      '<circle cx="130" cy="34" r="13" style="fill:#E0A526"/><circle cx="166" cy="34" r="13" style="fill:#3F9A5B"/>' +
      '<polyline points="52,34 57,39 65,29"/><polyline points="88,34 93,39 101,29"/><polyline points="124,34 129,39 137,29"/>' +
      '<polyline points="160,34 165,39 173,29"/></g>' +
      '<rect class="ill-bouton" x="34" y="72" width="152" height="56" rx="14"/><rect class="ill-bouton-ombre" x="34" y="124" width="152" height="6" rx="3"/>' +
      '<text class="ill-bouton-texte" x="110" y="109">Fait</text></svg>'
  };

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

  // Avant l'échauffement : la version illustrée, pour les patients.
  function afficherIllustre(racine, o) {
    var UI = global.UI, doc = global.document;
    function etape(e, i) {
      var dessin = UI.el("div", { classe: "illu-dessin" });
      dessin.appendChild(depuisHTML(DESSINS[e.dessin]));
      return UI.el("li", { classe: "illu-etape" }, [
        UI.el("span", { classe: "illu-num", texte: String(i + 1) }), dessin,
        UI.el("h3", { classe: "illu-titre", texte: e.titre }),
        UI.el("p", { classe: "illu-phrase", texte: e.phrase })
      ]);
    }
    function caseCourte(c) {
      return UI.el("li", { classe: "illu-case" + (c.type === "sommet" ? " illu-case-sommet" : "") }, [
        UI.el("span", { classe: "illu-case-picto" }, [picto(c.type, 30, "picto")]),
        UI.el("span", { classe: "illu-case-corps" }, [
          UI.el("b", { texte: c.nom }), UI.el("span", { texte: EN_BREF[c.type] })
        ])
      ]);
    }
    UI.vider(racine);
    racine.appendChild(UI.el("section", { classe: "ecran ecran-regles ecran-regles-illustre" }, [
      UI.el("header", { classe: "bandeau" }, [
        UI.el("div", { classe: "bandeau-gauche" }, [
          UI.el("div", { classe: "bandeau-titre" }, [
            UI.el("h2", { classe: "titre-ecran", texte: "Comment on joue" }),
            UI.el("p", { classe: "bandeau-sous", texte: "Tout le monde grimpe ensemble, chacun à son niveau." })
          ])
        ]),
        UI.el("div", { classe: "bandeau-droite" })
      ]),
      UI.el("main", { classe: "illu" }, [
        UI.el("ol", { classe: "illu-etapes" }, ETAPES.map(etape)),
        UI.el("section", { classe: "illu-cases" }, [
          UI.el("h3", { classe: "regles-titre", texte: "Les cases à connaître" }),
          UI.el("ul", { classe: "illu-grille" }, CASES.map(caseCourte))
        ])
      ]),
      UI.el("footer", { classe: "pied pied-regles" }, [
        UI.el("p", { classe: "pied-note", texte: "Le détail des règles reste consultable depuis l'accueil." }),
        UI.el("div", { classe: "pied-actions" }, [
          UI.el("button", { type: "button", classe: "bouton bouton-discret", texte: "Passer", onclick: o.surSuite }),
          UI.el("button", { type: "button", classe: "bouton bouton-principal bouton-suite",
            texte: "Commencer l'échauffement", onclick: o.surSuite })
        ])
      ])
    ]));
  }

  function afficher(racine, o) {
    var UI = global.UI, doc = global.document;
    o = o || {};
    if (o.surSuite) { afficherIllustre(racine, o); return; }

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

  var EcranRegles = { afficher: afficher, SECTIONS: SECTIONS, CASES: CASES, ETAPES: ETAPES, EN_BREF: EN_BREF,
    DESSINS: DESSINS };
  if (typeof module !== "undefined" && module.exports) module.exports = EcranRegles;
  else global.EcranRegles = EcranRegles;
})(typeof globalThis !== "undefined" ? globalThis : this);
