
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import DeleteButton from "./delete-button";
export const instant = false;
type ImageHistory = {
  id: string;
  tool_type: string;
  original_file_name: string;
  created_at: string;
  result_storage_path: string | null;
  signed_url: string | null;
};

export default async function HistoryPage() {
  const { userId, getToken } = await auth();

  if (!userId) {
    redirect("/");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  const token = await getToken();

  const supabase = createClient(supabaseUrl, supabaseKey, {
    accessToken: async () => token,
  });

  const { data, error } = await supabase
    .from("image_history")
    .select(
      "id, tool_type, original_file_name, created_at, result_storage_path"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const records = data ?? [];

  // Generate temporary URLs for saved images in private Storage.
  const history: ImageHistory[] = await Promise.all(
    records.map(async (item) => {
      let signedUrl: string | null = null;

      if (item.result_storage_path) {
        const { data: signedData, error: signedError } =
          await supabase.storage
            .from("kraz-images")
            .createSignedUrl(item.result_storage_path, 60 * 60);

        if (!signedError && signedData?.signedUrl) {
          signedUrl = signedData.signedUrl;
        }
      }

      return {
        ...item,
        result_storage_path: item.result_storage_path,
        signed_url: signedUrl,
      };
    })
  );

  return (
    <main className="min-h-screen bg-[#0b0912] p-6 text-white md:p-10">
      <nav className="flex items-center justify-between border-b border-white/10 pb-5">
        <Link href="/" className="text-2xl font-black">
          KRAZ<span className="text-violet-400">.</span>
        </Link>

        <Link
          href="/dashboard"
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-gray-300 hover:bg-white/10"
        >
          ← Dashboard
        </Link>
      </nav>

      <section className="mx-auto mt-12 max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">
          Your creative journey
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Image History
        </h1>

        <p className="mt-3 text-gray-400">
          View, preview, download, and manage your previously processed images.
        </p>

        {error ? (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-red-300">
            We couldn&apos;t load your history. Please refresh and try again.
          </div>
        ) : history.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <div className="text-4xl">🖼️</div>

            <h2 className="mt-4 text-xl font-semibold">
              Your history starts here
            </h2>

            <p className="mt-3 text-gray-400">
              Complete an image enhancement or remove an image background
              to see it listed here.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/restore"
                className="rounded-xl bg-violet-600 px-5 py-3 font-semibold hover:bg-violet-500"
              >
                Enhance an image
              </Link>

              <Link
                href="/background-remover"
                className="rounded-xl border border-white/15 px-5 py-3 font-semibold hover:bg-white/10"
              >
                Remove a background
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-gray-400">
              {history.length}{" "}
              {history.length === 1 ? "activity" : "activities"}
            </p>

            {history.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-4">
                  {/* Processed image preview */}
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-violet-400/10">
                    {item.signed_url ? (
                      <img
                        src={item.signed_url}
                        alt={`Processed result for ${item.original_file_name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span
                        className="text-3xl"
                        role="img"
                        aria-label="Image unavailable"
                      >
                        🖼️
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="break-all font-semibold">
                      {item.original_file_name}
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                      {item.tool_type === "image_enhancer"
                        ? "✨ AI Image Enhancer"
                        : item.tool_type === "background_remover"
                          ? "🪄 Background Remover"
                          : item.tool_type}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleString()}
                    </p>

                    {item.signed_url ? (
                      <a
                        href={item.signed_url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
                      >
                        ↓ Download image
                      </a>
                    ) : (
                      <p className="mt-3 text-xs text-amber-300/90">
                        Preview unavailable for this item. It may be an older
                        record or its saved image may no longer be accessible.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                  <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs text-violet-300">
                    Completed
                  </span>

                  <DeleteButton id={item.id} />
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="mt-14 border-t border-white/10 py-6 text-center text-sm text-gray-500">
          KRAZ · Your AI-powered creative workspace
        </footer>
      </section>
    </main>
  );
}
