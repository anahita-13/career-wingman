/**
 * Job Hunt Chief of Staff — URL reader proxy (Cloudflare Worker)
 * ------------------------------------------------------------------
 * Purpose: a browser page cannot fetch an arbitrary job posting
 * (cross-origin + JS-rendered). This tiny Worker does the fetch
 * server-side, strips the HTML to readable text, and returns it as
 * JSON so the app can feed it to Gemini as a pasted-JD.
 *
 * It reads the page HTML only. It does NOT call Gemini and never sees
 * your API key — the app still calls Gemini directly from the browser.
 *
 * Deploy (free):
 *   1. Create a free account at https://dash.cloudflare.com
 *   2. Workers & Pages -> Create -> Worker -> name it (e.g. jd-reader)
 *   3. "Edit code", paste this whole file, Deploy.
 *   4. Copy the Worker URL (e.g. https://jd-reader.YOURNAME.workers.dev)
 *   5. In the app: API key modal -> paste that URL in "JD reader URL".
 *
 * Security note: this is an open proxy that will fetch any URL you give
 * it. For a personal demo that's fine. If you want to lock it down,
 * restrict ALLOWED_HOSTS below to the job boards you actually use.
 */

const ALLOWED_HOSTS = null; // e.g. ["careers.microsoft.com","boards.greenhouse.io"] or null to allow all

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }
    const url = new URL(request.url);
    const target = url.searchParams.get("url");
    if (!target) {
      return json({ error: "Pass ?url=<job posting url>" }, 400);
    }
    let targetUrl;
    try { targetUrl = new URL(target); } catch (e) {
      return json({ error: "Invalid url" }, 400);
    }
    if (targetUrl.protocol !== "https:" && targetUrl.protocol !== "http:") {
      return json({ error: "Only http/https allowed" }, 400);
    }
    if (ALLOWED_HOSTS && !ALLOWED_HOSTS.some(h => targetUrl.hostname.endsWith(h))) {
      return json({ error: "Host not allowed" }, 403);
    }

    try {
      const res = await fetch(targetUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; JD-Reader/1.0)",
          "Accept": "text/html,application/xhtml+xml",
        },
        cf: { cacheTtl: 300 },
      });
      if (!res.ok) return json({ error: "Fetch failed: HTTP " + res.status }, 502);
      const html = await res.text();
      const text = htmlToText(html);
      return json({
        url: targetUrl.toString(),
        title: extractTitle(html),
        text: text.slice(0, 12000),
        length: text.length,
      });
    } catch (e) {
      return json({ error: "Fetch error: " + (e && e.message ? e.message : "unknown") }, 502);
    }
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1].trim()).slice(0, 200) : "";
}

function htmlToText(html) {
  let s = html;
  // Drop non-content blocks
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  s = s.replace(/<svg[\s\S]*?<\/svg>/gi, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  // Turn block boundaries into newlines so lists/paras stay readable
  s = s.replace(/<\/(p|div|li|h[1-6]|section|article|br|tr)>/gi, "\n");
  s = s.replace(/<li[^>]*>/gi, "\n• ");
  // Strip remaining tags
  s = s.replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);
  // Collapse whitespace
  s = s.replace(/[ \t\f\v]+/g, " ");
  s = s.replace(/\s*\n\s*/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}
