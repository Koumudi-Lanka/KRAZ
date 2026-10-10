
"use client";

import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { createClerkSupabaseClient } from "./supabase";

export function useSupabase() {
  const { getToken } = useAuth();

  const supabase = useMemo(
    () =>
      createClerkSupabaseClient(async () => {
        // Clerk's browser token must not be requested during SSR.
        if (typeof window === "undefined") {
          return null;
        }

        return getToken();
      }),
    [getToken]
  );

  return supabase;
}
