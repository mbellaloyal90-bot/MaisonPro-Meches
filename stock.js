/* =========================================================
   MaisonPro Mèches — stock.js
   Affichage du stock réel (Firestore, mis à jour par la
   propriétaire depuis gestion-stock.html). Aucun chiffre
   n'est inventé : tant que la propriétaire n'a pas renseigné
   une quantité pour un produit, aucun badge ne s'affiche.
   ========================================================= */

(function () {
  "use strict";

  const SEUIL_STOCK_BAS = 3;
  let stockCharge = null;

  async function chargerStock() {
    if (stockCharge) return stockCharge;
    try {
      const snap = await db.collection("stock").get();
      const carte = {};
      snap.forEach((doc) => { carte[doc.id] = doc.data().quantite; });
      stockCharge = carte;
    } catch (e) {
      stockCharge = {};
    }
    return stockCharge;
  }

  function badgeStockHTML(quantite) {
    if (quantite === undefined || quantite === null) return "";
    if (quantite <= 0) return '<span class="badge-stock badge-stock-rupture">Rupture de stock</span>';
    if (quantite <= SEUIL_STOCK_BAS) return `<span class="badge-stock badge-stock-bas">Plus que ${quantite} en stock</span>`;
    return "";
  }

  async function appliquerStockGrille() {
    const carte = await chargerStock();
    document.querySelectorAll(".produit-carte").forEach((produitCarte) => {
      const media = produitCarte.querySelector(".produit-media");
      if (!media) return;

      const ancien = media.querySelector(".badge-stock");
      if (ancien) ancien.remove();
      produitCarte.classList.remove("produit-epuise");

      const quantite = carte[produitCarte.dataset.id];
      const html = badgeStockHTML(quantite);
      if (html) media.insertAdjacentHTML("beforeend", html);

      const btnRapide = produitCarte.querySelector(".btn-ajout-rapide");
      if (quantite !== undefined && quantite !== null && quantite <= 0) {
        produitCarte.classList.add("produit-epuise");
        if (btnRapide) { btnRapide.disabled = true; btnRapide.textContent = "✕"; }
      } else if (btnRapide) {
        btnRapide.disabled = false;
        if (btnRapide.textContent === "✕") btnRapide.textContent = "+";
      }
    });
  }

  async function appliquerStockDetail(produitId) {
    const carte = await chargerStock();
    const quantite = carte[produitId];

    const zone = document.querySelector(".detail-image-zone");
    if (zone) {
      const ancien = zone.querySelector(".badge-stock");
      if (ancien) ancien.remove();
      const html = badgeStockHTML(quantite);
      if (html) zone.insertAdjacentHTML("beforeend", html);
    }

    if (quantite !== undefined && quantite !== null && quantite <= 0) {
      const btn = document.getElementById("detail-btn-ajouter");
      if (btn) { btn.disabled = true; btn.textContent = "Rupture de stock"; }
      document.querySelectorAll(".qte-control button, .qte-control input").forEach((el) => (el.disabled = true));
    }
  }

  document.addEventListener("mp-catalogue-pret", () => {
    if (document.getElementById("grille-produits")) appliquerStockGrille();

    const zoneDetail = document.getElementById("detail-produit");
    if (zoneDetail) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id") || (typeof PRODUITS !== "undefined" ? PRODUITS[0].id : null);
      if (id) appliquerStockDetail(id);
    }
  });
})();
