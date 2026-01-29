const cache = new Map();
const CACHE_TTL = 60 * 1000;

// helper: clean weird unicode + normalize keys
function cleanRecord(item) {
  return {
    id: item["𝐈𝐃"] || item["ID"] || "",
    mobile: item["𝐌𝐨𝐛𝐢𝐥𝐞"] || "",
    name: item["𝐍𝐚𝐦𝐞"] || "",
    father_name: item["𝐅𝐚𝐭𝐡𝐞𝐫'𝐬 𝐍𝐚𝐦𝐞"] || "",
    address: (item["𝐀𝐝𝐝𝐫𝐞𝐬𝐬"] || "")
      .replace(/!/g, ", ")
      .replace(/\s+/g, " ")
      .trim(),
    alt_mobile: item["𝐀𝐥𝐭𝐞𝐫𝐧𝐚𝐭𝐞 𝐌𝐨𝐛𝐢𝐥𝐞"] || "",
    circle: item["𝐂𝐢𝐫𝐜𝐥𝐞"] || "",
    email: item["𝐄𝐦𝐚𝐢𝐥"] || ""
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ status: "error", message: "Method not allowed" });
    }

    const apiKey = req.query.api || req.body?.api;
    let num = req.query.num || req.body?.num;

    if (apiKey !== "DARZ") {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    if (!num) {
      return res.status(400).json({ status: "error", message: "Invalid request" });
    }

    num = String(num).replace(/\D/g, "");
    if (num.length > 10) num = num.slice(-10);
    if (num.length !== 10) {
      return res.status(400).json({ status: "error", message: "Invalid number format" });
    }

    const now = Date.now();

    // cache
    if (cache.has(num)) {
      const cached = cache.get(num);
      if (now - cached.time < CACHE_TTL) {
        return res.status(200).json({
          status: "success",
          provider: "DARZ API",
          owner: "Toji",
          number: num,
          results: cached.data,
          cached: true,
          copyright: "© DARZ API — Made by Toji",
          timestamp: Math.floor(now / 1000)
        });
      }
      cache.delete(num);
    }

    const targetUrl = `https://source-code-api.vercel.app/?num=${num}`;
    const response = await fetch(targetUrl, {
      headers: {
        "accept": "application/json,*/*",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/137.0 Mobile Safari/537.36"
      }
    });

    const raw = await response.text();
    const parsed = JSON.parse(raw);

    // 🔥 REMOVE THEIR METADATA & CLEAN RESULTS
    const cleanedResults = Array.isArray(parsed.result)
      ? parsed.result.map(cleanRecord)
      : [];

    cache.set(num, { data: cleanedResults, time: now });

    return res.status(200).json({
      status: "success",
      provider: "DARZ API",
      owner: "Toji",
      number: num,
      results: cleanedResults,
      cached: false,
      copyright: "© DARZ API — Made by Toji",
      timestamp: Math.floor(now / 1000)
    });

  } catch (e) {
    return res.status(503).json({
      status: "error",
      message: "Service unavailable"
    });
  }
}
