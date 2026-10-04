/* =========================================================
   MaisonPro Mèches — interactions.js
   Panneau unique "Mon espace" (Compte / Favoris /
   Paramètres), menu mobile, toasts, révélation au scroll,
   quiz, boutons flottants.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- 1. Panneau "Mon espace" (ouverture + onglets) ---------- */
  function initEspace() {
    const bouton = document.getElementById("espace-toggle");
    const panneau = document.getElementById("espace-panel");
    const overlay = document.getElementById("espace-overlay");
    const fermer = document.getElementById("espace-close");
    if (!panneau) return;

    function ouvrir(onglet) {
      panneau.classList.add("ouvert");
      overlay.classList.add("ouvert");
      if (onglet) activerOnglet(onglet);
    }
    function fermerPanneau() {
      panneau.classList.remove("ouvert");
      overlay.classList.remove("ouvert");
    }

    if (bouton) bouton.addEventListener("click", () => ouvrir());
    if (fermer) fermer.addEventListener("click", fermerPanneau);
    if (overlay) overlay.addEventListener("click", fermerPanneau);

    function activerOnglet(nom) {
      panneau.querySelectorAll(".espace-tab").forEach((t) => t.classList.toggle("actif", t.dataset.tab === nom));
      panneau.querySelectorAll(".espace-section").forEach((s) => (s.hidden = s.dataset.section !== nom));
    }
    panneau.querySelectorAll(".espace-tab").forEach((tab) => {
      tab.addEventListener("click", () => activerOnglet(tab.dataset.tab));
    });

    window.mpOuvrirEspace = ouvrir;
  }

  /* ---------- 2. Thème sombre / animations (dans l'onglet Paramètres) ---------- */
  const PREF_THEME = "maisonpro-theme";
  const PREF_ANIM = "maisonpro-animations";

  function appliquerTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(PREF_THEME, theme);
    document.querySelectorAll(".theme-switch input").forEach((c) => (c.checked = theme === "sombre"));
  }
  function appliquerAnimations(actives) {
    document.documentElement.setAttribute("data-anim", actives ? "on" : "off");
    localStorage.setItem(PREF_ANIM, actives ? "on" : "off");
    document.querySelectorAll(".anim-switch input").forEach((c) => (c.checked = actives));
  }
  function initParametres() {
    appliquerTheme(localStorage.getItem(PREF_THEME) || "clair");
    appliquerAnimations(localStorage.getItem(PREF_ANIM) !== "off");

    document.querySelectorAll(".theme-switch input").forEach((c) => {
      c.addEventListener("change", (e) => appliquerTheme(e.target.checked ? "sombre" : "clair"));
    });
    document.querySelectorAll(".anim-switch input").forEach((c) => {
      c.addEventListener("change", (e) => appliquerAnimations(e.target.checked));
    });
  }

  /* ---------- 3. Menu mobile ---------- */
  function initMenuMobile() {
    const bouton = document.getElementById("menu-toggle");
    const nav = document.querySelector(".site-header nav");
    if (!bouton || !nav) return;
    bouton.addEventListener("click", () => {
      nav.classList.toggle("ouvert");
      bouton.classList.toggle("actif");
      bouton.setAttribute("aria-expanded", nav.classList.contains("ouvert"));
    });
    nav.querySelectorAll("a").forEach((lien) => {
      lien.addEventListener("click", () => {
        nav.classList.remove("ouvert");
        bouton.classList.remove("actif");
      });
    });
  }

  /* ---------- 4. Toasts ---------- */
  function toast(message, icone) {
    let conteneur = document.getElementById("toast-container");
    if (!conteneur) {
      conteneur = document.createElement("div");
      conteneur.id = "toast-container";
      document.body.appendChild(conteneur);
    }
    const bulle = document.createElement("div");
    bulle.className = "toast";
    bulle.innerHTML = `<span class="toast-icone">${icone || "✓"}</span><span>${message}</span>`;
    conteneur.appendChild(bulle);
    requestAnimationFrame(() => bulle.classList.add("visible"));
    setTimeout(() => {
      bulle.classList.remove("visible");
      setTimeout(() => bulle.remove(), 350);
    }, 2600);
  }
  window.mpToast = toast;

  document.addEventListener("click", (e) => {
    const bouton = e.target.closest(".btn-ajouter, .btn-ajout-rapide");
    const carte = bouton && bouton.closest(".produit-carte");
    if (bouton && carte && !bouton.id) {
      toast(`${carte.dataset.nom} ajouté au panier`, "🛍️");
    }
  });

  /* ---------- 5. Favoris (cœur + liste dans le panneau) ---------- */
  const CLE_FAVORIS = "maisonpro-favoris";

  function chargerFavoris() {
    try { return JSON.parse(localStorage.getItem(CLE_FAVORIS)) || []; }
    catch (e) { return []; }
  }
  function sauvegarderFavoris(liste) {
    localStorage.setItem(CLE_FAVORIS, JSON.stringify(liste));
  }

  function rendreListeFavoris() {
    const zone = document.getElementById("favoris-liste");
    if (!zone) return;
    const favoris = chargerFavoris();

    if (favoris.length === 0) {
      zone.innerHTML = '<p class="favoris-vide">Aucun favori pour le moment. Touche le cœur sur une mèche pour la garder ici.</p>';
      return;
    }

    const produits = typeof PRODUITS !== "undefined" ? PRODUITS : [];
    zone.innerHTML = favoris
      .map((id) => produits.find((p) => p.id === id))
      .filter(Boolean)
      .map(
        (p) => `
      <a class="favori-ligne" href="produit.html?id=${p.id}">
        <img src="${p.image}" alt="${p.nom}">
        <div class="favori-info">
          <h4>${p.nom}</h4>
          <span>${p.prix.toLocaleString("fr-FR").replace(/,/g, " ")} FCFA</span>
        </div>
        <button type="button" class="favori-retirer" data-id="${p.id}" aria-label="Retirer des favoris">✕</button>
      </a>`
      )
      .join("");

    zone.querySelectorAll(".favori-retirer").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        let favoris = chargerFavoris().filter((id) => id !== btn.dataset.id);
        sauvegarderFavoris(favoris);
        rendreTout();
      });
    });
  }

  function rendreTout() {
    const favoris = chargerFavoris();
    document.querySelectorAll("#wishlist-count").forEach((c) => (c.textContent = favoris.length));
    document.querySelectorAll(".btn-favori, .btn-favori-detail").forEach((btn) => {
      const carte = btn.closest("[data-id]") || btn.closest(".produit-carte");
      const id = carte ? carte.dataset.id : btn.dataset.id;
      btn.classList.toggle("aime", favoris.includes(id));
    });
    rendreListeFavoris();
  }

  function initFavoris() {
    rendreTout();
    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-favori, .btn-favori-detail");
      if (!btn) return;
      e.stopPropagation();
      const carte = btn.closest(".produit-carte");
      const id = carte ? carte.dataset.id : btn.dataset.id;
      const nom = carte ? carte.dataset.nom : "";
      let favoris = chargerFavoris();
      if (favoris.includes(id)) {
        favoris = favoris.filter((f) => f !== id);
        toast(`${nom || "Produit"} retiré des favoris`, "💔");
      } else {
        favoris.push(id);
        toast(`${nom || "Produit"} ajouté aux favoris`, "❤️");
      }
      sauvegarderFavoris(favoris);
      rendreTout();
    });
  }

  /* ---------- 6. Révélation au scroll ---------- */
  function initRevelationScroll() {
    const elements = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window) || elements.length === 0) {
      elements.forEach((el) => el.classList.add("revele"));
      return;
    }
    const observateur = new IntersectionObserver(
      (entrees) => {
        entrees.forEach((entree) => {
          if (entree.isIntersecting) {
            entree.target.classList.add("revele");
            observateur.unobserve(entree.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    elements.forEach((el) => observateur.observe(el));
  }

  /* ---------- 7. Quiz "Trouve ta teinte" ---------- */
  const REPONSES_QUIZ = {};
  const RESULTATS_QUIZ = {
    "blond-lumineux": { id: "balayage-dore-ondule", texte: "Le Balayage Doré Ondulé va sublimer ta base claire avec un effet lumineux tout en douceur." },
    "blond-glamour": { id: "blond-cendre-boucle", texte: "Le Blond Cendré Bouclé apporte le volume et l'éclat glamour que tu recherches." },
    "blond-subtil": { id: "chatain-clair-ondule", texte: "Le Châtain Clair Ondulé se fond naturellement dans une base claire, en toute discrétion." },
    "brun-subtil": { id: "chatain-balayage-caramel", texte: "Le Châtain Balayage Caramel ajoute de la lumière à ta couleur sans la dénaturer." },
    "brun-lumineux": { id: "ondule-miel-ensoleille", texte: "L'Ondulé Miel Ensoleillé crée un beau contraste chaleureux avec des cheveux foncés." },
    "brun-glamour": { id: "roux-cuivre-glamour", texte: "Le Roux Cuivré Glamour pour un changement de style marquant et sophistiqué." },
    "noir-subtil": { id: "carre-plongeant-brun", texte: "Le Carré Plongeant Brun apporte du volume sans dénaturer ta couleur naturelle." },
    "noir-lumineux": { id: "balayage-dore-ondule", texte: "Le Balayage Doré Ondulé pour un contraste doré spectaculaire sur base foncée." },
    "noir-glamour": { id: "blond-platine-lisse", texte: "Le Blond Platiné Lisse pour un changement radical et glamour." },
  };

  function initQuiz() {
    const quiz = document.getElementById("quiz");
    if (!quiz) return;
    const etapes = quiz.querySelectorAll(".quiz-etape");
    const resultat = document.getElementById("quiz-resultat");

    quiz.querySelectorAll(".quiz-option").forEach((option) => {
      option.addEventListener("click", () => {
        const etapeActuelle = option.closest(".quiz-etape");
        REPONSES_QUIZ[etapeActuelle.dataset.cle] = option.dataset.valeur;
        etapeActuelle.classList.remove("active");
        const indexSuivant = Array.from(etapes).indexOf(etapeActuelle) + 1;
        if (indexSuivant < etapes.length) etapes[indexSuivant].classList.add("active");
        else afficherResultatQuiz();
      });
    });

    const boutonRecommencer = document.getElementById("quiz-recommencer");
    if (boutonRecommencer) {
      boutonRecommencer.addEventListener("click", () => {
        resultat.classList.remove("active");
        etapes[0].classList.add("active");
      });
    }

    function afficherResultatQuiz() {
      const cle = `${REPONSES_QUIZ.base}-${REPONSES_QUIZ.envie}`;
      const reco = RESULTATS_QUIZ[cle] || RESULTATS_QUIZ["brun-subtil"];
      const produit = (typeof PRODUITS !== "undefined" ? PRODUITS : []).find((p) => p.id === reco.id);

      resultat.querySelector(".quiz-resultat-texte").textContent = reco.texte;
      const image = resultat.querySelector(".quiz-resultat-image");
      if (image && produit) image.src = produit.image;

      const lienVoir = resultat.querySelector(".quiz-resultat-lien");
      if (lienVoir && produit) lienVoir.onclick = () => (window.location.href = `produit.html?id=${produit.id}`);

      resultat.classList.add("active");
    }
  }

  /* ---------- 8. Défilement : header flou + bouton retour en haut ---------- */
  function initDefilement() {
    const header = document.querySelector(".site-header");
    const boutonHaut = document.getElementById("back-to-top");
    window.addEventListener(
      "scroll",
      () => {
        if (header) header.classList.toggle("flou", window.scrollY > 40);
        if (boutonHaut) boutonHaut.classList.toggle("visible", window.scrollY > 500);
      },
      { passive: true }
    );
    if (boutonHaut) boutonHaut.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  document.addEventListener("DOMContentLoaded", () => {
    initEspace();
    initParametres();
    initMenuMobile();
    initFavoris();
    initRevelationScroll();
    initQuiz();
    initDefilement();
  });

  // Les cartes "produits similaires" arrivent après le premier rendu (page détail) :
  document.addEventListener("mp-catalogue-pret", rendreTout);
})();
