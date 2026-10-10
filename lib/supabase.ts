
import { createClient } from "@supabase/supabase-js";

type GetClerkToken = () => Promise<string | null>;

export function createClerkSupabaseClient(
  getToken: GetClerkToken
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  return createClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      accessToken: getToken,
    }
  );
}
