import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConfigureAmplifyClientSide from "@/components/ConfigureAmplify";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CourtLink",
  description: "Premium Court Reservation System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfigureAmplifyClientSide />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
