(function (global) {
  // Chaînes de progression du tronc. Contenu validé par Romain :
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
  var ISO_LOURD = "Charge lourde, tenue sans trembler";
  var PORTE = "Charge modérée, épaules horizontales du début à la fin";
  var U = { unilateral: true };
  var SGS = ["sans_genoux_sol"];

  var CHAINES = [
    {
      id: "gainage_anterieur", nom: "Gainage antérieur", zone: "tronc", exclueParFiltre: {},
      niveaux: {
        "1": [v("Planche sur les genoux", "Avant-bras et genoux au sol, corps aligné des genoux aux épaules, fessiers serrés, sans creuser le bas du dos.", ["tapis_sol"], sec(20), { incompatible: SGS }),
              v("Dead bug", "Couché sur le tapis, bras vers le plafond et hanches fléchies à 90°, descendre un bras et la jambe opposée sans creuser le bas du dos.", ["tapis_sol"], reps(10))],
        "2": [v("Planche courte", "Avant-bras et pointes de pieds au sol, corps parfaitement aligné, fessiers serrés, respiration calme sans creuser le bas du dos.", ["tapis_sol"], sec(20)),
              v("Dead bug lent", "Couché sur le tapis, descendre le bras et la jambe opposée en 3 s, remonter en 3 s, bas du dos toujours plaqué au tapis.", ["tapis_sol"], reps(10))],
        "3": [v("Planche avant-bras", "Avant-bras et pointes de pieds au sol, corps aligné, tenir sans que le bassin monte ni s'affaisse, regard vers le tapis.", ["tapis_sol"], sec(30)),
              v("Dead bug élastique", "Couché, élastique tendu entre les mains et un ancrage derrière la tête, descendre la jambe opposée sans creuser le bas du dos.", ["elastiques", "tapis_sol"], reps(10))],
        "4": [v("Planche longue", "Avant-bras et pointes de pieds au sol, corps aligné, tenir en respirant calmement sans laisser le bassin s'affaisser.", ["tapis_sol"], sec(45)),
              v("Planche sur les mains", "Bras tendus sous les épaules, corps aligné des talons à la tête, fessiers serrés, sans creuser le bas du dos.", ["tapis_sol"], sec(30))],
        "5": [v("Planche avec tapes d'épaules", "En planche sur les mains, toucher l'épaule opposée d'une main puis de l'autre, sans que le bassin tourne ni s'affaisse.", ["tapis_sol"], reps(16)),
              v("Planche pieds sur le step", "Avant-bras au sol, pieds posés sur le step, corps aligné, tenir sans creuser le bas du dos.", ["step", "tapis_sol"], sec(30))],
        "6": [v("Tapes d'épaules lentes", "En planche sur les mains, pieds écartés, toucher l'épaule opposée en 2 s puis revenir, bassin strictement immobile.", ["tapis_sol"], reps(12)),
              v("Planche bras tendu devant", "En planche sur les mains, tendre un bras devant soi 3 s sans que le bassin tourne, puis changer de bras.", ["tapis_sol"], reps(8), U)],
        "7": [v("Planche sur swiss ball", "Avant-bras posés sur le swiss ball, pieds au sol, corps aligné, tenir sans que le ballon parte sur le côté.", ["swiss_ball"], sec(30)),
              v("Mountain climbers lents", "En planche sur les mains, ramener un genou vers la poitrine en 2 s puis l'autre, bassin bas et immobile.", ["tapis_sol"], reps(20))],
        "8": [v("Cercles sur swiss ball", "Avant-bras sur le swiss ball, dessiner de petits cercles avec les avant-bras sans que le corps bouge, gainage serré.", ["swiss_ball"], reps(10)),
              v("Mountain climbers avec arrêt", "En planche sur les mains, amener un genou vers la poitrine et tenir 2 s avant de changer, bassin bas et stable.", ["tapis_sol"], reps(16))],
        "9": [v("Planche aux sangles", "Avant-bras au sol, pieds dans les sangles réglées bas, corps aligné, tenir sans que le bassin s'affaisse.", ["sangles_suspension"], sec(30)),
              v("Genoux-poitrine aux sangles", "En planche sur les mains, pieds dans les sangles, ramener les deux genoux vers la poitrine puis retendre les jambes en contrôle.", ["sangles_suspension"], reps(12))],
        "10": [v("Body saw aux sangles", "Avant-bras au sol, pieds dans les sangles, glisser le corps vers l'arrière puis revenir, bassin toujours aligné.", ["sangles_suspension"], reps(10)),
               v("Genou-coude croisé aux sangles", "En planche sur les mains, pieds dans les sangles, amener un genou vers le coude opposé puis retendre, bassin stable.", ["sangles_suspension"], reps(10), U)]
      }
    },
    {
      id: "gainage_lateral", nom: "Gainage latéral", zone: "tronc", exclueParFiltre: {},
      niveaux: {
        "1": [v("Planche latérale sur les genoux", "Sur le côté, appui sur l'avant-bras et les genoux au sol, bassin levé, corps aligné des genoux à la tête.", ["tapis_sol"], sec(20), { unilateral: true, incompatible: SGS }),
              v("Side bend léger", "Debout, un haltère léger le long du corps, pencher le buste de ce côté puis revenir bien droit, sans tourner le bassin.", ["halteres"], reps(12), { unilateral: true, charge: RIR45 })],
        "2": [v("Planche latérale genoux tenue", "Appui avant-bras et genoux au sol, bassin levé et tenu haut, épaules et hanches dans le même plan.", ["tapis_sol"], sec(30), { unilateral: true, incompatible: SGS }),
              v("Side bend élastique", "Debout sur l'élastique, une extrémité dans la main, pencher le buste du côté opposé puis revenir droit, bassin immobile.", ["elastiques"], reps(12), U)],
        "3": [v("Planche latérale pieds décalés", "Appui sur l'avant-bras, pieds l'un devant l'autre, bassin levé, corps aligné, main libre posée sur la hanche.", ["tapis_sol"], sec(20), U),
              v("Side bend haltère", "Debout, haltère dans une main, pencher le buste de ce côté en 3 s puis revenir droit, sans rotation du buste.", ["halteres"], reps(12), { unilateral: true, charge: RIR23 })],
        "4": [v("Planche latérale", "Appui sur l'avant-bras et le bord du pied du dessous, bassin levé, corps parfaitement aligné, épaules empilées.", ["tapis_sol"], sec(30), U),
              v("Planche latérale bras tendu", "Appui sur la main, bras tendu sous l'épaule, bassin levé, corps aligné, main libre posée sur la hanche.", ["tapis_sol"], sec(20), U)],
        "5": [v("Planche latérale avec abduction", "En planche latérale, monter la jambe du dessus tendue puis la redescendre lentement, bassin toujours haut.", ["tapis_sol"], reps(10), U),
              v("Planche latérale dynamique", "En planche latérale, descendre le bassin près du sol puis le remonter haut, sans que les épaules partent en avant.", ["tapis_sol"], reps(12), U)],
        "6": [v("Planche latérale lestée", "En planche latérale, un haltère posé sur la hanche du dessus et tenu de la main libre, corps aligné, bassin haut.", ["halteres", "tapis_sol"], sec(20), { unilateral: true, charge: ISO_LOURD }),
              v("Abduction en planche tenue", "En planche latérale, jambe du dessus levée et tenue à 30°, bassin haut, sans rouler le bassin en arrière.", ["tapis_sol"], sec(20), U)],
        "7": [v("Planche latérale pieds sur step", "Appui avant-bras au sol, pieds posés sur le step, bassin levé, corps aligné, épaules empilées.", ["step", "tapis_sol"], sec(30), U),
              v("Planche latérale sur swiss ball", "Avant-bras posé sur le swiss ball, pieds au sol l'un devant l'autre, bassin levé, corps aligné sans que le ballon bouge.", ["swiss_ball"], sec(20), U)],
        "8": [v("Abduction sur swiss ball", "Avant-bras sur le swiss ball en planche latérale, monter et descendre la jambe du dessus lentement, bassin haut.", ["swiss_ball"], reps(10), U),
              v("Porté valise", "Marcher droit avec une kettlebell dans une main, épaules horizontales, buste droit, sans pencher du côté chargé.", ["kettlebells"], sec(30), { unilateral: true, charge: PORTE })],
        "9": [v("Planche latérale aux sangles", "Pieds dans les sangles réglées bas, appui sur l'avant-bras au sol, bassin levé, corps aligné, épaules empilées.", ["sangles_suspension"], sec(20), U),
              v("Porté valise lourd", "Marcher avec une kettlebell très lourde dans une main, buste droit, épaules horizontales, pas réguliers et contrôlés.", ["kettlebells"], sec(40), { unilateral: true, charge: ISO_LOURD })],
        "10": [v("Abduction aux sangles", "En planche latérale pieds dans les sangles, monter la jambe du dessus puis la redescendre en contrôle, bassin haut.", ["sangles_suspension"], reps(8), U),
               v("Porté valise en ligne", "Marcher pied devant pied avec une kettlebell lourde dans une main, sans pencher le buste ni laisser l'épaule tomber.", ["kettlebells"], sec(40), { unilateral: true, charge: ISO_LOURD })]
      }
    },
    {
      id: "gainage_posterieur", nom: "Gainage postérieur", zone: "tronc", exclueParFiltre: {},
      niveaux: {
        "1": [v("Superman alterné", "À plat ventre sur le tapis, lever un bras et la jambe opposée 2 s puis changer, nuque longue et regard vers le tapis.", ["tapis_sol"], reps(12)),
              v("Pont dorsal au sol", "Couché sur le tapis, pieds à plat, monter le bassin en serrant les fessiers sans cambrer, redescendre en 3 s.", ["tapis_sol"], reps(15))],
        "2": [v("Superman bras seuls", "À plat ventre, lever les deux bras et la poitrine de quelques centimètres, regard vers le tapis, nuque longue.", ["tapis_sol"], reps(12)),
              v("Pont dorsal tenu", "Couché sur le tapis, bassin levé et maintenu, fessiers serrés, bas du dos neutre, respiration calme.", ["tapis_sol"], sec(30))],
        "3": [v("Superman complet", "À plat ventre, lever bras et jambes ensemble de quelques centimètres, fessiers serrés, nuque dans l'axe du dos.", ["tapis_sol"], reps(12)),
              v("Pont pieds sur le step", "Couché, talons posés sur le step, monter le bassin en serrant les fessiers, tenir 2 s sans cambrer.", ["step", "tapis_sol"], reps(12))],
        "4": [v("Extension lombaire sur swiss ball", "Ventre sur le swiss ball, pieds calés au mur, monter le buste jusqu'à l'alignement puis redescendre lentement, nuque dans l'axe.", ["swiss_ball"], reps(12)),
              v("Bird dog", "En quadrupédie sur le tapis, tendre un bras et la jambe opposée à l'horizontale 2 s, bassin strictement immobile.", ["tapis_sol"], reps(10), { unilateral: true, incompatible: SGS })],
        "5": [v("Extension lombaire tenue", "Ventre sur le swiss ball, pieds calés, buste tenu à l'horizontale sans cambrer, mains aux tempes, nuque dans l'axe.", ["swiss_ball"], sec(20)),
              v("Bird dog lent", "En quadrupédie, tendre bras et jambe opposés en 3 s, tenir 3 s, revenir en 3 s, sans que le bassin bascule.", ["tapis_sol"], reps(8), { unilateral: true, incompatible: SGS })],
        "6": [v("Extension lombaire lestée", "Ventre sur le swiss ball, haltère léger tenu contre la poitrine, monter le buste à l'horizontale puis redescendre en 3 s.", ["swiss_ball", "halteres"], reps(10), { charge: RIR45 }),
              v("Bird dog élastique", "En quadrupédie, élastique tendu entre la main et le pied opposés, tendre bras et jambe à l'horizontale, bassin immobile.", ["elastiques", "tapis_sol"], reps(8), { unilateral: true, incompatible: SGS })],
        "7": [v("Pont dorsal unipodal", "Couché, un pied à plat, l'autre genou ramené vers la poitrine, monter le bassin sans qu'il penche d'un côté.", ["tapis_sol"], reps(10), U),
              v("Reverse hyper sur swiss ball", "Ventre sur le swiss ball, mains au sol, lever les deux jambes tendues jusqu'à l'alignement puis redescendre lentement.", ["swiss_ball"], reps(12))],
        "8": [v("Pont unipodal tenu", "Couché, un pied à plat, l'autre jambe tendue en l'air, bassin levé et maintenu à l'horizontale sans cambrer.", ["tapis_sol"], sec(30), U),
              v("Reverse hyper tenue", "Ventre sur le swiss ball, mains au sol, jambes tendues maintenues à l'horizontale, fessiers serrés, nuque dans l'axe.", ["swiss_ball"], sec(20))],
        "9": [v("Planche dorsale aux sangles", "Allongé au sol, talons dans les sangles réglées bas, monter le bassin jusqu'à l'alignement talons-épaules et tenir.", ["sangles_suspension"], sec(20)),
              v("Pont unipodal lesté", "Couché, haltère tenu sur les hanches, un pied à plat et l'autre jambe tendue, monter le bassin sans qu'il penche.", ["halteres", "tapis_sol"], reps(8), { unilateral: true, charge: RIR23 })],
        "10": [v("Planche dorsale jambe levée", "Talons dans les sangles, bassin levé, tendre une jambe vers le plafond et tenir, bassin horizontal sans s'affaisser.", ["sangles_suspension"], sec(20), U),
               v("Pont unipodal lourd", "Couché, kettlebell lourde tenue sur les hanches, un pied à plat, l'autre jambe tendue, monter le bassin à l'horizontale.", ["kettlebells", "tapis_sol"], reps(8), { unilateral: true, charge: RIR12 })]
      }
    },
    {
      id: "anti_rotation", nom: "Anti-rotation", zone: "tronc", exclueParFiltre: {},
      niveaux: {
        "1": [v("Pallof press à genoux", "À genoux sur le tapis, élastique fixé sur le côté à hauteur de poitrine, tendre les bras devant sans laisser le buste tourner.", ["elastiques", "tapis_sol"], reps(10), { unilateral: true, incompatible: SGS }),
              v("Pallof press debout", "Debout, pieds largeur de hanches, élastique fixé sur le côté, tendre les bras devant la poitrine sans que le buste tourne.", ["elastiques"], reps(10), U)],
        "2": [v("Pallof press tenu", "Debout, élastique fixé sur le côté, bras tendus devant la poitrine, tenir sans laisser le buste partir vers l'ancrage.", ["elastiques"], sec(20), U),
              v("Pallof press à genoux tenu", "À genoux sur le tapis, bras tendus devant la poitrine, tenir la position sans que le buste tourne vers l'élastique.", ["elastiques", "tapis_sol"], sec(20), { unilateral: true, incompatible: SGS })],
        "3": [v("Pallof press élastique fort", "Debout, élastique plus résistant fixé sur le côté, tendre les bras devant en 2 s et revenir en 2 s, bassin de face.", ["elastiques"], reps(12), U),
              v("Pallof press en demi-squat", "En demi-squat, élastique fixé sur le côté, tendre les bras devant la poitrine sans que les épaules tournent.", ["elastiques"], reps(10), U)],
        "4": [v("Pallof press avec pas de côté", "Bras tendus devant, faire deux pas latéraux qui éloignent de l'ancrage puis revenir, buste toujours de face.", ["elastiques"], reps(10), U),
              v("Pallof press pas avant-arrière", "Bras tendus devant, avancer d'un pas puis reculer sans laisser le buste tourner vers l'élastique.", ["elastiques"], reps(10), U)],
        "5": [v("Marche Pallof", "Élastique tendu sur le côté, bras tendus devant la poitrine, marcher lentement en avant puis en arrière, buste de face.", ["elastiques"], reps(8), U),
              v("Pallof press en fente avant", "En fente avant tenue, élastique fixé sur le côté, tendre les bras devant la poitrine, bassin et épaules de face.", ["elastiques"], reps(10), U)],
        "6": [v("Marche Pallof longue", "Bras tendus devant, s'éloigner de l'ancrage sur cinq pas puis revenir, sans jamais laisser le buste tourner.", ["elastiques"], sec(30), U),
              v("Pallof press rapide", "Élastique fort fixé sur le côté, tendre les bras devant en 1 s et revenir en 2 s, buste strictement de face.", ["elastiques"], reps(12), U)],
        "7": [v("Pallof press en fente arrière", "En fente arrière tenue, élastique fort fixé sur le côté à hauteur de poitrine, tendre les bras devant sans rotation du buste.", ["elastiques"], reps(8), U),
              v("Rip trainer anti-rotation", "Rip trainer tenu à deux mains, ancrage sur le côté, pousser la barre devant soi sans laisser le buste tourner.", ["rip_trainer"], reps(10), U)],
        "8": [v("Pallof en chevalier servant", "En chevalier servant, genou arrière au sol, élastique fixé sur le côté, tendre les bras devant, bassin et épaules de face.", ["elastiques", "tapis_sol"], reps(8), { unilateral: true, incompatible: SGS }),
              v("Rip trainer tenu", "Rip trainer tenu bras tendus devant la poitrine, ancrage sur le côté, tenir sans que le buste ni le bassin tournent.", ["rip_trainer"], sec(20), U)],
        "9": [v("Rip trainer en appui unipodal", "Sur un pied, rip trainer poussé devant la poitrine, ancrage sur le côté, bassin horizontal et buste de face.", ["rip_trainer"], reps(8), U),
              v("Pallof overhead", "Bras tendus, monter l'élastique au-dessus de la tête puis redescendre devant la poitrine, sans cambrer ni tourner le buste.", ["elastiques"], reps(10), { unilateral: true, incompatible: ["sans_overhead"] })],
        "10": [v("Rip trainer unipodal sur bosu", "Sur un pied sur le dôme du bosu, pousser le rip trainer devant la poitrine, ancrage sur le côté, bassin horizontal.", ["rip_trainer", "bosu"], reps(8), U),
               v("Pallof overhead avec pas", "Bras tendus au-dessus de la tête, faire deux pas qui éloignent de l'ancrage puis revenir, sans cambrer le bas du dos.", ["elastiques"], reps(8), { unilateral: true, incompatible: ["sans_overhead"] })]
      }
    },
    {
      id: "rotation", nom: "Rotation", zone: "tronc", exclueParFiltre: {},
      niveaux: {
        "1": [v("Rotations assises au bâton", "Assis sur le step, bâton tenu sur les épaules, tourner le buste à droite puis à gauche sans bouger le bassin.", ["baton", "step"], reps(15)),
              v("Rotations debout au bâton", "Debout, pieds largeur de hanches, bâton tenu sur les épaules, tourner lentement le buste sans que le bassin suive.", ["baton"], reps(15))],
        "2": [v("Rotations assises lentes", "Assis sur le step, bâton sur les épaules, tourner le buste en 3 s à droite puis à gauche, amplitude maximale sans douleur.", ["baton", "step"], reps(12)),
              v("Rotations au bâton en fente", "En fente avant tenue, bâton sur les épaules, tourner le buste vers la jambe avant puis revenir, bassin immobile.", ["baton"], reps(10), U)],
        "3": [v("Rotation élastique contrôlée", "Debout, élastique fixé sur le côté à hauteur de poitrine, tourner le buste à l'opposé en 2 s puis revenir en 3 s.", ["elastiques"], reps(12), U),
              v("Rotations assises jambes levées", "Assis au sol, talons décollés, bâton sur les épaules, tourner le buste à droite puis à gauche, dos droit.", ["baton", "tapis_sol"], reps(12))],
        "4": [v("Chop à l'élastique", "Élastique ancré en haut sur le côté, tirer en diagonale de l'épaule vers la hanche opposée, bras tendus, bassin fixe.", ["elastiques"], reps(12), U),
              v("Lift à l'élastique", "Élastique ancré en bas sur le côté, tirer en diagonale de la hanche vers l'épaule opposée, bras tendus, bassin fixe.", ["elastiques"], reps(12), U)],
        "5": [v("Chop à genoux", "À genoux sur le tapis, élastique ancré en haut, tirer en diagonale vers la hanche opposée sans que le bassin tourne.", ["elastiques", "tapis_sol"], reps(10), { unilateral: true, incompatible: SGS }),
              v("Chop en fente", "En fente avant tenue, élastique ancré en haut, tirer en diagonale vers la hanche opposée, bassin stable, dos droit.", ["elastiques"], reps(10), U)],
        "6": [v("Lift en fente", "En fente avant tenue, élastique ancré en bas, tirer en diagonale vers l'épaule opposée, bassin stable, sans cambrer.", ["elastiques"], reps(10), U),
              v("Chop rapide", "Élastique fort ancré en haut, tirer en diagonale le plus vite possible, retour freiné en 3 s, bassin et genoux immobiles.", ["elastiques"], reps(12), U)],
        "7": [v("Russian twist médecine-ball", "Assis au sol, talons décollés, médecine-ball tenu à deux mains, tourner le buste d'un côté à l'autre, dos droit.", ["medecine_ball", "tapis_sol"], reps(16), { balle: "tenue" }),
              v("Rip trainer rotation", "Rip trainer ancré sur le côté, tourner le buste en poussant la barre à l'opposé puis revenir en contrôle, bassin fixe.", ["rip_trainer"], reps(10), U)],
        "8": [v("Russian twist jambes tendues", "Assis, jambes tendues et talons décollés, médecine-ball tenu à deux mains, tourner le buste d'un côté à l'autre.", ["medecine_ball", "tapis_sol"], reps(16), { balle: "tenue" }),
              v("Rip trainer rotation rapide", "Rip trainer ancré sur le côté, tourner le buste le plus vite possible puis freiner le retour, bassin et genoux fixes.", ["rip_trainer"], reps(12), U)],
        "9": [v("Passe latérale en rotation", "Recevoir le médecine-ball d'un partenaire placé sur le côté et le lui renvoyer aussitôt par une rotation vive du buste.", ["medecine_ball"], reps(10), { unilateral: true, balle: "passe" }),
              v("Rotation explosive médecine-ball", "Médecine-ball tenu à deux mains devant la poitrine, tourner le buste le plus vite possible d'un côté puis de l'autre.", ["medecine_ball"], reps(12), { balle: "tenue" })],
        "10": [v("Passe latérale en fente", "En fente avant tenue, recevoir le médecine-ball d'un partenaire sur le côté et le lui renvoyer par une rotation vive.", ["medecine_ball"], reps(8), { unilateral: true, balle: "passe" }),
               v("Rotation explosive en fente", "En fente avant tenue, médecine-ball devant la poitrine, tourner le buste le plus vite possible puis freiner le retour.", ["medecine_ball"], reps(8), { unilateral: true, balle: "tenue" })]
      }
    },
    {
      id: "flexion_controlee", nom: "Flexion contrôlée", zone: "tronc", exclueParFiltre: {},
      niveaux: {
        "1": [v("Crunch", "Couché sur le tapis, genoux fléchis, décoller les omoplates en soufflant, menton décollé du sternum, redescendre lentement.", ["tapis_sol"], reps(15)),
              v("Dead bug bras tendus", "Couché, bras tendus vers le plafond et hanches fléchies à 90°, descendre un bras et la jambe opposée, bas du dos plaqué.", ["tapis_sol"], reps(10))],
        "2": [v("Crunch lent", "Couché, genoux fléchis, monter en 3 s et redescendre en 3 s, sans tirer sur la nuque, bas du dos au contact du tapis.", ["tapis_sol"], reps(12)),
              v("Dead bug bras et jambes", "Couché, descendre le bras et la jambe opposée jusqu'à quelques centimètres du sol, bas du dos toujours plaqué au tapis.", ["tapis_sol"], reps(10))],
        "3": [v("Crunch bras croisés", "Couché, bras croisés sur la poitrine, décoller les omoplates en soufflant, nuque longue, descente contrôlée en 3 s.", ["tapis_sol"], reps(15)),
              v("Dead bug élastique fixe", "Couché, élastique tendu entre les mains et un ancrage derrière la tête, descendre la jambe opposée, bas du dos plaqué.", ["elastiques", "tapis_sol"], reps(10))],
        "4": [v("Relevés de jambes fléchies", "Couché, mains sous les fesses, monter les genoux vers la poitrine puis redescendre lentement sans cambrer.", ["tapis_sol"], reps(12)),
              v("Toe touches", "Couché, jambes tendues vers le plafond, monter les mains vers les pieds en décollant les omoplates, nuque longue.", ["tapis_sol"], reps(15))],
        "5": [v("Relevés de jambes tendues", "Couché, jambes tendues, les monter à la verticale puis les redescendre en 3 s sans que le bas du dos se creuse.", ["tapis_sol"], reps(12)),
              v("Toe touches lestés", "Jambes tendues vers le plafond, haltère léger tenu à deux mains, monter les mains vers les pieds, nuque longue.", ["halteres", "tapis_sol"], reps(12), { charge: RIR45 })],
        "6": [v("Relevés de jambes lents", "Couché, jambes tendues, monter en 2 s et descendre en 4 s, s'arrêter dès que le bas du dos se creuse.", ["tapis_sol"], reps(10)),
              v("Toe touches médecine-ball", "Jambes tendues vers le plafond, médecine-ball tenu à deux mains, monter le ballon vers les pieds puis redescendre.", ["medecine_ball", "tapis_sol"], reps(12), { balle: "tenue" })],
        "7": [v("Hollow hold", "Couché, bas du dos plaqué au tapis, épaules et jambes tendues décollées, tenir sans que le bas du dos se creuse.", ["tapis_sol"], sec(30)),
              v("V-ups", "Couché, monter ensemble le buste et les jambes tendues pour toucher les pieds, redescendre sans laisser tomber les jambes.", ["tapis_sol"], reps(10))],
        "8": [v("Hollow hold bras allongés", "En position hollow, bras tendus derrière la tête, tenir sans que le bas du dos se creuse, respiration continue.", ["tapis_sol"], sec(40)),
              v("V-ups lents", "Monter buste et jambes tendues en 2 s, tenir 1 s en haut, redescendre en 3 s sans que le bas du dos se creuse.", ["tapis_sol"], reps(8))],
        "9": [v("V-ups lestés", "Haltère léger tenu à deux mains, monter buste et jambes tendues pour amener l'haltère aux pieds, descente contrôlée.", ["halteres", "tapis_sol"], reps(10), { charge: RIR45 }),
              v("Hollow rocks", "En position hollow, se balancer d'avant en arrière sur le tapis en gardant le corps parfaitement rigide.", ["tapis_sol"], reps(15))],
        "10": [v("V-ups médecine-ball", "Médecine-ball tenu à deux mains, monter buste et jambes tendues pour amener le ballon aux pieds, descente en 3 s.", ["medecine_ball", "tapis_sol"], reps(10), { balle: "tenue" }),
               v("Hollow rocks lestés", "Haltère léger tenu à deux mains, se balancer d'avant en arrière en position hollow, corps rigide, bas du dos plaqué.", ["halteres", "tapis_sol"], reps(12), { charge: RIR45 })]
      }
    }
  ];

  if (typeof module !== "undefined" && module.exports) module.exports = CHAINES;
  else global.CHAINES_TRONC = CHAINES;
})(typeof globalThis !== "undefined" ? globalThis : this);
