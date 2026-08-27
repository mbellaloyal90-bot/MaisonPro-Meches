/* =========================================================
   MaisonPro Mèches — script.js
   Système de vente : panier en mémoire de session,
   gestion des quantités, total en FCFA, et commande
   finalisée par redirection WhatsApp avec récapitulatif
   pré-rempli.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Configuration boutique ---------- */
  const WHATSAPP_NUMERO = "237651107092"; // format international sans le +
  const FRAIS_LIVRAISON = 1000; // FCFA, Yaoundé

  /* ---------- État du panier ---------- */
  // Rechargé depuis sessionStorage si l'utilisateur navigue entre les pages
  // du site pendant la même session (perdu à la fermeture de l'onglet).
  let panier = chargerPanier();

  function chargerPanier() {
    try {
      const brut = sessionStorage.getItem("maisonpro-meches-panier");
      return brut ? JSON.parse(brut) : [];
    } catch (e) {
      return [];
    }
  }

  function sauvegarderPanier() {
    try {
      sessionStorage.setItem("maisonpro-meches-panier", JSON.stringify(panier));
    } catch (e) {
      /* silencieux : navigation privée ou stockage désactivé */
    }
  }

  function formaterPrix(nombre) {
    return nombre.toLocaleString("fr-FR").replace(/,/g, " ") + " FCFA";
  }

  /* ---------- Actions panier ---------- */
  function ajouterAuPanier(id, nom, prix, image, quantite) {
    const existant = panier.find((item) => item.id === id);
    if (existant) {
      existant.quantite += quantite;
    } else {
      panier.push({ id, nom, prix, image, quantite });
    }
    sauvegarderPanier();
    rendrePanier();
  }

  function changerQuantite(id, delta) {
    const item = panier.find((i) => i.id === id);
    if (!item) return;
    item.quantite += delta;
    if (item.quantite <= 0) {
      panier = panier.filter((i) => i.id !== id);
    }
    sauvegarderPanier();
    rendrePanier();
  }

  function retirerDuPanier(id) {
    panier = panier.filter((i) => i.id !== id);
    sauvegarderPanier();
    rendrePanier();
  }

  function totalPanier() {
    return panier.reduce((somme, item) => somme + item.prix * item.quantite, 0);
  }

  function nombreArticles() {
    return panier.reduce((somme, item) => somme + item.quantite, 0);
  }

  /* ---------- Rendu du panier (drawer) ---------- */
  function rendrePanier() {
    const compteurs = document.querySelectorAll("#cart-count");
    compteurs.forEach((c) => (c.textContent = nombreArticles()));

    const conteneur = document.getElementById("cart-items");
    const boutonCommander = document.getElementById("checkout-whatsapp");
    const totalEl = document.getElementById("cart-total-valeur");
    if (!conteneur) return; // page sans panier (ex: politiques.html)

    if (panier.length === 0) {
      conteneur.innerHTML = '<p class="cart-vide">Ton panier est vide pour le moment.</p>';
      if (boutonCommander) boutonCommander.disabled = true;
      if (totalEl) totalEl.textContent = formaterPrix(0);
      return;
    }

    conteneur.innerHTML = panier
      .map(
        (item) => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.nom}">
        <div class="cart-item-info">
          <h4>${item.nom}</h4>
          <span>${formaterPrix(item.prix)}</span>
        </div>
        <div class="cart-item-actions">
          <div class="cart-item-qte">
            <button type="button" data-action="moins" aria-label="Diminuer la quantité">−</button>
            <span>${item.quantite}</span>
            <button type="button" data-action="plus" aria-label="Augmenter la quantité">+</button>
          </div>
          <button type="button" class="cart-item-remove" data-action="retirer">Retirer</button>
        </div>
      </div>`
      )
      .join("");

    if (boutonCommander) boutonCommander.disabled = false;
    if (totalEl) totalEl.textContent = formaterPrix(totalPanier());

    conteneur.querySelectorAll(".cart-item").forEach((el) => {
      const id = el.dataset.id;
      el.querySelector('[data-action="moins"]').addEventListener("click", () => changerQuantite(id, -1));
      el.querySelector('[data-action="plus"]').addEventListener("click", () => changerQuantite(id, 1));
      el.querySelector('[data-action="retirer"]').addEventListener("click", () => retirerDuPanier(id));
    });
  }

  /* ---------- Message WhatsApp ---------- */
  function construireMessageWhatsApp() {
    let lignes = ["Bonjour MaisonPro, je souhaite commander :", ""];
    panier.forEach((item) => {
      lignes.push(`• ${item.nom} x${item.quantite} — ${formaterPrix(item.prix * item.quantite)}`);
    });
    lignes.push("");
    lignes.push(`Livraison Yaoundé : ${formaterPrix(FRAIS_LIVRAISON)}`);
    lignes.push(`Total à payer : ${formaterPrix(totalPanier() + FRAIS_LIVRAISON)}`);
    lignes.push("");
    lignes.push("Merci de me confirmer la disponibilité.");
    return lignes.join("\n");
  }

  function ouvrirWhatsApp() {
    if (panier.length === 0) return;
    const message = encodeURIComponent(construireMessageWhatsApp());
    window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${message}`, "_blank");
  }

  /* ---------- Drawer panier : ouverture/fermeture ---------- */
  function initDrawer() {
    const overlay = document.getElementById("cart-overlay");
    const drawer = document.getElementById("cart-drawer");
    const boutonsOuvrir = document.querySelectorAll("#cart-toggle");
    const boutonFermer = document.getElementById("cart-close");

    function ouvrir() {
      overlay.classList.add("ouvert");
      drawer.classList.add("ouvert");
      drawer.setAttribute("aria-hidden", "false");
    }
    function fermer() {
      overlay.classList.remove("ouvert");
      drawer.classList.remove("ouvert");
      drawer.setAttribute("aria-hidden", "true");
    }

    boutonsOuvrir.forEach((b) => b.addEventListener("click", ouvrir));
    if (boutonFermer) boutonFermer.addEventListener("click", fermer);
    if (overlay) overlay.addEventListener("click", fermer);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") fermer();
    });
  }

  /* ---------- Cartes produits : quantité + ajout ---------- */
  function initCartesProduits() {
    document.querySelectorAll(".produit-carte").forEach((carte) => {
      const input = carte.querySelector(".qte-input");
      const moins = carte.querySelector('[data-qte="moins"]');
      const plus = carte.querySelector('[data-qte="plus"]');
      const btnAjouter = carte.querySelector(".btn-ajouter");

      if (moins) {
        moins.addEventListener("click", () => {
          input.value = Math.max(1, parseInt(input.value || "1", 10) - 1);
        });
      }
      if (plus) {
        plus.addEventListener("click", () => {
          input.value = parseInt(input.value || "1", 10) + 1;
        });
      }

      if (btnAjouter) {
        btnAjouter.addEventListener("click", () => {
          const { id, nom, prix, image } = carte.dataset;
          const quantite = Math.max(1, parseInt(input.value || "1", 10));
          ajouterAuPanier(id, nom, Number(prix), image, quantite);

          btnAjouter.textContent = "Ajouté ✓";
          btnAjouter.classList.add("ajoute");
          setTimeout(() => {
            btnAjouter.textContent = "Ajouter au panier";
            btnAjouter.classList.remove("ajoute");
          }, 1400);
        });
      }
    });
  }

  /* ---------- Initialisation ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initDrawer();
    initCartesProduits();
    rendrePanier();

    const boutonCommander = document.getElementById("checkout-whatsapp");
    if (boutonCommander) boutonCommander.addEventListener("click", ouvrirWhatsApp);
  });
})();
