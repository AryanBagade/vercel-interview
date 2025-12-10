import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "WordFinder | Smart Autocomplete Search",
  description: "Lightning-fast autocomplete search across 438,000+ English words. Built with Next.js and TypeScript.",
  keywords: ["autocomplete", "dictionary", "word search", "english words"],
  authors: [{ name: "WordFinder" }],
  openGraph: {
    title: "WordFinder | Smart Autocomplete Search",
    description: "Lightning-fast autocomplete search across 438,000+ English words",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} ${jetbrainsMono.variable} antialiased min-h-screen bg-[#0a0a0f]`}>
        {children}
      </body>
    </html>
  );
}
