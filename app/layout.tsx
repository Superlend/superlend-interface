import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import Header from "@/components/Header";
import ContextProvider from "@/context";
import Footer from "@/components/Footer";
import { GoogleTagManager } from '@next/third-parties/google'
import ScrollToTop from "@/components/ScrollToTop";
// import { Inter } from "next/font/google";

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Superlend",
  description: "All in one aggregator platform for your lending and borrowing needs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookies = headers().get('cookie')
  const GTM_ID = process.env.NEXT_GTM_ID || "";

  return (
    <html lang="en">
      <body className={`bg-[#B4E2FB]`}>
        <ScrollToTop />
        <GoogleTagManager gtmId={GTM_ID} />
        <ContextProvider cookies={cookies}>
          <Header />
          {children}
          <Footer />
        </ContextProvider>
      </body>
    </html>
  );
}
