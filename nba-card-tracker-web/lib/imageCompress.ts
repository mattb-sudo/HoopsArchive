"use client";

/**
 * Redimensionne + recompresse une photo cote navigateur avant upload.
 *
 * Les photos prises au telephone pesent souvent plusieurs Mo (jusqu'a 10 Mo
 * acceptes par le serveur) alors qu'une carte affichee, meme en grand sur sa
 * fiche, ne depasse jamais quelques centaines de pixels de large. Sans ce
 * passage, le site devient lent des qu'on a plus que quelques photos : c'est
 * le principal levier pour que l'appli reste fluide avec une collection
 * entierement illustree.
 */
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

export async function compressImageFile(file: File): Promise<File> {
  // Rien a gagner sur un format deja vectoriel/non rasterisable.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    // Si la recompression ne fait pas gagner de place (deja tres compacte),
    // on garde l'original plutot que de perdre en qualite pour rien.
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^./\\]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    // Navigateur sans createImageBitmap/canvas fonctionnel (rare) : on
    // envoie l'original plutot que de bloquer l'ajout de la photo.
    return file;
  }
}
