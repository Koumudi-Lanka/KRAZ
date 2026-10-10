"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSupabase } from "../../lib/use-supabase";

export default function BackgroundRemoverPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { userId } = useAuth();
  const supabase = useSupabase();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyMessage, setHistoryMessage] = useState("");

  // Release temporary browser image URLs when they are replaced or the page unmounts.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result);
    };
  }, [result]);

  function chooseFile(selected?: File) {
    if (!selected || loading) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setError("Please choose a JPG, PNG, or WebP image.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (selected.size > 15 * 1024 * 1024) {
      setError("Your image must be smaller than 15 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setError("");
    setHistoryMessage("");
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult("");
  }

  async function removeBackground() {
    if (!file || loading) {
      if (!file) setError("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setHistoryMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "http://127.0.0.1:8000/remove-background",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        let message = "Background removal failed. Please try again.";

        try {
          const details = await response.json();

          if (details.detail) {
            message =
              typeof details.detail === "string"
                ? details.detail
                : JSON.stringify(details.detail);
          }
        } catch {
          // Keep the default error message.
        }

        throw new Error(message);
      }

      const imageBlob = await response.blob();

      if (!imageBlob.type.startsWith("image/")) {
        throw new Error(
          "The AI backend did not return a valid image. Please try again."
        );
      }

      // Display the result immediately, even if saving to history fails.
      setResult(URL.createObjectURL(imageBlob));

      if (!userId) {
        setHistoryMessage(
          "Background removed successfully. Sign in to save your history."
        );
        return;
      }

      let storagePath: string | null = null;

      try {
        storagePath = `${userId}/${crypto.randomUUID()}.png`;

        const { error: uploadError } = await supabase.storage
          .from("kraz-images")
          .upload(storagePath, imageBlob, {
            contentType: imageBlob.type,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { error: historyError } = await supabase
          .from("image_history")
          .insert({
            user_id: userId,
            tool_type: "background_remover",
            original_file_name: file.name,
            result_storage_path: storagePath,
          });

        if (historyError) {
          const { error: cleanupError } = await supabase.storage
            .from("kraz-images")
            .remove([storagePath]);

          if (cleanupError) {
            console.error(
              "Storage cleanup failed:",
              cleanupError.message
            );
          }

          throw historyError;
        }

        setHistoryMessage(
          "Background removal saved to your history with its image file."
        );
      } catch (saveError) {
        console.error(
          "Could not save background-removal result:",
          saveError
        );

        setHistoryMessage(
          "Background removed successfully, but saving it to history failed. Check the browser console for details."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the KRAZ AI backend."
      );
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    if (loading) return;

    setFile(null);
    setPreview("");
    setResult("");
    setError("");
    setHistoryMessage("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0912] text-white">
      <nav className="flex items-center justify-between border-b border-white/10 px-6 py-5 md:px-12">
        <a href="/" className="text-2xl font-black tracking-tight">
          KRAZ<span className="text-violet-400">.</span>
        </a>

        <a
          href="/restore"
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10"
        >
          Image Enhancer
        </a>
      </nav>

      <section className="mx-auto max-w-6xl px-5 py-14 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-sm text-violet-300">
            <span>✦</span> AI-Powered Image Editing
          </div>

          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Remove backgrounds.
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Keep the magic.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-gray-400 md:text-lg">
            Turn ordinary images into clean, transparent PNGs with KRAZ AI.
            No manual selection required.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-violet-950/20 md:p-8">
          {!preview ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                chooseFile(event.dataTransfer.files[0]);
              }}
              className="flex min-h-72 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-400/30 bg-violet-400/[0.04] p-8 text-center transition hover:border-violet-400/70 hover:bg-violet-400/[0.08]"
            >
              <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-400/15 text-3xl">
                ↑
              </span>

              <span className="text-xl font-bold">Upload your image</span>

              <span className="mt-2 text-sm text-gray-400">
                Click to browse or drag and drop
              </span>

              <span className="mt-4 text-xs text-gray-500">
                JPG, PNG or WebP · Maximum 15 MB
              </span>
            </button>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-semibold text-gray-300">
                  Original image
                </p>

                <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3">
                  <img
                    src={preview}
                    alt="Original upload"
                    className="max-h-96 max-w-full rounded-lg object-contain"
                  />
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-gray-300">
                  Transparent result
                </p>

                <div
                  className="flex min-h-64 items-center justify-center overflow-hidden rounded-2xl border border-white/10 p-3"
                  style={{
                    backgroundColor: "#ffffff",
                    backgroundImage:
                      "linear-gradient(45deg,#d8d8df 25%,transparent 25%),linear-gradient(-45deg,#d8d8df 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#d8d8df 75%),linear-gradient(-45deg,transparent 75%,#d8d8df 75%)",
                    backgroundSize: "24px 24px",
                    backgroundPosition:
                      "0 0, 0 12px, 12px -12px, -12px 0px",
                  }}
                >
                  {result ? (
                    <img
                      src={result}
                      alt="Background removed"
                      className="max-h-96 max-w-full object-contain"
                    />
                  ) : (
                    <div className="p-6 text-center text-sm text-gray-600">
                      {loading
                        ? "Your transparent image is being created..."
                        : "Your result will appear here"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={loading}
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />

          {file && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400">
              <span className="max-w-full break-all">
                {file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>

              <button
                type="button"
                onClick={reset}
                disabled={loading}
                className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                Choose another
              </button>
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          {historyMessage && (
            <p
              role="status"
              className="mt-4 text-center text-sm text-violet-300"
            >
              {historyMessage}
            </p>
          )}

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={removeBackground}
              disabled={!file || loading}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-7 py-3.5 font-bold shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Removing background..." : "✦ Remove Background"}
            </button>

            {result && (
              <a
                href={result}
                download="kraz-no-background.png"
                className="rounded-xl border border-white/15 px-7 py-3.5 text-center font-semibold transition hover:bg-white/10"
              >
                ↓ Download PNG
              </a>
            )}
          </div>

          {loading && (
            <p className="mt-4 text-center text-sm text-violet-300">
              KRAZ AI is processing your image. Larger images may take longer.
            </p>
          )}
        </div>

        <p className="mt-7 text-center text-xs text-gray-500">
          Powered by your local KRAZ AI backend · Images are processed on your
          machine
        </p>
      </section>
    </main>
  );
}
