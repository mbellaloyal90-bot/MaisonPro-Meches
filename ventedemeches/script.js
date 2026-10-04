/* =========================================================
   MaisonPro Mèches — script.js
   Système de vente : panier en mémoire de session,
   gestion des quantités, total en FCFA, et commande
   finalisée par redirection WhatsApp avec récapitulatif
   pré-rempli. Un compte est requis pour valider la commande,
   mais pas pour parcourir la boutique.
   ========================================================= */

(function () {
  "use strict";

  const WHATSAPP_NUMERO = "237651107092";
  const FRAIS_LIVRAISON = 1000;

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
    } catch (e) {}
  }

  function formaterPrix(nombre) {
    return nombre.toLocaleString("fr-FR").replace(/,/g, " ") + " FCFA";
  }

  function ajouterAuPanier(id, nom, prix, image, quantite) {
    const existant = panier.find((item) => item.id === id);
    if (existant) {
      existant.quantite += quantite;
    } else {
      panier.push({ id, nom, prix: Number(prix), image, quantite });
    }
    sauvegarderPanier();
    rendrePanier();
  }
  window.mpAjouterAuPanier = ajouterAuPanier;

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

  function majNoteCompte() {
    const note = document.getElementById("checkout-compte-note");
    if (!note) return;
    note.textContent = window.mpUtilisateurConnecte ? "" : "🔒 Connecte-toi pour pouvoir commander";
  }
  document.addEventListener("mp-auth-change", majNoteCompte);

  function rendrePanier() {
    const compteurs = document.querySelectorAll("#cart-count");
    compteurs.forEach((c) => (c.textContent = nombreArticles()));

    const conteneur = document.getElementById("cart-items");
    const boutonCommander = document.getElementById("checkout-whatsapp");
    const totalEl = document.getElementById("cart-total-valeur");
    if (!conteneur) return;

    if (panier.length === 0) {
      conteneur.innerHTML = '<p class="cart-vide">Ton panier est vide pour le moment.</p>';
      if (boutonCommander) boutonCommander.disabled = true;
      if (totalEl) totalEl.textContent = formaterPrix(0);
      majNoteCompte();
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
    majNoteCompte();

    conteneur.querySelectorAll(".cart-item").forEach((el) => {
      const id = el.dataset.id;
      el.querySelector('[data-action="moins"]').addEventListener("click", () => changerQuantite(id, -1));
      el.querySelector('[data-action="plus"]').addEventListener("click", () => changerQuantite(id, 1));
      el.querySelector('[data-action="retirer"]').addEventListener("click", () => retirerDuPanier(id));
    });
  }
  window.mpRendrePanier = rendrePanier;

  function construireMessageWhatsApp(reduction) {
    let lignes = ["Bonjour MaisonPro, je souhaite commander :", ""];
    panier.forEach((item) => {
      lignes.push(`• ${item.nom} x${item.quantite} — ${formaterPrix(item.prix * item.quantite)}`);
    });
    lignes.push("");
    const sousTotal = totalPanier();
    let total = sousTotal + FRAIS_LIVRAISON;
    if (reduction) {
      const remise = Math.round(sousTotal * 0.1);
      lignes.push(`🎁 Réduction fidélité (5ème commande, -10%) : -${formaterPrix(remise)}`);
      total -= remise;
    }
    lignes.push(`Livraison Yaoundé : ${formaterPrix(FRAIS_LIVRAISON)}`);
    lignes.push(`Total à payer : ${formaterPrix(total)}`);
    lignes.push("");
    lignes.push("Merci de me confirmer la disponibilité.");
    return lignes.join("\n");
  }

  async function ouvrirWhatsApp() {
    if (panier.length === 0) return;
    if (!window.mpUtilisateurConnecte) {
      if (window.mpToast) window.mpToast("Crée un compte ou connecte-toi pour commander", "🔒");
      if (window.mpOuvrirEspace) window.mpOuvrirEspace("compte");
      return;
    }

    const fenetre = window.open("", "_blank");

    let reduction = false;
    if (window.mpEnregistrerCommandeFidelite) {
      const resultat = await window.mpEnregistrerCommandeFidelite();
      reduction = resultat.reduction;
      if (reduction && window.mpToast) window.mpToast("🎉 -10% appliqué, 5ème commande !", "🎁");
    }

    const message = encodeURIComponent(construireMessageWhatsApp(reduction));
    if (window.mpComptabiliserCommande) window.mpComptabiliserCommande();
    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${message}`;
    if (fenetre) fenetre.location.href = url;
    else window.open(url, "_blank");
  }

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

  /* Ajout rapide (1 clic = +1) depuis la grille ou les produits similaires */
  function initAjoutRapide() {
    document.querySelectorAll(".produit-carte .btn-ajout-rapide").forEach((btn) => {
      if (btn.dataset.ajoutRapidePret) return;
      btn.dataset.ajoutRapidePret = "true";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const carte = btn.closest(".produit-carte");
        const { id, nom, prix, image } = carte.dataset;
        ajouterAuPanier(id, nom, prix, image, 1);
        btn.textContent = "✓";
        setTimeout(() => (btn.textContent = "+"), 900);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initDrawer();
    initAjoutRapide();
    rendrePanier();

    const boutonCommander = document.getElementById("checkout-whatsapp");
    if (boutonCommander) boutonCommander.addEventListener("click", ouvrirWhatsApp);
  });

  // Les produits similaires (page détail) sont injectés après coup :
  // on re-scanne les boutons d'ajout rapide une fois le catalogue prêt.
  document.addEventListener("mp-catalogue-pret", initAjoutRapide);
})();
