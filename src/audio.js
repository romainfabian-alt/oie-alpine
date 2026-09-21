(function (global) {
  var CLE = "oieAlpine.son";

  function creer(stockage) {
    var contexte = null;
    function lire() { try { return stockage.getItem(CLE) !== "0"; } catch (e) { return true; } }
    function ecrire(v) { try { stockage.setItem(CLE, v ? "1" : "0"); } catch (e) { /* stockage bloqué : sans gravité */ } }
    var actif = lire();

    // iOS n'autorise le son qu'après un geste de l'utilisateur.
    function debloquer() {
      if (!contexte) {
        var C = global.AudioContext || global.webkitAudioContext;
        if (C) contexte = new C();
      }
      if (contexte && contexte.state === "suspended") contexte.resume();
    }

    function bip() {
      if (!actif || !contexte) return;
      // Web Audio peut lever (contexte fermé, iOS capricieux...) : un bip qui
      // échoue ne doit jamais faire planter l'écran qui l'appelle.
      try {
        [0, 0.25, 0.5].forEach(function (decalage) {
          var o = contexte.createOscillator(), g = contexte.createGain(), t0 = contexte.currentTime + decalage;
          o.type = "sine"; o.frequency.value = 880;
          g.gain.setValueAtTime(0.3, t0);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
          o.connect(g); g.connect(contexte.destination);
          o.start(t0); o.stop(t0 + 0.2);
        });
      } catch (e) { if (global.console) global.console.error(e); }
    }

    return {
      debloquer: debloquer, bip: bip,
      actif: function () { return actif; },
      basculer: function () { actif = !actif; ecrire(actif); return actif; }
    };
  }

  var SonOie = { creer: creer };
  if (typeof module !== "undefined" && module.exports) module.exports = SonOie;
  else global.SonOie = SonOie;
})(typeof globalThis !== "undefined" ? globalThis : this);
