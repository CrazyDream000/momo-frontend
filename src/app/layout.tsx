"use client";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Providers from "./providers";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

import { useMemo } from "react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "MOMO 2.0",
//   description: "SOLANA DeFi",

// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <Providers>
          <Header />

          {children}
        </Providers>
      </body>
    </html>
  );
}
