import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MCFC Master Dashboard",
  description: "Melbourne City FC — Marketing Performance Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full" style={{ background: "#1e3338" }}>
        <Sidebar />
        <main className="ml-[140px] min-h-screen">{children}</main>
      </body>
    </html>
  );
}
