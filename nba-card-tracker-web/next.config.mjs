/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Aucune image distante n'est chargee : les visuels de cartes sont generes
  // localement (CSS/SVG) et les photos personnelles viennent de Supabase Storage
  // via des URL signees, servies par une balise <img> classique.
  images: { unoptimized: true },
};

export default nextConfig;
