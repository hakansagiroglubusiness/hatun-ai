import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://hatun-ai.hakansagiroglu-busin.chatgpt.site"),
  title: "Hatun — AI Creator Studio",
  description: "Tutarlı AI karakterleri, görselleri ve videoları tek üretim merkezinde oluştur.",
  icons: { icon: "/og-hatun.png", shortcut: "/og-hatun.png" },
  openGraph: {
    title: "Hatun — AI Creator Studio",
    description: "Karakterini oluştur. İçeriğini ölçekle.",
    images: ["/og-hatun.png"],
  },
  twitter: { card: "summary_large_image", images: ["/og-hatun.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body className={geist.variable}>{children}</body></html>;
}
