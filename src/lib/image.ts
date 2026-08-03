import "server-only";

import sharp from "sharp";

/**
 * Traitement des photos de recettes, côté serveur.
 *
 * Le composant client réduit déjà l'image avant l'envoi, mais c'est une
 * commodité, pas une protection : n'importe qui peut poster ce qu'il veut à la
 * Server Action. Tout ce qui compte vraiment se passe ici.
 *
 * On ne se fie ni au nom de fichier ni au type MIME déclaré — les deux sont
 * fournis par le client. C'est `sharp` qui tranche : s'il n'arrive pas à
 * décoder les octets comme une image, l'entrée est rejetée.
 */

/** Plafond avant décodage, pour ne pas faire exploser la mémoire de la fonction. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Largeur maximale conservée. Au-delà, une photo de recette n'apporte rien. */
const MAX_WIDTH = 1600;

/** Formats acceptés, déterminés par le décodeur et non par le nom du fichier. */
const ALLOWED_FORMATS = new Set(["jpeg", "jpg", "png", "webp", "avif", "heif"]);

export class InvalidImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidImageError";
  }
}

export type ProcessedImage = {
  data: Buffer;
  contentType: "image/webp";
  extension: "webp";
};

/**
 * Décode, redimensionne et ré-encode en WebP.
 *
 * Le ré-encodage systématique est délibéré : il garantit que ce qui part sur
 * Blob est bien une image et rien d'autre. Un fichier piégé — SVG contenant du
 * script, polyglotte image/HTML, métadonnées EXIF indiscrètes — ne survit pas à
 * un aller-retour par le décodeur.
 */
export async function processRecipeImage(file: File): Promise<ProcessedImage> {
  if (file.size === 0) {
    throw new InvalidImageError("Le fichier est vide.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new InvalidImageError(
      `Image trop lourde (${Math.round(file.size / 1024 / 1024)} Mo). Maximum 4 Mo.`,
    );
  }

  const input = Buffer.from(await file.arrayBuffer());

  let pipeline: sharp.Sharp;
  let metadata: sharp.Metadata;
  try {
    // `animated: false` : on ne garde que la première image d'un GIF animé,
    // pour ne pas ré-encoder des centaines de frames.
    pipeline = sharp(input, { animated: false });
    metadata = await pipeline.metadata();
  } catch {
    throw new InvalidImageError("Ce fichier n'est pas une image reconnue.");
  }

  if (!metadata.width || !metadata.height) {
    throw new InvalidImageError("Ce fichier n'est pas une image reconnue.");
  }

  // Liste blanche de formats, plutôt qu'une liste noire.
  //
  // Le SVG est notamment exclu : sharp sait le rasteriser — le script qu'il
  // contiendrait ne survivrait donc pas au ré-encodage — mais le décoder fait
  // passer les octets par librsvg, qui peut suivre des références externes.
  // Aucune photo de recette n'a de raison d'être un SVG.
  if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
    throw new InvalidImageError(
      "Format non pris en charge. Utilisez un JPEG, un PNG ou un WebP.",
    );
  }

  // Garde-fou anti « bombe de décompression » : une image minuscule à l'octet
  // peut se décoder en centaines de mégapixels et saturer la fonction.
  const megapixels = (metadata.width * metadata.height) / 1_000_000;
  if (megapixels > 50) {
    throw new InvalidImageError("Image trop grande (plus de 50 mégapixels).");
  }

  const data = await pipeline
    .rotate() // applique l'orientation EXIF avant de la perdre au ré-encodage
    .resize({
      width: MAX_WIDTH,
      // N'agrandit jamais une petite image : ça ne ferait qu'alourdir le fichier.
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: 80 })
    .toBuffer();

  return { data, contentType: "image/webp", extension: "webp" };
}
