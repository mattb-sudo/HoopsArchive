/**
 * Grain/bruit CSS pur (SVG encode en data URI), sans aucune image externe ni
 * requete reseau. Applique en overlay a faible opacite sur les visuels
 * generes pour casser l'effet "dégradé plat" trop lisse/synthétique.
 */
export const NOISE_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
