
"use client";

import { useTheme } from "../theme-provider";

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const cardClass = isDark
    ? "border-white/10 bg-white/[0.03] text-white"
    : "border-gray-200 bg-white text-gray-900";

  const mutedClass = isDark ? "text-gray-400" : "text-gray-600";

  const optionBase =
    "rounded-xl border p-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500";

  function getOptionClass(selected: boolean) {
    if (selected) {
      return isDark
        ? `${optionBase} border-violet-400 bg-violet-400/10`
        : `${optionBase} border-violet-500 bg-violet-50`;
    }

    return isDark
      ? `${optionBase} border-white/10 hover:bg-white/[0.04]`
      : `${optionBase} border-gray-200 hover:bg-gray-50`;
  }

  return (
    <section
      aria-labelledby="appearance-heading"
      className={`mt-6 rounded-2xl border p-6 sm:p-8 ${cardClass}`}
    >
      <div>
        <h2 id="appearance-heading" className="text-xl font-semibold">
          Appearance
        </h2>

        <p className={`mt-2 text-sm ${mutedClass}`}>
          Choose your preferred KRAZ workspace appearance.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setTheme("dark")}
          aria-pressed={isDark}
          className={getOptionClass(isDark)}
        >
          <span aria-hidden="true" className="text-2xl">
            🌙
          </span>

          <h3 className="mt-3 font-semibold">Dark mode</h3>

          <p className={`mt-2 text-sm ${mutedClass}`}>
            The original dark KRAZ appearance.
          </p>

          {isDark && (
            <p className="mt-3 text-sm font-semibold text-violet-400">
              ✓ Selected
            </p>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTheme("light")}
          aria-pressed={!isDark}
          className={getOptionClass(!isDark)}
        >
          <span aria-hidden="true" className="text-2xl">
            ☀️
          </span>

          <h3 className="mt-3 font-semibold">Light mode</h3>

          <p className={`mt-2 text-sm ${mutedClass}`}>
            A brighter workspace appearance.
          </p>

          {!isDark && (
            <p className="mt-3 text-sm font-semibold text-violet-600">
              ✓ Selected
            </p>
          )}
        </button>
      </div>

      <p role="status" className={`mt-5 text-sm ${mutedClass}`}>
        Your theme preference is saved in this browser.
      </p>
    </section>
  );
}
