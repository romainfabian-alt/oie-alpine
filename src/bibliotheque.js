(function (global) {
  var R = (typeof require !== "undefined") ? require("./referentiel.js") : global.Referentiel;

  function creer(chaines) {
    var parId = {};
    chaines.forEach(function (c) { parId[c.id] = c; });
    return {
      chaine: function (id) { return parId[id] || null; },
      ids: function () { return Object.keys(parId); },
      idsZone: function (zone) {
        return (R.ZONES[zone] ? R.ZONES[zone].chaines : []).filter(function (id) { return !!parId[id]; });
      }
    };
  }

  var NOMS = [
    ["chaines-membre-inferieur.js", "CHAINES_MEMBRE_INFERIEUR"],
    ["chaines-tronc.js", "CHAINES_TRONC"],
    ["chaines-membre-superieur.js", "CHAINES_MEMBRE_SUPERIEUR"],
    ["chaines-complexe.js", "CHAINES_COMPLEXE"]
  ];

  function defaut() {
    var toutes = [];
    NOMS.forEach(function (n) {
      var liste = null;
      if (typeof require !== "undefined") {
        try { liste = require("../contenu/" + n[0]); } catch (e) { liste = null; }
      } else {
        liste = global[n[1]] || null;
      }
      if (liste) toutes = toutes.concat(liste);
    });
    return creer(toutes);
  }

  var Bibliotheque = { creer: creer, defaut: defaut };
  if (typeof module !== "undefined" && module.exports) module.exports = Bibliotheque;
  else global.Bibliotheque = Bibliotheque;
})(typeof globalThis !== "undefined" ? globalThis : this);
