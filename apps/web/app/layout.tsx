import { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@workspace/ui/globals.css";
import { Toaster } from "sonner";
import { Providers } from "./components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BuildFlow — Visual Workflow Automation Platform",
  description: "Connect APIs, build visual logic flows, and automate work seamlessly.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-[#0f1012] text-[#f9fafb] antialiased selection:bg-indigo-500/20 selection:text-indigo-400 font-sans" suppressHydrationWarning>
        <Providers>
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "#18191c",
                border: "1px solid #27282d",
                color: "#f9fafb",
              },
            }}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}
