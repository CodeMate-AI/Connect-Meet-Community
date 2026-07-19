# ConnectMeet

ConnectMeet is a modern video meeting dashboard and in-call experience built with Next.js, React, TypeScript, Tailwind CSS, and VideoSDK. It combines a dashboard for creating or joining meetings with a responsive meeting room that includes live video, chat, participants, reactions, hand-raise support, and device controls.

## Product overview

ConnectMeet is organized around three core experiences:

1. **Dashboard** — create, join, and manage meetings from a lightweight home screen.
2. **Lobby** — preview meeting metadata and prepare before joining a room.
3. **Meeting room** — connect to a VideoSDK-backed call with real-time media controls and side panels.

The application is intentionally client-heavy because the video SDK, local storage, and browser device APIs are all browser-facing concerns.

## Tech stack

- **Framework:** Next.js 16 App Router
- **Language:** TypeScript
- **UI:** React 19, Tailwind CSS 4, Radix UI primitives, Lucide icons
- **Video platform:** VideoSDK React SDK + JavaScript SDK
- **Notifications:** Sonner
- **State persistence:** browser `localStorage`

## Repository structure

- [`app/`](app) — route segments, API routes, layouts, and page entry points
- [`components/`](components) — feature UI, dashboard widgets, call controls, and shared UI primitives
- [`lib/`](lib) — meeting persistence helpers and utility functions
- [`hooks/`](hooks) — reusable browser-state hooks
- [`public/`](public) — static assets

## Architecture

### 1) Routing and rendering model

The project uses the Next.js App Router and splits responsibilities by route:

- [`app/page.tsx`](app/page.tsx) renders the dashboard home screen.
- [`app/meeting/[id]/page.tsx`](app/meeting/[id]/page.tsx) dynamically loads the meeting client to avoid server-side rendering for VideoSDK-dependent code.
- [`app/meeting/[id]/MeetingRoomPageClient.tsx`](app/meeting/[id]/MeetingRoomPageClient.tsx) owns the full meeting experience: joining, connection state, sidebar state, and call layout.
- [`app/meeting/[id]/lobby/page.tsx`](app/meeting/[id]/lobby/page.tsx) handles pre-join lobby behavior.

The meeting room is intentionally client-rendered because it depends on browser APIs such as `window`, `localStorage`, and webcam/microphone device access.

### 2) Dashboard flow

The dashboard is built from focused UI components:

- [`components/dashboard/Sidebar.tsx`](components/dashboard/Sidebar.tsx) provides primary navigation.
- [`components/dashboard/QuickActions.tsx`](components/dashboard/QuickActions.tsx) surfaces create/join actions.
- [`components/dashboard/MeetingList.tsx`](components/dashboard/MeetingList.tsx) reads from local storage and renders upcoming meetings.
- [`components/meeting/MeetingModal.tsx`](components/meeting/MeetingModal.tsx) powers the join/create modal, including room creation and meeting record persistence.

Meeting data is stored locally through [`lib/meetings.ts`](lib/meetings.ts). This keeps the app self-contained and avoids requiring a database for the current workflow.

### 3) Meeting state and call lifecycle

The active call experience is coordinated by [`components/call/ControlBar.tsx`](components/call/ControlBar.tsx) and [`app/meeting/[id]/MeetingRoomPageClient.tsx`](app/meeting/[id]/MeetingRoomPageClient.tsx):

- `MeetingRoomPageClient` creates and joins the room, tracks connection state, and decides when the room is ready.
- `ControlBar` manages the user-facing call controls such as mute, video, screen share, participant panel, chat panel, reactions, and leave actions.
- `VideoGrid` renders the participant tiles and reflects raised hands and transient reaction overlays.
- `ParticipantsPanel` and `ChatPanel` are side drawers/panels for collaboration.
- `EmptyRoomState` is shown when no remote participants are present.
- `ReconnectBanner`, `ReactionPicker`, `ReactionBubble`, `MobileSheet`, and `HostSettingsModal` provide supporting UX for in-call interactions.

### 4) VideoSDK integration

The app uses two server endpoints to isolate secret handling:

