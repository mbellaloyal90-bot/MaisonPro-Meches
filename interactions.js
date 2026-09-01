/* =========================================================
   MaisonPro Mèches — interactions.js
   Confort moderne : thème sombre, menu mobile, favoris,
   notifications toast, révélation au scroll, quiz "Trouve
   ta teinte", boutons flottants.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- 1. Thème sombre / paramètres ---------- */
  const PREF_THEME = "maisonpro-theme";
  const PREF_ANIM = "maisonpro-animations";

  function appliquerTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(PREF_THEME, theme);
    const cases = document.querySelectorAll(".theme-switch input");
    cases.forEach((c) => (c.checked = theme === "sombre"));
  }

  function appliquerAnimations(actives) {
    document.documentElement.setAttribute("data-anim", actives ? "on" : "off");
    localStorage.setItem(PREF_ANIM, actives ? "on" : "off");
    const cases = document.querySelectorAll(".anim-switch input");
    cases.forEach((c) => (c.checked = actives));
  }

  function initParametres() {
    const themeSauvegarde = localStorage.getItem(PREF_THEME) || "clair";
    const animSauvegarde = localStorage.getItem(PREF_ANIM) !== "off";
    appliquerTheme(themeSauvegarde);
    appliquerAnimations(animSauvegarde);

    const bouton = document.getElementById("settings-toggle");
    const panneau = document.getElementById("settings-panel");
    const fermer = document.getElementById("settings-close");
    const overlay = document.getElementById("settings-overlay");

    if (bouton) bouton.addEventListener("click", () => panneau.classList.add("ouvert"));
    if (fermer) fermer.addEventListener("click", () => panneau.classList.remove("ouvert"));
    if (overlay) overlay.addEventListener("click", () => panneau.classList.remove("ouvert"));

    document.querySelectorAll(".theme-switch input").forEach((c) => {
      c.addEventListener("change", (e) => appliquerTheme(e.target.checked ? "sombre" : "clair"));
    });
    document.querySelectorAll(".anim-switch input").forEach((c) => {
      c.addEventListener("change", (e) => appliquerAnimations(e.target.checked));
    });
  }

  /* ---------- 2. Menu mobile ---------- */
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

  /* ---------- 3. Notifications toast ---------- */
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

  // Se greffe sur les clics "Ajouter au panier" déjà gérés par script.js,
  // sans modifier ce fichier — juste une notification en plus.
  document.addEventListener("click", (e) => {
    const bouton = e.target.closest(".btn-ajouter");
    if (bouton && bouton.closest(".produit-carte")) {
      const nom = bouton.closest(".produit-carte").dataset.nom;
      toast(`${nom} ajouté au panier`, "🛍️");
    }
  });

  /* ---------- 4. Favoris ---------- */
  const CLE_FAVORIS = "maisonpro-favoris";

  function chargerFavoris() {
    try {
      return JSON.parse(localStorage.getItem(CLE_FAVORIS)) || [];
    } catch (e) {
      return [];
    }
  }

  function sauvegarderFavoris(liste) {
    localStorage.setItem(CLE_FAVORIS, JSON.stringify(liste));
  }

  function rendreFavoris() {
    let favoris = chargerFavoris();
    const compteur = document.getElementById("wishlist-count");
    if (compteur) compteur.textContent = favoris.length;

    document.querySelectorAll(".btn-favori").forEach((btn) => {
      const carte = btn.closest(".produit-carte");
      const id = carte ? carte.dataset.id : null;
      btn.classList.toggle("aime", favoris.includes(id));
    });
  }

  function initFavoris() {
    rendreFavoris();

    document.querySelectorAll(".btn-favori").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const carte = btn.closest(".produit-carte");
        const id = carte.dataset.id;
        const nom = carte.dataset.nom;
        let favoris = chargerFavoris();

        if (favoris.includes(id)) {
          favoris = favoris.filter((f) => f !== id);
          toast(`${nom} retiré des favoris`, "💔");
        } else {
          favoris.push(id);
          toast(`${nom} ajouté aux favoris`, "❤️");
        }
        sauvegarderFavoris(favoris);
        rendreFavoris();
      });
    });

    const boutonFavoris = document.getElementById("wishlist-toggle");
    if (boutonFavoris) {
      boutonFavoris.addEventListener("click", () => {
        const favoris = chargerFavoris();
        if (favoris.length === 0) {
          toast("Aucun favori pour le moment", "🤍");
          return;
        }
        const noms = favoris
          .map((id) => {
            const carte = document.querySelector(`.produit-carte[data-id="${id}"]`);
            return carte ? carte.dataset.nom : null;
          })
          .filter(Boolean);
        toast(noms.join(" · "), "❤️");
        document.getElementById("produits")?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }

  /* ---------- 5. Révélation au scroll ---------- */
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

  /* ---------- 6. Quiz "Trouve ta teinte" ---------- */
  const REPONSES_QUIZ = {};
  const RESULTATS_QUIZ = {
    "blond-lumineux": {
      id: "balayage-dore-ondule",
      texte: "Le Balayage Doré Ondulé va sublimer ta base claire avec un effet lumineux tout en douceur.",
    },
    "blond-glamour": {
      id: "blond-cendre-boucle",
      texte: "Le Blond Cendré Bouclé apporte le volume et l'éclat glamour que tu recherches.",
    },
    "brun-subtil": {
      id: "chatain-balayage-caramel",
      texte: "Le Châtain Balayage Caramel ajoute de la lumière à ta couleur sans la dénaturer.",
    },
    "brun-lumineux": {
      id: "balayage-dore-ondule",
      texte: "Le Balayage Doré Ondulé crée un beau contraste chaleureux avec des cheveux foncés.",
    },
    "brun-glamour": {
      id: "blond-cendre-boucle",
      texte: "Le Blond Cendré Bouclé pour un changement de style marquant et sophistiqué.",
    },
    "noir-subtil": {
      id: "chatain-balayage-caramel",
      texte: "Le Châtain Balayage Caramel, en pointes, apporte une touche de lumière discrète.",
    },
    "noir-lumineux": {
      id: "balayage-dore-ondule",
      texte: "Le Balayage Doré Ondulé pour un contraste doré spectaculaire sur base foncée.",
    },
    "noir-glamour": {
      id: "blond-cendre-boucle",
      texte: "Le Blond Cendré Bouclé pour un changement radical et glamour.",
    },
  };

  function initQuiz() {
    const quiz = document.getElementById("quiz");
    if (!quiz) return;

    const etapes = quiz.querySelectorAll(".quiz-etape");
    const resultat = document.getElementById("quiz-resultat");

    quiz.querySelectorAll(".quiz-option").forEach((option) => {
      option.addEventListener("click", () => {
        const etapeActuelle = option.closest(".quiz-etape");
        const cle = etapeActuelle.dataset.cle;
        REPONSES_QUIZ[cle] = option.dataset.valeur;

        etapeActuelle.classList.remove("active");
        const indexSuivant = Array.from(etapes).indexOf(etapeActuelle) + 1;

        if (indexSuivant < etapes.length) {
          etapes[indexSuivant].classList.add("active");
        } else {
          afficherResultatQuiz();
        }
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
      const cleResultat = `${REPONSES_QUIZ.base}-${REPONSES_QUIZ.envie}`;
      const reco = RESULTATS_QUIZ[cleResultat] || RESULTATS_QUIZ["brun-subtil"];
      const carteProduit = document.querySelector(`.produit-carte[data-id="${reco.id}"]`);

      resultat.querySelector(".quiz-resultat-texte").textContent = reco.texte;
      const image = resultat.querySelector(".quiz-resultat-image");
      if (image && carteProduit) image.src = carteProduit.dataset.image;

      const lienVoir = resultat.querySelector(".quiz-resultat-lien");
      if (lienVoir) {
        lienVoir.onclick = () => {
          carteProduit?.scrollIntoView({ behavior: "smooth", block: "center" });
          carteProduit?.classList.add("mise-en-avant");
          setTimeout(() => carteProduit?.classList.remove("mise-en-avant"), 1800);
        };
      }

      resultat.classList.add("active");
    }
  }

  /* ---------- 7. En-tête flouté au défilement + boutons flottants ---------- */
  function initDefilement() {
    const header = document.querySelector(".site-header");
    const boutonHaut = document.getElementById("back-to-top");

    window.addEventListener(
      "scroll",
      () => {
        const descendu = window.scrollY > 40;
        if (header) header.classList.toggle("flou", descendu);
        if (boutonHaut) boutonHaut.classList.toggle("visible", window.scrollY > 500);
      },
      { passive: true }
    );

    if (boutonHaut) {
      boutonHaut.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
  }

  /* ---------- Initialisation ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    initParametres();
    initMenuMobile();
    initFavoris();
    initRevelationScroll();
    initQuiz();
    initDefilement();
  });
})();
