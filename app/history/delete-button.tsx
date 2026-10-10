
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this history item and its saved image? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/history/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete image.");
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "🗑 Delete"}
      </button>

      {error && (
        <p role="alert" className="max-w-xs text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
