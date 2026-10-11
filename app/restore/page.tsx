
"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent,
} from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useSupabase } from "../../lib/use-supabase";

export default function RestorePage() {
  const { userId } = useAuth();
  const supabase = useSupabase();

  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [historyMessage, setHistoryMessage] = useState("");
  const [comparison, setComparison] = useState(50);

  const comparisonRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  // Release temporary preview URLs when they are replaced or the page unmounts.
  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image);
    };
  }, [image]);

  useEffect(() => {
    return () => {
      if (resultImage) URL.revokeObjectURL(resultImage);
    };
  }, [resultImage]);

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPG, PNG, or WebP image.");
      input.value = "";
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("Please choose an image smaller than 15 MB.");
      input.value = "";
      return;
    }

    setImage(URL.createObjectURL(file));
    setFileName(file.name);
    setSelectedFile(file);
    setResultImage(null);
    setComparison(50);
    setError("");
    setHistoryMessage("");
  }

  async function handleEnhance() {
    if (!selectedFile || isProcessing) return;

    setIsProcessing(true);
    setError("");
    setHistoryMessage("");
    setResultImage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Configure this URL in .env.local for local development
      // and in your hosting dashboard for production.
      const aiApiUrl = (
        process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:8000"
      ).replace(/\/+$/, "");

      const response = await fetch(`${aiApiUrl}/enhance`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = "Image enhancement failed. Please try again.";

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

      const blob = await response.blob();

      if (!blob.type.startsWith("image/")) {
        throw new Error("The AI backend did not return a valid image.");
      }

      // Display the enhanced image before attempting to save its history.
      setResultImage(URL.createObjectURL(blob));
      setComparison(50);

      if (!userId) {
        setHistoryMessage(
          "Image enhanced successfully. Sign in to save your history."
        );
        return;
      }

      const storagePath = `${userId}/${crypto.randomUUID()}.png`;

      try {
        // Save the actual enhanced image to Supabase Storage.
        const { error: uploadError } = await supabase.storage
          .from("kraz-images")
          .upload(storagePath, blob, {
            contentType: blob.type,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Record the result in the image history table.
        const { error: historyError } = await supabase
          .from("image_history")
          .insert({
            user_id: userId,
            tool_type: "image_enhancer",
            original_file_name: selectedFile.name,
            result_storage_path: storagePath,
          });

        if (historyError) {
          const { error: cleanupError } = await supabase.storage
            .from("kraz-images")
            .remove([storagePath]);

          if (cleanupError) {
            console.error(
              "Could not remove the uploaded file:",
              cleanupError.message
            );
          }

          throw historyError;
        }

        setHistoryMessage(
          "Enhancement saved to your history with its image file."
        );
      } catch (saveError) {
        console.error("Could not save enhanced image:", saveError);

        setHistoryMessage(
          "Image enhanced successfully, but saving it to your history failed. Check the console for details."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the KRAZ AI backend."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function removeImage() {
    if (isProcessing) return;

    setImage(null);
    setFileName("");
    setSelectedFile(null);
    setResultImage(null);
    setError("");
    setHistoryMessage("");
    setComparison(50);
    draggingRef.current = false;

    const input = document.getElementById(
      "image-upload"
    ) as HTMLInputElement | null;

    if (input) input.value = "";
  }

  function updateComparison(clientX: number) {
    const bounds = comparisonRef.current?.getBoundingClientRect();

    if (!bounds || bounds.width === 0) return;

    const position = ((clientX - bounds.left) / bounds.width) * 100;

    setComparison(Math.max(0, Math.min(100, position)));
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (draggingRef.current) {
      updateComparison(event.clientX);
    }
  }

  function stopDragging() {
    draggingRef.current = false;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080812] px-5 py-7 text-white sm:px-8">
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-40 h-96 w-96 rounded-full bg-violet-700/10 blur-[120px]" />
        <div className="absolute -right-40 top-96 h-96 w-96 rounded-full bg-fuchsia-600/10 blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-2xl font-black tracking-tight">
          KRAZ<span className="text-violet-400">.</span>
        </Link>

        <Link
          href="/dashboard"
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300 transition hover:border-violet-400/40 hover:bg-white/[0.08]"
        >
          ← Dashboard
        </Link>
      </nav>

      <section className="relative mx-auto mt-14 max-w-4xl sm:mt-20">
        {/* Page heading */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
            AI-powered enhancement
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
            Bring your photos
            <br />
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
              back to life.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
            Enhance image details and upscale your photos with KRAZ&apos;s AI
            engine. Your images are sent to the configured AI backend for
            processing.
          </p>
        </div>

        {/* Main enhancement card */}
        <div className="mt-12 rounded-[28px] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-violet-950/20 sm:p-9">
          <label
            htmlFor="image-upload"
            className={`flex min-h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-400/30 bg-violet-400/[0.035] p-6 text-center transition ${
              image
                ? "cursor-default"
                : "cursor-pointer hover:border-violet-400/70 hover:bg-violet-400/[0.07]"
            }`}
          >
            {image ? (
              <img
                src={image}
                alt="Original uploaded photo"
                className="max-h-72 max-w-full rounded-xl object-contain"
              />
            ) : (
              <>
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-500/10 text-3xl text-violet-300">
                  ↑
                </div>

                <span className="text-lg font-semibold">
                  Drop into a better picture
                </span>

                <span className="mt-2 text-sm text-slate-400">
                  Click to choose a photo from your computer
                </span>

                <span className="mt-4 text-xs text-slate-500">
                  JPG, PNG or WebP · Maximum 15 MB
                </span>
              </>
            )}

            <input
              id="image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isProcessing}
            />
          </label>

          {/* Selected file details */}
          {image && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="break-all text-sm text-slate-300">
                Selected: {fileName}
              </p>

              <button
                type="button"
                onClick={removeImage}
                disabled={isProcessing}
                className="text-sm text-rose-300 transition hover:text-rose-200 disabled:opacity-40"
              >
                Remove image
              </button>
            </div>
          )}

          {/* Enhance button */}
          <button
            type="button"
            disabled={!selectedFile || isProcessing}
            onClick={handleEnhance}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-4 font-bold shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isProcessing
              ? "✦ Enhancing your photo..."
              : "✦ Enhance image with AI →"}
          </button>

          {isProcessing && (
            <p className="mt-4 animate-pulse text-center text-sm text-violet-300">
              Your AI engine is processing the image. Larger images may take
              longer.
            </p>
          )}

          {/* Enhancement errors */}
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200"
            >
              {error}
            </p>
          )}

          {/* Database and Storage status */}
          {historyMessage && (
            <p
              role="status"
              className="mt-4 text-center text-sm text-violet-300"
            >
              {historyMessage}
            </p>
          )}

          {/* Before-and-after comparison */}
          {resultImage && image && (
            <section className="mt-10 border-t border-white/10 pt-9">
              <div className="mb-6 text-center">
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
                  ✦ Enhancement complete
                </div>

                <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                  See the transformation.
                </h2>

                <p className="mt-3 text-sm text-slate-400">
                  Drag the divider to compare your original and enhanced
                  images. You can also focus the divider and use the left and
                  right arrow keys.
                </p>
              </div>

              <div
                ref={comparisonRef}
                className="relative isolate mx-auto w-full select-none overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-violet-950/20"
                onPointerMove={handlePointerMove}
                onPointerUp={stopDragging}
                onPointerCancel={stopDragging}
                onLostPointerCapture={stopDragging}
              >
                {/* Enhanced image */}
                <img
                  src={resultImage}
                  alt="AI-enhanced photo"
                  draggable={false}
                  className="block h-auto max-h-[650px] w-full object-contain"
                />

                {/* Original image overlay */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    clipPath: `inset(0 ${100 - comparison}% 0 0)`,
                  }}
                >
                  <img
                    src={image}
                    alt="Original photo before enhancement"
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                </div>

                {/* Original label */}
                <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/10 bg-black/65 px-3 py-2 text-[10px] font-bold tracking-[0.15em] backdrop-blur-md sm:left-4 sm:top-4 sm:text-xs">
                  ORIGINAL
                </div>

                {/* Enhanced label */}
                <div className="pointer-events-none absolute right-3 top-3 rounded-lg border border-violet-300/30 bg-violet-950/75 px-3 py-2 text-[10px] font-bold tracking-[0.15em] text-violet-100 backdrop-blur-md sm:right-4 sm:top-4 sm:text-xs">
                  AI ENHANCED
                </div>

                {/* Draggable slider divider */}
                <div
                  className="absolute bottom-0 top-0 z-10 w-[3px] cursor-ew-resize bg-white shadow-[0_0_14px_rgba(167,139,250,0.9)]"
                  style={{
                    left: `${comparison}%`,
                    transform: "translateX(-50%)",
                    touchAction: "none",
                  }}
                  onPointerDown={(event) => {
                    draggingRef.current = true;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    updateComparison(event.clientX);
                  }}
                  role="slider"
                  aria-label="Before and after comparison"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(comparison)}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowLeft") {
                      event.preventDefault();
                      setComparison((value) => Math.max(0, value - 5));
                    }

                    if (event.key === "ArrowRight") {
                      event.preventDefault();
                      setComparison((value) => Math.min(100, value + 5));
                    }
                  }}
                >
                  <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_0_30px_rgba(139,92,246,0.65)]">
                    <span className="text-lg font-bold text-white">↔</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>← Original</span>
                <span>Enhanced →</span>
              </div>

              {/* Reset and download */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setComparison(50)}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/[0.06]"
                >
                  Reset comparison
                </button>

                <a
                  href={resultImage}
                  download={`kraz-enhanced-${fileName.replace(/\.[^.]+$/, "")}.png`}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-center text-sm font-bold shadow-lg shadow-violet-950/30 transition hover:brightness-110"
                >
                  Download enhanced image ↓
                </a>
              </div>
            </section>
          )}

          <p className="mt-6 text-center text-xs leading-6 text-slate-500">
            Powered by your configured KRAZ image-enhancement backend.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          KRAZ · Your photos, enhanced with AI.
        </p>
      </section>
    </main>
  );
}
