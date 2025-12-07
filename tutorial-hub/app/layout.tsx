import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CarouselNav } from "./components";

const basePath = process.env.NODE_ENV === "production" ? "/TutorialHub" : "";


const pjsFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: "Tutorial Hub",
  description: "Ukv Blog, Tech Blog, porfolio",
  manifest: `${basePath}/site.webmanifest`,
  icons: {
    icon: `${basePath}/favicon.ico`,
    apple: `${basePath}/apple-touch-icon.png`,
    shortcut: `${basePath}/favicon.ico`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pjsFont.className} antialiased`}>
        <CarouselNav />
        {children}
      </body>
    </html>
  );
}
