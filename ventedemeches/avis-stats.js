/* =========================================================
   MaisonPro Mèches — avis-stats.js
   Avis clients (Firestore, modérés) + statistiques réelles
   du site (visites, commandes, note moyenne).
   ========================================================= */

const db = firebase.firestore();

(function () {
  "use strict";

  function formaterPrix(nombre) {
    return nombre.toLocaleString("fr-FR").replace(/,/g, " ") + " FCFA";
  }

  function comptabiliserVisite() {
    if (sessionStorage.getItem("mp-visite-comptee")) return;
    sessionStorage.setItem("mp-visite-comptee", "1");
    db.collection("statistiques").doc("compteurs").set(
      { visites: firebase.firestore.FieldValue.increment(1) },
      { merge: true }
    ).catch(() => {});
  }

  function comptabiliserCommande() {
    db.collection("statistiques").doc("compteurs").set(
      { commandes: firebase.firestore.FieldValue.increment(1) },
      { merge: true }
    ).catch(() => {});
  }
  window.mpComptabiliserCommande = comptabiliserCommande;

  async function afficherStatistiques() {
    const zone = document.getElementById("stats-bar");
    if (!zone) return;
    try {
      const doc = await db.collection("statistiques").doc("compteurs").get();
      const donnees = doc.exists ? doc.data() : {};
      const visites = donnees.visites || 0;
      const commandes = donnees.commandes || 0;

      const avisApprouves = await db.collection("avis").where("statut", "==", "approuve").get();
      let total = 0, somme = 0;
      avisApprouves.forEach((d) => { somme += d.data().note; total++; });
      const moyenne = total > 0 ? (somme / total).toFixed(1) : null;

      zone.innerHTML = `
        <div class="stat-item"><strong>${visites}</strong><span>visites du site</span></div>
        <div class="stat-item"><strong>${commandes}</strong><span>commandes envoyées</span></div>
        <div class="stat-item"><strong>${moyenne ? moyenne + " ★" : "—"}</strong><span>${total} avis client${total > 1 ? "s" : ""}</span></div>
      `;
    } catch (e) {
      zone.innerHTML = "";
    }
  }

  async function chargerAvisProduit(produitId) {
    const zoneNote = document.getElementById("avis-note-moyenne");
    const zoneListe = document.getElementById("avis-liste");
    if (!zoneListe) return;

    zoneListe.innerHTML = '<p class="avis-chargement">Chargement des avis...</p>';

    try {
      const snap = await db.collection("avis")
        .where("produitId", "==", produitId)
        .where("statut", "==", "approuve")
        .get();

      const avis = [];
      snap.forEach((d) => avis.push(d.data()));
      avis.sort((a, b) => (b.dateCreation?.seconds || 0) - (a.dateCreation?.seconds || 0));

      if (zoneNote) {
        if (avis.length === 0) {
          zoneNote.textContent = "Aucun avis pour le moment — sois la première à en laisser un.";
        } else {
          const moyenne = (avis.reduce((s, a) => s + a.note, 0) / avis.length).toFixed(1);
          zoneNote.innerHTML = `<span class="avis-etoiles">${"★".repeat(Math.round(moyenne))}${"☆".repeat(5 - Math.round(moyenne))}</span> ${moyenne} / 5 · ${avis.length} avis`;
        }
      }

      zoneListe.innerHTML = avis.length === 0
        ? ""
        : avis.map((a) => `
          <div class="avis-carte">
            <div class="avis-entete">
              <span class="avis-etoiles">${"★".repeat(a.note)}${"☆".repeat(5 - a.note)}</span>
              <span class="avis-auteur">${a.nom || "Cliente"}</span>
            </div>
            <p>${a.commentaire}</p>
          </div>
        `).join("");
    } catch (e) {
      zoneListe.innerHTML = '<p class="avis-chargement">Impossible de charger les avis pour le moment.</p>';
    }
  }

  function initFormulaireAvis(produitId, produitNom) {
    const zoneConnecte = document.getElementById("avis-form-connecte");
    const zoneDeconnecte = document.getElementById("avis-form-deconnecte");
    const form = document.getElementById("form-avis");
    if (!form) return;

    function majEtatConnexion() {
      const connecte = !!window.mpUtilisateurConnecte;
      if (zoneConnecte) zoneConnecte.style.display = connecte ? "block" : "none";
      if (zoneDeconnecte) zoneDeconnecte.style.display = connecte ? "none" : "block";
    }
    majEtatConnexion();
    document.addEventListener("mp-auth-change", majEtatConnexion);

    let noteChoisie = 0;
    form.querySelectorAll(".avis-etoile-input").forEach((etoile, index) => {
      etoile.addEventListener("click", () => {
        noteChoisie = index + 1;
        form.querySelectorAll(".avis-etoile-input").forEach((e, i) => {
          e.textContent = i < noteChoisie ? "★" : "☆";
        });
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const utilisateur = window.mpUtilisateurConnecte;
      if (!utilisateur) return;
      if (noteChoisie === 0) {
        if (window.mpToast) window.mpToast("Choisis une note avant d'envoyer", "⚠️");
        return;
      }
      const commentaire = document.getElementById("avis-commentaire").value.trim();
      if (!commentaire) return;

      try {
        await db.collection("avis").add({
          produitId,
          produitNom,
          note: noteChoisie,
          commentaire,
          nom: utilisateur.displayName || utilisateur.email.split("@")[0],
          uid: utilisateur.uid,
          statut: "en_attente",
          dateCreation: firebase.firestore.FieldValue.serverTimestamp(),
        });
        form.reset();
        noteChoisie = 0;
        form.querySelectorAll(".avis-etoile-input").forEach((e) => (e.textContent = "☆"));
        if (window.mpToast) window.mpToast("Merci ! Ton avis sera visible après validation", "📝");
      } catch (err) {
        if (window.mpToast) window.mpToast("Erreur lors de l'envoi, réessaie", "⚠️");
      }
    });
  }

  window.mpInitAvisProduit = function (produitId, produitNom) {
    chargerAvisProduit(produitId);
    initFormulaireAvis(produitId, produitNom);
  };

  const SEUIL_FIDELITE = 5;

  async function enregistrerCommandeFidelite() {
    const utilisateur = window.mpUtilisateurConnecte;
    if (!utilisateur) return { compte: 0, reduction: false };
    const ref = db.collection("clients").doc(utilisateur.uid);
    try {
      await ref.set({ commandes: firebase.firestore.FieldValue.increment(1) }, { merge: true });
      const doc = await ref.get();
      const compte = (doc.data() && doc.data().commandes) || 1;
      return { compte, reduction: compte % SEUIL_FIDELITE === 0 };
    } catch (e) {
      return { compte: 0, reduction: false };
    }
  }
  window.mpEnregistrerCommandeFidelite = enregistrerCommandeFidelite;

  async function afficherProgressionFidelite() {
    const zone = document.getElementById("fidelite-info");
    if (!zone) return;
    if (!window.mpUtilisateurConnecte) { zone.textContent = ""; return; }
    try {
      const doc = await db.collection("clients").doc(window.mpUtilisateurConnecte.uid).get();
      const compte = (doc.exists && doc.data().commandes) || 0;
      const restant = SEUIL_FIDELITE - (compte % SEUIL_FIDELITE);
      zone.textContent = compte === 0
        ? `Passe ${SEUIL_FIDELITE} commandes pour obtenir -10% sur la suivante 🎁`
        : `${compte} commande${compte > 1 ? "s" : ""} passée${compte > 1 ? "s" : ""} · encore ${restant} avant ta prochaine réduction de 10% 🎁`;
    } catch (e) {
      zone.textContent = "";
    }
  }
  document.addEventListener("mp-auth-change", afficherProgressionFidelite);
  document.addEventListener("DOMContentLoaded", afficherProgressionFidelite);

  document.addEventListener("DOMContentLoaded", () => {
    comptabiliserVisite();
    afficherStatistiques();
  });
})();
