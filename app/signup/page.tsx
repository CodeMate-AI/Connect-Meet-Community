"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Sparkles, UserPlus, ArrowRight, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

function getStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function SignupForm() {
  const { signUp, resendConfirmationEmail, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);

  const strength = useMemo(() => getStrength(password), [password]);
  const passwordsMatch = password === confirmPassword;
  const canSubmit = fullName.trim() && email.trim() && password.length >= 6 && acceptTerms && passwordsMatch;

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, loading, redirectTo, router]);

  if (emailSent) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-blue-950/5 backdrop-blur sm:p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#0B5CFF]/10 text-[#0B5CFF] shadow-inner">
            <Mail className="h-8 w-8 animate-bounce" />
          </div>

          <h1 className="font-heading text-2xl font-bold text-slate-900">Check your email</h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            We have sent an email with a confirmation link to:
          </p>
          <div className="my-3 inline-block rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 break-all">
            {email}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Please confirm it by clicking the link in the email to activate your account.
          </p>

          <div className="mt-8 space-y-3">
            <Link
              href={`/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-[#0B5CFF] text-white hover:bg-[#0948cc] text-sm font-semibold shadow-md shadow-[#0B5CFF]/20 transition-all"
            >
              <span>Go to Log in</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Button
              type="button"
              variant="outline"
              disabled={resending}
              onClick={async () => {
                setResending(true);
                await resendConfirmationEmail(email);
                setResending(false);
              }}
              className="w-full h-11 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${resending ? "animate-spin" : ""}`} />
              {resending ? "Resending email..." : "Resend confirmation email"}
            </Button>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setEmailSent(false)}
              className="text-xs text-[#0B5CFF] hover:underline"
            >
              Entered wrong email? Change email
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-blue-950/5 backdrop-blur sm:p-8">
        <div className="mb-8 space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B5CFF]/10 text-[#0B5CFF]">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="mt-2 text-sm text-slate-500">Join ConnectMeet and jump into your dashboard instantly.</p>
          </div>
        </div>

        <form
          className="grid gap-5"
          autoComplete="off"
          onSubmit={async (event) => {
            event.preventDefault();
            setSubmitting(true);
            const res = await signUp({ fullName, email, password });
            if (res.success && res.needsConfirmation) {
              setEmailSent(true);
            }
            setSubmitting(false);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="off"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alex Developer"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                minLength={6}
                required
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Password strength</span>
                <span>{strength <= 1 ? "Weak" : strength === 2 ? "Fair" : "Strong"}</span>
              </div>
              <Progress value={Math.max(15, strength * 25)} className="h-2" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirm-new-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              required
            />
            {!passwordsMatch && confirmPassword.length > 0 ? (
              <p className="text-xs text-red-500">Passwords do not match.</p>
            ) : null}
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0B5CFF] focus:ring-[#0B5CFF]"
            />
            <span>
              I accept the terms and understand my profile will be stored securely with Supabase Auth.
            </span>
          </label>

          <Button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full h-11 rounded-xl bg-[#0B5CFF] text-white hover:bg-[#0948cc]"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {submitting ? "Creating account..." : "Get Started Free"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href={`/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`} className="font-semibold text-[#0B5CFF] hover:underline">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SignupForm />
    </Suspense>
  );
}
