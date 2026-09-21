(function (global) {
  // Chaîne de progression complexe (mouvements globaux, corps entier).
  // Contenu validé par Romain : ne jamais modifier une variante sans son accord.
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
  var SWING = "Charge moyenne, hanches explosives";
  var PORTE_MOYEN = "Charge modérée, buste droit du début à la fin";
  var PORTE_LOURD = "Charge lourde, épaules basses et buste droit";
  var SGS = ["sans_genoux_sol"];
  var SOH = ["sans_overhead"];

  var CHAINES = [
    {
      id: "complexe", nom: "Complexe", zone: "complexe", exclueParFiltre: {},
      niveaux: {
        "1": [v("Porté fermier", "Une kettlebell dans chaque main, marcher droit à pas réguliers, buste grand, épaules basses, sans pencher le tronc.", ["kettlebells"], sec(40), { charge: PORTE_MOYEN }),
              v("Relevé de sol contrôlé", "Assis au sol, se relever en passant par un genou au sol puis se rasseoir, mouvement lent et sans à-coup.", ["tapis_sol"], reps(8), { incompatible: SGS })],
        "2": [v("Porté fermier lourd", "Une kettlebell lourde dans chaque main, marcher à pas réguliers, buste grand, sans que les épaules tombent en avant.", ["kettlebells"], sec(40), { charge: PORTE_LOURD }),
              v("Relevé de sol sans les mains", "Assis au sol, se relever et se rasseoir sans poser les mains, en passant par un genou au sol, mouvement lent.", ["tapis_sol"], reps(6), { incompatible: SGS })],
        "3": [v("Porté valise alterné", "Une kettlebell dans une main, marcher droit, poser, changer de main et repartir, épaules horizontales tout du long.", ["kettlebells"], sec(40), { unilateral: true, charge: PORTE_LOURD }),
              v("Relevé de sol et marche", "Assis au sol, se relever, marcher trois pas, revenir et se rasseoir en contrôle, sans s'aider des mains.", ["tapis_sol"], reps(6))],
        "4": [v("Kettlebell swing", "Balancer la kettlebell entre les cuisses puis la monter à hauteur de poitrine par une extension vive des hanches, dos plat.", ["kettlebells"], reps(15), { charge: SWING }),
              v("Thruster haltères léger", "Haltères au niveau des oreilles, squat à mi-course puis remontée qui prolonge la poussée au-dessus de la tête.", ["halteres"], reps(10), { charge: RIR45, incompatible: SOH })],
        "5": [v("Kettlebell swing enchaîné", "Enchaîner les balancements sans pause, hanches explosives, bras relâchés, dos plat, respiration rythmée.", ["kettlebells"], reps(20), { charge: SWING }),
              v("Thruster haltères", "Haltères au niveau des oreilles, squat cuisses parallèles puis extension qui pousse les haltères au-dessus de la tête.", ["halteres"], reps(10), { charge: RIR23, incompatible: SOH })],
        "6": [v("Swing et squat gobelet", "Cinq balancements puis cinq squats gobelet avec la même kettlebell, sans poser la charge entre les deux.", ["kettlebells"], reps(10), { charge: SWING }),
              v("Thruster kettlebell", "Kettlebells calées contre les avant-bras, squat cuisses parallèles puis extension qui les pousse au-dessus de la tête.", ["kettlebells"], reps(8), { charge: RIR23, incompatible: SOH })],
        "7": [v("Sprawl", "Debout, poser les mains au sol et projeter les pieds en arrière jusqu'à la planche sans saut, puis se relever vite.", ["tapis_sol"], reps(10)),
              v("Bear crawl", "À quatre appuis, genoux décollés de quelques centimètres, avancer main et pied opposés, bassin bas et stable.", ["tapis_sol"], sec(30))],
        "8": [v("Sprawl enchaîné", "Enchaîner les descentes en planche et les relevés sans pause et sans saut, dos plat, rythme régulier.", ["tapis_sol"], reps(12)),
              v("Bear crawl avant-arrière", "À quatre appuis genoux décollés, avancer de trois appuis puis reculer de trois, bassin bas et immobile.", ["tapis_sol"], sec(40))],
        "9": [v("Burpee complet", "Descente en planche, pompe complète, retour des pieds sous les hanches puis saut vertical, réception souple.", ["tapis_sol"], reps(10), { incompatible: ["sans_saut"] }),
              v("Man maker haltères", "En planche haltères en main, un rowing par bras, une pompe, puis se relever et pousser les haltères au-dessus de la tête.", ["halteres"], reps(8), { charge: RIR23, incompatible: SOH }),
              v("Sprawl et bear crawl", "Un sprawl sans saut puis trois appuis de bear crawl en avant, enchaîner sans pause, bassin bas et dos plat.", ["tapis_sol"], sec(40))],
        "10": [v("Burpee enchaîné", "Enchaîner les burpees complets sans pause, pompe complète à chaque descente, réception souple et silencieuse.", ["tapis_sol"], reps(12), { incompatible: ["sans_saut"] }),
               v("Man maker lourd", "Haltères lourds, un rowing par bras en planche, une pompe, puis relevé et poussée des haltères au-dessus de la tête.", ["halteres"], reps(6), { charge: RIR12, incompatible: SOH }),
               v("Swing et sprawl", "Dix balancements de kettlebell puis cinq sprawls sans saut, sans pause entre les deux, dos plat tout du long.", ["kettlebells", "tapis_sol"], reps(10), { charge: SWING })]
      }
    }
  ];

  if (typeof module !== "undefined" && module.exports) module.exports = CHAINES;
  else global.CHAINES_COMPLEXE = CHAINES;
})(typeof globalThis !== "undefined" ? globalThis : this);
