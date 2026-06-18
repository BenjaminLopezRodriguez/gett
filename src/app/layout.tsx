import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Inter, Figtree } from "next/font/google";

import { DirectionProvider } from "@/components/ui/direction";
import { TRPCReactProvider } from "@/trpc/react";
import { cn } from "@/lib/utils";

const figtreeHeading = Figtree({subsets:['latin'],variable:'--font-heading'});
const inter = Inter({subsets:['latin'],variable:'--font-sans'});
const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "gett — Medical paperwork, handled.",
  description:
    "Benefits, medical leave, accommodations, and compliance — guided in one place.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      // dir="rtl"
      className={cn(geist.variable, inter.variable, figtreeHeading.variable, "font-sans")}
    >
      <body className={geist.className}>
        <DirectionProvider dir="rtl">
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}
