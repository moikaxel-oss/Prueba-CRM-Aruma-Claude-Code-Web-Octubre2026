import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan de marketing · Aruma & Soft Line",
  description: "Calendario de contenido orgánico y Meta Ads",
};

const FONTS =
  "https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@400;500;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&family=Sora:wght@600;700;800&display=swap";

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={FONTS} />
      {children}
    </>
  );
}
