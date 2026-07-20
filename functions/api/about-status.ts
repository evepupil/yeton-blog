import { loadAboutActivityStatus } from "../../lib/about-status/service";

const responseHeaders = {
  "Cache-Control":
    "public, max-age=300, s-maxage=1800, stale-while-revalidate=86400",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
} as const;

export async function onRequestGet(): Promise<Response> {
  try {
    const status = await loadAboutActivityStatus();
    return new Response(JSON.stringify(status), { headers: responseHeaders });
  } catch {
    return new Response(
      JSON.stringify({ code: "ABOUT_STATUS_UNAVAILABLE", retryable: true }),
      {
        headers: { ...responseHeaders, "Cache-Control": "no-store" },
        status: 503,
      },
    );
  }
}
