import { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@workspace/ui/globals.css";
import { Toaster } from "sonner";
import { Providers } from "./components/providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BuildFlow — Visual Workflow Automation Platform",
  description: "Connect APIs, build visual logic flows, and automate work seamlessly.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased selection:bg-primary/20 selection:text-primary font-sans" suppressHydrationWarning>
        <Providers>
          <Toaster
            position="top-right"
            theme="system"
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
