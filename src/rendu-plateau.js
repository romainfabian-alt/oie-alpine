(function (global) {
  // Dessin du plateau en spirale : grille, position de chaque case, puis SVG
  // complet (cases + flèches + pions). Reprend au trait les pictogrammes et
  // classes CSS de la maquette validée (maquettes/ecrans.html, tâche 11).
  var COULEURS = ["#D9483B", "#2E6FB0", "#E0A526", "#3F9A5B"];
  var T = 170, ESPACE = 10, COTE = T - ESPACE;

  // Pictogrammes au trait (viewBox 12 × 12), repris tels quels de la maquette.
  var ICONES = {
    depart: '<circle cx="6" cy="6" r="4.6"/><polyline points="6,3.4 6,6 8.2,7.4"/>',
    flocon: '<line x1="6" y1="1" x2="6" y2="11"/><line x1="1.7" y1="3.5" x2="10.3" y2="8.5"/><line x1="1.7" y1="8.5" x2="10.3" y2="3.5"/>',
    telecabine: '<line x1="1" y1="3.5" x2="11" y2="1.5"/><line x1="6" y1="2.5" x2="6" y2="5"/><rect x="3.8" y="5" width="4.4" height="4.6" rx="0.8"/>',
    crevasse: '<polyline points="1,3 4,3 6,9 8,3 11,3"/><line x1="6" y1="9" x2="6" y2="11"/>',
    refuge: '<polyline points="1.5,6.5 6,2 10.5,6.5"/><polyline points="3,5.5 3,10.5 9,10.5 9,5.5"/>',
    avalanche: '<polyline points="1,10.5 6,2 11,10.5"/><line x1="4.2" y1="6.5" x2="6.8" y2="6.5"/><line x1="3.2" y1="8.5" x2="8.2" y2="8.5"/>',
    sommet: '<polyline points="0.8,11 4.5,4.5 7,8 9,5 11.2,11"/><line x1="6" y1="1" x2="6" y2="4"/><polyline points="6,1 8.4,1.9 6,2.8"/>',
    col: '<path d="M0.8,10.5 L3.6,3.5 C4.8,7.6 7.2,7.6 8.4,3.5 L11.2,10.5"/><polyline points="4.8,9.4 6,8.2 7.2,9.4"/>',
    chamois: '<path d="M4.4,6.2 C3,5 2.6,3.4 3.2,1.4"/><path d="M7.6,6.2 C9,5 9.4,3.4 8.8,1.4"/><path d="M3.6,6.4 L8.4,6.4 L6.9,10.6 L5.1,10.6 Z"/>',
    duel: '<line x1="2" y1="2" x2="9.2" y2="9.2"/><line x1="10" y1="2" x2="2.8" y2="9.2"/><line x1="7.4" y1="10.6" x2="10.6" y2="7.4"/><line x1="1.4" y1="7.4" x2="4.6" y2="10.6"/>',
    cordee: '<circle cx="4.3" cy="6" r="2.8"/><circle cx="7.7" cy="6" r="2.8"/>',
    meteo: '<circle cx="4.2" cy="4.2" r="1.9"/><line x1="4.2" y1="0.8" x2="4.2" y2="1.3"/><line x1="0.8" y1="4.2" x2="1.3" y2="4.2"/><line x1="1.8" y1="1.8" x2="2.2" y2="2.2"/><path d="M4.2,10.6 L9.3,10.6 A1.9,1.9 0 0 0 9.3,6.8 A2.6,2.6 0 0 0 4.6,7.6 A1.5,1.5 0 0 0 4.2,10.6 Z"/>',
    bivouac: '<polyline points="1,10.5 6,2.5 11,10.5"/><line x1="0.8" y1="10.5" x2="11.2" y2="10.5"/><polyline points="4.7,10.5 6,7.6 7.3,10.5"/>',
    ravitaillement: '<rect x="3.6" y="4" width="4.8" height="7" rx="1.4"/><rect x="5" y="1.6" width="2" height="2.4" rx="0.4"/><line x1="3.6" y1="7" x2="8.4" y2="7"/>'
  };
  var NOMS = { depart: "Départ", flocon: "Flocon", telecabine: "Télécabine", crevasse: "Crevasse", refuge: "Refuge",
    avalanche: "Avalanche", sommet: "Sommet", col: "Col", chamois: "Chamois", duel: "Duel", cordee: "Cordée",
    meteo: "Météo", bivouac: "Bivouac", ravitaillement: "Ravitaillement" };

  // Jusqu'à 48 cases : 10 × 6. Au-delà (plateaux de 72 cases depuis le
  // 29/09) : 8 lignes, pour garder des cases assez grandes sur l'iPad et un
  // centre libre de 2 lignes pour le lancer, plus une pour les positions.
  function grille(n) {
    if (n <= 48) return { colonnes: 10, lignes: 6 };
    return { colonnes: Math.max(12, Math.ceil((n - 24) / 4)), lignes: 8 };
  }

  function spirale(n, colonnes, lignes) {
    var res = [], haut = 0, bas = lignes - 1, gauche = 0, droite = colonnes - 1, c, l;
    while (res.length < n && haut <= bas && gauche <= droite) {
      for (c = gauche; c <= droite; c++) res.push([haut, c]);
      haut++;
      for (l = haut; l <= bas; l++) res.push([l, droite]);
      droite--;
      if (haut <= bas) { for (c = droite; c >= gauche; c--) res.push([bas, c]); bas--; }
      if (gauche <= droite) { for (l = bas; l >= haut; l--) res.push([l, gauche]); gauche++; }
    }
    return res.slice(0, n);
  }

  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
  function altitude(m) { return String(m).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " m"; }

  // Découpe un nom d'exercice sur deux lignes au plus (repère visuel de la
  // maquette : « Pont et » / « ischios », « Charnière » / « de hanche »...).
  // Au-delà de deux lignes, le reste rejoint la deuxième. « serre » signale
  // une ligne trop longue pour la taille normale (« médecine-ball »).
  var LIGNE_MAX = 11;
  function ligniser(nom) {
    var mots = String(nom || "").split(" ").filter(Boolean), lignes = [], courante = "";
    mots.forEach(function (m) {
      var essai = courante ? courante + " " + m : m;
      if (!courante || essai.length <= LIGNE_MAX) courante = essai;
      else { lignes.push(courante); courante = m; }
    });
    if (courante) lignes.push(courante);
    if (lignes.length > 2) lignes = [lignes[0], lignes.slice(1).join(" ")];
    var serre = lignes.some(function (l) { return l.length > LIGNE_MAX; });
    return { lignes: lignes, serre: serre };
  }

  // Géométrie d'une case (unités du viewBox, case de 160) : bande du haut
  // (numéro, pions, « vers N ») jusqu'à 44, contenu au milieu, altitude en bas.
  function texteChaine(nom) {
    var d = ligniser(nom), cx = COTE / 2, classe = "case-chaine" + (d.serre ? " case-chaine-serre" : "");
    if (d.lignes.length < 2) {
      return '<text class="' + classe + '" x="' + cx + '" y="92" text-anchor="middle">' + esc(d.lignes[0] || "") + "</text>";
    }
    return '<text class="' + classe + '" x="' + cx + '" y="80" text-anchor="middle">' + esc(d.lignes[0]) +
      '<tspan x="' + cx + '" dy="26">' + esc(d.lignes[1]) + "</tspan></text>";
  }

  // actif (facultatif) : id du joueur dont c'est le tour, pion cerclé.
  function svg(plateau, joueurs, bib, actif) {
    var n = plateau.cases.length, g = grille(n), pos = spirale(n, g.colonnes, g.lignes);
    var largeur = g.colonnes * T, hauteur = g.lignes * T;
    var morceaux = ['<svg class="plateau-svg" viewBox="0 0 ' + largeur + " " + hauteur + '" xmlns="http://www.w3.org/2000/svg">'];

    plateau.cases.forEach(function (c, i) {
      var p = pos[i], x = p[1] * T + ESPACE / 2, y = p[0] * T + ESPACE / 2;
      var special = c.type !== "exercice";
      var classes = "case " + c.type + (special ? " case-speciale" : "") + (c.type === "sommet" ? " case-sommet" : "");
      var corps;
      if (special) {
        var libLong = NOMS[c.type].length > 10;
        corps = '<g class="case-picto" transform="translate(' + (COTE / 2 - 18) + ',52) scale(3)">' +
          '<g fill="none" stroke="currentColor" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round">' + ICONES[c.type] + "</g></g>" +
          '<text class="case-lib' + (libLong ? " case-lib-long" : "") + '" x="' + (COTE / 2) + '" y="113" text-anchor="middle">' +
          esc(NOMS[c.type].toUpperCase()) + "</text>";
      } else {
        corps = texteChaine(((bib.chaine(c.chaine) || {}).nom) || "");
      }
      var cible = (c.type === "telecabine" || c.type === "avalanche") && typeof c.cible === "number"
        ? '<text class="case-cible" x="' + (COTE - 10) + '" y="26" text-anchor="end">vers ' + (c.cible + 1) + "</text>" : "";
      morceaux.push('<g class="' + classes + '" transform="translate(' + x + "," + y + ')">' +
        '<rect width="' + COTE + '" height="' + COTE + '" rx="10"/>' +
        '<text class="case-num" x="11" y="26">' + (i + 1) + "</text>" + cible + corps +
        '<text class="case-alt" x="' + (COTE / 2) + '" y="' + (COTE - 14) + '" text-anchor="middle">' +
        altitude(plateau.altitudes[i]) + "</text></g>");
    });

    for (var i = 1; i < n; i++) {
      var a = pos[i - 1], b = pos[i];
      var dl = b[0] - a[0], dc = b[1] - a[1];
      var angle = dc === 1 ? 0 : dc === -1 ? 180 : dl === 1 ? 90 : 270;
      var cx = ((a[1] + b[1]) / 2) * T + T / 2, cy = ((a[0] + b[0]) / 2) * T + T / 2;
      morceaux.push('<path class="chevron" transform="translate(' + cx + "," + cy + ") rotate(" + angle + ')" d="M-2.6,-5 L2.8,0 L-2.6,5"/>');
    }

    // Pions : regroupés par case pour placer côte à côte ceux qui partagent
    // une même position, toujours dans le coin haut-droit (jamais sur le nom,
    // le pictogramme ou l'altitude).
    var parPosition = {};
    joueurs.filter(function (j) { return j.rang === null || j.position === n - 1; }).forEach(function (j) {
      (parPosition[j.position] = parPosition[j.position] || []).push(j);
    });
    Object.keys(parPosition).forEach(function (k) {
      var p = pos[Number(k)], baseX = p[1] * T + ESPACE / 2, baseY = p[0] * T + ESPACE / 2;
      var groupe = parPosition[k], serres = groupe.length > 3;
      var r = serres ? 13 : 16, pas = serres ? 30 : 38, depart = serres ? 140 : 136;
      groupe.forEach(function (j, idx) {
        // Une rangée dans la bande du haut, de droite à gauche : jamais sur le
        // numéro (à gauche), le nom, le pictogramme ou l'altitude (plus bas).
        var cx = baseX + depart - idx * pas, cy = baseY + 24;
        var lettre = j.prenom ? j.prenom.charAt(0).toUpperCase() : "?";
        var couleurTexte = String(j.couleur).toUpperCase() === COULEURS[2].toUpperCase() ? "#3A2E22" : "#FFFFFF";
        var cercle = actif !== undefined && actif !== null && j.id === actif
          ? '<circle class="pion-actif" r="' + (r + 5) + '" fill="none" stroke="' + j.couleur + '" stroke-width="2.5" stroke-dasharray="4 3"/>' : "";
        morceaux.push('<g class="pion' + (cercle ? " pion-en-cours" : "") + '" transform="translate(' + cx + "," + cy + ')">' + cercle +
          '<circle r="' + r + '" fill="' + j.couleur + '" stroke="#FAF6EE" stroke-width="3"/>' +
          '<text class="pion-lettre' + (serres ? " pion-lettre-serree" : "") + '" text-anchor="middle" dy="' + (serres ? 5 : 6) + '" fill="' + couleurTexte + '">' + esc(lettre) + "</text></g>");
      });
    });

    morceaux.push("</svg>");
    return morceaux.join("");
  }

  var RenduPlateau = { grille: grille, spirale: spirale, svg: svg, ligniser: ligniser, COULEURS: COULEURS, NOMS: NOMS, ICONES: ICONES };
  if (typeof module !== "undefined" && module.exports) module.exports = RenduPlateau;
  else global.RenduPlateau = RenduPlateau;
})(typeof globalThis !== "undefined" ? globalThis : this);
