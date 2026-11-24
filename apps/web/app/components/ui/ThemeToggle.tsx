"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg border border-border bg-card" />
    );
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-9 h-9 rounded-lg border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-colors shadow-xs cursor-pointer"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-warning" />
      ) : (
        <Moon className="w-4 h-4 text-muted-foreground" />
      )}
    </motion.button>
  );
}
