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
  icons: [
    { url: "/images/logos/favicon-16x16.png", sizes: "16x16" },
    { url: "/images/logos/favicon-32x32.png", sizes: "32x32" },
    { rel: "apple-touch-icon", url: "/images/logos/apple-touch-icon.png" },
    { rel: "apple-touch-icon", url: "/images/logos/apple-touch-icon.png" },
  ],
  openGraph: {
    type: "website",
    url: "https://beta.superlend.xyz/",
    title: "Superlend",
    description: "All in one aggregator platform for your lending and borrowing needs.",
    siteName: "Superlend",
    images: [{
      url: "https://beta.superlend.xyz/og.png",
    }],
  }
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
