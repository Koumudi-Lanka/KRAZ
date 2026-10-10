
"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "../../lib/use-supabase";

export default function SupabaseTestPage() {
  const supabase = useSupabase();
  const [message, setMessage] = useState("Testing connection...");

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from("image_history")
        .select("id, tool_type, original_file_name, created_at")
        .limit(5);

      if (error) {
        setMessage(`Connection test failed: ${error.message}`);
        return;
      }

      setMessage(
        `Connection successful! Retrieved ${data.length} history record(s).`
      );
    }

    testConnection();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="mb-4 text-2xl font-bold">
        Supabase Connection Test
      </h1>
      <p>{message}</p>
    </main>
  );
}
