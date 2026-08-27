/**
 * Job Hunt Chief of Staff — cloud sync (Cloudflare Worker + KV)
 * ------------------------------------------------------------------
 * Stores one JSON blob per "sync code" so you can share your pipeline
 * between devices (laptop + phone). It is a simple key-value store:
 *   PUT  /?code=<your-code>   body: {state, savedAt}   -> saves
 *   GET  /?code=<your-code>                              -> returns it
 *
 * SECURITY: the sync code IS the password. Anyone with the URL + code
 * can read and overwrite that record. Use a long, private code. This
 * Worker never sees your Gemini key.
 *
 * DEPLOY (free):
 *   1. https://dash.cloudflare.com -> Workers & Pages -> Create -> Worker.
 *      Name it e.g. "jhcos-sync". Paste this file. Deploy.
 *   2. Create a KV namespace: Workers & Pages -> KV -> Create namespace,
 *      name it "JHCOS" (or anything).
 *   3. Bind it to the Worker: open the Worker -> Settings -> Variables ->
 *      "KV Namespace Bindings" -> Add binding:
 *          Variable name: JHCOS_KV
 *          KV namespace : (the one you created)
 *      Save and Deploy.
 *   4. Copy the Worker URL (https://jhcos-sync.YOURNAME.workers.dev).
 *   5. In the app: Sync -> paste that URL + a private sync code on each
 *      device -> Push on one, Pull on the other.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    if (!code || code.length < 6) {
      return json({ error: "Missing or too-short ?code= (use a private passphrase, 6+ chars)" }, 400);
    }
    if (!env.JHCOS_KV) {
      return json({ error: "KV not bound. Add a KV namespace binding named JHCOS_KV (see file header)." }, 500);
    }
    const key = "state:" + code;

    if (request.method === "PUT") {
      let body;
      try { body = await request.json(); } catch (e) { return json({ error: "Invalid JSON body" }, 400); }
      if (!body || !body.state) return json({ error: "Body must be {state, savedAt}" }, 400);
      await env.JHCOS_KV.put(key, JSON.stringify({ state: body.state, savedAt: body.savedAt || Date.now() }));
      return json({ ok: true, savedAt: body.savedAt || Date.now() });
    }

    if (request.method === "GET") {
      const raw = await env.JHCOS_KV.get(key);
      if (!raw) return json({ error: "No data for this code yet" }, 404);
      return new Response(raw, { headers: { "Content-Type": "application/json", ...CORS } });
    }

    return json({ error: "Use GET or PUT" }, 405);
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
