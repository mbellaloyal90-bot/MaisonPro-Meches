(function () {
  "use strict";
  const PROPRIETAIRES = ["mbellaloyal90@gmail.com", "maisonprocontact@gmail.com", "mbjjaures@gmail.com"];
  const SEUIL = 3, db = firebase.firestore(); let stock = {}, mouvements = [];
  const estProprietaire = user => user && PROPRIETAIRES.includes(user.email);
  const qte = id => Math.max(0, Number(stock[id]?.quantite) || 0);
  const escape = value => String(value).replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
  function message(text, type = "") { const el = document.getElementById("stock-message"); el.textContent = text; el.className = `stock-message ${type}`; }
  function statut(value) { return value === 0 ? ["Rupture", "rupture"] : value <= SEUIL ? ["Stock bas", "bas"] : ["En stock", "ok"]; }
  function rendreResume() { const values = PRODUITS.map(p => qte(p.id)); const total = values.reduce((a, b) => a + b, 0), bas = values.filter(v => v > 0 && v <= SEUIL).length, rupture = values.filter(v => v === 0).length; document.getElementById("stock-resume").innerHTML = `<article><strong>${total}</strong><span>mèches disponibles</span></article><article><strong>${PRODUITS.length}</strong><span>références suivies</span></article><article class="stock-resume-alerte"><strong>${bas}</strong><span>stocks bas</span></article><article class="stock-resume-rupture"><strong>${rupture}</strong><span>ruptures</span></article>`; }
  function rendreListe() {
    const zone = document.getElementById("stock-liste"), terme = document.getElementById("stock-recherche").value.trim().toLowerCase();
    const produits = PRODUITS.filter(p => `${p.nom} ${p.texture} ${p.longueur}`.toLowerCase().includes(terme));
    zone.innerHTML = produits.length ? produits.map(p => { const value = qte(p.id), [label, state] = statut(value); return `<article class="stock-produit" data-id="${p.id}"><img src="${p.image}" alt="${escape(p.nom)}"><div class="stock-produit-info"><h2>${escape(p.nom)}</h2><p>${p.longueur} · ${p.texture}</p><span class="stock-statut ${state}">${label}</span></div><div class="stock-controles"><label>Quantité <input type="number" min="0" inputmode="numeric" value="${value}" aria-label="Quantité de ${escape(p.nom)}"></label><div class="stock-actions"><button type="button" data-action="moins" aria-label="Retirer une unité">−</button><button type="button" data-action="sauver">Enregistrer</button><button type="button" data-action="plus" aria-label="Ajouter une unité">+</button></div></div></article>`; }).join("") : '<p class="stock-vide">Aucun produit ne correspond à ta recherche.</p>';
    zone.querySelectorAll(".stock-produit").forEach(card => { const product = PRODUITS.find(p => p.id === card.dataset.id), input = card.querySelector("input"); card.querySelector('[data-action="moins"]').onclick = () => modifier(product, -1); card.querySelector('[data-action="plus"]').onclick = () => modifier(product, 1); card.querySelector('[data-action="sauver"]').onclick = () => appliquer(product, input.value, "ajustement"); });
  }
  function rendreHistorique() { const zone = document.getElementById("stock-historique"); zone.innerHTML = mouvements.length ? mouvements.map(m => { const variation = Number(m.variation) || 0, date = m.creeLe?.toDate ? m.creeLe.toDate().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "À l’instant"; return `<div class="stock-mouvement"><span class="stock-mouvement-variation ${variation >= 0 ? "positif" : "negatif"}">${variation >= 0 ? "+" : ""}${variation}</span><div><strong>${escape(m.produitNom || m.produitId)}</strong><small>${date} · Stock après mouvement : ${m.quantiteApres}</small></div></div>`; }).join("") : '<p class="stock-vide">Aucun mouvement enregistré pour le moment.</p>'; }
  async function appliquer(product, cible, motif) {
    const ancienneQuantite = qte(product.id);
    const nouvelleQuantite = Math.max(0, Math.round(Number(cible) || 0));
    const variationLocale = nouvelleQuantite - ancienneQuantite;
    if (!variationLocale) return;

    stock[product.id] = { ...(stock[product.id] || {}), quantite: nouvelleQuantite };
    mouvements.unshift({ produitId: product.id, produitNom: product.nom, variation: variationLocale, quantiteApres: nouvelleQuantite });
    rendreResume();
    rendreListe();
    rendreHistorique();

    const ref = db.collection("inventaire").doc(product.id);
    try {
      await db.runTransaction(async tx => {
        const doc = await tx.get(ref);
        const ancienneQuantiteServeur = doc.exists ? Math.max(0, Number(doc.data().quantite) || 0) : 0;
        const variation = nouvelleQuantite - ancienneQuantiteServeur;
        if (!variation) return;
        tx.set(ref, { quantite: nouvelleQuantite, modifieLe: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        tx.set(db.collection("catalogueDisponibilite").doc(product.id), { disponible: nouvelleQuantite > 0, modifieLe: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        tx.set(db.collection("mouvementsStock").doc(), { produitId: product.id, produitNom: product.nom, variation, quantiteApres: nouvelleQuantite, motif, creeLe: firebase.firestore.FieldValue.serverTimestamp() });
      });
      message(`${product.nom} mis à jour.`, "succes");
    } catch (error) {
      stock[product.id] = { ...(stock[product.id] || {}), quantite: ancienneQuantite };
      mouvements.shift();
      rendreResume();
      rendreListe();
      rendreHistorique();
      message(`Impossible d’enregistrer : ${error.message}`, "erreur");
    }
  }
  function modifier(product, delta) { appliquer(product, qte(product.id) + delta, delta > 0 ? "entrée" : "sortie"); }
  async function initialiser() { if (!confirm("Initialiser les références à zéro ? Tu pourras ensuite saisir tes quantités.")) return; const batch = db.batch(); PRODUITS.forEach(p => { const value = qte(p.id); batch.set(db.collection("inventaire").doc(p.id), { quantite: value, modifieLe: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }); batch.set(db.collection("catalogueDisponibilite").doc(p.id), { disponible: value > 0, modifieLe: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }); }); try { await batch.commit(); message("Catalogue initialisé. Saisis maintenant tes quantités.", "succes"); } catch (error) { message(`Initialisation impossible : ${error.message}`, "erreur"); } }
  function ecouter() { db.collection("inventaire").onSnapshot(snap => { stock = {}; snap.forEach(doc => stock[doc.id] = doc.data()); rendreResume(); rendreListe(); }, error => message(`Accès au stock refusé : ${error.message}`, "erreur")); db.collection("mouvementsStock").orderBy("creeLe", "desc").limit(25).onSnapshot(snap => { mouvements = snap.docs.map(doc => doc.data()); rendreHistorique(); }, error => message(`Historique indisponible : ${error.message}`, "erreur")); }
  document.addEventListener("DOMContentLoaded", () => { document.getElementById("stock-connexion").onclick = () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); document.getElementById("stock-deconnexion").onclick = () => auth.signOut(); document.getElementById("stock-recherche").oninput = rendreListe; document.getElementById("stock-initialiser").onclick = initialiser; auth.onAuthStateChanged(user => { const lock = document.getElementById("stock-verrou"), content = document.getElementById("stock-contenu"), signout = document.getElementById("stock-deconnexion"); if (estProprietaire(user)) { lock.hidden = true; content.hidden = false; signout.hidden = false; ecouter(); } else { lock.hidden = false; content.hidden = true; signout.hidden = true; if (user) lock.querySelector("p").textContent = "Ce compte n’est pas autorisé à gérer le stock."; } }); });
})();
