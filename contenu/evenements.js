(function (global) {
  // Cartes du jeu : météo, duels, échauffements et cases de repos.
  // Contenu à relire par Romain : ne jamais modifier une carte sans son accord.
  // Règles tenues ici : texte de météo sous 120 caractères, aucun rebond de balle,
  // échauffements sans matériel et sans impact (ils s'adressent à tous les joueurs,
  // quels que soient leurs filtres).

  // Météo : soit un déplacement (cible « tous », « dernier » ou « premier »,
  // valeur entière non nulle entre -3 et 3), soit un exercice d'une chaîne.
  var METEO = [
    { id: "grand_beau", titre: "Grand beau",
      texte: "Ciel dégagé sur toute la vallée, la trace est rapide : tout le monde avance de 2 cases.",
      effet: { type: "deplacement", cible: "tous", valeur: 2 } },
    { id: "poudreuse", titre: "Poudreuse",
      texte: "Trente centimètres de fraîche : le dernier ouvre la trace et avance de 3 cases.",
      effet: { type: "deplacement", cible: "dernier", valeur: 3 } },
    { id: "brouillard", titre: "Brouillard",
      texte: "La purée de pois efface les balises, tout le monde recule d'une case.",
      effet: { type: "deplacement", cible: "tous", valeur: -1 } },
    { id: "vent_du_nord", titre: "Vent du nord",
      texte: "Le vent de face freine la tête de course, le premier recule de 2 cases.",
      effet: { type: "deplacement", cible: "premier", valeur: -2 } },
    { id: "redoux", titre: "Redoux",
      texte: "La neige colle moins et la montée passe mieux, tout le monde avance d'une case.",
      effet: { type: "deplacement", cible: "tous", valeur: 1 } },
    { id: "coup_de_foehn", titre: "Coup de foehn",
      texte: "Le foehn pousse dans le dos du dernier, il avance de 2 cases.",
      effet: { type: "deplacement", cible: "dernier", valeur: 2 } },
    { id: "orage", titre: "Orage",
      texte: "Tout le monde s'abrite sous le rocher et gaine en attendant l'accalmie.",
      effet: { type: "exercice", chaine: "gainage_anterieur" } },
    { id: "tempete", titre: "Tempête",
      texte: "Bourrasques de travers : il faut tenir de profil sans se laisser pousser.",
      effet: { type: "exercice", chaine: "gainage_lateral" } },
    { id: "verglas", titre: "Verglas",
      texte: "La plaque de glace oblige à poser chaque appui avec précision.",
      effet: { type: "exercice", chaine: "equilibre" } },
    { id: "jour_blanc", titre: "Jour blanc",
      texte: "Plus d'horizon ni de relief : le bassin doit rester stable à chaque pas.",
      effet: { type: "exercice", chaine: "stabilite_hanche" } },
    { id: "arc_en_ciel", titre: "Arc-en-ciel",
      texte: "L'averse s'éloigne et le moral remonte, tout le monde avance d'une case.",
      effet: { type: "deplacement", cible: "tous", valeur: 1 } },
    { id: "chute_de_neige", titre: "Chute de neige",
      texte: "Il neige serré et la trace se referme, le premier recule d'une case.",
      effet: { type: "deplacement", cible: "premier", valeur: -1 } }
  ];

  // Duels : « tenue » = tenir le plus longtemps, « reps30 » = le plus de
  // répétitions en 30 s. Un duel « tenue » exige une variante en durée au
  // niveau 1 de la chaîne, sinon le joueur le plus fragile ne peut pas jouer.
  var DUELS = [
    { id: "duel_planche", titre: "Duel de planche", chaine: "gainage_anterieur", format: "tenue" },
    { id: "duel_planche_laterale", titre: "Duel de planche latérale", chaine: "gainage_lateral", format: "tenue" },
    { id: "duel_squats", titre: "Duel de squats", chaine: "squat", format: "reps30" },
    { id: "duel_pompes", titre: "Duel de pompes", chaine: "poussee_horizontale", format: "reps30" },
    { id: "duel_rowing", titre: "Duel de rowing", chaine: "tirage_horizontal", format: "reps30" },
    { id: "duel_mollets", titre: "Duel de mollets", chaine: "mollet_cheville", format: "reps30" },
    { id: "duel_superman", titre: "Duel de superman", chaine: "gainage_posterieur", format: "reps30" },
    { id: "duel_releves", titre: "Duel de relevés", chaine: "flexion_controlee", format: "reps30" }
  ];

  // Échauffements : lignes « Nom : dosage », sans matériel et sans impact.
  var ECHAUFFEMENTS = {
    membre_inferieur: [
      "Marche sur place en déroulant le pied : 45 s",
      "Montées de genoux sur place : 30 s",
      "Rotations de cheville : × 10 / côté",
      "Squats au poids du corps, amplitude confortable : × 10",
      "Fentes arrière lentes : × 6 / côté"
    ],
    tronc: [
      "Rotations de bassin debout : 30 s",
      "Inclinaisons latérales du buste : × 8 / côté",
      "Rotations du buste, bras croisés sur la poitrine : × 10",
      "Dead bug lent sur le dos : × 8",
      "Respiration ample par les côtes basses : 30 s"
    ],
    membre_superieur: [
      "Cercles d'épaules vers l'arrière : × 10",
      "Ouverture de poitrine, bras écartés à hauteur d'épaules : 30 s",
      "Rotations externes, coudes au corps : × 10 / côté",
      "Élévations des bras devant soi jusqu'aux épaules : × 12",
      "Glissements des omoplates vers le bas : × 10"
    ],
    full_body: [
      "Marche sur place en balançant les bras : 45 s",
      "Montées de genoux sur place : 30 s",
      "Rotations du buste, bras croisés sur la poitrine : × 10",
      "Cercles d'épaules vers l'arrière : × 10",
      "Squats au poids du corps, amplitude confortable : × 10"
    ]
  };

  var EVENEMENTS = {
    meteo: METEO,
    duels: DUELS,
    echauffements: ECHAUFFEMENTS,
    recuperation: { nom: "Récupération active",
      description: "Marche lente, grandes respirations, mobilité douce des épaules et des hanches.",
      dosage: { type: "duree", valeur: 60 } },
    ravitaillement: { nom: "Ravitaillement",
      description: "Bois quelques gorgées d'eau et récupère.",
      dosage: { type: "duree", valeur: 60 } },
    refuge: { nom: "Refuge", description: "Pause : tu te reposes pendant ce tour." },
    chaineCrevasse: "gainage_anterieur",
    chaineChamois: "agilite"
  };

  if (typeof module !== "undefined" && module.exports) module.exports = EVENEMENTS;
  else global.EVENEMENTS = EVENEMENTS;
})(typeof globalThis !== "undefined" ? globalThis : this);