- [`app/api/videosdk/token/route.ts`](app/api/videosdk/token/route.ts) issues VideoSDK JWT tokens.
- [`app/api/videosdk/room/route.ts`](app/api/videosdk/room/route.ts) creates new rooms and returns the generated room ID.

These routes run on the Node.js runtime so the server can safely access `VIDEOSDK_API_KEY` and `VIDEOSDK_SECRET` without exposing them to the client.

### 5) Shared utilities and persistence

[`lib/meetings.ts`](lib/meetings.ts) is the main persistence layer for dashboard meeting metadata. It provides helpers for:

- reading and writing the meeting list from `localStorage`
- formatting meeting dates for the dashboard
- generating meeting links
- creating new VideoSDK rooms from the client

This keeps storage logic centralized and makes the dashboard components simpler.

### 6) UI composition

The app favors small composable UI units:

- [`components/ui/`](components/ui) contains reusable design-system primitives such as buttons, dialogs, dropdowns, tabs, sheets, and inputs.
- [`components/Icon.tsx`](components/Icon.tsx) wraps Lucide icons so the rest of the app can reference icons by name.
- Tailwind utility classes are used directly in feature components to keep layout and responsiveness close to the consuming component.

### 7) Responsive design strategy

The interface is designed to work across mobile, tablet, and desktop:

- the dashboard uses a left sidebar on larger screens and compact layouts on smaller screens
- the meeting room keeps the main stage central while moving controls and secondary panels into mobile-friendly patterns
- device controls, call actions, and participant/chat surfaces are sized with touch targets in mind
- the control bar collapses into a mobile overflow pattern for narrower viewports

## Key user flows

### Create a meeting

1. Open the dashboard.
2. Launch the meeting modal.
3. Create a room through the VideoSDK room API.
4. Persist the meeting metadata locally.
5. Navigate into the meeting lobby or meeting room.

### Join an existing meeting

1. Enter a meeting ID and display name.
2. Save the participant identity locally.
3. Add the meeting record to local storage.
4. Navigate into the meeting lobby.

### Join the room

1. The meeting page dynamically loads the client-only meeting shell.
2. The client fetches or prepares a VideoSDK token.
3. The room joins once the SDK reports readiness.
4. The meeting UI becomes active with the video grid and control bar.

## Environment variables

The VideoSDK server routes require the following environment variables:

```bash
VIDEOSDK_API_KEY=
VIDEOSDK_SECRET=
```

Without these values, the room and token endpoints return a server error.

## Available scripts

```bash
npm run dev
npm run build
npm start
```

### Local development

```bash
npm install
npm run dev
```

Then open [`http://localhost:3000`](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

## Implementation notes

- The meeting pages are client-driven because browser media and storage APIs are required.
- Meeting metadata is intentionally lightweight and stored locally to keep the project easy to run.
- The VideoSDK room/token routes keep secret material on the server.
- Component boundaries are chosen so dashboard, call controls, and panels can evolve independently.
- The UI uses a consistent blue-and-slate visual language across dashboard and call surfaces.

## Contributing and extending

Good extension points in the current architecture include:

- adding persistent backend storage for meetings instead of `localStorage`
- introducing authentication for host and attendee flows
- expanding the dashboard with meeting history and filters
- adding richer in-call moderation controls
- splitting the meeting room logic into additional hooks if the feature surface grows

## Reference files

- [`app/page.tsx`](app/page.tsx)
- [`app/meeting/[id]/MeetingRoomPageClient.tsx`](app/meeting/[id]/MeetingRoomPageClient.tsx)
- [`components/call/ControlBar.tsx`](components/call/ControlBar.tsx)
- [`components/meeting/MeetingModal.tsx`](components/meeting/MeetingModal.tsx)
- [`lib/meetings.ts`](lib/meetings.ts)
- [`app/api/videosdk/token/route.ts`](app/api/videosdk/token/route.ts)
- [`app/api/videosdk/room/route.ts`](app/api/videosdk/room/route.ts)

## Deployment

This app is a standard Next.js project and can be deployed to any environment that supports the App Router and Node.js serverless routes. Ensure the VideoSDK environment variables are configured in the deployment platform before launching production traffic.
