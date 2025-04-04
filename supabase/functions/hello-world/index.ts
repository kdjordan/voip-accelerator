import { serve } from "std/http/server.ts";

serve(() => {
  return new Response("Hello from Supabase Edge Function!", {
    headers: { "Content-Type": "text/plain" }
  });
});