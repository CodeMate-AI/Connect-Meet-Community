import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/keep-alive
 *
 * Lightweight endpoint called by a Vercel Cron Job every 3 days to prevent
 * the Supabase free-tier project from being paused due to inactivity (7-day threshold).
 *
 * Security: Protected by a CRON_SECRET env variable. Vercel automatically sends
 * the Authorization header when invoking cron routes.
 */
export async function GET(request: NextRequest) {
  // --- Auth guard ---
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Ping Supabase ---
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing." },
      { status: 500 }
    );
  }

  // Use a cookie-less client since this is a server-side cron call (no user session needed)
  const supabase = createServerClient(url, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  });

  try {
    // Minimal query - just enough to keep the connection alive
    const { error } = await supabase
      .from("_keep_alive_ping")
      .select("*")
      .limit(1)
      .maybeSingle();

    // Ignore "table not found" errors - the goal is only to open a DB connection
    if (error && !error.message.includes("does not exist")) {
      throw error;
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      message: "Supabase keep-alive ping successful.",
    });
  } catch (err) {
    console.error("[keep-alive] DB ping failed:", err);
    return NextResponse.json(
      { error: "DB ping failed", details: String(err) },
      { status: 500 }
    );
  }
}
