import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { getWeddingConfig } from "@/lib/services/config-service";
import { extractFirstName } from "@/lib/utils/section-adapter";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  fallback: ["Georgia", "serif"],
  adjustFontFallback: false,
  display: "optional",
  preload: false,
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  fallback: ["Georgia", "serif"],
  adjustFontFallback: false,
  display: "optional",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getWeddingConfig()
  const brideName = extractFirstName(config.bride_name) || 'Bride'
  const groomName = extractFirstName(config.groom_name) || 'Groom'
  const title = `Undangan Pernikahan ${brideName} & ${groomName}`
  
  return {
    title,
    description: "Dengan penuh kebahagiaan kami mengundang Anda untuk hadir dan merayakan hari istimewa kami.",
    keywords: ["pernikahan", "undangan", "wedding", "undangan pernikahan"],
    openGraph: {
      title,
      description: "Dengan penuh kebahagiaan kami mengundang Anda untuk hadir dan merayakan hari istimewa kami.",
      type: "website",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${playfair.variable} ${cormorant.variable} font-serif antialiased`}
      >
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
