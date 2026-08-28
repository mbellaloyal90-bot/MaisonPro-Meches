/* =========================================================
   MaisonPro Mèches — auth.js
   Authentification via Firebase : connexion Google et
   création de compte email/mot de passe. Nécessite les
   scripts Firebase SDK chargés avant ce fichier (voir
   index.html) et la config ci-dessous remplie avec tes
   propres clés (Firebase Console > Paramètres du projet).
   ========================================================= */

/* ---------- 1. Configuration ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyDGqOb9i4l6Ebs30WCOtQGGC6IFA3Jzxl0",
  authDomain: "maisonpro-meches.firebaseapp.com",
  projectId: "maisonpro-meches",
  storageBucket: "maisonpro-meches.firebasestorage.app",
  messagingSenderId: "637669819790",
  appId: "1:637669819790:web:0bd03290dbcd8e8e4950df",
  measurementId: "G-N5Z4MEY002",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

(function () {
  "use strict";

  const googleProvider = new firebase.auth.GoogleAuthProvider();

  /* ---------- 2. Connexion avec Google ---------- */
  function connexionGoogle() {
    auth.signInWithPopup(googleProvider).catch((erreur) => {
      afficherErreur(traduireErreur(erreur.code));
    });
  }

  /* ---------- 3. Création de compte par email/mot de passe ---------- */
  function creerCompteEmail(email, motDePasse, nom) {
    auth
      .createUserWithEmailAndPassword(email, motDePasse)
      .then((identifiants) => {
        // Enregistre le nom affiché sur le profil
        return identifiants.user.updateProfile({ displayName: nom });
      })
      .catch((erreur) => {
        afficherErreur(traduireErreur(erreur.code));
      });
  }

  /* ---------- 4. Connexion par email/mot de passe (compte existant) ---------- */
  function connexionEmail(email, motDePasse) {
    auth.signInWithEmailAndPassword(email, motDePasse).catch((erreur) => {
      afficherErreur(traduireErreur(erreur.code));
    });
  }

  /* ---------- 5. Déconnexion ---------- */
  function deconnexion() {
    auth.signOut();
  }

  /* ---------- 6. Messages d'erreur en français ---------- */
  function traduireErreur(code) {
    const messages = {
      "auth/email-already-in-use": "Cet email a déjà un compte. Essaie de te connecter à la place.",
      "auth/invalid-email": "L'adresse email n'est pas valide.",
      "auth/weak-password": "Le mot de passe doit faire au moins 6 caractères.",
      "auth/user-not-found": "Aucun compte ne correspond à cet email.",
      "auth/wrong-password": "Mot de passe incorrect.",
      "auth/popup-closed-by-user": "Fenêtre Google fermée avant la fin de la connexion.",
    };
    return messages[code] || "Une erreur est survenue. Réessaie.";
  }

  function afficherErreur(message) {
    const zone = document.getElementById("auth-erreur");
    if (zone) {
      zone.textContent = message;
      zone.style.display = "block";
    } else {
      alert(message);
    }
  }

  /* ---------- 7. Mise à jour de l'interface selon l'état de connexion ---------- */
  auth.onAuthStateChanged((utilisateur) => {
    const boutonCompte = document.getElementById("account-toggle");
    const modal = document.getElementById("auth-modal");
    const zoneConnecte = document.getElementById("auth-connecte");
    const zoneFormulaires = document.getElementById("auth-formulaires");
    const nomAffiche = document.getElementById("auth-nom-utilisateur");

    if (utilisateur) {
      if (boutonCompte) boutonCompte.textContent = "👤 " + (utilisateur.displayName || utilisateur.email.split("@")[0]);
      if (zoneConnecte) zoneConnecte.style.display = "block";
      if (zoneFormulaires) zoneFormulaires.style.display = "none";
      if (nomAffiche) nomAffiche.textContent = utilisateur.displayName || utilisateur.email;
      if (modal) modal.classList.remove("ouvert");
    } else {
      if (boutonCompte) boutonCompte.textContent = "👤 Mon compte";
      if (zoneConnecte) zoneConnecte.style.display = "none";
      if (zoneFormulaires) zoneFormulaires.style.display = "block";
    }
  });

  /* ---------- 8. Branchement des boutons/formulaires ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    const boutonCompte = document.getElementById("account-toggle");
    const modal = document.getElementById("auth-modal");
    const boutonFermer = document.getElementById("auth-close");
    const boutonGoogle = document.getElementById("btn-google");
    const boutonDeconnexion = document.getElementById("btn-deconnexion");
    const formulaireInscription = document.getElementById("form-inscription");
    const formulaireConnexion = document.getElementById("form-connexion");

    if (boutonCompte) {
      boutonCompte.addEventListener("click", () => {
        if (auth.currentUser) {
          modal.classList.toggle("ouvert");
        } else {
          modal.classList.add("ouvert");
        }
      });
    }
    if (boutonFermer) boutonFermer.addEventListener("click", () => modal.classList.remove("ouvert"));
    if (boutonGoogle) boutonGoogle.addEventListener("click", connexionGoogle);
    if (boutonDeconnexion) boutonDeconnexion.addEventListener("click", deconnexion);

    if (formulaireInscription) {
      formulaireInscription.addEventListener("submit", (e) => {
        e.preventDefault();
        const nom = document.getElementById("inscription-nom").value.trim();
        const email = document.getElementById("inscription-email").value.trim();
        const motDePasse = document.getElementById("inscription-motdepasse").value;
        creerCompteEmail(email, motDePasse, nom);
      });
    }

    if (formulaireConnexion) {
      formulaireConnexion.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("connexion-email").value.trim();
        const motDePasse = document.getElementById("connexion-motdepasse").value;
        connexionEmail(email, motDePasse);
      });
    }
  });
})();
