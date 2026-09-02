/* =========================================================
   MaisonPro Mèches — catalogue.js
   Génère la grille produits (page boutique) et la page
   détail d'un produit, à partir de PRODUITS (produits-data.js).
   ========================================================= */

(function () {
  "use strict";

  function formaterPrix(nombre) {
    return nombre.toLocaleString("fr-FR").replace(/,/g, " ") + " FCFA";
  }

  function carteHTML(p) {
    return `
      <article class="produit-carte" data-id="${p.id}" data-nom="${p.nom}" data-prix="${p.prix}" data-image="${p.image}">
        <button type="button" class="btn-favori" aria-label="Ajouter aux favoris"></button>
        <div class="produit-media">
          <img src="${p.image}" alt="${p.nom}" loading="lazy">
          <span class="badge-gamme">${p.badge}</span>
          <button type="button" class="btn-ajout-rapide" aria-label="Ajout rapide au panier">+</button>
        </div>
        <div class="produit-info">
          <h3>${p.nom}</h3>
          <span class="produit-prix">${formaterPrix(p.prix)}</span>
        </div>
      </article>`;
  }

  /* ---------- Grille de la boutique (index.html) ---------- */
  function rendreGrille() {
    const grille = document.getElementById("grille-produits");
    if (!grille) return;

    grille.innerHTML = PRODUITS.map(carteHTML).join("");

    grille.querySelectorAll(".produit-carte").forEach((carte) => {
      carte.addEventListener("click", (e) => {
        if (e.target.closest(".btn-favori") || e.target.closest(".btn-ajout-rapide")) return;
        window.location.href = `produit.html?id=${carte.dataset.id}`;
      });
    });
  }

  /* ---------- Page détail (produit.html) ---------- */
  function rendreDetail() {
    const conteneur = document.getElementById("detail-produit");
    if (!conteneur) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const produit = PRODUITS.find((p) => p.id === id) || PRODUITS[0];

    document.title = `${produit.nom} — MaisonPro Mèches`;

    conteneur.innerHTML = `
      <a href="index.html#produits" class="detail-retour">← Retour à la boutique</a>
      <div class="detail-grille">
        <div class="detail-image-zone">
          <img src="${produit.image}" alt="${produit.nom}" class="detail-image">
          <span class="badge-gamme">${produit.badge}</span>
        </div>
        <div class="detail-infos">
          <h1>${produit.nom}</h1>
          <p class="detail-meta">${produit.longueur} · ${produit.texture}</p>
          <span class="detail-prix">${formaterPrix(produit.prix)}</span>
          <p class="detail-description">${produit.description}</p>

          <div class="detail-actions">
            <div class="qte-control">
              <button type="button" data-qte="moins" aria-label="Diminuer">−</button>
              <input type="text" class="qte-input" value="1" inputmode="numeric" aria-label="Quantité">
              <button type="button" data-qte="plus" aria-label="Augmenter">+</button>
            </div>
            <button type="button" class="btn-ajouter" id="detail-btn-ajouter">Ajouter au panier</button>
            <button type="button" class="btn-favori-detail" aria-label="Ajouter aux favoris"></button>
          </div>
        </div>
      </div>
    `;

    // Quantité
    const input = conteneur.querySelector(".qte-input");
    conteneur.querySelector('[data-qte="moins"]').addEventListener("click", () => {
      input.value = Math.max(1, parseInt(input.value || "1", 10) - 1);
    });
    conteneur.querySelector('[data-qte="plus"]').addEventListener("click", () => {
      input.value = parseInt(input.value || "1", 10) + 1;
    });

    // Ajout au panier (fonction exposée par script.js)
    document.getElementById("detail-btn-ajouter").addEventListener("click", () => {
      const quantite = Math.max(1, parseInt(input.value || "1", 10));
      if (window.mpAjouterAuPanier) {
        window.mpAjouterAuPanier(produit.id, produit.nom, produit.prix, produit.image, quantite);
      }
      if (window.mpToast) window.mpToast(`${produit.nom} ajouté au panier`, "🛍️");
    });

    // Favori
    const btnFavori = conteneur.querySelector(".btn-favori-detail");
    function estFavori() {
      try {
        return (JSON.parse(localStorage.getItem("maisonpro-favoris")) || []).includes(produit.id);
      } catch (e) {
        return false;
      }
    }
    function majFavori() {
      btnFavori.classList.toggle("aime", estFavori());
    }
    majFavori();
    btnFavori.addEventListener("click", () => {
      let favoris = [];
      try {
        favoris = JSON.parse(localStorage.getItem("maisonpro-favoris")) || [];
      } catch (e) {}
      if (favoris.includes(produit.id)) {
        favoris = favoris.filter((f) => f !== produit.id);
        if (window.mpToast) window.mpToast("Retiré des favoris", "💔");
      } else {
        favoris.push(produit.id);
        if (window.mpToast) window.mpToast("Ajouté aux favoris", "❤️");
      }
      localStorage.setItem("maisonpro-favoris", JSON.stringify(favoris));
      majFavori();
      document.getElementById("wishlist-count") &&
        (document.getElementById("wishlist-count").textContent = favoris.length);
    });

    // Produits similaires
    const similairesZone = document.getElementById("produits-similaires");
    if (similairesZone) {
      const autres = PRODUITS.filter((p) => p.id !== produit.id).sort(() => 0.5 - Math.random()).slice(0, 4);
      similairesZone.innerHTML = autres.map(carteHTML).join("");
      similairesZone.querySelectorAll(".produit-carte").forEach((carte) => {
        carte.addEventListener("click", (e) => {
          if (e.target.closest(".btn-favori") || e.target.closest(".btn-ajout-rapide")) return;
          window.location.href = `produit.html?id=${carte.dataset.id}`;
        });
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    rendreGrille();
    rendreDetail();
    document.dispatchEvent(new CustomEvent("mp-catalogue-pret"));
  });
})();
