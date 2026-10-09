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

  function attacherInteractionsCartes(grille) {
    grille.querySelectorAll(".produit-carte").forEach((carte) => {
      carte.addEventListener("click", (e) => {
        if (e.target.closest(".btn-favori") || e.target.closest(".btn-ajout-rapide")) return;
        window.location.href = `produit.html?id=${carte.dataset.id}`;
      });
    });
  }

  function rendreGrille(produits) {
    const grille = document.getElementById("grille-produits");
    if (!grille) return;

    const produitsAffiches = produits || PRODUITS;
    grille.innerHTML = produitsAffiches.length
      ? produitsAffiches.map(carteHTML).join("")
      : '<p class="catalogue-vide">Aucune mèche ne correspond à cette recherche. Essaie une autre couleur ou réinitialise les filtres.</p>';

    attacherInteractionsCartes(grille);
    document.dispatchEvent(new CustomEvent("mp-catalogue-pret"));
  }

  function normaliser(texte) {
    return String(texte)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function initRechercheEtFiltres() {
    const recherche = document.getElementById("recherche-produits");
    const boutons = document.querySelectorAll(".filtre-produit");
    const compteur = document.getElementById("catalogue-resultats-nombre");
    const reinitialiser = document.getElementById("reinitialiser-catalogue");
    if (!recherche || !boutons.length || !compteur || !reinitialiser) return;

    let filtreActif = "tout";

    function appliquerFiltres() {
      const terme = normaliser(recherche.value.trim());
      const resultats = PRODUITS.filter((produit) => {
        const contenu = normaliser([produit.nom, produit.badge, produit.longueur, produit.texture, produit.description].join(" "));
        const correspondRecherche = !terme || contenu.includes(terme);
        const correspondFiltre =
          filtreActif === "tout" ||
          (filtreActif === "premium" && normaliser(produit.badge).includes("premium")) ||
          normaliser(produit.texture).includes(filtreActif);
        return correspondRecherche && correspondFiltre;
      });

      rendreGrille(resultats);
      compteur.textContent = resultats.length
        ? `${resultats.length} mèche${resultats.length > 1 ? "s" : ""} à découvrir`
        : "Aucune mèche trouvée";
      reinitialiser.hidden = filtreActif === "tout" && !terme;
    }

    boutons.forEach((bouton) => {
      bouton.addEventListener("click", () => {
        filtreActif = bouton.dataset.filtre;
        boutons.forEach((item) => {
          const estActif = item === bouton;
          item.classList.toggle("actif", estActif);
          item.setAttribute("aria-pressed", String(estActif));
        });
        appliquerFiltres();
      });
    });

    recherche.addEventListener("input", appliquerFiltres);
    reinitialiser.addEventListener("click", () => {
      recherche.value = "";
      filtreActif = "tout";
      boutons.forEach((bouton) => {
        const estActif = bouton.dataset.filtre === "tout";
        bouton.classList.toggle("actif", estActif);
        bouton.setAttribute("aria-pressed", String(estActif));
      });
      appliquerFiltres();
      recherche.focus();
    });
  }

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
            <button type="button" class="btn-favori-detail" data-id="${produit.id}" aria-label="Ajouter aux favoris"></button>
            <button type="button" class="btn-partager" aria-label="Partager ce produit">↗</button>
          </div>
        </div>
      </div>
    `;

    const input = conteneur.querySelector(".qte-input");
    conteneur.querySelector('[data-qte="moins"]').addEventListener("click", () => {
      input.value = Math.max(1, parseInt(input.value || "1", 10) - 1);
    });
    conteneur.querySelector('[data-qte="plus"]').addEventListener("click", () => {
      input.value = parseInt(input.value || "1", 10) + 1;
    });

    document.getElementById("detail-btn-ajouter").addEventListener("click", () => {
      const quantite = Math.max(1, parseInt(input.value || "1", 10));
      if (window.mpAjouterAuPanier) {
        window.mpAjouterAuPanier(produit.id, produit.nom, produit.prix, produit.image, quantite);
      }
      if (window.mpToast) window.mpToast(`${produit.nom} ajouté au panier`, "🛍️");
    });

    conteneur.querySelector(".btn-partager").addEventListener("click", () => {
      const lien = window.location.href;
      const texte = `Regarde cette mèche chez MaisonPro : ${produit.nom} — ${formaterPrix(produit.prix)}\n${lien}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(texte)}`, "_blank");
    });

    // Le cœur favoris est géré globalement par interactions.js (initFavoris / rendreTout),
    // qui écoute déjà les clics sur ".btn-favori-detail" via délégation sur <body>.
    // Pas de second gestionnaire ici : en avoir un ici en plus provoquait un double
    // basculement (ajouté puis aussitôt retiré) et polluait la liste de favoris avec
    // des entrées invalides, car ce bouton n'avait pas d'attribut data-id lisible
    // par le code global. L'attribut data-id ajouté ci-dessus suffit désormais à
    // ce que interactions.js affiche et mette à jour correctement l'état du cœur.

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

    // Signale que le catalogue est prêt même sur une page détail (pas de grille ici),
    // pour que favoris, avis et stock s'initialisent correctement.
    document.dispatchEvent(new CustomEvent("mp-catalogue-pret"));
  }

  document.addEventListener("DOMContentLoaded", () => {
    rendreGrille();
    initRechercheEtFiltres();
    rendreDetail();
  });
})();
