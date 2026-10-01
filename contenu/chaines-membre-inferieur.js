(function (global) {
  // Chaînes de progression du membre inférieur. Contenu validé par Romain :
  // ne jamais modifier une variante sans son accord.
  // Niveaux : 1-3 reprise (aucun impact), 4-6 renforcement, 7-8 réathlétisation
  // (pliométrie légère), 9-10 retour au sport (pliométrie intense).
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
  var SWING = "Charge moyenne, hanches explosives";
  var SWING_LOURD = "Charge lourde : 2-3 répétitions en réserve, hanches explosives";
  var ISO_LOURD = "Charge lourde, tenue sans trembler";
  var LOURD_VITE = "Charge lourde : 2-3 répétitions en réserve, montée la plus rapide possible";
  var U = { unilateral: true };
  var SS = ["sans_saut"];

  var CHAINES = [
    {
      id: "squat", nom: "Squat", zone: "membre_inferieur", exclueParFiltre: {},
      niveaux: {
        "1": [v("Squat sur chaise", "Pieds largeur de hanches, s'asseoir lentement sur le step haut ou une chaise, puis se relever sans élan.", ["step"], reps(12)),
              v("Chaise au mur", "Dos contre le mur, genoux à 90° au maximum, poids sur les talons, respiration calme.", ["aucun"], sec(30))],
        "2": [v("Squat poids du corps", "Descendre jusqu'aux cuisses parallèles au sol, genoux dans l'axe des pieds, remonter en 2 s.", ["aucun"], reps(15))],
        "3": [v("Squat gobelet léger", "Haltère tenu contre la poitrine, descente contrôlée en 3 s, dos droit.", ["halteres"], reps(12), { charge: RIR45 })],
        "4": [v("Squat gobelet", "Kettlebell contre la poitrine, cuisses parallèles, pousser le sol pour remonter.", ["kettlebells"], reps(10), { charge: RIR23 }),
              v("Squat élastique aux genoux", "Élastique au-dessus des genoux, écarter les genoux pendant toute la descente.", ["elastiques"], reps(15))],
        "5": [v("Squat gobelet tempo", "Kettlebell contre la poitrine, 3 s de descente, 1 s en bas, remontée dynamique.", ["kettlebells"], reps(8), { charge: RIR23 })],
        "6": [v("Squat haltères", "Un haltère dans chaque main, bras le long du corps, cuisses parallèles, remontée dynamique.", ["halteres"], reps(10), { charge: RIR12 }),
              v("Squat bulgare", "Pied arrière posé sur le step, descendre le genou avant à 90°, buste légèrement penché.", ["step", "halteres"], reps(8), { unilateral: true, charge: RIR23 })],
        "7": [v("Squat sauté", "Descente aux cuisses parallèles, extension explosive, réception souple et silencieuse.", ["aucun"], reps(8), { incompatible: ["sans_saut"] }),
              v("Squat haltères lent", "Haltères en main, 4 s de descente, 2 s en bas, remontée sans à-coup.", ["halteres"], reps(8), { charge: RIR12 })],
        "8": [v("Squat sauté lesté", "Haltères légers en main, extension explosive, réception genoux dans l'axe.", ["halteres"], reps(6), { charge: "Charge légère, vitesse maximale", incompatible: ["sans_saut"] }),
              v("Squat unipodal sur box", "S'asseoir sur une jambe sur la pliobox de 50 cm, se relever sans élan.", ["pliobox"], reps(6), { unilateral: true })],
        "9": [v("Squat sauté 180°", "Saut avec demi-tour en l'air, réception stable 2 s avant le suivant.", ["aucun"], reps(8), { incompatible: ["sans_saut"] }),
              v("Squat unipodal lesté sur box", "Haltère contre la poitrine, s'asseoir sur une jambe sur la pliobox, remonter en contrôle.", ["pliobox", "halteres"], reps(6), { unilateral: true, charge: RIR23 })],
        "10": [v("Squat sauté sur pliobox", "Saut pieds joints sur la pliobox de 60 cm, réception basse, redescendre en marchant.", ["pliobox"], reps(6), { incompatible: ["sans_saut"] }),
               v("Pistol assisté", "Tenir les sangles, descendre sur une jambe l'autre tendue devant, remonter sans élan.", ["sangles_suspension"], reps(5), { unilateral: true, incompatible: ["sans_flexion_profonde"] })]
      }
    },
    {
      id: "fente", nom: "Fente", zone: "membre_inferieur", exclueParFiltre: {},
      niveaux: {
        "1": [v("Fente statique tenue", "Grand pas, descendre à mi-hauteur et tenir. Genou avant au-dessus de la cheville, buste droit, une main au mur si besoin.", ["aucun"], sec(20), U),
              v("Fente arrière courte", "Reculer d'un petit pas, fléchir les deux genoux à mi-course, remonter en poussant sur le talon avant, genou dans l'axe du pied.", ["aucun"], reps(8), U)],
        "2": [v("Fente arrière", "Reculer d'un grand pas, genou arrière descendu à une main du sol, remonter en poussant sur le talon avant. Genou avant stable.", ["aucun"], reps(10), U),
              v("Montée sur step", "Poser tout le pied sur le step, monter en poussant sur la jambe du haut sans s'aider de celle du bas, redescendre lentement.", ["step"], reps(10), U)],
        "3": [v("Fente arrière lestée légère", "Un haltère dans chaque main, reculer d'un grand pas, buste droit, genou avant aligné avec le deuxième orteil.", ["halteres"], reps(8), { unilateral: true, charge: RIR45 }),
              v("Fente latérale", "Grand pas de côté, s'asseoir sur la jambe fléchie, l'autre tendue, pieds à plat. Genou au-dessus du pied, dos droit.", ["aucun"], reps(8), U)],
        "4": [v("Fente arrière lestée", "Haltères en main, reculer d'un grand pas, genou arrière à une main du sol, remonter en poussant sur le talon avant.", ["halteres"], reps(10), { unilateral: true, charge: RIR23 }),
              v("Montée sur step lestée", "Haltères en main, monter sur le step par la seule poussée de la jambe du haut, redescendre en 2 s, genou dans l'axe.", ["step", "halteres"], reps(10), { unilateral: true, charge: RIR23 })],
        "5": [v("Marche en fente lestée", "Haltères en main, enchaîner les pas en avant, genou arrière à une main du sol, buste droit, genou avant au-dessus du pied.", ["halteres"], reps(8), { unilateral: true, charge: RIR23 }),
              v("Fente arrière et montée de genou", "Remonter de la fente arrière jusqu'à l'appui sur un pied, genou levé à hauteur de hanche, tenir 1 s, bassin horizontal.", ["aucun"], reps(10), U)],
        "6": [v("Fente avant lestée", "Haltères en main, grand pas en avant, freiner la descente, revenir en une poussée sur le talon. Genou avant dans l'axe.", ["halteres"], reps(8), { unilateral: true, charge: RIR12 }),
              v("Fente arrière genou levé lestée", "Haltère dans la main opposée à la jambe avant, remonter de la fente jusqu'au genou levé et tenir 1 s, bassin stable.", ["halteres"], reps(8), { unilateral: true, charge: RIR23 })],
        "7": [v("Fente sautée alternée", "Changer de jambe en l'air, réception souple sur l'avant-pied, genou avant dans l'axe, buste droit.", ["aucun"], reps(6), { unilateral: true, incompatible: SS }),
              v("Fente latérale rapide", "Grand pas de côté, freiner bas puis revenir au centre en une seule poussée vive, pied toujours au sol. Genou au-dessus du pied.", ["aucun"], reps(8), U)],
        "8": [v("Fente sautée stabilisée", "Changer de jambe en l'air et figer la réception 2 s, genou avant au-dessus du pied, bassin horizontal.", ["aucun"], reps(6), { unilateral: true, incompatible: SS }),
              v("Fente latérale rapide lestée", "Kettlebell contre la poitrine, pas latéral, freiner bas puis revenir au centre en une poussée vive. Genou au-dessus du pied.", ["kettlebells"], reps(8), { unilateral: true, charge: VITE })],
        "9": [v("Fente sautée lestée", "Haltères légers en main, changer de jambe en l'air, réception silencieuse, genou avant dans l'axe.", ["halteres"], reps(6), { unilateral: true, charge: VITE, incompatible: SS }),
              v("Marche en fente lourde", "Haltères lourds en main, pas longs et contrôlés, genou arrière à une main du sol, buste droit, genou avant stable.", ["halteres"], reps(8), { unilateral: true, charge: RIR12 })],
        "10": [v("Fente sautée avec rotation", "Médecine-ball tenu contre la poitrine, changer de jambe en l'air en tournant le buste vers la jambe avant, réception stable.", ["medecine_ball"], reps(6), { unilateral: true, incompatible: SS, balle: "tenue" }),
               v("Fente avant freinée lourde", "Haltères en main, grand pas vif en avant, freiner net en 1 s, revenir en une poussée. Genou avant dans l'axe, buste droit.", ["halteres"], reps(6), { unilateral: true, charge: RIR12 })]
      }
    },
    {
      id: "charniere", nom: "Charnière de hanche", zone: "membre_inferieur", exclueParFiltre: {},
      niveaux: {
        "1": [v("Charnière guidée au bâton", "Bâton le long du dos, en contact avec la tête et le bassin : reculer les fesses en penchant le buste, genoux souples, sans perdre le contact.", ["baton"], reps(12)),
              v("Charnière mains sur les cuisses", "Glisser les mains le long des cuisses jusqu'aux genoux en reculant les fesses, dos plat, puis remonter en serrant les fessiers.", ["aucun"], reps(12))],
        "2": [v("Good morning poids du corps", "Mains croisées sur la poitrine, pencher le buste vers l'avant en reculant les fesses, dos plat, genoux légèrement fléchis.", ["aucun"], reps(12)),
              v("Charnière unipodale au bâton", "Bâton planté devant soi comme une canne, pencher le buste en tendant une jambe derrière, bassin horizontal.", ["baton"], reps(8), U)],
        "3": [v("Soulevé de terre roumain léger", "Haltères devant les cuisses, descendre le long des jambes jusqu'aux genoux, dos plat, genoux souples, remonter hanches en avant.", ["halteres"], reps(12), { charge: RIR45 }),
              v("Charnière unipodale", "Sur un pied, pencher le buste en tendant l'autre jambe derrière jusqu'à l'horizontale, bassin horizontal, genou d'appui souple.", ["aucun"], reps(8), U)],
        "4": [v("Soulevé de terre roumain", "Kettlebell tenue à deux mains, descendre le long des cuisses jusqu'à mi-tibias, dos plat, genoux souples.", ["kettlebells"], reps(10), { charge: RIR23 }),
              v("Soulevé roumain élastique", "Debout sur l'élastique, une extrémité dans chaque main, charnière de hanche puis remonter en serrant les fessiers, dos plat.", ["elastiques"], reps(15))],
        "5": [v("Soulevé roumain unipodal", "Haltère dans la main opposée à la jambe d'appui, pencher le buste jambe libre tendue, bassin horizontal, dos plat.", ["halteres"], reps(8), { unilateral: true, charge: RIR23 }),
              v("Soulevé roumain tempo", "Kettlebell à deux mains, 3 s de descente jusqu'à mi-tibias, dos plat, remontée dynamique hanches en avant.", ["kettlebells"], reps(8), { charge: RIR23 })],
        "6": [v("Soulevé roumain lourd", "Un haltère dans chaque main, descendre jusqu'à mi-tibias dos plat, genoux souples, remonter en poussant les hanches en avant.", ["halteres"], reps(8), { charge: RIR12 }),
              v("Soulevé unipodal kettlebell", "Kettlebell dans la main opposée à la jambe d'appui, 3 s de descente, bassin horizontal, genou d'appui souple.", ["kettlebells"], reps(8), { unilateral: true, charge: RIR23 })],
        "7": [v("Kettlebell swing", "Balancer la kettlebell entre les cuisses puis la monter à hauteur de poitrine par une extension vive des hanches, dos plat, bras relâchés.", ["kettlebells"], reps(15), { charge: SWING }),
              v("Soulevé unipodal tempo", "Haltère dans la main opposée à la jambe d'appui, 4 s de descente, 1 s en bas, remontée contrôlée, bassin horizontal.", ["halteres"], reps(8), { unilateral: true, charge: RIR23 })],
        "8": [v("Kettlebell swing lourd", "Kettlebell plus lourde, balancer entre les cuisses puis extension vive des hanches jusqu'à la poitrine. Dos plat, genoux souples.", ["kettlebells"], reps(12), { charge: SWING_LOURD }),
              v("Soulevé unipodal et montée de genou", "Haltère en main, remonter du soulevé unipodal jusqu'au genou levé à hauteur de hanche, tenir 1 s, bassin stable.", ["halteres"], reps(8), { unilateral: true, charge: RIR23 })],
        "9": [v("Swing à une main", "Kettlebell dans une main, balancer entre les cuisses puis extension vive des hanches, épaules de face, dos plat.", ["kettlebells"], reps(10), { unilateral: true, charge: SWING }),
              v("Soulevé unipodal lesté", "Un haltère dans chaque main, pencher le buste jambe libre tendue, bassin horizontal, dos plat, remontée contrôlée.", ["halteres"], reps(8), { unilateral: true, charge: RIR23 })],
        "10": [v("Swing à une main lourd", "Kettlebell lourde dans une main, extension vive des hanches, épaules de face sans rotation du buste, dos plat.", ["kettlebells"], reps(10), { unilateral: true, charge: SWING_LOURD }),
               v("Soulevé unipodal lourd", "Kettlebell lourde dans la main opposée à la jambe d'appui, descente en 3 s, bassin horizontal, dos plat.", ["kettlebells"], reps(6), { unilateral: true, charge: RIR12 })]
      }
    },
    {
      id: "pont_ischios", nom: "Pont et ischios", zone: "membre_inferieur", exclueParFiltre: {},
      niveaux: {
        "1": [v("Pont fessier", "Couché sur le tapis, pieds à plat, décoller le bassin en serrant les fessiers sans cambrer, redescendre lentement.", ["tapis_sol"], reps(15)),
              v("Pont fessier tenu", "Couché sur le tapis, pieds à plat, bassin levé et tenu, fessiers serrés, bas du dos neutre, respiration calme.", ["tapis_sol"], sec(30))],
        "2": [v("Pont unipodal", "Couché, un pied au sol, l'autre genou ramené vers la poitrine, monter le bassin sans qu'il penche d'un côté.", ["tapis_sol"], reps(10), U),
              v("Pont élastique aux genoux", "Couché, élastique au-dessus des genoux, écarter les genoux et monter le bassin, tenir 2 s en haut sans cambrer.", ["elastiques", "tapis_sol"], reps(15))],
        "3": [v("Pont fessier lesté", "Couché, haltère posé sur les hanches et tenu à deux mains, monter le bassin en serrant les fessiers, sans cambrer.", ["halteres", "tapis_sol"], reps(12), { charge: RIR45 }),
              v("Pont pieds sur swiss ball", "Couché, talons posés sur le swiss ball, jambes presque tendues, monter le bassin et tenir 2 s sans que le ballon bouge.", ["swiss_ball", "tapis_sol"], reps(12))],
        "4": [v("Hip thrust unipodal sur step", "Haut du dos appuyé sur le step, un pied au sol, monter le bassin à l'horizontale sans cambrer, tenir 1 s.", ["step"], reps(10), U),
              v("Leg curl swiss ball", "Couché, talons sur le swiss ball, bassin levé, ramener le ballon vers les fesses puis le repousser, bassin toujours haut.", ["swiss_ball", "tapis_sol"], reps(10))],
        "5": [v("Hip thrust lesté sur step", "Haut du dos sur le step, haltère tenu sur les hanches, monter le bassin à l'horizontale, menton rentré, sans cambrer.", ["step", "halteres"], reps(10), { charge: RIR23 }),
              v("Leg curl swiss ball excentrique", "Ramener le ballon à deux jambes, puis le repousser sur une seule jambe en 4 s, bassin toujours haut.", ["swiss_ball", "tapis_sol"], reps(6), U)],
        "6": [v("Hip thrust unipodal lesté", "Haut du dos sur le step, haltère sur la hanche de la jambe d'appui, monter le bassin sans qu'il penche, sans cambrer.", ["step", "halteres"], reps(8), { unilateral: true, charge: RIR23 }),
              v("Pont unipodal talon sur step", "Couché, un talon sur le step, jambe presque tendue, monter le bassin et tenir 1 s. Arrêter si crampe à l'arrière de la cuisse.", ["step", "tapis_sol"], reps(10), U)],
        "7": [v("Leg curl swiss ball unipodal", "Un talon sur le swiss ball, l'autre jambe levée, bassin haut, ramener le ballon vers la fesse puis le repousser en contrôle.", ["swiss_ball", "tapis_sol"], reps(8), U),
              v("Pont talon sur step tenu", "Couché, un talon sur le step, jambe presque tendue, bassin levé et tenu sans qu'il penche, bas du dos neutre.", ["step", "tapis_sol"], sec(30), U)],
        "8": [v("Leg curl unipodal tempo", "Un talon sur le swiss ball, ramener le ballon en 1 s et le repousser en 3 s, bassin toujours haut et horizontal.", ["swiss_ball", "tapis_sol"], reps(8), U),
              v("Pont talon sur step rapide", "Un talon sur le step, jambe presque tendue, monter le bassin vite puis redescendre en 3 s, bassin horizontal.", ["step", "tapis_sol"], reps(10), U)],
        "9": [v("Marche des talons en pont", "Bassin levé, avancer les talons à petits pas jusqu'aux jambes presque tendues puis revenir, sans laisser tomber le bassin.", ["tapis_sol"], reps(6)),
              v("Leg curl unipodal lent", "Un talon sur le swiss ball, ramener le ballon vers la fesse puis le repousser en 5 s, bassin haut et horizontal.", ["swiss_ball", "tapis_sol"], reps(8), U),
              v("Pont talon sur step lesté", "Un talon sur le step, haltère tenu sur les hanches, monter le bassin et tenir 1 s, redescendre en 3 s.", ["step", "halteres", "tapis_sol"], reps(8), { unilateral: true, charge: RIR23 })],
        "10": [v("Marche des talons unipodale", "Bassin levé sur une jambe, l'autre tendue en l'air, avancer le talon à petits pas puis revenir, bassin horizontal.", ["tapis_sol"], reps(5), U),
               v("Nordic assisté à l'élastique", "À genoux sur le tapis, chevilles bloquées sous le step, élastique tendu devant pour aider : descendre le buste en 4 s, bassin gainé, revenir avec les bras.", ["elastiques", "step", "tapis_sol"], reps(6), { incompatible: ["sans_genoux_sol"] }),
               v("Isométrie ischios maximale", "Couché, un talon sur le step, genou légèrement fléchi, pousser le talon dans le step le plus fort possible 5 s, relâcher 5 s.", ["step", "tapis_sol"], reps(5), U)]
      }
    },
    {
      id: "mollet_cheville", nom: "Mollet et cheville", zone: "membre_inferieur", exclueParFiltre: {},
      niveaux: {
        "1": [v("Élévations sur deux pieds", "Monter lentement sur la pointe des pieds, tenir 1 s, redescendre en 2 s, chevilles droites sans partir vers l'extérieur.", ["aucun"], reps(20)),
              v("Releveurs à l'élastique", "Assis, élastique fixé devant et passé sur le dessus du pied, ramener la pointe du pied vers soi puis relâcher lentement.", ["elastiques", "tapis_sol"], reps(15), U)],
        "2": [v("Élévations sur un pied", "Une main au mur pour l'équilibre, monter sur la pointe d'un pied, redescendre en 2 s, cheville droite.", ["aucun"], reps(12), U),
              v("Élévations genoux fléchis", "Genoux légèrement fléchis tout du long, monter sur la pointe des pieds et redescendre lentement, pour le soléaire.", ["aucun"], reps(15))],
        "3": [v("Élévations unipodales sur step", "Avant-pied au bord du step, main au mur, laisser descendre le talon sous le step puis monter haut sur la pointe.", ["step"], reps(12), U),
              v("Éversion à l'élastique", "Assis, élastique autour de l'avant-pied tiré vers l'intérieur, tourner la plante du pied vers l'extérieur puis revenir lentement.", ["elastiques", "tapis_sol"], reps(15), U)],
        "4": [v("Mollet unipodal sur step lesté", "Haltère dans la main du côté travaillé, l'autre main au mur, talon sous le step puis montée haute, cheville droite.", ["step", "halteres"], reps(10), { unilateral: true, charge: RIR23 }),
              v("Soléaire unipodal", "Genou d'appui fléchi et gardé fléchi, monter sur la pointe du pied et redescendre en 2 s, main au mur.", ["aucun"], reps(15), U)],
        "5": [v("Mollet unipodal tempo", "Sur le bord du step, haltère en main, 3 s de montée, 1 s en haut, 3 s de descente, main au mur.", ["step", "halteres"], reps(8), { unilateral: true, charge: RIR23 }),
              v("Soléaire assis lesté", "Assis sur le step, avant-pied sur le sol, haltère posé sur le genou, monter le talon le plus haut possible et redescendre lentement.", ["step", "halteres"], reps(12), { unilateral: true, charge: RIR23 })],
        "6": [v("Mollet unipodal lourd", "Sur le bord du step, haltère lourd en main, amplitude complète, cheville droite, main au mur.", ["step", "halteres"], reps(8), { unilateral: true, charge: RIR12 }),
              v("Mollet unipodal sur bosu", "Debout sur un pied sur le dôme du bosu, près d'un mur, monter sur la pointe et redescendre sans que la cheville vrille.", ["bosu"], reps(10), U),
              v("Mollet unipodal rapide", "Sur un pied, main au mur, monter vite sur la pointe sans décoller et redescendre en 2 s.", ["aucun"], reps(15), U)],
        "7": [v("Pogos", "Petits sauts pieds joints sur l'avant-pied, chevilles raides, contact avec le sol le plus court possible, genoux presque tendus.", ["aucun"], reps(20), { incompatible: SS }),
              v("Corde à sauter", "Petits sauts réguliers sur l'avant-pied, genoux souples, poignets qui tournent la corde, regard devant.", ["corde_saut"], sec(45), { incompatible: SS }),
              v("Mollet unipodal explosif", "Sur le bord du step, main au mur, monter le plus vite possible sur la pointe sans décoller, redescendre en 2 s.", ["step"], reps(12), U)],
        "8": [v("Corde à sauter pas de course", "Alterner les appuis comme en courant sur place, sur l'avant-pied, genoux souples, rythme régulier.", ["corde_saut"], sec(60), { incompatible: SS }),
              v("Pogos avant-arrière", "Petits sauts pieds joints au-dessus d'une ligne, avant puis arrière, chevilles raides, contact au sol très court.", ["aucun"], reps(20), { incompatible: SS }),
              v("Mollet explosif lesté", "Sur le bord du step, haltère en main, monter le plus vite possible sur la pointe sans décoller, redescendre en 2 s.", ["step", "halteres"], reps(10), { unilateral: true, charge: VITE })],
        "9": [v("Sauts unipodaux sur place", "Petits sauts sur un pied, sur l'avant-pied, genou dans l'axe, contact au sol court. Stop à la moindre douleur.", ["aucun"], reps(15), { unilateral: true, incompatible: SS }),
              v("Corde à sauter sur un pied", "Petits sauts sur un seul pied, genou souple et aligné, rythme lent au début, changer de pied au signal.", ["corde_saut"], sec(20), { unilateral: true, incompatible: SS }),
              v("Isométrie mollet lestée", "Sur un pied au bord du step, haltère lourd en main, talon tenu à mi-hauteur sans bouger, main au mur.", ["step", "halteres"], sec(30), { unilateral: true, charge: ISO_LOURD })],
        "10": [v("Sauts unipodaux avant-arrière", "Sur un pied, sauts au-dessus d'une ligne avant puis arrière, contact au sol court, genou dans l'axe du pied.", ["aucun"], reps(16), { unilateral: true, incompatible: SS }),
               v("Mollet unipodal lourd explosif", "Sur le bord du step, haltère lourd en main, montée la plus rapide possible sans décoller, descente en 3 s.", ["step", "halteres"], reps(8), { unilateral: true, charge: LOURD_VITE })]
      }
    },
    {
      id: "adducteurs", nom: "Adducteurs", zone: "membre_inferieur", exclueParFiltre: {},
      niveaux: {
        "1": [v("Serrer le ballon genoux fléchis", "Couché, genoux fléchis, médecine-ball entre les genoux, serrer fort 5 s puis relâcher 5 s. Sans douleur à l'aine.", ["medecine_ball", "tapis_sol"], reps(8), { balle: "tenue" }),
              v("Adduction élastique debout", "Élastique fixé bas sur le côté et passé à la cheville, ramener la jambe vers l'autre, bassin immobile, main au mur.", ["elastiques"], reps(15), U)],
        "2": [v("Adduction couché sur le côté", "Couché sur le côté, jambe du dessus pliée devant, monter la jambe du dessous tendue puis redescendre lentement.", ["tapis_sol"], reps(15), U),
              v("Serrer le ballon jambes tendues", "Couché, jambes tendues, médecine-ball entre les chevilles, serrer fort 5 s puis relâcher 5 s, sans douleur à l'aine.", ["medecine_ball", "tapis_sol"], reps(8), { balle: "tenue" })],
        "3": [v("Pont en serrant le ballon", "Couché, médecine-ball serré entre les genoux, monter le bassin et tenir 2 s en serrant, sans cambrer.", ["medecine_ball", "tapis_sol"], reps(12), { balle: "tenue" }),
              v("Adduction élastique résistante", "Élastique plus fort fixé bas sur le côté, ramener la jambe devant l'autre en 1 s, revenir en 3 s, buste immobile.", ["elastiques"], reps(12), U)],
        "4": [v("Copenhague court", "Couché sur le côté sur l'avant-bras, genou du dessus posé sur le step haut, soulever le bassin et tenir le corps aligné.", ["step", "tapis_sol"], sec(20), { unilateral: true, incompatible: ["sans_genoux_sol"] }),
              v("Fente latérale adducteurs", "Grand pas de côté, s'asseoir sur la jambe fléchie en gardant l'autre tendue, sentir l'étirement de l'aine, pieds à plat.", ["aucun"], reps(8), U)],
        "5": [v("Copenhague court dynamique", "Genou du dessus posé sur le step haut, avant-bras au sol, monter et descendre le bassin lentement, corps aligné.", ["step", "tapis_sol"], reps(10), { unilateral: true, incompatible: ["sans_genoux_sol"] }),
              v("Fente latérale lestée", "Kettlebell contre la poitrine, grand pas de côté, freiner la descente, revenir en poussant sur la jambe fléchie, genou au-dessus du pied.", ["kettlebells"], reps(8), { unilateral: true, charge: RIR23 })],
        "6": [v("Copenhague court jambe levée", "Genou du dessus sur le step haut, bassin levé, amener la jambe du dessous au contact du step puis la redescendre.", ["step", "tapis_sol"], reps(8), { unilateral: true, incompatible: ["sans_genoux_sol"] }),
              v("Fente latérale lourde", "Kettlebell lourde contre la poitrine, pas latéral, descente en 2 s, retour au centre en une poussée, dos droit.", ["kettlebells"], reps(8), { unilateral: true, charge: RIR12 }),
              v("Adduction élastique rapide", "Élastique fort fixé bas sur le côté, ramener la jambe vite devant l'autre, revenir en 3 s, bassin immobile.", ["elastiques"], reps(15), U)],
        "7": [v("Copenhague long", "Cheville du dessus posée sur le step haut, jambe tendue, avant-bras au sol, soulever le bassin et tenir le corps aligné.", ["step", "tapis_sol"], sec(20), U),
              v("Adduction élastique explosive", "Élastique fort fixé bas sur le côté, fente latérale légère, ramener la jambe le plus vite possible, retour lent.", ["elastiques"], reps(12), U)],
        "8": [v("Copenhague long tenu", "Cheville du dessus sur le step haut, jambe tendue, bassin levé et corps aligné, tenir sans que le bassin s'affaisse.", ["step", "tapis_sol"], sec(30), U),
              v("Fente latérale explosive", "Grand pas de côté, freiner bas puis revenir au centre en une poussée la plus vive possible, pied au sol. Genou au-dessus du pied.", ["aucun"], reps(8), U)],
        "9": [v("Copenhague long dynamique", "Cheville du dessus sur le step haut, jambe tendue, monter et descendre le bassin en 2 s chaque sens, corps aligné.", ["step", "tapis_sol"], reps(8), U),
              v("Fente latérale lestée rapide", "Kettlebell contre la poitrine, pas latéral, freiner en 1 s et revenir au centre en une seule poussée vive.", ["kettlebells"], reps(8), { unilateral: true, charge: VITE })],
        "10": [v("Copenhague long jambe mobile", "Bassin levé, cheville du dessus sur le step haut, amener la jambe du dessous au contact du step puis la redescendre, corps aligné.", ["step", "tapis_sol"], reps(8), U),
               v("Fente latérale sautée", "Sauter latéralement d'une fente latérale à l'autre, réception basse et stable 1 s, genou au-dessus du pied.", ["aucun"], reps(6), { unilateral: true, incompatible: SS }),
               v("Copenhague long rythmé", "Cheville du dessus sur le step haut, monter le bassin en 1 s, redescendre en 3 s, sans poser la hanche, corps aligné.", ["step", "tapis_sol"], reps(10), U)]
      }
    },
    {
      id: "stabilite_hanche", nom: "Stabilité de hanche", zone: "membre_inferieur", exclueParFiltre: {},
      niveaux: {
        "1": [v("Clamshell élastique", "Couché sur le côté, élastique au-dessus des genoux, pieds joints, ouvrir le genou du dessus sans rouler le bassin en arrière.", ["elastiques", "tapis_sol"], reps(15), U),
              v("Abduction couché sur le côté", "Couché sur le côté, jambe du dessus tendue légèrement en arrière, monter à 30-40° sans rouler le bassin, redescendre lentement.", ["tapis_sol"], reps(15), U)],
        "2": [v("Abduction couché élastique", "Couché sur le côté, élastique aux chevilles, monter la jambe du dessus tendue, pointe du pied vers l'avant, bassin immobile.", ["elastiques", "tapis_sol"], reps(12), U),
              v("Pont élastique écarté", "Couché, élastique au-dessus des genoux, bassin levé et tenu, ouvrir et fermer les genoux sans que le bassin descende.", ["elastiques", "tapis_sol"], reps(15))],
        "3": [v("Abduction debout élastique", "Élastique aux chevilles, main au mur, écarter la jambe sur le côté sans pencher le buste, bassin horizontal.", ["elastiques"], reps(15), U),
              v("Bascule du bassin sur step", "Debout sur un pied au bord du step, laisser descendre le bassin côté libre puis le remonter avec la hanche d'appui, genou tendu.", ["step"], reps(12), U)],
        "4": [v("Pas latéraux élastique", "Élastique au-dessus des genoux, genoux fléchis, pas latéraux sans rapprocher les pieds, buste stable. Aller puis retour.", ["elastiques"], reps(10), U),
              v("Bascule du bassin lestée", "Sur un pied au bord du step, haltère dans la main côté libre, abaisser puis remonter le bassin, genou d'appui tendu.", ["step", "halteres"], reps(10), { unilateral: true, charge: RIR23 })],
        "5": [v("Monster walk", "Élastique aux chevilles, genoux fléchis, avancer en pas diagonaux en gardant l'élastique tendu, genoux dans l'axe des pieds.", ["elastiques"], reps(10), U),
              v("Pas latéraux élastique chevilles", "Élastique aux chevilles, demi-squat, pas latéraux lents sans que les genoux rentrent vers l'intérieur. Aller puis retour.", ["elastiques"], reps(10), U)],
        "6": [v("Monster walk élastique aux pieds", "Élastique autour de l'avant-pied, demi-squat, pas diagonaux en avant puis en arrière, genoux poussés vers l'extérieur.", ["elastiques"], reps(10), U),
              v("Pas latéraux en demi-squat", "Élastique autour de l'avant-pied, rester bas tout du long, pas latéraux larges, buste droit, genoux dans l'axe.", ["elastiques"], reps(12), U)],
        "7": [v("Pas latéraux rapides élastique", "Élastique au-dessus des genoux, demi-squat, petits pas latéraux vifs, pieds rasant le sol, genoux dans l'axe.", ["elastiques"], sec(20), U),
              v("Abduction élastique explosive", "Élastique aux chevilles, sur un pied, écarter la jambe libre le plus vite possible, revenir en 3 s, bassin horizontal.", ["elastiques"], reps(12), U)],
        "8": [v("Pas chassés élastique", "Élastique au-dessus des genoux, pas chassés rapides en restant bas, genoux poussés vers l'extérieur, sans croiser les pieds.", ["elastiques"], sec(20), { unilateral: true, incompatible: SS }),
              v("Pas latéraux lestés élastique", "Kettlebell contre la poitrine, élastique au-dessus des genoux, demi-squat, pas latéraux larges et contrôlés.", ["elastiques", "kettlebells"], reps(12), { unilateral: true, charge: RIR23 })],
        "9": [v("Skaters stabilisés", "Bondir latéralement d'un pied sur l'autre, réception unipodale figée 1 s, genou dans l'axe, bassin horizontal.", ["aucun"], reps(8), { unilateral: true, incompatible: SS }),
              v("Pas de patineur sans saut", "Pousser latéralement sur une jambe et freiner en fente latérale sur l'autre, pieds toujours au sol, genou au-dessus du pied.", ["aucun"], reps(10), U)],
        "10": [v("Skaters enchaînés", "Bondir latéralement d'un pied sur l'autre sans pause, réception souple, genou dans l'axe, buste penché vers l'avant.", ["aucun"], reps(10), { unilateral: true, incompatible: SS }),
               v("Pas de patineur élastique", "Élastique au-dessus des genoux, pousser fort latéralement et freiner bas sur l'autre jambe, pieds toujours au sol.", ["elastiques"], reps(10), U)]
      }
    },
    {
      id: "equilibre", nom: "Équilibre", zone: "membre_inferieur", exclueParFiltre: {},
      niveaux: {
        "1": [v("Appui unipodal yeux ouverts", "Debout sur un pied près d'un mur, genou d'appui légèrement fléchi, bassin horizontal, regard fixe devant.", ["aucun"], sec(30), U),
              v("Appui unipodal tête mobile", "Sur un pied près d'un mur, tourner lentement la tête à droite puis à gauche sans perdre l'équilibre, genou souple.", ["aucun"], sec(30), U)],
        "2": [v("Appui unipodal yeux fermés", "Sur un pied à portée de main d'un mur, fermer les yeux, genou souple. Rouvrir les yeux dès que l'équilibre part.", ["aucun"], sec(20), U),
              v("Bosu à deux pieds", "Debout sur le dôme du bosu, pieds largeur de hanches, genoux souples, garder l'équilibre sans bouger les pieds.", ["bosu"], sec(30))],
        "3": [v("Étoile d'équilibre", "Sur un pied, toucher du bout de l'autre pied devant, sur le côté puis derrière, sans y mettre de poids. Genou d'appui dans l'axe.", ["aucun"], reps(8), U),
              v("Mini-squat sur bosu", "Debout à deux pieds sur le dôme du bosu, fléchir les genoux à mi-course et remonter, genoux dans l'axe des pieds.", ["bosu"], reps(12))],
        "4": [v("Appui unipodal sur bosu", "Sur un pied sur le dôme du bosu, près d'un mur, genou souple et dans l'axe, bassin horizontal.", ["bosu"], sec(20), U),
              v("Ballon autour de la taille", "Sur un pied, faire passer le médecine-ball autour de la taille d'une main à l'autre, bassin stable, genou souple.", ["medecine_ball"], sec(30), { unilateral: true, balle: "tenue" })],
        "5": [v("Bosu unipodal ballon diagonal", "Sur un pied sur le bosu, amener le médecine-ball de la hanche opposée jusqu'à hauteur d'épaule, genou d'appui dans l'axe.", ["bosu", "medecine_ball"], reps(8), { unilateral: true, balle: "tenue" }),
              v("Mini-squat unipodal sur bosu", "Sur un pied sur le dôme du bosu, près d'un mur, fléchir le genou à mi-course et remonter, genou au-dessus du pied.", ["bosu"], reps(8), U)],
        "6": [v("Balancier élastique unipodal", "Élastique fixé bas passé à la cheville libre, balancer la jambe libre devant puis derrière sans bouger le bassin ni le genou d'appui.", ["elastiques"], reps(12), U),
              v("Étoile d'équilibre sur bosu", "Sur un pied sur le bosu, toucher du bout de l'autre pied devant, sur le côté puis derrière, genou d'appui dans l'axe.", ["bosu"], reps(6), U)],
        "7": [v("Réceptions unipodales sur bosu", "Petit saut de deux pieds au sol vers un pied sur le bosu, réception figée 3 s, genou dans l'axe du pied.", ["bosu"], reps(6), { unilateral: true, incompatible: SS }),
              v("Transfert sur bosu", "Grand pas en avant sur le bosu, freiner sur un pied et tenir 3 s sans bouger, puis revenir. Genou au-dessus du pied.", ["bosu"], reps(8), U)],
        "8": [v("Sauts unipodaux vers le bosu", "Sauter d'un pied au sol au même pied sur le bosu, réception figée 3 s, genou dans l'axe, bassin horizontal.", ["bosu"], reps(6), { unilateral: true, incompatible: SS }),
              v("Transfert latéral sur bosu", "Grand pas latéral sur le bosu, freiner sur un pied et tenir 3 s, genou au-dessus du pied, puis revenir.", ["bosu"], reps(8), U)],
        "9": [v("Passes en appui unipodal", "Sur un pied, recevoir le médecine-ball d'un autre joueur à hauteur de poitrine et le lui renvoyer, genou d'appui souple.", ["medecine_ball"], reps(10), { unilateral: true, balle: "passe" }),
              v("Sauts unipodaux stabilisés", "Sur un pied, sauts courts devant, sur le côté puis derrière, réception figée 2 s à chaque fois, genou dans l'axe.", ["aucun"], reps(8), { unilateral: true, incompatible: SS }),
              v("Bosu unipodal ballon rapide", "Sur un pied sur le bosu, déplacer vite le médecine-ball devant, sur les côtés et vers la hanche, genou d'appui souple.", ["bosu", "medecine_ball"], sec(30), { unilateral: true, balle: "tenue" })],
        "10": [v("Passes unipodales sur bosu", "Sur un pied sur le bosu, recevoir le médecine-ball léger d'un autre joueur et le lui renvoyer, genou dans l'axe.", ["bosu", "medecine_ball"], reps(10), { unilateral: true, balle: "passe" }),
               v("Sauts sur bosu en diagonale", "Sauter en diagonale d'un pied au sol au même pied sur le bosu, réception figée 3 s, genou dans l'axe du pied.", ["bosu"], reps(6), { unilateral: true, incompatible: SS }),
               v("Bosu unipodal avec rotation", "Sur un pied sur le bosu, médecine-ball bras tendus devant, tourner le buste à droite puis à gauche, bassin face devant.", ["bosu", "medecine_ball"], reps(10), { unilateral: true, balle: "tenue" })]
      }
    },
    {
      id: "plio_verticale", nom: "Pliométrie verticale", zone: "membre_inferieur", exclueParFiltre: {},
      niveaux: {
        "1": [v("Isométrie mollets", "Sur la pointe des pieds à mi-hauteur, genoux tendus, tenir sans bouger, main au mur si besoin.", ["aucun"], sec(30)),
              v("Montées sur pointes rapides", "Monter vite sur la pointe des pieds et redescendre en contrôle, sans décoller, genoux presque tendus.", ["aucun"], reps(20))],
        "2": [v("Extension rapide sans décoller", "Depuis un quart de squat, s'étendre vite chevilles, genoux et hanches jusqu'à la pointe des pieds, sans décoller.", ["aucun"], reps(10)),
              v("Isométrie quart de squat", "En quart de squat, pousser le sol le plus fort possible comme pour décoller, genoux dans l'axe, puis relâcher.", ["aucun"], sec(20))],
        "3": [v("Élan de bras sans décoller", "Élan des bras, descente en quart de squat puis extension vive jusqu'à la pointe des pieds, sans décoller. Genoux dans l'axe.", ["aucun"], reps(10)),
              v("Descente freinée rapide", "Depuis la pointe des pieds, descendre vite en demi-squat et figer 2 s, genoux dans l'axe, poids réparti sur tout le pied.", ["aucun"], reps(8))],
        "4": [v("Sauts pieds joints légers", "Petits sauts verticaux, réception silencieuse sur l'avant-pied, genoux dans l'axe des pieds.", ["aucun"], reps(8), { incompatible: SS }),
              v("Extension explosive élastique", "Debout sur l'élastique, extrémités tenues aux épaules, quart de squat puis extension explosive jusqu'à la pointe des pieds.", ["elastiques"], reps(10))],
        "5": [v("Sauts verticaux avec arrêt", "Saut vertical le plus haut possible, réception en demi-squat figée 2 s, genoux dans l'axe, puis repartir.", ["aucun"], reps(6), { incompatible: SS }),
              v("Extension explosive lestée", "Haltères en main, quart de squat puis extension explosive jusqu'à la pointe des pieds, sans décoller, dos droit.", ["halteres"], reps(8), { charge: VITE })],
        "6": [v("Sauts sur step", "Saut pieds joints sur le step, réception en demi-squat stable, redescendre en marchant.", ["step"], reps(8), { incompatible: SS }),
              v("Sauts verticaux enchaînés", "Sauts verticaux sans pause, contact au sol court, genoux dans l'axe, bras actifs.", ["aucun"], reps(8), { incompatible: SS }),
              v("Squat gobelet explosif", "Kettlebell contre la poitrine, descente en 2 s aux cuisses parallèles, remontée la plus rapide possible jusqu'à la pointe des pieds.", ["kettlebells"], reps(8), { charge: VITE })],
        "7": [v("Box jump 50 cm", "Saut pieds joints sur la pliobox de 50 cm, réception en demi-squat silencieuse, redescendre en marchant.", ["pliobox"], reps(6), { incompatible: SS }),
              v("Sauts de haies basses", "Sauts pieds joints au-dessus des haies basses, réception stable 1 s avant chaque haie, genoux dans l'axe.", ["haies"], reps(8), { incompatible: SS }),
              v("Montée explosive sur pliobox", "Un pied posé sur la pliobox, monter le plus vite possible par la seule poussée de la jambe du haut, sans décoller le pied, redescendre en contrôle.", ["pliobox"], reps(8), U)],
        "8": [v("Box jump 60 cm", "Saut pieds joints sur la pliobox de 60 cm, réception en demi-squat silencieuse, redescendre en marchant.", ["pliobox"], reps(6), { incompatible: SS }),
              v("Haies basses enchaînées", "Sauts pieds joints au-dessus des haies basses sans pause, contact au sol court, genoux dans l'axe.", ["haies"], reps(8), { incompatible: SS }),
              v("Montée explosive lestée", "Haltères en main, un pied sur la pliobox, monter le plus vite possible sans décoller le pied, redescendre en contrôle.", ["pliobox", "halteres"], reps(6), { unilateral: true, charge: VITE })],
        "9": [v("Drop jump du step", "Se laisser tomber du step, toucher le sol pieds joints et repartir vers le haut aussitôt, contact très court, genoux dans l'axe.", ["step"], reps(6), { incompatible: SS }),
              v("Sauts de haies hautes", "Sauts pieds joints au-dessus des haies hautes, réception en demi-squat stable 1 s avant chaque haie.", ["haies"], reps(6), { incompatible: SS }),
              v("Squat gobelet explosif lourd", "Kettlebell lourde contre la poitrine, descente en 2 s, remontée la plus rapide possible jusqu'à la pointe des pieds.", ["kettlebells"], reps(6), { charge: LOURD_VITE })],
        "10": [v("Drop jump 50 cm", "Se laisser tomber de la pliobox de 50 cm, toucher le sol pieds joints et repartir vers le haut aussitôt, genoux dans l'axe.", ["pliobox"], reps(5), { incompatible: SS }),
               v("Haies hautes enchaînées", "Sauts pieds joints au-dessus des haies hautes sans pause, contact au sol court, réception finale figée.", ["haies"], reps(6), { incompatible: SS }),
               v("Montée explosive lourde", "Haltères lourds en main, un pied sur la pliobox, monter le plus vite possible sans décoller le pied, descente en 3 s.", ["pliobox", "halteres"], reps(6), { unilateral: true, charge: LOURD_VITE })]
      }
    },
    {
      id: "plio_horizontale", nom: "Pliométrie horizontale", zone: "membre_inferieur", exclueParFiltre: {},
      niveaux: {
        "1": [v("Marche rapide en fente", "Enchaîner des fentes avant en marchant vite, genou avant stable au-dessus du pied, buste droit, sans décoller.", ["aucun"], reps(8), U),
              v("Montées de genoux sans impact", "Sur place, monter les genoux alternativement à hauteur de hanche, vite, un pied toujours au sol, bras actifs.", ["aucun"], sec(30))],
        "2": [v("Marche en fente avec arrêt", "Grand pas en avant, freiner et figer la fente 2 s, genou avant dans l'axe, puis enchaîner le pas suivant.", ["aucun"], reps(8), U),
              v("Marche athlétique en A", "Marcher en montant le genou à hauteur de hanche, pied qui revient griffer le sol sous la hanche, buste grand.", ["aucun"], sec(30))],
        "3": [v("Fente avant freinée", "Grand pas vif en avant, freiner la descente en 1 s, genou dans l'axe, revenir en une poussée sur le talon.", ["aucun"], reps(8), U)],
        "4": [v("Bonds pieds joints courts", "Petits bonds en avant pieds joints, réception souple et stable 2 s entre chaque, genoux dans l'axe.", ["aucun"], reps(6), { incompatible: SS }),
              v("Marche résistée à l'élastique", "Élastique autour de la taille fixé à un point solide derrière soi, avancer à grands pas puissants, buste penché, pieds sous les hanches.", ["elastiques"], sec(20))],
        "5": [v("Bonds pieds joints avec arrêt", "Bond en avant pieds joints le plus loin possible, réception en demi-squat figée 2 s, genoux dans l'axe.", ["aucun"], reps(6), { incompatible: SS }),
              v("Fente avant explosive lestée", "Haltères en main, grand pas vif en avant, freiner puis revenir en une poussée explosive, genou avant dans l'axe.", ["halteres"], reps(8), { unilateral: true, charge: VITE })],
        "6": [v("Bonds latéraux pieds joints", "Petits bonds latéraux pieds joints au-dessus d'une ligne, réception souple et stable, genoux dans l'axe.", ["aucun"], reps(10), { incompatible: SS }),
              v("Saut en longueur sans élan", "Élan des bras, bond le plus loin possible, réception en demi-squat figée 2 s, genoux dans l'axe.", ["aucun"], reps(5), { incompatible: SS }),
              v("Marche résistée lourde", "Élastique fort autour de la taille fixé derrière soi, pas courts et puissants, buste penché, genoux dans l'axe.", ["elastiques"], sec(20))],
        "7": [v("Bonds enchaînés par trois", "Trois bonds pieds joints en avant sans pause, réception figée au dernier, genoux dans l'axe. Revenir en marchant.", ["aucun"], reps(9), { incompatible: SS }),
              v("Bonds latéraux au-dessus d'un plot", "Bonds latéraux pieds joints par-dessus un plot, contact au sol court, genoux dans l'axe.", ["plots"], reps(10), { incompatible: SS }),
              v("Poussée latérale élastique", "Élastique autour de la taille fixé sur le côté, pousser loin sur la jambe proche et freiner sur l'autre, pieds au sol.", ["elastiques"], reps(8), U)],
        "8": [v("Hops latéraux unipodaux", "Sur un pied, petits sauts latéraux au-dessus d'une ligne, sur l'avant-pied, genou dans l'axe du pied.", ["aucun"], reps(10), { unilateral: true, incompatible: SS }),
              v("Bonds enchaînés longs", "Cinq bonds pieds joints en avant enchaînés, réception figée au dernier, genoux dans l'axe. Revenir en marchant.", ["aucun"], reps(10), { incompatible: SS }),
              v("Fente avant explosive", "Grand pas vif en avant, freiner en 1 s puis revenir en une poussée la plus explosive possible, genou avant dans l'axe.", ["aucun"], reps(10), U)],
        "9": [v("Sauts unipodaux avant", "Trois sauts sur un pied en avant, réception figée au dernier, genou dans l'axe du pied, bassin horizontal.", ["aucun"], reps(6), { unilateral: true, incompatible: SS }),
              v("Bonds latéraux au-dessus des haies", "Bonds latéraux pieds joints au-dessus des haies basses, contact au sol court, genoux dans l'axe.", ["haies"], reps(8), { incompatible: SS }),
              v("Fente avant explosive lourde", "Haltères en main, grand pas vif en avant, freiner en 1 s, revenir en une poussée explosive, genou avant stable.", ["halteres"], reps(6), { unilateral: true, charge: LOURD_VITE })],
        "10": [v("Sauts unipodaux enchaînés", "Cinq sauts sur un pied en avant sans pause, réception finale figée, genou dans l'axe, bassin horizontal.", ["aucun"], reps(5), { unilateral: true, incompatible: SS }),
               v("Hops latéraux au-dessus des haies", "Sur un pied, sauts latéraux au-dessus d'une haie basse, réception sur l'avant-pied, genou dans l'axe.", ["haies"], reps(8), { unilateral: true, incompatible: SS }),
               v("Poussée latérale élastique lourde", "Élastique fort autour de la taille fixé sur le côté, pousser loin et freiner bas sur l'autre jambe, pieds au sol.", ["elastiques"], reps(8), U)]
      }
    },
    {
      id: "agilite", nom: "Agilité", zone: "membre_inferieur", exclueParFiltre: {},
      niveaux: {
        "1": [v("Pas chassés lents entre plots", "Deux plots à 3 m, pas chassés lents en gardant un pied au sol, buste face devant, genoux souples.", ["plots"], sec(30)),
              v("Échelle de rythme en marchant", "Marcher dans l'échelle, deux appuis par case, regard devant, sans toucher les barreaux.", ["echelle_rythme"], sec(30))],
        "2": [v("Échelle latérale en marchant", "De profil, marcher dans l'échelle deux appuis par case, genoux souples, regard devant.", ["echelle_rythme"], sec(30)),
              v("Slalom en marchant", "Contourner 5 plots en marche rapide, pas courts dans les virages, buste droit.", ["plots"], sec(30))],
        "3": [v("Échelle rythmée sans décoller", "Marche rapide dans l'échelle, deux appuis par case, sur l'avant-pied, un pied toujours au sol.", ["echelle_rythme"], sec(30)),
              v("Freinages en marchant", "Avancer vite vers un plot, freiner en abaissant les hanches, genoux dans l'axe, repartir en arrière vers le départ.", ["plots"], sec(30))],
        "4": [v("Piétinés rapides sur place", "Sur l'avant-pied, petits appuis les plus rapides possible sans avancer, genoux souples, bras actifs, regard devant.", ["aucun"], sec(20), { incompatible: SS }),
              v("Échelle deux appuis rapide", "Pas très rapides, deux appuis par case, un pied toujours au sol, sans décoller.", ["echelle_rythme"], sec(30))],
        "5": [v("Croix de plots rapide", "Quatre plots en croix à 1 m autour de soi, aller toucher chacun du pied le plus vite possible en revenant au centre entre chaque.", ["plots"], sec(20), { incompatible: SS }),
              v("Échelle latérale rapide", "De profil, pas latéraux rapides, deux appuis par case, un pied toujours au sol, regard devant.", ["echelle_rythme"], sec(30))],
        "6": [v("Échelle dedans-dehors", "Pieds dedans puis dehors à chaque case en avançant vite, sur l'avant-pied, genoux souples.", ["echelle_rythme"], sec(20), { incompatible: SS }),
              v("Slalom en marche rapide", "Slalom entre 5 plots en marche la plus rapide possible, freiner bas dans chaque virage, un pied toujours au sol.", ["plots"], sec(30)),
              v("Pas latéraux rapides entre plots", "Élastique au-dessus des genoux, pas latéraux vifs entre deux plots à 3 m, demi-squat, pieds rasant le sol.", ["elastiques", "plots"], sec(20))],
        "7": [v("Pas chassés freinés", "Deux plots à 2 m, pas chassés vifs de l'un à l'autre, freiner bas et figer 1 s à chaque plot, sans croiser les pieds.", ["plots"], sec(30), { incompatible: SS }),
              v("T en marche rapide", "Même parcours en T entre plots en marche la plus rapide possible, freiner bas à chaque plot, un pied toujours au sol.", ["plots"], reps(4))],
        "8": [v("Appuis croisés rapides", "Sur place, un pied croise devant l'autre puis revient, alterner vite des deux côtés, hanches basses, bassin face devant.", ["aucun"], sec(20), { incompatible: SS }),
              v("Étoile de freinage", "Cinq plots en étoile autour de soi, aller toucher chacun en fente rapide puis revenir au centre, un pied toujours au sol.", ["plots"], sec(30))],
        "9": [v("Shuffle rapide entre plots", "Pas chassés rapides entre deux plots à 2 m, toucher le plot à chaque bout, hanches basses, sans croiser les pieds.", ["plots"], sec(20), { incompatible: SS }),
              v("Échelle sur un pied", "Petits sauts sur un pied dans chaque case de l'échelle, réception sur l'avant-pied, genou dans l'axe.", ["echelle_rythme"], reps(10), { unilateral: true, incompatible: SS }),
              v("Étoile de freinage lestée", "Kettlebell contre la poitrine, plots en étoile, aller toucher chacun en fente rapide et revenir au centre, pied au sol.", ["plots", "kettlebells"], sec(30), { charge: VITE })],
        "10": [v("Pas chassé et arrêt sur un pied", "Deux plots à 2 m, pas chassé explosif vers un plot, arrêt net sur le pied extérieur figé 1 s, genou dans l'axe, puis vers l'autre.", ["plots"], reps(6), { unilateral: true, incompatible: SS }),
               v("Échelle unipodale latérale", "De profil, petits sauts latéraux sur un pied de case en case, réception sur l'avant-pied, genou dans l'axe.", ["echelle_rythme"], reps(10), { unilateral: true, incompatible: SS }),
               v("Étoile de freinage élastique", "Élastique au-dessus des genoux, plots en étoile, aller toucher chacun en fente rapide et revenir, un pied toujours au sol.", ["plots", "elastiques"], sec(30))]
      }
    }
  ];

  if (typeof module !== "undefined" && module.exports) module.exports = CHAINES;
  else global.CHAINES_MEMBRE_INFERIEUR = CHAINES;
})(typeof globalThis !== "undefined" ? globalThis : this);
