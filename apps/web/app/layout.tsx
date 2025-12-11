import { ReactNode } from "react";
import "@workspace/ui/globals.css"
import { Toaster } from "sonner";
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
