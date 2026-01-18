// ─────────────────────────────────────────────
// DARZ PROXY API
// Owner: Toji
// Runtime: Node.js (Vercel)
// ─────────────────────────────────────────────

// Simple in-memory cache (per instance)
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds

export default async function handler(req, res) {
  try {
    // ─────────────────────────────────────────────
    // 1. METHOD CHECK
    // ─────────────────────────────────────────────
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({
        status: "error",
        message: "Method not allowed"
      });
    }

    // ─────────────────────────────────────────────
    // 2. PARAMS (GET + POST SUPPORT)
    // ─────────────────────────────────────────────
    const apiKey = req.query.api || req.body?.api;
    let num = req.query.num || req.body?.num;

    // ─────────────────────────────────────────────
    // 3. API KEY VALIDATION
    // ─────────────────────────────────────────────
    if (!apiKey || apiKey !== "DARZ") {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized"
      });
    }

    // ─────────────────────────────────────────────
    // 4. NUMBER VALIDATION
    // ─────────────────────────────────────────────
    if (!num) {
      return res.status(400).json({
        status: "error",
        message: "Invalid request"
      });
    }

    // ─────────────────────────────────────────────
    // 5. NUMBER NORMALIZATION
    // ─────────────────────────────────────────────
    num = String(num).replace(/\D/g, "");

    if (num.length > 10) {
      num = num.slice(-10);
    }

    if (num.length !== 10) {
      return res.status(400).json({
        status: "error",
        message: "Invalid number format"
      });
    }

    // ─────────────────────────────────────────────
    // 6. CACHE CHECK
    // ─────────────────────────────────────────────
    const now = Date.now();
    if (cache.has(num)) {
      const cached = cache.get(num);
      if (now - cached.time < CACHE_TTL) {
        return res.status(200).json({
          status: "success",
          provider: "DARZ API",
          owner: "Toji",
          number: num,
          leak: cached.data,
          cached: true,
          copyright:
            "© DARZ API — Made by Toji",
          timestamp: Math.floor(now / 1000)
        });
      } else {
        cache.delete(num);
      }
    }

    // ─────────────────────────────────────────────
    // 7. TARGET API REQUEST (FULLY HIDDEN)
    // ─────────────────────────────────────────────
    const targetUrl = `https://source-code-api.vercel.app/?num=${num}`;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/137.0 Mobile Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error("Target API failed");
    }

    // ─────────────────────────────────────────────
    // 8. STORE RESPONSE IN `leak`
    // ─────────────────────────────────────────────
    const leak = await response.text();

    // Save to cache
    cache.set(num, {
      data: leak,
      time: now
    });

    // ─────────────────────────────────────────────
    // 9. FINAL RESPONSE
    // ─────────────────────────────────────────────
    return res.status(200).json({
      status: "success",
      provider: "DARZ API",
      owner: "Toji",
      number: num,
      leak: leak,
      cached: false,
      copyright:
        "© DARZ API — Made by Toji",
      timestamp: Math.floor(now / 1000)
    });

  } catch (e) {
    // ─────────────────────────────────────────────
    // 10. SAFE ERROR (NO LEAKS)
    // ─────────────────────────────────────────────
    return res.status(503).json({
      status: "error",
      message: "Service unavailable"
    });
  }
}
