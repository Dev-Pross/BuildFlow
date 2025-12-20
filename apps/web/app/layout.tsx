import { ReactNode } from "react";
import "@workspace/ui/globals.css"
import { Toaster } from "sonner";
import { Providers } from "./components/providers";
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
        <Toaster position="top-right" />
        {children}
        </Providers>
      </body>
    </html>
  );
}
