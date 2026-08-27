# ConnectMeet 🚀

ConnectMeet is a modern, full-stack video conferencing application built with **Next.js 16 (Turbopack)**, **React 19**, **TypeScript**, **Tailwind CSS 4**, **Supabase Auth (SSR)**, and **VideoSDK**.

It combines a marketing landing page, secure authentication layer with 1-click demo access, a dashboard for creating and scheduling meetings, a pre-join lobby with media device preview, and a feature-packed in-call meeting room supporting multi-participant video, screen sharing, chat, emoji reactions, hand-raising, and host controls.

---

## 🌟 Features & Core Experiences

1. **🎨 Landing Page (`/`)**
   - Modern hero presentation with live mockup preview.
   - Dynamic CTA buttons reflecting real-time authentication state.
   - Comprehensive sections: 6 Feature Highlights, 3-Step "How It Works" Workflow, Interactive FAQ Accordion, and Bottom Banner.

2. **🔐 Secure Authentication Layer (`/signup`, `/login`)**
   - **Supabase SSR Authentication**: Powered by `@supabase/ssr` with Next.js Edge Middleware route guarding (`/dashboard` and `/meeting/*`).
   - **Autofill Prevention**: Clean input fields on load without browser credential prefilling.
   - **⚡ 1-Click Instant Demo Login**: Built-in showcase card allowing 1-click test login without manual setup.
   - **Password Strength Meter & Live Feedback**: Real-time validation and responsive toast notifications.

3. **📊 Workspace Dashboard (`/dashboard`)**
   - Personalized user greeting with avatar initials and user metadata.
   - Instant meeting creation (generates live VideoSDK room ID).
   - Join existing meetings by ID.
   - Schedule and list upcoming meetings with local persistence and one-click copy links.
   - Sidebar navigation with a functional **Logout** action.

4. **🚪 Pre-Join Lobby (`/meeting/[id]/lobby`)**
   - Camera and microphone permission checks and live video preview.
   - Device selection and toggle (Camera / Mic) before entering the call.
   - Displays meeting ID and auto-syncs participant display name.

5. **📹 Interactive Meeting Room (`/meeting/[id]`)**
   - **Multi-Party Video & Grid Layout**: Responsive participant video grid with active speaker indicators.
   - **Rich Media Controls**: Mic mute/unmute, Camera on/off, Screen sharing, and Host settings.
   - **Live Collaboration**: In-call text Chat drawer and live Participants panel.
   - **Interactive Reactions**: Animated floating emoji bubbles and hand-raise queue.
   - **Mobile-First UX**: Responsive bottom control bar and collapsible side panels for all screen sizes.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router + Turbopack)
- **Language:** TypeScript 5
- **UI & Styling:** React 19, Tailwind CSS 4, Radix UI Primitives, Lucide Icons
- **Authentication & Database:** Supabase Auth (`@supabase/ssr` & `@supabase/supabase-js`)
- **Video & Real-Time Media:** VideoSDK (React SDK + JavaScript SDK)
- **Notifications:** Sonner
- **State Persistence:** Supabase Session Cookies + browser `localStorage`

---

## ⚡ Instant Demo Credentials

For quick testing without creating a new account, use the pre-configured Demo Account:

| Field | Demo Credential |
| :--- | :--- |
| **Email** | `demo@connectmeet.io` |
| **Password** | `ConnectMeet@2026` |
| **Display Name** | `Demo User` |

> 💡 **Tip:** On the [`/login`](http://localhost:3000/login) page, you can simply click **"⚡ 1-Click Demo Login"** to jump straight into the dashboard!

---

## 📁 Repository Structure

```text
ConnectMeet/
├── app/
│   ├── api/videosdk/         # Server endpoints for VideoSDK JWT tokens and room creation
│   │   ├── room/route.ts
│   │   └── token/route.ts
│   ├── auth/callback/        # Supabase OAuth/auth code exchange handler
│   ├── dashboard/            # Authenticated user dashboard
│   ├── login/                # Log in page with 1-click Demo Access
│   ├── meeting/              # Pre-join lobby & live VideoSDK meeting room
│   │   └── [id]/
│   │       ├── lobby/page.tsx
│   │       ├── MeetingRoomPageClient.tsx
│   │       └── page.tsx
│   ├── signup/               # User registration page with email confirmation support
│   ├── layout.tsx            # Root layout with fonts and metadata
│   ├── page.tsx              # Full landing page with dynamic auth state
│   └── providers.tsx         # App-wide AuthProvider and Toaster
├── components/
│   ├── call/                 # Meeting room controls, video grid, chat, participants, reactions
│   ├── dashboard/            # Sidebar, quick actions, meeting list, stats
│   ├── landing/              # Landing page modular components
│   ├── meeting/              # Meeting creation/join modals
│   └── ui/                   # Reusable UI primitives (buttons, dialogs, inputs, sheets)
├── lib/
│   ├── auth-context.tsx      # AuthProvider context (signIn, signUp, signInDemo, signOut)
│   ├── meetings.ts           # Meeting metadata & local storage helpers
│   └── supabase/             # Supabase SSR client, server, and middleware helpers
├── middleware.ts             # Edge route protection for dashboard & meeting rooms
└── public/                   # Static assets
```

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration (Authentication & SSR)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_or_anon_key

# VideoSDK Credentials (Server-side token generation & room creation)
VIDEOSDK_API_KEY=your_videosdk_api_key
VIDEOSDK_SECRET=your_videosdk_secret
```

A template is also available in [`.env.example`](.env.example).

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

---

## 🔒 Route Protection & Middleware

Next.js Edge Middleware ([`middleware.ts`](middleware.ts)) automatically guards routes:
- **Protected Routes** (`/dashboard`, `/meeting/*`): Unauthenticated visitors are automatically redirected to `/login?redirect=...`.
- **Auth Routes** (`/login`, `/signup`): Authenticated users are redirected directly to `/dashboard`.
- **Session Refresh**: Cookies are automatically refreshed on every request via `@supabase/ssr`.

---

## 🤝 License

This project is licensed under the MIT License.
