(function (global) {
  // Écran de mise en place : 1 à 4 joueurs, prénom facultatif, niveau et
  // filtres de blessure. Reprend la mise en page de la maquette validée
  // (tâche 11) : 4 colonnes, emplacements vides avec « Ajouter un joueur »,
  // filtres en interrupteurs, lien « Retirer », pas de note de bas de page.
  var R = global.Referentiel, UI = global.UI, COULEURS = global.RenduPlateau.COULEURS, Prenoms = global.Prenoms;

  function depuisHTML(html) {
    var conteneur = global.document.createElement("div");
    conteneur.innerHTML = html;
    return conteneur.firstElementChild;
  }

  function icoRetour() {
    return depuisHTML('<svg class="picto" width="24" height="24" viewBox="0 0 12 12" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' +
      '<polyline points="6.5,2.5 3,6 6.5,9.5"/><line x1="3" y1="6" x2="10" y2="6"/></g></svg>');
  }

  function boutonNu(classe, action, enfants) {
    return UI.el("button", { type: "button", classe: classe, onclick: action }, enfants || []);
  }

  function afficher(racine, o) {
    var joueurs = [nouveau(0)];
    function nouveau(i) { return { prenom: "", couleur: COULEURS[i], niveau: o.plateau.niveau, filtres: [] }; }
    function recolorer() { joueurs.forEach(function (j, i) { j.couleur = COULEURS[i]; }); }

    function pastille(j, taille) {
      return UI.el("span", { classe: "pastille-joueur", style: "--joueur:" + j.couleur + ";--taille:" + taille + "px" });
    }

    function emplacementRempli(j, i) {
      // Un <input> réel (classe .saisie) : la maquette simule un curseur
      // statique pour la capture, l'app utilise le champ de texte natif.
      var entree = UI.el("input", { type: "text", maxlength: "14", value: j.prenom, classe: "saisie",
        placeholder: "Prénom", oninput: function (e) { j.prenom = e.target.value; } });
      var enveloppe = UI.el("div", { classe: "champ" }, [
        UI.el("span", { classe: "champ-lib" }, [global.document.createTextNode("Prénom "), UI.el("em", { texte: "facultatif" })]),
        entree
      ]);

      var niveauVal = UI.el("span", { classe: "niveau-val" });
      function rafraichirNiveau() {
        UI.vider(niveauVal);
        niveauVal.appendChild(global.document.createTextNode(String(j.niveau)));
        niveauVal.appendChild(UI.el("small", { texte: R.phaseDe(j.niveau).libelle }));
      }
      rafraichirNiveau();
      function regler(delta) { j.niveau = Math.max(1, Math.min(10, j.niveau + delta)); rafraichirNiveau(); }

      var filtres = UI.el("ul", { classe: "filtres" }, Object.keys(R.FILTRES).map(function (f) {
        var actif = j.filtres.indexOf(f) !== -1;
        var li = UI.el("li", { classe: "filtre" + (actif ? " actif" : ""), onclick: function () {
          var k = j.filtres.indexOf(f);
          if (k === -1) j.filtres.push(f); else j.filtres.splice(k, 1);
          li.className = "filtre" + (j.filtres.indexOf(f) !== -1 ? " actif" : "");
        } }, [UI.el("span", { texte: R.FILTRES[f] }), UI.el("i", { classe: "interrupteur" })]);
        return li;
      }));

      var tete = UI.el("div", { classe: "emplacement-tete" }, [
        pastille(j, 34),
        UI.el("span", { texte: "Joueur " + (i + 1) }),
        joueurs.length > 1 ? boutonNu("lien-retirer", function () { joueurs.splice(i, 1); recolorer(); dessiner(); }, ["Retirer"]) : null
      ]);

      return UI.el("section", { classe: "emplacement", style: "--joueur:" + j.couleur }, [
        tete, enveloppe,
        UI.el("div", { classe: "champ" }, [
          UI.el("span", { classe: "champ-lib", texte: "Niveau" }),
          UI.el("div", { classe: "niveau" }, [
            UI.el("button", { type: "button", classe: "bouton bouton-carre", "aria-label": "Baisser", onclick: function () { regler(-1); }, texte: "−" }),
            niveauVal,
            UI.el("button", { type: "button", classe: "bouton bouton-carre", "aria-label": "Monter", onclick: function () { regler(1); }, texte: "+" })
          ])
        ]),
        UI.el("div", { classe: "champ" }, [UI.el("span", { classe: "champ-lib", texte: "Filtres de blessure" }), filtres])
      ]);
    }

    function emplacementVide(i) {
      var j = { couleur: COULEURS[i] };
      return UI.el("section", { classe: "emplacement vide", style: "--joueur:" + j.couleur }, [
        UI.el("div", { classe: "emplacement-tete" }, [pastille(j, 34), UI.el("span", { texte: "Joueur " + (i + 1) })]),
        UI.el("div", { classe: "emplacement-vide" }, [
          boutonNu("bouton bouton-ajout", function () { joueurs.push(nouveau(i)); dessiner(); },
            [UI.el("span", { classe: "plus", texte: "+" }), global.document.createTextNode("Ajouter un joueur")])
        ])
      ]);
    }

    function dessiner() {
      UI.vider(racine);
      var emplacements = [];
      for (var i = 0; i < 4; i++) emplacements.push(i < joueurs.length ? emplacementRempli(joueurs[i], i) : emplacementVide(i));

      racine.appendChild(UI.el("section", { classe: "ecran" }, [
        UI.el("header", { classe: "bandeau" }, [
          UI.el("div", { classe: "bandeau-gauche" }, [
            boutonNu("bouton bouton-discret", o.surRetour, [icoRetour(), global.document.createTextNode("Retour")]),
            UI.el("div", { classe: "bandeau-titre" }, [
              UI.el("h2", { classe: "titre-ecran", texte: "Les grimpeurs" }),
              UI.el("p", { classe: "bandeau-sous", texte: R.ZONES[o.plateau.zone].libelle + " · Plateau " + o.plateau.niveau +
                " · " + R.phaseDe(o.plateau.niveau).libelle })
            ])
          ]),
          UI.el("div", { classe: "bandeau-droite" })
        ]),
        UI.el("main", { classe: "joueurs" }, emplacements),
        UI.el("footer", { classe: "pied", style: "justify-content:flex-end" }, [
          UI.el("button", { type: "button", classe: "bouton bouton-principal bouton-large", texte: "Commencer",
            onclick: function () {
              o.surCommencer(joueurs.map(function (j) {
                return { prenom: Prenoms.nettoyer(j.prenom), couleur: j.couleur, niveau: j.niveau, filtres: j.filtres.slice() };
              }));
            } })
        ])
      ]));
    }
    dessiner();
  }

  global.EcranJoueurs = { afficher: afficher };
})(typeof globalThis !== "undefined" ? globalThis : this);
