(function (global) {
  // Inventaire du cabinet (source : ~/SuiviPatient/app/materiel_defaut.json),
  // réduit au matériel utilisable en autonomie et disponible en plusieurs
  // exemplaires ou réservé aux cases jouées par un seul joueur.
  var MATERIEL = {
    halteres: "Haltères",
    kettlebells: "Kettlebell",
    elastiques: "Élastique",
    medecine_ball: "Médecine-ball",
    swiss_ball: "Swiss ball",
    step: "Step",
    bosu: "Bosu",
    pliobox: "Pliobox",
    haies: "Haies",
    echelle_rythme: "Échelle de rythme",
    plots: "Plots",
    corde_saut: "Corde à sauter",
    sangles_suspension: "Sangles de suspension",
    rip_trainer: "Rip trainer",
    baton: "Bâton",
    barre_traction: "Barre de traction",
    tapis_sol: "Tapis",
    aucun: "Sans matériel"
  };

  var FILTRES = {
    sans_saut: "Sans saut ni impact",
    sans_overhead: "Sans bras au-dessus de la tête",
    sans_genoux_sol: "Sans appui sur les genoux",
    sans_flexion_profonde: "Sans flexion profonde du genou",
    sans_charge_dos: "Sans charge sur le dos"
  };

  var MI = ["squat", "fente", "charniere", "pont_ischios", "mollet_cheville", "adducteurs",
            "stabilite_hanche", "equilibre", "plio_verticale", "plio_horizontale", "agilite"];
  var TRONC = ["gainage_anterieur", "gainage_lateral", "gainage_posterieur", "anti_rotation",
               "rotation", "flexion_controlee"];
  var MS = ["poussee_horizontale", "poussee_verticale", "tirage_horizontal", "tirage_vertical",
            "coiffe_scapula", "passes"];
  var COMPLEXE = ["complexe"];

  var ZONES = {
    membre_inferieur: { libelle: "Membre inférieur", chaines: MI },
    tronc: { libelle: "Tronc", chaines: TRONC },
    membre_superieur: { libelle: "Membre supérieur", chaines: MS },
    full_body: { libelle: "Full body", chaines: [].concat(MI, TRONC, MS, COMPLEXE) },
    complexe: { libelle: "Complexe", chaines: COMPLEXE }
  };

  // Les zones jouables (plateaux). « complexe » n'a pas de plateau propre.
  var ZONES_PLATEAU = ["membre_inferieur", "membre_superieur", "tronc", "full_body"];

  var PHASES = [
    { min: 1, max: 3, libelle: "Reprise" },
    { min: 4, max: 6, libelle: "Renforcement" },
    { min: 7, max: 8, libelle: "Réathlétisation" },
    { min: 9, max: 10, libelle: "Retour au sport" }
  ];

  // Interdits partout : aucun rebond de balle au sol ni au mur (demande de Romain).
  // Les passes de la main à la main entre joueurs restent autorisées.
  var MOTS_INTERDITS = [/rebond/i, /slam/i, /wall ?ball/i, /dribbl/i,
                        /(ball|balle|ballon)[^.]*contre le mur/i,
                        /(lancer|lance|jeter|jette|frapper|frappe|projeter)[^.]*(ball|balle|ballon)[^.]*(contre le mur|au mur|au sol|le sol|par terre)/i,
                        /(ball|balle|ballon)[^.]*(lancer|lance|jeter|jette|frapper|frappe|projeter)[^.]*(contre le mur|au mur|au sol|le sol|par terre)/i];

  function zoneDeChaine(id) {
    var zones = ["membre_inferieur", "tronc", "membre_superieur", "complexe"];
    for (var i = 0; i < zones.length; i++) {
      if (ZONES[zones[i]].chaines.indexOf(id) !== -1) return zones[i];
    }
    return null;
  }

  function phaseDe(niveau) {
    for (var i = 0; i < PHASES.length; i++) {
      if (niveau >= PHASES[i].min && niveau <= PHASES[i].max) return PHASES[i];
    }
    return null;
  }

  var Referentiel = {
    MATERIEL: MATERIEL, FILTRES: FILTRES, ZONES: ZONES, ZONES_PLATEAU: ZONES_PLATEAU,
    PHASES: PHASES, MOTS_INTERDITS: MOTS_INTERDITS, zoneDeChaine: zoneDeChaine, phaseDe: phaseDe
  };
  if (typeof module !== "undefined" && module.exports) module.exports = Referentiel;
  else global.Referentiel = Referentiel;
})(typeof globalThis !== "undefined" ? globalThis : this);
