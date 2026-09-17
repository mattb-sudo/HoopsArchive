/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Les visuels de cartes sont generes localement (CSS/SVG), mais les photos
  // personnelles viennent de Supabase Storage via des URL signees : on active
  // l'optimisation Next (redimensionnement + formats modernes + lazy loading
  // via next/image) pour elles, indispensable des qu'il y a beaucoup de
  // photos en base.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
};

export default nextConfig;
