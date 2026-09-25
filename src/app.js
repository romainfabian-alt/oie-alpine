(function (global) {
  // Point d'entrée : orchestre les écrans (accueil, joueurs, règles, partie) et
  // installe le filet de sécurité en cas d'erreur imprévue. Aucune donnée
  // patient n'est jamais persistée ; seule la préférence de son l'est.
  var doc = global.document, racine = doc.getElementById("racine");

  function stockageSur() {
    try { var s = global.localStorage; s.getItem("oieAlpine.son"); return s; }
    catch (e) { return { getItem: function () { return null; }, setItem: function () {} }; }
  }

  var bib = global.Bibliotheque.defaut();
  var son = global.SonOie.creer(stockageSur());
  var veille = global.Veille.creer();
  var ecranPartieActif = null;   // handle { detruire } de l'écran de partie en cours, s'il y en a un
  var enErreur = false;          // évite qu'une erreur pendant l'affichage de l'écran d'erreur ne boucle

  // Démonte proprement l'écran de partie courant (minuteur, modale) avant
  // d'en afficher un autre : cf. EcranPartie.detruire, appelée sans passer
  // par surQuitter pour ne pas redéclencher la navigation qu'elle porte.
  function detruirePartieActive() {
    if (ecranPartieActif) { ecranPartieActif.detruire(); ecranPartieActif = null; }
  }

  function accueil() {
    detruirePartieActive();
    veille.relacher();
    global.EcranAccueil.afficher(racine, { plateaux: global.PLATEAUX, surChoix: joueurs, surRegles: regles });
  }

  // Règles consultées depuis l'accueil : pas de partie à enchaîner, seul le
  // retour est proposé.
  function regles() {
    detruirePartieActive();
    veille.relacher();
    global.EcranRegles.afficher(racine, { surRetour: accueil });
  }

  function joueurs(plateau) {
    detruirePartieActive();
    global.EcranJoueurs.afficher(racine, { plateau: plateau, surRetour: accueil,
      surCommencer: function (liste) { reglesAvantPartie(plateau, liste); } });
  }

  // Règles affichées juste avant l'échauffement (première phase de l'écran de
  // partie) : les deux boutons mènent à la partie, le retour n'a pas de sens
  // ici (revenir en arrière perdrait la saisie des joueurs).
  function reglesAvantPartie(plateau, liste) {
    detruirePartieActive();
    global.EcranRegles.afficher(racine, { surSuite: function () { partie(plateau, liste); } });
  }

  function partie(plateau, liste) {
    detruirePartieActive();
    var p = global.Regles.creerPartie(plateau, liste,
      { bib: bib, ev: global.EVENEMENTS, alea: global.Aleatoire.creer(Date.now() % 4294967296) });
    veille.prendre();
    ecranPartieActif = global.EcranPartie.afficher(racine, { partie: p, son: son, surQuitter: accueil });
  }

  // Écran d'erreur minimal, construit avec du DOM brut uniquement (pas de
  // passage par UI.vider/UI.el/UI.bouton). C'est le filet de secours quand
  // l'écran d'erreur "riche" lui-même échoue à se construire : il ne doit
  // dépendre de rien qui puisse à son tour lever une exception.
  function afficherEcranErreurMinimal() {
    var cible = racine;
    try {
      if (!cible || !cible.appendChild) { cible = doc.body; }
    } catch (e) {
      cible = doc.body;
    }

    // On vide la cible avant d'y ajouter la boîte minimale : sinon, si
    // l'écran riche a échoué après avoir vidé (ou pas encore vidé) racine,
    // ou si un premier écran minimal est déjà là suite à une deuxième
    // erreur, on empilerait plusieurs écrans côte à côte. Best-effort :
    // une exception ici ne doit pas empêcher d'afficher la boîte.
    try {
      while (cible.firstChild) { cible.removeChild(cible.firstChild); }
    } catch (e) {
      // Sans gravité : on tente quand même d'ajouter la boîte minimale.
    }

    // Si la cible est document.body, une modale de partie (fond assombri)
    // peut être restée accrochée directement au body : on la retire pour
    // que la boîte minimale reste visible et cliquable.
    if (cible === doc.body) {
      try {
        var fonds = doc.body.getElementsByClassName("modal-fond");
        while (fonds.length) { doc.body.removeChild(fonds[0]); }
      } catch (e) {
        // Sans gravité.
      }
    }

    var section = doc.createElement("section");
    var titre = doc.createElement("h2");
    titre.textContent = "Oups, un problème est survenu";
    var texte = doc.createElement("p");
    texte.textContent = "La partie en cours est perdue. Désolé !";
    var bouton = doc.createElement("button");
    bouton.textContent = "Revenir à l'accueil";
    bouton.onclick = function () {
      global.location.reload();
    };
    section.appendChild(titre);
    section.appendChild(texte);
    section.appendChild(bouton);

    try {
      cible.appendChild(section);
    } catch (e) {
      // Dernier recours : racine était inutilisable, on tente document.body.
      doc.body.appendChild(section);
    }
  }

  // Une erreur imprévue ne doit jamais laisser un écran blanc en pleine
  // séance. L'écran de partie gère déjà ses propres exceptions moteur ; ce
  // filet ne sert que pour le reste (accueil, joueurs, ou tout autre cas).
  // La garde enErreur reste vraie pendant toute la construction de l'écran
  // d'erreur (riche ou minimal) pour qu'une exception synchrone à ce
  // moment-là ne puisse pas rouvrir ce même gestionnaire en boucle ; elle
  // est relâchée dès que l'utilisateur revient à l'accueil, ou si même
  // l'écran minimal échoue (pour laisser une chance à une erreur suivante).
  global.addEventListener("error", function () {
    if (enErreur) return;   // une erreur pendant le dessin de l'écran d'erreur ne doit jamais reboucler
    enErreur = true;

    try {
      detruirePartieActive();
      veille.relacher();
    } catch (e) {
      // Sans gravité : on tente quand même d'afficher un écran d'erreur.
    }

    try {
      global.UI.vider(racine);
      racine.appendChild(global.UI.el("section", { classe: "ecran erreur" }, [
        global.UI.el("h2", { texte: "Oups, un problème est survenu" }),
        global.UI.el("p", { texte: "La partie en cours est perdue. Désolé !" }),
        global.UI.bouton("Revenir à l'accueil", function () { enErreur = false; accueil(); }, "bouton-principal")
      ]));
    } catch (e) {
      // L'écran riche n'a pas pu être construit (UI.vider ou UI.el en
      // échec, par exemple) : on retombe sur l'écran minimal en DOM brut,
      // pour ne jamais laisser un écran blanc sans issue.
      try {
        afficherEcranErreurMinimal();
      } catch (e2) {
        // Rien de plus à tenter. On relâche quand même la garde pour
        // qu'une prochaine erreur globale ait sa chance, plutôt que d'être
        // ignorée indéfiniment.
        enErreur = false;
      }
    }
  });

  if (global.navigator && global.navigator.serviceWorker) {
    try {
      var enregistrement = global.navigator.serviceWorker.register("service-worker.js");
      if (enregistrement && enregistrement.catch) {
        enregistrement.catch(function () {
          // file:// ou navigateur sans support : l'app fonctionne quand même,
          // simplement sans mise en cache hors ligne.
        });
      }
    } catch (e) {
      // Certains navigateurs lèvent une erreur synchrone sur file:// plutôt
      // que de rejeter la promesse (violation de sécurité). Sans gravité.
    }
  }
  accueil();
})(typeof globalThis !== "undefined" ? globalThis : this);
