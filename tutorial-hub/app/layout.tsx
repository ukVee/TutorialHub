import type { Metadata } from "next";
import { Fira_Code, Fira_Mono } from "next/font/google";
import "./globals.css";
import { CarouselNav } from "./components";

const firacode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fira'
})

const firamono = Fira_Mono({
  weight: ['400', '500', '700'],
  variable: '--font-fira-mono'
})

export const metadata: Metadata = {
  title: "Tutorial Hub",
  description: "Ukv Blog, Tech Blog, porfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${firacode.variable} ${firamono.variable} antialiased`}
      >
        <CarouselNav />
        {children}
      </body>
    </html>
  );
}
