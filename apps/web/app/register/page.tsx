"use client";

import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Inputbox';
import { useRouter } from 'next/navigation';
import Button from '../components/ui/Button';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { Workflow, UserPlus } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ user: '', password: '', confirm: '', email: '' });
  const [error, setError] = useState({ email: "", password: "", auth: "", confirm: "", name: '' });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateEmail = (val: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  };

  const registerHandler = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newErrors = { email: '', password: '', auth: '', confirm: '', name: '' };

    if (!formData.user.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirm) {
      newErrors.confirm = "Please confirm your password";
    } else if (formData.password !== formData.confirm) {
      newErrors.confirm = "Passwords do not match";
    }

    if (Object.values(newErrors).some(err => err !== '')) {
      setError(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const result = await axios.post('/api/auth', {
        email: formData.email,
        password: formData.password,
        name: formData.user
      });

      if (result.data) {
        toast.success("Registration successful! Please sign in.");
        router.push('/login');
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError({ ...newErrors, auth: "User already exists with this email" });
        toast.error("User already exists with this email");
      } else if (err.response?.status === 400) {
        setError({ ...newErrors, auth: "Invalid data provided" });
        toast.error("Invalid data provided");
      } else {
        setError({ ...newErrors, auth: "Registration failed. Please try again." });
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0f1012] flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md my-8">
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
          <h1 className="text-xl font-bold text-white">Create an account</h1>
          <p className="text-sm text-[#9ca3af] mt-1">Start automating workflows in minutes</p>
        </div>

        <Card blur="border border-[#27282d] shadow-2xl" color="bg-[#18191c]" width="w-full">
          {error.auth && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-sm flex items-center justify-center gap-2">
              <span>⚠️</span>
              <span>{error.auth}</span>
            </div>
          )}

          <form onSubmit={registerHandler} className="space-y-1">
            <Input
              label="Full Name"
              error={error.name}
              startIcon="user"
              placeholder="Alex Johnson"
              type="text"
              value={formData.user}
              onChange={(e) => setFormData({ ...formData, user: e.target.value })}
              autoComplete="name"
            />

            <Input
              label="Email"
              error={error.email}
              startIcon="mail"
              placeholder="alex@domain.com"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              autoComplete="email"
            />

            <Input
              label="Password"
              error={error.password}
              startIcon="password"
              placeholder="At least 8 characters"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              error={error.confirm}
              startIcon="password"
              placeholder="Confirm password"
              type="password"
              value={formData.confirm}
              onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              text={isLoading ? 'Creating account...' : 'Create Account'}
              variant="solid"
              size="md"
              bgColor="bg-white"
              textColor="text-black"
              fullWidth
              className="mt-5"
              disabled={isLoading}
            >
              {!isLoading && <UserPlus className="ml-1.5 h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#27282d] text-center">
            <p className="text-xs text-[#9ca3af]">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-400 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;