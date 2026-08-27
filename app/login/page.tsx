"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Sparkles, Zap, Copy, Check } from "lucide-react";
import { useAuth, DEMO_CREDENTIALS } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function LoginForm() {
  const { signIn, signInDemo, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim() && password.length >= 6, [email, password]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, loading, redirectTo, router]);

  const copyToClipboard = (text: string, field: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`Copied ${field} to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleFillDemo = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    toast.info("Demo credentials filled in form!");
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50 px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-blue-950/5 backdrop-blur sm:p-8">
        <div className="mb-6 space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B5CFF]/10 text-[#0B5CFF]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">Log in to continue to your dashboard.</p>
          </div>
        </div>

        {/* Demo Account Showcase Card */}
        <div className="mb-6 rounded-2xl border border-blue-200/80 bg-linear-to-b from-blue-50/90 to-blue-50/40 p-4">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B5CFF] uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5 fill-[#0B5CFF]" />
              <span>Instant Demo Access</span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-semibold text-[#0B5CFF] hover:underline"
            >
              Fill in form
            </button>
          </div>

          <div className="space-y-1.5 rounded-xl bg-white/90 p-2.5 border border-blue-100 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Email:</span>
              <div className="flex items-center gap-1.5">
                <code className="font-mono text-slate-900 font-medium">{DEMO_CREDENTIALS.email}</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(DEMO_CREDENTIALS.email, "email")}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Copy email"
                >
                  {copiedField === "email" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Password:</span>
              <div className="flex items-center gap-1.5">
                <code className="font-mono text-slate-900 font-medium">{DEMO_CREDENTIALS.password}</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(DEMO_CREDENTIALS.password, "password")}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Copy password"
                >
                  {copiedField === "password" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="button"
            disabled={demoSubmitting || submitting}
            onClick={async () => {
              setDemoSubmitting(true);
              await signInDemo(redirectTo);
              setDemoSubmitting(false);
            }}
            className="mt-3 w-full h-10 rounded-xl bg-[#0B5CFF] text-white hover:bg-[#0948cc] text-xs font-semibold shadow-sm shadow-[#0B5CFF]/30"
          >
            <Zap className="mr-1.5 h-3.5 w-3.5 fill-white" />
            {demoSubmitting ? "Logging in as Demo User..." : "1-Click Demo Login"}
          </Button>
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">
              Or sign in with email
            </span>
          </div>
        </div>

        {/* Standard Login Form */}
        <form
          className="space-y-4"
          autoComplete="off"
          onSubmit={async (event) => {
            event.preventDefault();
            setSubmitting(true);
            await signIn(email, password, redirectTo);
            setSubmitting(false);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="login_email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="login_password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
          </div>

          <div className="flex items-center justify-between gap-3 text-xs sm:text-sm pt-1">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#0B5CFF] focus:ring-[#0B5CFF]"
              />
              <span>Remember me</span>
            </label>
          </div>

          <Button
            type="submit"
            disabled={!canSubmit || submitting || demoSubmitting}
            className="w-full h-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold"
          >
            <LogIn className="mr-2 h-4 w-4" />
            {submitting ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don’t have an account?{" "}
          <Link
            href={`/signup${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="font-semibold text-[#0B5CFF] hover:underline"
          >
            Get started free
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginForm />
    </Suspense>
  );
}

