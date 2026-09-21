(function (global) {
  var doc = global.document;

  function el(tag, attributs, enfants) {
    var n = doc.createElement(tag);
    Object.keys(attributs || {}).forEach(function (k) {
      if (k === "texte") n.textContent = attributs[k];
      else if (k === "classe") n.className = attributs[k];
      else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), attributs[k]);
      else n.setAttribute(k, attributs[k]);
    });
    (enfants || []).forEach(function (e) { if (e) n.appendChild(typeof e === "string" ? doc.createTextNode(e) : e); });
    return n;
  }

  function bouton(texte, action, classe) {
    return el("button", { type: "button", classe: "bouton " + (classe || ""), texte: texte, onclick: action });
  }

  function vider(noeud) { while (noeud.firstChild) noeud.removeChild(noeud.firstChild); }

  function modal(titre, texte, choix) {
    var fond = el("div", { classe: "modal-fond" });
    function fermer() { if (fond.parentNode) fond.parentNode.removeChild(fond); }
    var boite = el("div", { classe: "modal" }, [
      el("h2", { texte: titre }),
      texte ? el("p", { texte: texte }) : null,
      el("div", { classe: "modal-choix" }, choix.map(function (c) {
        return bouton(c.texte, function () { fermer(); if (c.action) c.action(); }, c.classe);
      }))
    ]);
    fond.appendChild(boite);
    doc.body.appendChild(fond);
    return fermer;
  }

  var UI = { el: el, bouton: bouton, vider: vider, modal: modal };
  if (typeof module !== "undefined" && module.exports) module.exports = UI;
  else global.UI = UI;
})(typeof globalThis !== "undefined" ? globalThis : this);
