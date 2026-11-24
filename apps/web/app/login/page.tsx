"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { Logo } from "@/app/components/ui/Logo";
import { ThemeToggle } from "@/app/components/ui/ThemeToggle";

function LoginContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const handleOAuth = (provider: "google" | "github") => {
    setLoadingProvider(provider);
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  const getErrorMessage = () => {
    if (!errorParam) return null;
    if (errorParam === "OAuthCallback" || errorParam === "OAuthSignin") {
      return "Authentication could not be completed with the provider. Please try again.";
    }
    if (errorParam === "AccessDenied") {
      return "Access was denied. Please approve the permissions to continue.";
    }
    return "Sign-in failed. Please try again or use another account.";
  };

  if (status === "authenticated" || status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const errorMessage = getErrorMessage();

  return (
    <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      {/* Background subtle ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[360px] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle at center, color-mix(in srgb, var(--primary) 12%, transparent) 0%, transparent 70%)"
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block mb-4" aria-label="BuildFlow Home">
            <Logo variant="nav" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Welcome to BuildFlow</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            Connect and automate your workflows across Webhooks, Google Sheets, and Gmail.
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-destructive" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Social Sign In */}
          <div className="space-y-3">
            <button
              type="button"
              disabled={!!loadingProvider}
              onClick={() => handleOAuth("google")}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-card border border-border hover:bg-secondary active:scale-[0.99] text-foreground font-semibold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingProvider === "google" ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              disabled={!!loadingProvider}
              onClick={() => handleOAuth("github")}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-secondary border border-border hover:bg-muted active:scale-[0.99] text-foreground font-semibold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingProvider === "github" ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <svg className="w-4 h-4 fill-current text-foreground" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              )}
              <span>Continue with GitHub</span>
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to BuildFlow's Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
