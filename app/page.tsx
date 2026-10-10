import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from "@clerk/nextjs";

export const instant = false;

const tools = [
  {
    number: "01",
    title: "Image Enhancer",
    description:
      "Restore image clarity and upscale low-resolution photos with AI.",
    href: "/restore",
    icon: "✧",
    label: "IMAGE UPSCALING",
    gradient: "from-violet-500/20 to-indigo-500/5",
  },
  {
    number: "02",
    title: "Background Remover",
    description:
      "Remove image backgrounds and create transparent PNGs in seconds.",
    href: "/background-remover",
    icon: "◈",
    label: "BACKGROUND EDITING",
    gradient: "from-fuchsia-500/20 to-violet-500/5",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#0b0912] text-white">
      <nav className="relative z-10 flex items-center justify-between border-b border-white/[0.08] px-6 py-5 md:px-14">
        <Link href="/" className="text-2xl font-black tracking-tight">
          KRAZ<span className="text-violet-400">.</span>
        </Link>

        <div className="flex items-center gap-3 text-sm text-gray-400 sm:gap-5">
          <a href="#tools" className="transition hover:text-white">
            AI Tools
          </a>

          <span className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5 text-xs text-emerald-300 sm:inline-flex">
            ● AI tools online
          </span>

          <Show when="signed-out">
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="rounded-lg border border-white/15 px-3 py-2 text-white transition hover:bg-white/10 sm:px-4"
                >
                  Sign in
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="rounded-lg bg-violet-600 px-3 py-2 font-semibold text-white transition hover:bg-violet-500 sm:px-4"
                >
                  Sign up
                </button>
              </SignUpButton>
            </div>
          </Show>

          <Show when="signed-in">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="hidden text-white transition hover:text-violet-300 sm:inline"
              >
                Dashboard
              </Link>
              <UserButton />
            </div>
          </Show>
        </div>
      </nav>

      <section className="relative px-5 pb-20 pt-20 md:px-14 md:pb-28 md:pt-28">
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-700/20 blur-[120px]" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-4 py-2 text-xs font-medium tracking-wide text-violet-300">
            <span>✦</span>
            YOUR CREATIVE AI WORKSPACE
          </div>

          <h1 className="text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl md:text-8xl">
            Make every image
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-300 bg-clip-text text-transparent">
              extraordinary.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-gray-400 md:text-lg">
            Powerful AI image tools, all in one place. Enhance quality,
            remove backgrounds, and bring your creative ideas to life.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#tools"
              className="rounded-xl bg-violet-600 px-7 py-3.5 font-semibold transition hover:bg-violet-500"
            >
              Explore AI tools <span className="ml-2">↓</span>
            </a>

            <Link
              href="/background-remover"
              className="rounded-xl border border-white/15 px-7 py-3.5 font-semibold transition hover:bg-white/[0.06]"
            >
              Try background remover ↗
            </Link>
          </div>

          <div className="mx-auto mt-14 grid max-w-xl grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.025] py-5">
            <div>
              <p className="text-2xl font-bold">02</p>
              <p className="mt-1 text-xs text-gray-500">AI tools</p>
            </div>

            <div>
              <p className="text-2xl font-bold">AI</p>
              <p className="mt-1 text-xs text-gray-500">
                Powered editing
              </p>
            </div>

            <div>
              <p className="text-2xl font-bold">PNG</p>
              <p className="mt-1 text-xs text-gray-500">
                Transparent exports
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="tools"
        className="mx-auto max-w-7xl px-5 pb-24 md:px-14"
      >
        <div className="mb-9 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold tracking-[0.25em] text-violet-400">
              THE TOOLKIT
            </p>

            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              What would you like to create?
            </h2>
          </div>

          <p className="text-sm text-gray-500">
            Choose a tool to get started.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.number}
              href={tool.href}
              className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${tool.gradient} p-7 transition duration-300 hover:-translate-y-1 hover:border-violet-400/40 md:p-9`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-3xl text-violet-300">
                  {tool.icon}
                </div>

                <span className="text-sm text-gray-600">
                  {tool.number}
                </span>
              </div>

              <p className="mb-3 mt-9 text-[10px] font-bold tracking-[0.22em] text-violet-300">
                {tool.label}
              </p>

              <h3 className="text-2xl font-bold">{tool.title}</h3>

              <p className="mt-3 max-w-md leading-7 text-gray-400">
                {tool.description}
              </p>

              <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white">
                Open tool
                <span className="transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/[0.08] px-6 py-7 md:px-14">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-gray-500 sm:flex-row">
          <p className="font-bold tracking-wide text-gray-300">
            KRAZ<span className="text-violet-400">.</span>
          </p>

          <p>Built to make image editing simpler.</p>
        </div>
      </footer>
    </main>
  );
}