
import { auth, currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppearanceSettings from "./appearance-settings";
export const instant = false;
export default async function SettingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const user = await currentUser();

  const displayName =
    user?.fullName ||
    user?.username ||
    "KRAZ Creator";

  const email =
    user?.primaryEmailAddress?.emailAddress ||
    "No email available";

  const createdAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unavailable";

  return (
    <main className="min-h-screen bg-[#0b0912] p-6 text-white md:p-10">
      {/* Navigation */}
      <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <Link
          href="/"
          className="text-2xl font-black tracking-tight"
        >
          KRAZ<span className="text-violet-400">.</span>
        </Link>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-gray-300 transition hover:text-white"
          >
            Dashboard
          </Link>

          <Link
            href="/history"
            className="text-sm text-gray-300 transition hover:text-white"
          >
            History
          </Link>

          <UserButton />
        </div>
      </nav>

      <section className="mx-auto mt-12 max-w-4xl">
        {/* Page heading */}
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">
          Personalize your workspace
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Settings
        </h1>

        <p className="mt-3 text-gray-400">
          Manage your account, appearance, and KRAZ workspace.
        </p>

        {/* Account information */}
        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Account information
              </h2>

              <p className="mt-2 text-sm text-gray-400">
                Your profile details from Clerk.
              </p>
            </div>

            <UserButton />
          </div>

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-400/10 text-3xl">
              👤
            </div>

            <div className="min-w-0">
              <h3 className="text-lg font-semibold">
                {displayName}
              </h3>

              <p className="mt-1 break-all text-sm text-gray-400">
                {email}
              </p>

              <p className="mt-2 text-xs text-gray-500">
                Account created {createdAt}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-sm font-medium">
              Manage your profile
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Update your name, profile photo, and available account
              details using your profile menu.
            </p>

            <div className="mt-4">
              <UserButton />
            </div>
          </div>
        </section>

        {/* Appearance settings */}
        <AppearanceSettings />

        {/* Workspace links */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="text-xl font-semibold">
            Your workspace
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Quickly access your AI tools and saved results.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              href="/restore"
              className="group rounded-xl border border-white/10 p-5 transition hover:border-violet-400/40 hover:bg-white/[0.04]"
            >
              <span className="text-2xl">✨</span>

              <h3 className="mt-3 font-semibold transition group-hover:text-violet-300">
                Image Enhancer
              </h3>

              <p className="mt-2 text-sm text-gray-400">
                Improve image resolution with AI.
              </p>

              <p className="mt-4 text-sm font-medium text-violet-300">
                Open enhancer →
              </p>
            </Link>

            <Link
              href="/background-remover"
              className="group rounded-xl border border-white/10 p-5 transition hover:border-violet-400/40 hover:bg-white/[0.04]"
            >
              <span className="text-2xl">🪄</span>

              <h3 className="mt-3 font-semibold transition group-hover:text-violet-300">
                Background Remover
              </h3>

              <p className="mt-2 text-sm text-gray-400">
                Create transparent-background images.
              </p>

              <p className="mt-4 text-sm font-medium text-violet-300">
                Remove background →
              </p>
            </Link>

            <Link
              href="/history"
              className="group rounded-xl border border-white/10 p-5 transition hover:border-violet-400/40 hover:bg-white/[0.04] sm:col-span-2"
            >
              <span className="text-2xl">🖼️</span>

              <h3 className="mt-3 font-semibold transition group-hover:text-violet-300">
                Image History
              </h3>

              <p className="mt-2 text-sm text-gray-400">
                Preview, download, and manage your saved results.
              </p>

              <p className="mt-4 text-sm font-medium text-violet-300">
                View history →
              </p>
            </Link>
          </div>
        </section>

        {/* Return to dashboard */}
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-flex rounded-xl bg-violet-600 px-5 py-3 font-semibold transition hover:bg-violet-500"
          >
            ← Back to dashboard
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-14 border-t border-white/10 py-6 text-center text-sm text-gray-500">
          KRAZ · Your AI-powered creative workspace
        </footer>
      </section>
    </main>
  );
}
