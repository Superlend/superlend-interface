import type { Metadata } from "next";
import { headers } from "next/headers"; // added
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ContextProvider from "@/context";

const inter = Inter({ subsets: ["latin"] });

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

  return (
    <html lang="en">
      <body className={`bg-[#B4E2FB] px-[20px]`}>
        <ContextProvider cookies={cookies}>
          <Header />
          {children}
        </ContextProvider>
      </body>
    </html>
  );
}
