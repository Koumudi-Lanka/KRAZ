
import { auth, currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";

type HistoryRecord = {
  id: string;
  tool_type: string;
  original_file_name: string;
  created_at: string;
};

async function DashboardContent() {
  const { userId, getToken } = await auth();

  if (!userId) {
    redirect("/");
  }

  const user = await currentUser();

  const displayName = user?.firstName || user?.username || "Creator";
  const email = user?.primaryEmailAddress?.emailAddress || "";

  let records: HistoryRecord[] = [];
  let historyError = false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (supabaseUrl && supabaseKey) {
    const token = await getToken();

    const supabase = createClient(supabaseUrl, supabaseKey, {
      accessToken: async () => token,
    });

    const { data, error } = await supabase
      .from("image_history")
      .select("id, tool_type, original_file_name, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      historyError = true;
    } else {
      records = (data ?? []) as HistoryRecord[];
    }
  } else {
    historyError = true;
  }

  const totalProcessed = records.length;

  const enhancedCount = records.filter(
    (item) => item.tool_type === "image_enhancer"
  ).length;

  const backgroundRemovedCount = records.filter(
    (item) => item.tool_type === "background_remover"
  ).length;

  const recentActivities = records.slice(0, 5);

  return (
    <main className="kraz-dashboard min-h-screen p-6 md:p-10">
      {/* Navigation */}
      <nav className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <Link
          href="/"
          className="text-2xl font-black tracking-tight"
        >
          KRAZ<span className="text-violet-500">.</span>
        </Link>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="kraz-text-muted text-sm transition hover:text-violet-500">
            Home
          </Link>

          <Link
            href="/history"
            className="kraz-text-muted text-sm transition hover:text-violet-500"
          >
            History
          </Link>

          <Link
            href="/settings"
            className="kraz-button-secondary rounded-lg border px-3 py-2 text-sm font-medium transition"
          >
            ⚙️ Settings
          </Link>

          <UserButton />
        </div>
      </nav>

      <section className="mx-auto mt-12 max-w-6xl">
        {/* Welcome */}
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-500">
          Your creative workspace
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Welcome back, {displayName}!
        </h1>

        {email && (
          <p className="kraz-text-muted mt-2 text-sm">{email}</p>
        )}

        <p className="kraz-text-muted mt-4">
          Your AI-powered image studio. What would you like to create today?
        </p>

        {/* Dashboard statistics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="kraz-stat-card rounded-2xl border border-violet-400/30 bg-violet-400/[0.08] p-6 transition hover:border-violet-400/60">
            <div className="flex items-center justify-between">
              <p className="kraz-text-muted text-sm">
                Total images processed
              </p>
              <span className="text-2xl">🖼️</span>
            </div>

            <p className="mt-4 text-3xl font-bold">
              {historyError ? "—" : totalProcessed}
            </p>

            <p className="kraz-text-subtle mt-2 text-xs">
              All recorded activities
            </p>
          </article>

          <article className="kraz-card rounded-2xl border p-6 transition hover:border-violet-400/50">
            <div className="flex items-center justify-between">
              <p className="kraz-text-muted text-sm">
                Images enhanced
              </p>
              <span className="text-2xl">✨</span>
            </div>

            <p className="mt-4 text-3xl font-bold">
              {historyError ? "—" : enhancedCount}
            </p>

            <p className="kraz-text-subtle mt-2 text-xs">
              AI Image Enhancer
            </p>
          </article>

          <article className="kraz-card rounded-2xl border p-6 transition hover:border-violet-400/50 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <p className="kraz-text-muted text-sm">
                Backgrounds removed
              </p>
              <span className="text-2xl">🪄</span>
            </div>

            <p className="mt-4 text-3xl font-bold">
              {historyError ? "—" : backgroundRemovedCount}
            </p>

            <p className="kraz-text-subtle mt-2 text-xs">
              AI Background Remover
            </p>
          </article>
        </div>

        {historyError && (
          <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/[0.08] p-4 text-sm text-amber-700 dark:text-amber-200">
            We couldn&apos;t load your statistics right now. Your tools
            are still available. Check your Supabase connection and
            refresh this page.
          </div>
        )}

        {/* AI tools heading */}
        <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Your AI tools</h2>
            <p className="kraz-text-muted mt-2 text-sm">
              Choose a tool to get started.
            </p>
          </div>

          <Link
            href="/history"
            className="kraz-button-secondary rounded-xl border px-4 py-2 text-sm font-semibold transition"
          >
            View all history →
          </Link>
        </div>

        {/* AI tools and Settings cards */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Link
            href="/restore"
            className="kraz-card group rounded-2xl border p-7 transition hover:border-violet-500/60"
          >
            <div className="mb-6 text-3xl">✨</div>

            <h3 className="text-xl font-semibold transition group-hover:text-violet-500">
              AI Image Enhancer
            </h3>

            <p className="kraz-text-muted mt-3 leading-7">
              Improve image resolution and recover finer details with
              AI-powered upscaling.
            </p>

            <p className="mt-6 text-sm font-semibold text-violet-500">
              Open enhancer →
            </p>
          </Link>

          <Link
            href="/background-remover"
            className="kraz-card group rounded-2xl border p-7 transition hover:border-violet-500/60"
          >
            <div className="mb-6 text-3xl">🪄</div>

            <h3 className="text-xl font-semibold transition group-hover:text-violet-500">
              AI Background Remover
            </h3>

            <p className="kraz-text-muted mt-3 leading-7">
              Remove backgrounds and download transparent PNG images.
            </p>

            <p className="mt-6 text-sm font-semibold text-violet-500">
              Remove background →
            </p>
          </Link>

          <article className="kraz-card rounded-2xl border border-dashed p-7 transition hover:border-violet-400/60 md:col-span-2">
            <div className="mb-4 text-3xl">🎯</div>

            <h3 className="text-xl font-semibold">AI Object Remover</h3>

            <p className="kraz-text-muted mt-3">
              Remove unwanted objects while preserving the surrounding scene.
            </p>

            <span className="kraz-badge mt-5 inline-block rounded-full border px-3 py-1 text-xs">
              Planned
            </span>
          </article>

          <Link
            href="/settings"
            className="kraz-card group rounded-2xl border p-7 transition hover:border-violet-500/60 md:col-span-2"
          >
            <div className="mb-4 text-3xl">⚙️</div>

            <h3 className="text-xl font-semibold transition group-hover:text-violet-500">
              Settings &amp; Account
            </h3>

            <p className="kraz-text-muted mt-3 leading-7">
              View your account information and manage your KRAZ workspace.
            </p>

            <p className="mt-6 text-sm font-semibold text-violet-500">
              Open settings →
            </p>
          </Link>
        </div>

        {/* Recent activity */}
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Recent activity</h2>
              <p className="kraz-text-muted mt-2 text-sm">
                Your five latest recorded image-processing activities.
              </p>
            </div>

            <Link
              href="/history"
              className="text-sm font-semibold text-violet-500 transition hover:text-violet-400"
            >
              Full history →
            </Link>
          </div>

          {historyError ? (
            <div className="kraz-card mt-5 rounded-2xl border p-6 text-sm">
              <p className="kraz-text-muted">
                Recent activity is temporarily unavailable.
              </p>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="kraz-card mt-5 rounded-2xl border p-8 text-center">
              <p className="text-3xl">🚀</p>

              <h3 className="mt-3 font-semibold">
                Ready for your first creation?
              </h3>

              <p className="kraz-text-muted mt-2 text-sm">
                Your latest processing activities will appear here.
              </p>

              <Link
                href="/restore"
                className="mt-5 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                Enhance your first image
              </Link>
            </div>
          ) : (
            <div className="kraz-card mt-5 overflow-hidden rounded-2xl border">
              {recentActivities.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between ${
                    index !== recentActivities.length - 1
                      ? "border-b"
                      : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-xl">
                      {item.tool_type === "image_enhancer"
                        ? "✨"
                        : item.tool_type === "background_remover"
                          ? "🪄"
                          : "🖼️"}
                    </div>

                    <div className="min-w-0">
                      <p className="break-all font-medium">
                        {item.original_file_name}
                      </p>

                      <p className="kraz-text-muted mt-1 text-sm">
                        {item.tool_type === "image_enhancer"
                          ? "AI Image Enhancer"
                          : item.tool_type === "background_remover"
                            ? "Background Remover"
                            : item.tool_type}
                      </p>
                    </div>
                  </div>

                  <p className="kraz-text-subtle shrink-0 text-xs">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="kraz-footer mt-14 border-t py-6 text-center text-sm">
          KRAZ · Your AI-powered creative workspace
        </footer>
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="kraz-dashboard min-h-screen p-8">
          <p className="kraz-text-muted">
            Loading your KRAZ dashboard...
          </p>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
