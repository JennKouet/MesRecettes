import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 : plus de seed automatique après une migration.
// Lancer explicitement avec `yarn db:seed`.
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL! }),
});

const TAGS = [
  // Type de plat
  { name: "Apéritif", kind: "COURSE" },
  { name: "Entrée", kind: "COURSE" },
  { name: "Plat", kind: "COURSE" },
  { name: "Accompagnement", kind: "COURSE" },
  { name: "Dessert", kind: "COURSE" },
  { name: "Petit-déjeuner", kind: "COURSE" },
  // Régime
  { name: "Végétarien", kind: "DIET" },
  { name: "Végan", kind: "DIET" },
  { name: "Sans gluten", kind: "DIET" },
  // Cuisine
  { name: "Française", kind: "CUISINE" },
  { name: "Italienne", kind: "CUISINE" },
  { name: "Asiatique", kind: "CUISINE" },
  { name: "Méditerranéenne", kind: "CUISINE" },
  // Divers
  { name: "Rapide", kind: "OTHER" },
  { name: "De saison", kind: "OTHER" },
  { name: "Batch cooking", kind: "OTHER" },
] as const;

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const RECIPES = [
  {
    title: "Tarte aux pommes de mamie",
    description:
      "La tarte du dimanche, celle qui embaume toute la maison.\nLa pâte se fait à la main, sans robot : c'est plus rapide qu'il n'y paraît.",
    servings: 6,
    prepMinutes: 30,
    cookMinutes: 40,
    difficulty: "FACILE",
    tags: ["Dessert", "Française"],
    ingredients: [
      { quantity: 250, unit: "G", name: "farine" },
      { quantity: 125, unit: "G", name: "beurre doux", note: "bien froid, en dés" },
      { quantity: 1, unit: "PINCEE", name: "sel" },
      { quantity: 6, unit: "CL", name: "eau glacée" },
      { quantity: 6, unit: "PIECE", name: "pommes", note: "reinettes de préférence" },
      { quantity: 2, unit: "CUILLERE_A_SOUPE", name: "sucre en poudre" },
      { quantity: 1, unit: "CUILLERE_A_CAFE", name: "cannelle moulue" },
      { quantity: 20, unit: "G", name: "beurre", note: "pour parsemer" },
    ],
    steps: [
      "Dans un saladier, mélanger la farine et le sel. Ajouter le beurre froid en dés et travailler du bout des doigts jusqu'à obtenir une texture sableuse.",
      "Ajouter l'eau glacée d'un coup, rassembler la pâte en boule sans la pétrir. Filmer et réserver 30 minutes au réfrigérateur.",
      "Préchauffer le four à 190 °C. Étaler la pâte et en foncer un moule de 28 cm. Piquer le fond à la fourchette.",
      "Éplucher les pommes, les couper en fines lamelles et les disposer en rosace sur le fond de tarte.",
      "Saupoudrer de sucre et de cannelle, parsemer de noisettes de beurre.",
      "Enfourner 40 minutes, jusqu'à ce que les bords soient dorés et les pommes légèrement caramélisées. Laisser tiédir avant de servir.",
    ],
  },
  {
    title: "Risotto aux champignons",
    description:
      "Un risotto crémeux sans crème : tout vient de l'amidon du riz et du beurre monté à la fin.\nLe bouillon doit rester chaud tout au long de la cuisson.",
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 25,
    difficulty: "MOYEN",
    tags: ["Plat", "Italienne", "Végétarien"],
    ingredients: [
      { quantity: 320, unit: "G", name: "riz arborio" },
      { quantity: 400, unit: "G", name: "champignons de Paris", note: "émincés" },
      { quantity: 1, unit: "PIECE", name: "oignon", note: "finement ciselé" },
      { quantity: 2, unit: "GOUSSE", name: "ail" },
      { quantity: 15, unit: "CL", name: "vin blanc sec" },
      { quantity: 1.2, unit: "L", name: "bouillon de légumes", note: "maintenu chaud" },
      { quantity: 60, unit: "G", name: "parmesan râpé" },
      { quantity: 40, unit: "G", name: "beurre", note: "bien froid" },
      { quantity: 2, unit: "CUILLERE_A_SOUPE", name: "huile d'olive" },
    ],
    steps: [
      "Faire revenir les champignons à feu vif dans une poêle avec un filet d'huile, jusqu'à ce qu'ils rendent leur eau et colorent. Réserver.",
      "Dans une sauteuse, faire suer l'oignon et l'ail dans le reste d'huile, sans coloration.",
      "Ajouter le riz et le nacrer 2 minutes, en remuant, jusqu'à ce qu'il devienne translucide sur les bords.",
      "Déglacer au vin blanc et laisser évaporer complètement.",
      "Ajouter le bouillon chaud louche par louche, en remuant, et en attendant que chaque louche soit absorbée avant la suivante. Compter environ 18 minutes.",
      "Hors du feu, incorporer les champignons, le parmesan et le beurre froid. Remuer vivement pour émulsionner, puis servir aussitôt.",
    ],
  },
  {
    title: "Soupe de potimarron au lait de coco",
    description:
      "Onctueuse, un peu sucrée, relevée par le gingembre.\nLe potimarron ne s'épluche pas : sa peau devient fondante à la cuisson.",
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 25,
    difficulty: "FACILE",
    tags: ["Entrée", "Végan", "Sans gluten", "De saison"],
    ingredients: [
      { quantity: 1, unit: "PIECE", name: "potimarron", note: "environ 1 kg" },
      { quantity: 1, unit: "PIECE", name: "oignon" },
      { quantity: 2, unit: "TRANCHE", name: "gingembre frais" },
      { quantity: 40, unit: "CL", name: "lait de coco" },
      { quantity: 50, unit: "CL", name: "bouillon de légumes" },
      { quantity: 1, unit: "CUILLERE_A_SOUPE", name: "huile d'olive" },
      { quantity: 1, unit: "PINCEE", name: "sel" },
    ],
    steps: [
      "Laver le potimarron, le couper en deux, retirer les graines et le détailler en gros cubes. Inutile de l'éplucher.",
      "Faire revenir l'oignon émincé et le gingembre dans l'huile pendant 3 minutes.",
      "Ajouter les cubes de potimarron et le bouillon. Porter à ébullition puis laisser mijoter 20 minutes à couvert.",
      "Verser le lait de coco, saler, puis mixer finement jusqu'à obtenir une texture veloutée.",
      "Rectifier l'assaisonnement et servir bien chaud, avec un filet de lait de coco en surface.",
    ],
  },
] as const;

