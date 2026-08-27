"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import type { IconName } from "@/components/Icon";
import { useAuth } from "@/lib/auth-context";

interface FeatureCardProps {
  icon: IconName;
  title: string;
  description: string;
  badge?: string;
}

function FeatureCard({ icon, title, description, badge }: FeatureCardProps) {
  return (
    <div className="group relative p-5 sm:p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-xl hover:border-[#0B5CFF]/30 transition-all duration-300 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#0B5CFF]/10 text-[#0B5CFF] flex items-center justify-center group-hover:bg-[#0B5CFF] group-hover:text-white transition-colors duration-300">
            <Icon name={icon} className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          {badge && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[#FEBD00]/15 text-[#B45309] border border-[#FEBD00]/30">
              {badge}
            </span>
          )}
        </div>
        <h3 className="font-heading text-base sm:text-lg font-bold text-[#0F172A] mb-2 group-hover:text-[#0B5CFF] transition-colors">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: "Is ConnectMeet free to use without creating an account?",
    a: "Yes! You can easily sign up in seconds or join ongoing meetings with a single click.",
  },
  {
    q: "How does screen sharing and chat work?",
    a: "Built directly into the in-call experience. You can share entire screens or specific application windows, while collaborating in real-time through in-meeting chat and live emoji reactions.",
  },
  {
    q: "Can I test my microphone and camera before joining?",
    a: "Yes. ConnectMeet features a dedicated pre-join Lobby screen where you can preview your video stream, check audio devices, and configure preferences before entering.",
  },
  {
    q: "Is there host moderation available?",
    a: "Yes. Meeting hosts have access to controls including muting individual or all participants and managing attendees directly from the participants panel.",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { user } = useAuth();
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Guest";
  const loggedIn = Boolean(user);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#0F172A] flex flex-col selection:bg-[#0B5CFF]/20 selection:text-[#0B5CFF] overflow-x-hidden">
      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0B5CFF] text-white shadow-md shadow-[#0B5CFF]/25 group-hover:scale-105 transition-transform">
              <Icon name="Video" className="w-5 h-5" />
            </div>
            <span className="font-heading text-lg sm:text-xl font-extrabold tracking-tight text-[#0F172A]">
              Connect<span className="text-[#0B5CFF]">Meet</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#64748B]">
            <a href="#features" className="hover:text-[#0B5CFF] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#0B5CFF] transition-colors">
              How It Works
            </a>
            <a href="#preview" className="hover:text-[#0B5CFF] transition-colors">
              Experience
            </a>
            <a href="#faq" className="hover:text-[#0B5CFF] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Header Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {loggedIn ? (
              <>
                <span className="hidden lg:inline-flex items-center rounded-full border border-[#0B5CFF]/20 bg-[#0B5CFF]/10 px-3 py-1.5 text-xs font-semibold text-[#0B5CFF]">
                  Hi, {displayName}
                </span>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B5CFF] hover:bg-[#0948cc] text-white text-sm font-semibold shadow-md shadow-[#0B5CFF]/20 hover:shadow-lg hover:shadow-[#0B5CFF]/30 transition-all active:scale-[0.98]"
                >
                  <span>Enter Dashboard</span>
                  <Icon name="ArrowRight" className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] text-sm font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-[#0B5CFF] hover:bg-[#0948cc] text-white text-sm font-semibold shadow-md shadow-[#0B5CFF]/20 hover:shadow-lg hover:shadow-[#0B5CFF]/30 transition-all active:scale-[0.98]"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            <Icon name={mobileMenuOpen ? "X" : "Menu"} className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E2E8F0] px-4 pt-2 pb-6 space-y-3 shadow-lg">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#0B5CFF] hover:bg-slate-50"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#0B5CFF] hover:bg-slate-50"
            >
              How It Works
            </a>
            <a
              href="#preview"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#0B5CFF] hover:bg-slate-50"
            >
              Experience
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 rounded-lg text-sm font-medium text-[#64748B] hover:text-[#0B5CFF] hover:bg-slate-50"
            >
              FAQ
            </a>
            <div className="pt-2 flex flex-col gap-2">
              {loggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0B5CFF] text-white text-sm font-semibold shadow-md shadow-[#0B5CFF]/20"
                >
                  <span>Enter Dashboard</span>
                  <Icon name="ArrowRight" className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-[#E2E8F0] text-sm font-semibold text-[#0F172A]"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0B5CFF] text-white text-sm font-semibold shadow-md shadow-[#0B5CFF]/20"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-20 sm:pb-28">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-150 h-62.5 sm:h-87.5 bg-linear-to-tr from-[#0B5CFF]/15 to-[#FEBD00]/10 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#0F172A] tracking-tight leading-[1.15] sm:leading-[1.1] max-w-4xl mx-auto">
            Connect seamlessly, <br />
            <span className="bg-linear-to-r from-[#0B5CFF] via-[#2563EB] to-[#1D4ED8] bg-clip-text text-transparent">
              collaborate effortlessly.
            </span>
          </h1>

          <p className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl text-[#64748B] max-w-2xl mx-auto leading-relaxed px-2">
            Ultra-fast video meetings with crystal-clear HD video, screen sharing, real-time reactions, and collaborative chat. Just one click to enter.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            {loggedIn ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-[#0B5CFF] hover:bg-[#0948cc] text-white text-sm sm:text-base font-bold shadow-lg shadow-[#0B5CFF]/30 hover:shadow-xl hover:shadow-[#0B5CFF]/40 transition-all duration-200 active:scale-[0.98]"
              >
                <span>Enter Dashboard</span>
                <Icon name="ArrowRight" className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-[#0B5CFF] hover:bg-[#0948cc] text-white text-sm sm:text-base font-bold shadow-lg shadow-[#0B5CFF]/30 hover:shadow-xl hover:shadow-[#0B5CFF]/40 transition-all duration-200 active:scale-[0.98]"
                >
                  <span>Get Started Free</span>
                  <Icon name="ArrowRight" className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-slate-50 text-[#0F172A] border border-[#E2E8F0] text-sm sm:text-base font-semibold shadow-sm transition-all"
                >
                  <span>Log in</span>
                </Link>
              </>
            )}
            <a
              href="#preview"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-slate-50 text-[#0F172A] border border-[#E2E8F0] text-sm sm:text-base font-semibold shadow-sm transition-all"
            >
              <Icon name="Play" className="w-4 h-4 text-[#0B5CFF]" />
              <span>See Demo Preview</span>
            </a>
          </div>

          <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-8 text-xs sm:text-sm font-medium text-[#64748B]">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Icon name="CheckCircle" className="w-4 h-4 text-[#10B981] shrink-0" />
              <span>HD Video & Audio</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Icon name="CheckCircle" className="w-4 h-4 text-[#10B981] shrink-0" />
              <span>1-Click Room Creation</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Icon name="CheckCircle" className="w-4 h-4 text-[#10B981] shrink-0" />
              <span>Secure WebRTC Streams</span>
            </div>
          </div>
        </div>

        {/* 3. Call Preview Mockup Section */}
        <div id="preview" className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 mt-10 sm:mt-20">
          <div className="relative rounded-2xl sm:rounded-3xl p-3 sm:p-5 bg-[#0B1120] border border-[#1E293B] shadow-2xl shadow-slate-950/40 overflow-hidden text-white">
            {/* Top Bar Mockup */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-white/10 text-xs text-[#94A3B8]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80 shrink-0" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80 shrink-0" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/80 shrink-0" />
                <span className="ml-1 sm:ml-3 font-mono text-[11px] sm:text-xs text-white/70 truncate">
                  cm-demo99
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 px-2.5 sm:px-3 py-1 rounded-full border border-white/10 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-400 text-[11px] sm:text-xs font-medium">Live</span>
              </div>
            </div>

            {/* Video Grid Mockup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 min-h-55 sm:min-h-75">
              {/* Tile 1 */}
              <div className="relative rounded-xl sm:rounded-2xl bg-[#1E293B] border-2 border-[#0B5CFF] p-3 sm:p-4 flex flex-col justify-between overflow-hidden min-h-35 sm:min-h-45">
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/20" />
                <div className="relative flex justify-between items-center">
                  <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] sm:text-[11px] font-medium backdrop-blur">
                    Speaking 🎙️
                  </span>
                  <span className="text-base sm:text-xl">👏</span>
                </div>
                <div className="relative flex items-center justify-center my-auto py-2">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#0B5CFF]/20 border border-[#0B5CFF] flex items-center justify-center text-base sm:text-xl font-bold text-[#0B5CFF]">
                    AD
                  </div>
                </div>
                <div className="relative flex items-center justify-between text-[11px] sm:text-xs">
                  <span className="font-semibold text-white truncate">Alex Developer (Host)</span>
                  <div className="w-2 h-2 rounded-full bg-[#0B5CFF] shrink-0 ml-2" />
                </div>
              </div>

              {/* Tile 2 */}
              <div className="relative rounded-xl sm:rounded-2xl bg-[#1E293B] border border-white/10 p-3 sm:p-4 flex flex-col justify-between overflow-hidden min-h-35 sm:min-h-45">
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/20" />
                <div className="relative flex justify-between items-center">
                  <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] sm:text-[11px] font-medium text-emerald-400 backdrop-blur">
                    HD 1080p
                  </span>
                </div>
                <div className="relative flex items-center justify-center my-auto py-2">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#FEBD00]/20 border border-[#FEBD00] flex items-center justify-center text-base sm:text-xl font-bold text-[#FEBD00]">
                    SJ
                  </div>
                </div>
                <div className="relative flex items-center justify-between text-[11px] sm:text-xs">
                  <span className="font-semibold text-white truncate">Sarah Johnson</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 ml-2" />
                </div>
              </div>

              {/* Tile 3 (Desktop Only) */}
              <div className="hidden lg:flex relative rounded-2xl bg-[#1E293B] border border-white/10 p-4 flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/20" />
                <div className="relative flex justify-between items-center">
                  <span className="px-2 py-0.5 rounded bg-black/60 text-[11px] font-medium text-[#94A3B8] backdrop-blur">
                    Muted 🔇
                  </span>
                  <span className="text-xl">🔥</span>
                </div>
                <div className="relative flex items-center justify-center my-auto py-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-xl font-bold text-emerald-400">
                    MP
                  </div>
                </div>
                <div className="relative flex items-center justify-between text-xs">
                  <span className="font-semibold text-white truncate">Michael Park</span>
                  <div className="w-2 h-2 rounded-full bg-[#64748B] shrink-0 ml-2" />
                </div>
              </div>
            </div>

            {/* Bottom Bar Mockup */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 flex items-center justify-center text-white text-xs">
                  <Icon name="Mic" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 flex items-center justify-center text-white text-xs">
                  <Icon name="Video" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0B5CFF] flex items-center justify-center text-white text-xs">
                  <Icon name="Share2" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm">🎉</span>
                <span className="text-xs sm:text-sm">❤️</span>
                <span className="text-xs sm:text-sm">👍</span>
              </div>
              <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-red-600 text-white text-[11px] sm:text-xs font-semibold">
                Leave
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="py-14 sm:py-20 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B5CFF]">
              Everything you need
            </span>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-[#0F172A] mt-2">
              Engineered for seamless collaboration
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-[#64748B] mt-3">
              Powerful built-in tools that make every remote team meeting productive, natural, and fun.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <FeatureCard
              icon="Video"
              title="HD Audio & Video"
              description="Crisp video streams with automatic adaptive bitrate streaming for reliable calls on any network."
              badge="WebRTC"
            />
            <FeatureCard
              icon="Share2"
              title="Fast Screen Sharing"
              description="Share single tabs, windows, or full displays with high frame rate and low latency."
            />
            <FeatureCard
              icon="MessageSquare"
              title="Chat & Collaboration"
              description="Interactive real-time chat with timestamped messaging and immediate participant awareness."
            />
            <FeatureCard
              icon="Smile"
              title="Reactions & Hand Raises"
              description="Express thoughts with live floating emojis and hand raises for organized conversations."
            />
            <FeatureCard
              icon="Settings"
              title="Pre-call Lobby Testing"
              description="Preview your camera feed and test audio inputs before entering live rooms."
            />
            <FeatureCard
              icon="Shield"
              title="Host Moderation Controls"
              description="Easily mute participants, manage attendees, and maintain meeting privacy."
            />
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="py-14 sm:py-20 bg-[#F9FAFB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B5CFF]">
              Simple 3-step workflow
            </span>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-[#0F172A] mt-2">
              Get started in seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] shadow-sm relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#0B5CFF] text-white flex items-center justify-center font-heading text-base sm:text-lg font-bold mb-4 sm:mb-6">
                1
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[#0F172A] mb-2 sm:mb-3">
                Launch Dashboard
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Enter your dashboard to create a room instantly, schedule a meeting, or join using a room ID.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] shadow-sm relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#FEBD00] text-[#0F172A] flex items-center justify-center font-heading text-base sm:text-lg font-bold mb-4 sm:mb-6">
                2
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[#0F172A] mb-2 sm:mb-3">
                Check In The Lobby
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Test your webcam, microphone, and set your display name in the pre-join lobby before stepping in.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] shadow-sm relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#10B981] text-white flex items-center justify-center font-heading text-base sm:text-lg font-bold mb-4 sm:mb-6">
                3
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-[#0F172A] mb-2 sm:mb-3">
                Collaborate Live
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Enjoy frictionless video conferencing with screen share, live reactions, and real-time chat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section id="faq" className="py-14 sm:py-20 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B5CFF]">
              Frequently Asked Questions
            </span>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-[#0F172A] mt-2">
              Got questions? We've got answers.
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={item.q}
                  className="rounded-xl sm:rounded-2xl border border-[#E2E8F0] bg-[#F9FAFB] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-4 sm:px-6 py-3.5 sm:py-4 text-left flex items-center justify-between gap-3 font-heading text-sm sm:text-base font-semibold text-[#0F172A]"
                  >
                    <span>{item.q}</span>
                    <Icon
                      name={isOpen ? "ChevronUp" : "ChevronDown"}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-[#64748B] shrink-0"
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-1 text-xs sm:text-sm text-[#64748B] leading-relaxed border-t border-[#E2E8F0]">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Bottom CTA */}
      <section className="py-12 sm:py-20 bg-linear-to-b from-white to-[#F1F5F9]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-6 sm:p-12 md:p-14 rounded-2xl sm:rounded-3xl bg-[#0F172A] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-60 sm:w-80 h-60 sm:h-80 bg-[#0B5CFF]/30 blur-3xl rounded-full pointer-events-none" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold">
                Ready for effortless team video meetings?
              </h2>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-[#94A3B8]">
                No downloads, no hassle. Jump into ConnectMeet and start meeting with your team right now.
              </p>
              <div className="mt-6 sm:mt-8">
                {loggedIn ? (
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-[#0B5CFF] hover:bg-[#0948cc] text-white text-sm sm:text-base font-bold shadow-lg shadow-[#0B5CFF]/40 hover:shadow-xl transition-all active:scale-[0.98]"
                  >
                    <span>Enter Dashboard Now</span>
                    <Icon name="ArrowRight" className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                ) : (
                  <Link
                    href="/signup"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-[#0B5CFF] hover:bg-[#0948cc] text-white text-sm sm:text-base font-bold shadow-lg shadow-[#0B5CFF]/40 hover:shadow-xl transition-all active:scale-[0.98]"
                  >
                    <span>Get Started Free</span>
                    <Icon name="ArrowRight" className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#0B5CFF] flex items-center justify-center text-white">
              <Icon name="Video" className="w-3.5 h-3.5" />
            </div>
            <span className="font-heading font-bold text-sm text-[#0F172A]">ConnectMeet</span>
            <span className="text-slate-300">•</span>
            <span>© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/dashboard" className="hover:text-[#0B5CFF] transition-colors">
              Dashboard
            </Link>
            <a href="#features" className="hover:text-[#0B5CFF] transition-colors">
              Features
            </a>
            <a href="#faq" className="hover:text-[#0B5CFF] transition-colors">
              FAQ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
