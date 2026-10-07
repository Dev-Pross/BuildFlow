"use client";

import React, { useState } from 'react';
import Input from '../components/ui/Inputbox';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Workflow, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState({ email: "", password: "", auth: "" });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateEmail = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  };

  const loginHandler = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newErrors = { email: '', password: '', auth: '' };

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (Object.values(newErrors).some(err => err !== '')) {
      setError(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError({ ...newErrors, auth: "Invalid credentials" });
        toast.error("Invalid credentials");
      } else if (result?.ok) {
        toast.success("Login successful!");
        router.push('/workflows');
      }
    } catch {
      setError({ ...newErrors, auth: "Login failed. Please try again" });
      toast.error("Login failed. Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0f1012] flex items-center justify-center p-4 overflow-hidden">
      {/* Background subtle ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
            <div className="h-11 w-11 rounded-2xl bg-white text-black flex items-center justify-center group-hover:scale-105 transition-transform shadow-md">
              <Workflow className="h-6 w-6 text-black" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              BuildFlow
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-[#9ca3af] mt-1">Sign in to manage and run your automated flows</p>
        </div>

        <Card blur="border border-[#27282d] shadow-2xl" color="bg-[#18191c]" width="w-full">
          {error.auth && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-sm flex items-center justify-center gap-2">
              <span>⚠️</span>
              <span>{error.auth}</span>
            </div>
          )}

          <form onSubmit={loginHandler} className="space-y-1">
            <Input
              label="Email"
              error={error.email}
              startIcon="mail"
              placeholder="you@domain.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <Input
              label="Password"
              error={error.password}
              startIcon="password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <div className="flex justify-end pt-1 pb-2 px-2">
              <Link href="#" className="text-xs text-[#9ca3af] hover:text-white transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              text={isLoading ? 'Signing in...' : 'Sign In'}
              variant="solid"
              size="md"
              bgColor="bg-white"
              textColor="text-black"
              fullWidth
              className="mt-4"
              disabled={isLoading}
            >
              {!isLoading && <ArrowRight className="ml-1.5 h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#27282d] text-center">
            <p className="text-xs text-[#9ca3af]">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-indigo-400 font-semibold hover:underline">
                Register now
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;