/**
 * Le seed fait deux choses très différentes :
 *
 *  - les TAGS sont des données de référence. Sans eux, les catégories du
 *    formulaire de recette et les filtres de la liste sont vides : il faut les
 *    poser partout, production comprise. L'upsert les rend rejouables sans
 *    doublon.
 *
 *  - le compte de démonstration et ses recettes sont du contenu d'exemple. Son
 *    mot de passe est en clair dans ce fichier versionné : le créer en
 *    production ouvrirait un compte utilisable par quiconque lit le dépôt.
 *
 * D'où le défaut sûr : seuls les tags sont posés, et le contenu de démonstration
 * exige un SEED_DEMO=1 explicite.
 */
const withDemoContent = process.env.SEED_DEMO === "1";

async function main() {
  console.log("Seed — début");

  for (const tag of TAGS) {
    const slug = slugify(tag.name);
    await db.tag.upsert({
      where: { slug },
      update: { name: tag.name, kind: tag.kind },
      create: { slug, name: tag.name, kind: tag.kind },
    });
  }
  console.log(`  ${TAGS.length} tags`);

  if (!withDemoContent) {
    console.log(
      "  contenu de démonstration ignoré (SEED_DEMO=1 pour l'inclure en local)",
    );
    console.log("Seed — terminé");
    return;
  }

  // Utilisateur de démonstration.
  const demo = await db.user.upsert({
    where: { email: "demo@mesrecettes.local" },
    update: {},
    create: {
      email: "demo@mesrecettes.local",
      name: "Cuisine de démo",
      passwordHash: await bcrypt.hash("demo-motdepasse-2026", 12),
    },
  });
  console.log(`  utilisateur ${demo.email}`);

  for (const recipe of RECIPES) {
    const slug = slugify(recipe.title);

    // On repart de zéro pour chaque recette de démo : les collections ordonnées
    // sont remplacées en bloc, comme dans les Server Actions.
    await db.recipe.deleteMany({ where: { slug } });

    const tagIds = await db.tag.findMany({
      where: { name: { in: [...recipe.tags] } },
      select: { id: true },
    });

    await db.recipe.create({
      data: {
        slug,
        title: recipe.title,
        description: recipe.description,
        servings: recipe.servings,
        prepMinutes: recipe.prepMinutes,
        cookMinutes: recipe.cookMinutes,
        difficulty: recipe.difficulty,
        authorId: demo.id,
        ingredients: {
          create: recipe.ingredients.map((ingredient, position) => ({
            position,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            name: ingredient.name,
            note: "note" in ingredient ? ingredient.note : null,
          })),
        },
        steps: {
          create: recipe.steps.map((content, position) => ({ position, content })),
        },
        tags: {
          create: tagIds.map(({ id }) => ({ tagId: id })),
        },
      },
    });
  }
  console.log(`  ${RECIPES.length} recettes`);

  console.log("Seed — terminé");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
