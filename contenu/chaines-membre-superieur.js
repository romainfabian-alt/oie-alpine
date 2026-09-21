(function (global) {
  // Chaînes de progression du membre supérieur. Contenu validé par Romain :
  // ne jamais modifier une variante sans son accord.
  // Niveaux : 1-3 reprise (aucun impact), 4-6 renforcement, 7-8 réathlétisation,
  // 9-10 retour au sport.
  function reps(n) { return { type: "reps", valeur: n }; }
  function sec(n) { return { type: "duree", valeur: n }; }
  function v(nom, description, materiel, dosage, o) {
    o = o || {};
    return { nom: nom, description: description, materiel: materiel, dosage: dosage,
      unilateral: !!o.unilateral, charge: o.charge || null, incompatible: o.incompatible || [],
      balle: o.balle || "aucune" };
  }
  var RIR45 = "Charge légère : 4-5 répétitions en réserve";
  var RIR23 = "2-3 répétitions en réserve";
  var RIR12 = "1-2 répétitions en réserve";
  var VITE = "Charge légère, vitesse maximale";
  var LOURD_VITE = "Charge lourde : 2-3 répétitions en réserve, poussée la plus rapide possible";
  var ISO_LEGER = "Charge légère, bras verrouillé sans trembler";
  var ISO_LOURD = "Charge lourde, poignet verrouillé et épaule basse";
  var U = { unilateral: true };
  var SGS = ["sans_genoux_sol"];
  var SOH = ["sans_overhead"];

  var CHAINES = [
    {
      id: "poussee_horizontale", nom: "Poussée horizontale", zone: "membre_superieur", exclueParFiltre: {},
      niveaux: {
        "1": [v("Pompes au mur", "Mains au mur largeur d'épaules, corps gainé en une ligne, plier les coudes puis pousser, sans creuser le bas du dos.", ["aucun"], reps(15)),
              v("Pompes sur les genoux", "Genoux au sol sur le tapis, mains sous les épaules, corps aligné des genoux à la tête, descendre puis pousser.", ["tapis_sol"], reps(10), { incompatible: SGS })],
        "2": [v("Pompes au mur lentes", "Mains au mur, descendre en 3 s et pousser en 1 s, coudes à 45° du buste, corps gainé sans cambrer.", ["aucun"], reps(12)),
              v("Pompes genoux tempo", "Genoux au sol, descendre la poitrine en 3 s puis pousser, coudes à 45° du buste, bassin dans l'alignement.", ["tapis_sol"], reps(10), { incompatible: SGS })],
        "3": [v("Pompes mains sur le step haut", "Mains sur le step réglé haut, corps gainé, descendre la poitrine vers le step puis pousser, coudes à 45°.", ["step"], reps(12)),
              v("Pompes genoux amplitude", "Genoux au sol, descendre jusqu'à effleurer le sol de la poitrine puis pousser, corps aligné, sans cambrer.", ["tapis_sol"], reps(12), { incompatible: SGS })],
        "4": [v("Pompes sur le step", "Mains sur le step réglé bas, corps gainé des talons à la tête, descendre la poitrine puis pousser, coudes à 45°.", ["step"], reps(12)),
              v("Pompes mains écartées sur step", "Mains sur le step, écartées d'une main et demie, descendre la poitrine puis pousser, bassin dans l'alignement.", ["step"], reps(12))],
        "5": [v("Pompes", "Mains sous les épaules, corps gainé, descendre la poitrine à quelques centimètres du sol puis pousser, coudes à 45°.", ["tapis_sol"], reps(10)),
              v("Pompes sur le step tempo", "Mains sur le step, descendre en 3 s, 1 s en bas, pousser en 1 s, corps gainé sans que le bassin s'affaisse.", ["step"], reps(10))],
        "6": [v("Pompes tempo", "Descendre la poitrine en 3 s, marquer 1 s en bas sans relâcher le gainage, puis pousser, coudes à 45° du buste.", ["tapis_sol"], reps(10)),
              v("Pompes mains rapprochées", "Mains à largeur de bassin sous la poitrine, coudes qui frôlent le buste, descendre puis pousser, corps aligné.", ["tapis_sol"], reps(10))],
        "7": [v("Pompes pieds sur le step", "Pieds posés sur le step, mains au sol sous les épaules, descendre la poitrine puis pousser, sans creuser le bas du dos.", ["step", "tapis_sol"], reps(10)),
              v("Pompes aux sangles", "Poignées des sangles tenues, corps gainé incliné, descendre la poitrine entre les mains puis pousser, coudes à 45°.", ["sangles_suspension"], reps(10))],
        "8": [v("Pompes pieds surélevés tempo", "Pieds sur le step, descendre en 3 s, 1 s en bas, pousser en 1 s, bassin dans l'alignement des épaules et des talons.", ["step", "tapis_sol"], reps(8)),
              v("Pompes aux sangles tempo", "Sangles en main, descendre en 3 s en contrôlant l'écartement des poignées, 1 s en bas, pousser en 1 s, corps gainé.", ["sangles_suspension"], reps(8))],
        "9": [v("Pompes explosives sans décollage", "Descendre la poitrine en contrôle puis pousser le plus vite possible sans décoller les mains du sol, corps gainé.", ["tapis_sol"], reps(8)),
              v("Pompes pieds sur la pliobox", "Pieds posés sur la pliobox, mains au sol, descendre la poitrine puis pousser, sans que le bassin s'affaisse.", ["pliobox", "tapis_sol"], reps(8))],
        "10": [v("Pompes aux sangles pieds hauts", "Pieds sur le step, mains dans les sangles, descendre la poitrine entre les poignées puis pousser, corps gainé.", ["sangles_suspension", "step"], reps(8)),
               v("Pompes explosives sur le step", "Mains sur le step, descendre en contrôle puis pousser le plus vite possible sans décoller les mains, corps gainé.", ["step"], reps(8))]
      }
    },
    {
      id: "poussee_verticale", nom: "Poussée verticale", zone: "membre_superieur",
      exclueParFiltre: { sans_overhead: "poussee_horizontale" },
      niveaux: {
        "1": [v("Élévations frontales élastique", "Debout sur l'élastique, monter les bras tendus devant jusqu'à hauteur d'épaules puis redescendre lentement, sans cambrer.", ["elastiques"], reps(15)),
              v("Élévations frontales haltères", "Un haltère léger dans chaque main, monter les bras tendus devant jusqu'à hauteur d'épaules, redescendre en 3 s.", ["halteres"], reps(12), { charge: RIR45 })],
        "2": [v("Élévations frontales lentes", "Debout sur l'élastique, monter les bras tendus devant en 2 s, tenir 1 s à hauteur d'épaules, redescendre en 3 s.", ["elastiques"], reps(12)),
              v("Développé assis élastique", "Assis sur le step, élastique passé sous les pieds, pousser les mains vers le plafond sans cambrer le bas du dos.", ["elastiques", "step"], reps(12))],
        "3": [v("Développé haltères assis", "Assis sur le step, dos droit, haltères légers partant du niveau des oreilles, pousser vers le plafond sans cambrer.", ["halteres", "step"], reps(12), { charge: RIR45 })],
        "4": [v("Développé sur swiss ball", "Assis sur le swiss ball, pieds bien à plat, pousser les haltères vers le plafond, bas du dos neutre, gainage serré.", ["halteres", "swiss_ball"], reps(10), { charge: RIR23 }),
              v("Développé élastique debout", "Debout sur l'élastique, extrémités tenues à hauteur d'oreilles, pousser les mains vers le plafond sans cambrer.", ["elastiques"], reps(15))],
        "5": [v("Développé haltères tempo", "Assis sur le step, pousser les haltères en 1 s et redescendre en 3 s jusqu'au niveau des oreilles, dos droit.", ["halteres", "step"], reps(8), { charge: RIR23 }),
              v("Développé haltères debout", "Debout, fessiers et abdominaux serrés, pousser les haltères vers le plafond sans cambrer le bas du dos.", ["halteres"], reps(10), { charge: RIR23 })],
        "6": [v("Développé swiss ball tempo", "Assis sur le swiss ball, pousser les haltères en 1 s et redescendre en 3 s, ballon parfaitement immobile.", ["halteres", "swiss_ball"], reps(8), { charge: RIR23 }),
              v("Développé kettlebell assis", "Assis sur le step, kettlebell calée contre l'avant-bras, pousser vers le plafond sans cambrer, poignet droit.", ["kettlebells", "step"], reps(8), { unilateral: true, charge: RIR23 })],
        "7": [v("Développé haltère unilatéral", "Debout, un seul haltère, pousser vers le plafond sans que le buste s'incline, gainage serré, bassin de face.", ["halteres"], reps(8), { unilateral: true, charge: RIR23 }),
              v("Développé kettlebell debout", "Debout, kettlebell calée contre l'avant-bras, pousser vers le plafond, fessiers serrés, sans cambrer le bas du dos.", ["kettlebells"], reps(8), { unilateral: true, charge: RIR23 })],
        "8": [v("Développé haltère tempo", "Debout, un seul haltère, pousser en 1 s et redescendre en 3 s, buste strictement droit, bassin de face.", ["halteres"], reps(8), { unilateral: true, charge: RIR12 }),
              v("Développé kettlebell lourd", "Debout, kettlebell lourde calée contre l'avant-bras, pousser vers le plafond, gainage serré, poignet droit.", ["kettlebells"], reps(8), { unilateral: true, charge: RIR12 })],
        "9": [v("Push press haltères", "Haltères au niveau des oreilles, courte flexion des genoux puis extension vive qui propulse les haltères vers le plafond.", ["halteres"], reps(8), { charge: VITE, incompatible: ["sans_charge_dos"] }),
              v("Développé kettlebell en fente", "En fente avant tenue, kettlebell calée contre l'avant-bras du côté de la jambe arrière, pousser vers le plafond.", ["kettlebells"], reps(8), { unilateral: true, charge: RIR23 })],
        "10": [v("Push press kettlebells", "Kettlebells calées contre les avant-bras, extension vive des jambes pour les propulser, verrouiller les bras en haut.", ["kettlebells"], reps(6), { charge: LOURD_VITE, incompatible: ["sans_charge_dos"] }),
               v("Développé en chevalier servant", "En chevalier servant, genou arrière au sol, kettlebell calée contre l'avant-bras, pousser vers le plafond sans cambrer.", ["kettlebells", "tapis_sol"], reps(8), { unilateral: true, charge: RIR23, incompatible: SGS })]
      }
    },
    {
      id: "tirage_horizontal", nom: "Tirage horizontal", zone: "membre_superieur", exclueParFiltre: {},
      niveaux: {
        "1": [v("Tirage élastique assis", "Assis au sol jambes tendues, élastique passé autour des pieds, tirer les coudes vers l'arrière en serrant les omoplates.", ["elastiques", "tapis_sol"], reps(15)),
              v("Tirage élastique debout", "Élastique fixé devant à hauteur de poitrine, tirer les coudes le long du buste en serrant les omoplates, dos droit.", ["elastiques"], reps(15))],
        "2": [v("Tirage élastique assis lent", "Assis jambes tendues, tirer les coudes vers l'arrière en 2 s et relâcher en 3 s, buste droit sans se balancer.", ["elastiques", "tapis_sol"], reps(12)),
              v("Tirage élastique un bras", "Élastique fixé devant, tirer d'une seule main le coude le long du buste, sans que le buste tourne.", ["elastiques"], reps(12), U)],
        "3": [v("Tirage élastique fort", "Élastique plus résistant fixé devant, tirer les coudes vers l'arrière, omoplates serrées 1 s, retour contrôlé.", ["elastiques"], reps(12)),
              v("Rowing élastique tempo", "Élastique fixé devant, tirer en 1 s, tenir 2 s omoplates serrées, revenir en 3 s, buste immobile.", ["elastiques"], reps(12))],
        "4": [v("Rowing haltère sur le step", "Une main et un genou en appui sur le step, tirer l'haltère vers la hanche, dos plat, sans rotation du buste.", ["halteres", "step"], reps(12), { unilateral: true, charge: RIR23 }),
              v("Rowing élastique assis", "Assis sur le step, élastique fixé devant à hauteur de poitrine, tirer les coudes vers l'arrière, dos droit.", ["elastiques", "step"], reps(15))],
        "5": [v("Rowing haltère tempo", "Appui main et genou sur le step, tirer l'haltère en 1 s, tenir 1 s, redescendre en 3 s, dos plat.", ["halteres", "step"], reps(10), { unilateral: true, charge: RIR23 }),
              v("Rowing haltères buste penché", "Buste penché à 45°, dos plat, genoux souples, tirer les deux haltères vers les hanches en serrant les omoplates.", ["halteres"], reps(10), { charge: RIR23 })],
        "6": [v("Rowing haltères lourd", "Buste penché à 45°, dos plat, tirer deux haltères lourds vers les hanches, sans à-coup ni élan du buste.", ["halteres"], reps(8), { charge: RIR12 }),
              v("Rowing élastique rapide", "Élastique fort fixé devant, tirer le plus vite possible d'une main, retour freiné en 3 s, buste de face.", ["elastiques"], reps(15), U)],
        "7": [v("Rowing aux sangles", "Sangles en main, corps gainé incliné en arrière, tirer la poitrine vers les mains en serrant les omoplates.", ["sangles_suspension"], reps(12)),
              v("Rowing aux sangles tempo", "Corps gainé incliné, tirer en 1 s, tenir 2 s poitrine près des mains, redescendre en 3 s sans casser l'alignement.", ["sangles_suspension"], reps(10))],
        "8": [v("Rowing sangles corps horizontal", "Pieds avancés, corps presque horizontal et gainé, tirer la poitrine vers les mains, bassin dans l'alignement.", ["sangles_suspension"], reps(10)),
              v("Rowing aux sangles un bras", "Une seule poignée en main, corps gainé incliné, tirer sans laisser le buste tourner ni le bassin s'ouvrir.", ["sangles_suspension"], reps(8), U)],
        "9": [v("Rowing sangles pieds surélevés", "Pieds posés sur le step, corps gainé sous l'horizontale, tirer la poitrine vers les mains, bassin aligné.", ["sangles_suspension", "step"], reps(10)),
              v("Rowing unilatéral aux sangles", "Une poignée en main, pieds avancés, corps presque horizontal, tirer d'un seul bras sans rotation du buste.", ["sangles_suspension"], reps(8), U)],
        "10": [v("Rowing pieds hauts tempo", "Pieds sur le step, corps gainé, tirer en 1 s, tenir 2 s, redescendre en 3 s sans que le bassin s'affaisse.", ["sangles_suspension", "step"], reps(8)),
               v("Rowing unilatéral pieds hauts", "Pieds sur le step, une seule poignée en main, tirer d'un bras en gardant les épaules et le bassin de face.", ["sangles_suspension", "step"], reps(8), U)]
      }
    },
    {
      id: "tirage_vertical", nom: "Tirage vertical", zone: "membre_superieur",
      exclueParFiltre: { sans_overhead: "tirage_horizontal" },
      niveaux: {
        "1": [v("Tirage élastique vers le bas", "Assis sur le step, élastique passé sur la barre de traction, tirer les mains vers la poitrine en serrant les omoplates.", ["elastiques", "barre_traction", "step"], reps(15)),
              v("Tirage bras tendus élastique", "Debout, élastique passé sur la barre de traction, tirer les bras tendus vers les cuisses, dos droit, abdominaux serrés.", ["elastiques", "barre_traction"], reps(12))],
        "2": [v("Tirage élastique lent", "Assis sur le step, tirer les mains vers la poitrine en 2 s et remonter en 3 s, sans se balancer en arrière.", ["elastiques", "barre_traction", "step"], reps(12)),
              v("Tirage élastique un bras", "Debout, élastique passé sur la barre, tirer d'une seule main le coude vers la hanche, buste droit sans rotation.", ["elastiques", "barre_traction"], reps(12), U)],
        "3": [v("Tirage élastique fort", "Assis sur le step, élastique plus résistant, tirer les mains vers la poitrine, omoplates serrées 1 s, retour contrôlé.", ["elastiques", "barre_traction", "step"], reps(12)),
              v("Tirage à genoux", "À genoux sur le tapis, élastique passé sur la barre, tirer les mains vers la poitrine sans cambrer le bas du dos.", ["elastiques", "barre_traction", "tapis_sol"], reps(12), { incompatible: SGS })],
        "4": [v("Traction négative assistée", "Monter sur le step jusqu'au menton à hauteur de barre, retirer les pieds, descendre en 4 s jusqu'aux bras tendus.", ["barre_traction", "step"], reps(6)),
              v("Suspension à la barre", "Suspendu à la barre bras tendus, épaules actives et basses, gainage serré, tenir sans se balancer.", ["barre_traction"], sec(20), { incompatible: SOH })],
        "5": [v("Traction négative lente", "Départ menton haut, pieds retirés du step, descendre en 6 s en contrôlant les omoplates jusqu'aux bras tendus.", ["barre_traction", "step"], reps(5)),
              v("Traction australienne", "Sangles réglées bas, corps gainé incliné en arrière, tirer la poitrine vers les mains en serrant les omoplates.", ["sangles_suspension"], reps(10))],
        "6": [v("Traction négative longue", "Départ menton à hauteur de barre, descendre en 8 s jusqu'aux bras tendus, sans laisser les épaules monter aux oreilles.", ["barre_traction", "step"], reps(5)),
              v("Traction élastique fort", "Élastique fort accroché à la barre et pied posé dedans, monter le menton à hauteur de barre, descendre en 3 s.", ["barre_traction", "elastiques"], reps(8))],
        "7": [v("Traction assistée à l'élastique", "Élastique moyen accroché à la barre, un genou posé dedans, monter le menton à hauteur de barre, descendre en 3 s.", ["barre_traction", "elastiques"], reps(8)),
              v("Traction assistée deux temps", "Élastique moyen, monter le menton à hauteur de barre en 1 s, tenir 2 s, descendre en 3 s jusqu'aux bras tendus.", ["barre_traction", "elastiques"], reps(6))],
        "8": [v("Traction assistée légère", "Élastique fin accroché à la barre, un pied posé dedans, monter le menton à hauteur de barre, descendre en 3 s.", ["barre_traction", "elastiques"], reps(6)),
              v("Traction isométrique", "Menton à hauteur de barre, coudes serrés, tenir la position sans bouger, épaules basses et omoplates serrées.", ["barre_traction"], sec(15))],
        "9": [v("Tractions", "Suspendu à la barre en pronation, monter le menton à hauteur de barre puis redescendre bras tendus en contrôle.", ["barre_traction"], reps(6), { incompatible: SOH }),
              v("Tractions prise neutre", "Poignées parallèles, monter la poitrine vers la barre, coudes le long du buste, descendre jusqu'aux bras tendus.", ["barre_traction"], reps(6))],
        "10": [v("Tractions lestées", "Un haltère tenu entre les pieds, monter le menton à hauteur de barre puis redescendre bras tendus en 3 s.", ["barre_traction", "halteres"], reps(5), { charge: RIR12 }),
               v("Tractions tempo", "Monter en 1 s, tenir 2 s menton à hauteur de barre, descendre en 4 s jusqu'aux bras tendus, épaules basses.", ["barre_traction"], reps(5))]
      }
    },
    {
      id: "coiffe_scapula", nom: "Coiffe et scapula", zone: "membre_superieur", exclueParFiltre: {},
      niveaux: {
        "1": [v("Rotation externe coude au corps", "Élastique fixé devant à hauteur de coude, coude collé au buste à 90°, ouvrir l'avant-bras vers l'extérieur puis revenir en 3 s.", ["elastiques"], reps(15), U),
              v("Y-T-W sur swiss ball", "Ventre sur le swiss ball, enchaîner les bras en Y, en T puis en W en serrant les omoplates, pouces vers le plafond.", ["swiss_ball"], reps(10))],
        "2": [v("Rotation externe lente", "Élastique fixé devant, coude au corps à 90°, ouvrir en 2 s, tenir 2 s, revenir en 3 s, épaule basse.", ["elastiques"], reps(12), U),
              v("Y sur swiss ball", "Ventre sur le swiss ball, monter les bras en Y dans le prolongement du corps, pouces vers le plafond, nuque dans l'axe.", ["swiss_ball"], reps(12))],
        "3": [v("Rotation externe élastique fort", "Élastique plus résistant, coude collé au buste, ouvrir l'avant-bras sans que l'épaule monte ni que le buste tourne.", ["elastiques"], reps(12), U),
              v("T et W sur swiss ball", "Ventre sur le swiss ball, écarter les bras en T puis plier les coudes en W, omoplates serrées, nuque dans l'axe.", ["swiss_ball"], reps(12))],
        "4": [v("Rotation externe à 90°", "Coude levé à hauteur d'épaule, avant-bras à 90°, tourner l'avant-bras vers l'arrière contre l'élastique puis revenir en 3 s.", ["elastiques"], reps(12), U),
              v("Pompes scapulaires", "En planche sur les mains, bras tendus, rapprocher puis écarter les omoplates sans plier les coudes, bassin immobile.", ["tapis_sol"], reps(15))],
        "5": [v("Rotation externe 90° tempo", "Coude à hauteur d'épaule, tourner l'avant-bras en 2 s, tenir 2 s, revenir en 3 s, sans que l'épaule remonte.", ["elastiques"], reps(10), U),
              v("Pompes scapulaires pieds hauts", "Pieds posés sur le step, bras tendus, rapprocher puis écarter les omoplates sans plier les coudes, bassin aligné.", ["step", "tapis_sol"], reps(12))],
        "6": [v("Rotation externe 90° résistée", "Élastique fort, coude à hauteur d'épaule, tourner l'avant-bras vers l'arrière, épaule basse, buste immobile.", ["elastiques"], reps(10), U),
              v("Pompes scapulaires aux sangles", "Poignées en main, corps gainé incliné, rapprocher puis écarter les omoplates sans plier les coudes.", ["sangles_suspension"], reps(12))],
        "7": [v("Kettlebell tenue au-dessus", "Kettlebell tenue bras verrouillé au-dessus de la tête, poignet droit, épaule basse, tenir sans que le bras oscille.", ["kettlebells"], sec(30), { unilateral: true, charge: ISO_LEGER, incompatible: SOH }),
              v("Marche du fermier tête en bas", "Kettlebell tenue tête en bas contre l'avant-bras, marcher droit en gardant le poignet verrouillé et l'épaule basse.", ["kettlebells"], sec(30), { unilateral: true, charge: ISO_LEGER })],
        "8": [v("Stabilisation avec pas", "Kettlebell tenue bras verrouillé au-dessus de la tête, avancer et reculer de quelques pas sans que le bras bouge.", ["kettlebells"], sec(30), { unilateral: true, charge: ISO_LEGER, incompatible: SOH }),
              v("Marche tête en bas longue", "Kettlebell tenue tête en bas contre l'avant-bras, marcher en ligne droite sans laisser le poignet casser ni l'épaule monter.", ["kettlebells"], sec(45), { unilateral: true, charge: ISO_LEGER })],
        "9": [v("Rotation externe excentrique", "Élastique fort, coude à hauteur d'épaule, tourner vite vers l'arrière puis freiner le retour en 4 s, épaule basse.", ["elastiques"], reps(12), U),
              v("Porté tête en bas lourd", "Kettlebell lourde tenue tête en bas contre l'avant-bras, marcher droit, poignet verrouillé et épaule basse.", ["kettlebells"], sec(40), { unilateral: true, charge: ISO_LOURD })],
        "10": [v("Excentrique rapide résisté", "Élastique très fort, rotation externe vive puis retour freiné en 5 s, sans que l'épaule monte vers l'oreille.", ["elastiques"], reps(10), U),
               v("Porté tête en bas en ligne", "Kettlebell lourde tenue tête en bas, marcher pied devant pied sur une ligne, poignet verrouillé, buste droit.", ["kettlebells"], sec(45), { unilateral: true, charge: ISO_LOURD })]
      }
    },
    {
      id: "passes", nom: "Passes et médecine-ball", zone: "membre_superieur", exclueParFiltre: {},
      niveaux: {
        "1": [v("Rotations médecine-ball tenu", "Debout, médecine-ball tenu à deux mains devant la poitrine, tourner le buste à droite puis à gauche, bassin immobile.", ["medecine_ball"], reps(15), { balle: "tenue" }),
              v("Poussée médecine-ball tenu", "Médecine-ball tenu à deux mains contre la poitrine, tendre les bras devant soi puis ramener le ballon, sans le lâcher.", ["medecine_ball"], reps(15), { balle: "tenue" })],
        "2": [v("Ballon autour de la taille", "Debout, faire passer le médecine-ball autour de la taille d'une main à l'autre, bassin immobile, épaules relâchées.", ["medecine_ball"], sec(30), { balle: "tenue" }),
              v("Poussée bras tendus", "Médecine-ball tenu à deux mains, tendre les bras devant la poitrine et tenir 2 s, sans hausser les épaules.", ["medecine_ball"], reps(12), { balle: "tenue" })],
        "3": [v("Médecine-ball en diagonale", "Médecine-ball tenu à deux mains, l'amener de la hanche à l'épaule opposée puis revenir, bras tendus, bassin de face.", ["medecine_ball"], reps(12), { unilateral: true, balle: "tenue" }),
              v("Poussée en fente", "En fente avant tenue, médecine-ball contre la poitrine, tendre les bras devant soi puis ramener le ballon, buste droit.", ["medecine_ball"], reps(10), { unilateral: true, balle: "tenue" })],
        "4": [v("Passes de poitrine à 2 m", "Face à un partenaire à 2 m, renvoyer le médecine-ball de la poitrine à deux mains, pieds décalés, buste gainé.", ["medecine_ball"], reps(15), { balle: "passe" }),
              v("Poussée rapide médecine-ball", "Médecine-ball contre la poitrine, tendre les bras devant soi le plus vite possible puis ramener le ballon en contrôle.", ["medecine_ball"], reps(15), { balle: "tenue" })],
        "5": [v("Passes de poitrine rapides", "Face au partenaire à 2 m, enchaîner les renvois de poitrine sans pause, bras qui amortissent puis repoussent aussitôt.", ["medecine_ball"], reps(15), { balle: "passe" }),
              v("Poussée explosive tenue", "Médecine-ball contre la poitrine, tendre les bras le plus vite possible sans lâcher le ballon, retour freiné en 2 s.", ["medecine_ball"], reps(12), { balle: "tenue" })],
        "6": [v("Passes de poitrine à 3 m", "Face au partenaire à 3 m, renvoyer le médecine-ball de la poitrine, jambes légèrement fléchies, buste gainé.", ["medecine_ball"], reps(12), { balle: "passe" }),
              v("Poussée lourde tenue", "Médecine-ball lourd contre la poitrine, tendre les bras devant soi puis ramener le ballon, sans cambrer le bas du dos.", ["medecine_ball"], reps(10), { balle: "tenue" })],
        "7": [v("Passes latérales en rotation", "De profil au partenaire, renvoyer le médecine-ball par une rotation vive du buste, bassin qui suit, pieds au sol.", ["medecine_ball"], reps(12), { unilateral: true, balle: "passe" }),
              v("Rotation explosive tenue", "Médecine-ball tenu à deux mains, tourner le buste le plus vite possible d'un côté puis de l'autre sans lâcher le ballon.", ["medecine_ball"], reps(12), { balle: "tenue" })],
        "8": [v("Passes au-dessus de la tête", "Face au partenaire, renvoyer le médecine-ball à deux mains depuis au-dessus de la tête, sans cambrer le bas du dos.", ["medecine_ball"], reps(12), { balle: "passe", incompatible: SOH }),
              v("Poussée haute tenue", "Médecine-ball tenu à deux mains, le monter au-dessus de la tête bras tendus puis redescendre, sans cambrer.", ["medecine_ball"], reps(12), { balle: "tenue", incompatible: SOH }),
              v("Rotation en fente tenue", "En fente avant tenue, médecine-ball devant la poitrine, tourner le buste vite vers la jambe avant puis revenir.", ["medecine_ball"], reps(10), { unilateral: true, balle: "tenue" })],
        "9": [v("Passes explosives en fente", "En fente avant tenue, renvoyer le médecine-ball au partenaire de la poitrine sans bouger les appuis, buste gainé.", ["medecine_ball"], reps(10), { unilateral: true, balle: "passe" }),
              v("Poussée explosive en fente", "En fente avant tenue, pousser le médecine-ball devant soi le plus vite possible sans le lâcher, appuis immobiles.", ["medecine_ball"], reps(10), { unilateral: true, balle: "tenue" })],
        "10": [v("Passes unipodales", "Sur un pied, renvoyer le médecine-ball au partenaire de la poitrine, genou d'appui souple, bassin horizontal.", ["medecine_ball"], reps(10), { unilateral: true, balle: "passe" }),
               v("Poussée unipodale tenue", "Sur un pied, pousser le médecine-ball devant soi sans le lâcher, genou d'appui souple, bassin horizontal.", ["medecine_ball"], reps(10), { unilateral: true, balle: "tenue" })]
      }
    }
  ];

  if (typeof module !== "undefined" && module.exports) module.exports = CHAINES;
  else global.CHAINES_MEMBRE_SUPERIEUR = CHAINES;
})(typeof globalThis !== "undefined" ? globalThis : this);
