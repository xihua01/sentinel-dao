import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from "../src/providers";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: '--font-mono' });

export const metadata: Metadata = {
  title: "Sentinel DAO | Treasury Firewall",
  description: "On-Chain DAO Security & Policy Engine powered by Arbitrum Stylus"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${mono.variable} font-sans bg-slate-950`}>
        <div className="fixed inset-0 bg-grid-pattern z-[-1]" /> {/* Background Grid */}
        <Providers>
          {children}
          <Toaster position="top-right" theme="dark" richColors /> {/* Setup Notifikasi */}
        </Providers>
      </body>
    </html>
  );
}