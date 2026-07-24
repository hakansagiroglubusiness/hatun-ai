import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The AI Model Lab — AI Model Factory",
  description: "Build and scale hyper-realistic AI influencers with a 100% consistent face.",
  icons: { icon: "/assets/logo.png", shortcut: "/assets/logo.png" },
  openGraph: {
    title: "The AI Model Lab — AI Model Factory",
    description: "Build and scale AI models that earn on Fanvue.",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={geist.variable}>{children}</body></html>;
}
