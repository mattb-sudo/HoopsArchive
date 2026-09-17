/**
 * Petit trait decoratif en forme de couture de ballon de basket : remplace
 * les barres/rectangles classiques sous les titres par quelque chose de plus
 * "objet physique" et fidele a l'univers de la collection.
 */
export default function SeamDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 14"
      className={`h-3 w-full max-w-[170px] ${className}`}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path
        d="M2 4 C 38 13, 76 13, 108 6 C 140 -1, 180 -1, 218 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="1 7"
        strokeLinecap="round"
      />
    </svg>
  );
}
