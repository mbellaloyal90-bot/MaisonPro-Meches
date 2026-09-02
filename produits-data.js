/* =========================================================
   MaisonPro Mèches — produits-data.js
   Catalogue centralisé : une seule source de vérité pour
   la grille de la boutique et les pages détail produit.
   ========================================================= */

const PRODUITS = [
  {
    id: "balayage-dore-ondule",
    nom: "Balayage Doré Ondulé",
    prix: 26000,
    image: "images/balayage-dore-ondule.jpg",
    badge: "Naturel",
    longueur: "14 pouces",
    texture: "Ondulé",
    description:
      "Un balayage doré tout en douceur, qui part de racines brunes pour s'éclaircir progressivement vers des pointes blondes lumineuses. Idéal pour un effet naturel, comme si le soleil avait fait le travail lui-même.",
  },
  {
    id: "chatain-balayage-caramel",
    nom: "Châtain Balayage Caramel",
    prix: 30000,
    image: "images/chatain-balayage-caramel.jpg",
    badge: "Naturel",
    longueur: "16 pouces",
    texture: "Ondulé",
    description:
      "Une base châtain réchauffée par des reflets caramel, pour un mouvement subtil qui structure le visage sans dénaturer une couleur naturelle. Un classique intemporel.",
  },
  {
    id: "blond-cendre-boucle",
    nom: "Blond Cendré Bouclé",
    prix: 45000,
    image: "images/blond-cendre-boucle.jpg",
    badge: "Naturel · Premium",
    longueur: "18 pouces",
    texture: "Bouclé",
    description:
      "Un blond cendré généreux en volume et en boucles, pour un effet glamour immédiat. Cheveux naturels haut de gamme, sélectionnés pour leur brillance et leur tenue de boucle dans la durée.",
  },
  {
    id: "ondule-miel-ensoleille",
    nom: "Ondulé Miel Ensoleillé",
    prix: 28000,
    image: "images/ondule-miel-ensoleille.jpg",
    badge: "Naturel",
    longueur: "16 pouces",
    texture: "Ondulé",
    description:
      "Des tons miel chauds qui illuminent des racines plus foncées, avec des ondulations souples du début à la fin. Un look lumineux, facile à porter au quotidien.",
  },
  {
    id: "roux-cuivre-glamour",
    nom: "Roux Cuivré Glamour",
    prix: 42000,
    image: "images/roux-cuivre-glamour.jpg",
    badge: "Naturel · Premium",
    longueur: "18 pouces",
    texture: "Bouclé souple",
    description:
      "Un roux cuivré éclatant, coiffé en larges boucles brillantes. Un choix audacieux pour celles qui veulent un changement de style qui ne passe pas inaperçu.",
  },
  {
    id: "blond-platine-lisse",
    nom: "Blond Platiné Lisse",
    prix: 48000,
    image: "images/blond-platine-lisse.jpg",
    badge: "Naturel · Premium",
    longueur: "20 pouces",
    texture: "Lisse",
    description:
      "Un blond platine impeccablement lisse, avec des racines dégradées pour un rendu haut de gamme. Un travail de coloration délicat qui demande des cheveux de qualité premium.",
  },
  {
    id: "carre-plongeant-brun",
    nom: "Carré Plongeant Brun",
    prix: 20000,
    image: "images/carre-plongeant-brun.jpg",
    badge: "Naturel",
    longueur: "10 pouces",
    texture: "Lisse, coupe courte",
    description:
      "Un carré plongeant brun avec de fins reflets, parfait pour ajouter du volume et de la densité à une coupe courte sans perdre en légèreté.",
  },
  {
    id: "chatain-clair-ondule",
    nom: "Châtain Clair Ondulé",
    prix: 27000,
    image: "images/chatain-clair-ondule.jpg",
    badge: "Naturel",
    longueur: "16 pouces",
    texture: "Ondulé",
    description:
      "Un châtain clair discret, rehaussé de mèches fines couleur miel, coiffé en ondulations souples. Un ajout naturel qui se fond facilement dans une chevelure existante.",
  },
];

if (typeof module !== "undefined") module.exports = PRODUITS;
