const cache = new Map();
const CACHE_TTL = 60 * 1000; // 60s

export default async function handler(req, res) {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ status: "error" });
    }

    const apiKey = req.query.api || req.body?.api;
    let num = req.query.num || req.body?.num;

    if (apiKey !== "DARZ" || !num) {
      return res.status(401).json({ status: "error" });
    }

    // 🔥 FAST number normalize
    num = ("" + num).replace(/\D/g, "");
    if (num.length > 10) num = num.slice(-10);
    if (num.length !== 10) {
      return res.status(400).json({ status: "error" });
    }

    const now = Date.now();

    // ⚡ ULTRA FAST CACHE RETURN
    const cached = cache.get(num);
    if (cached && now - cached.t < CACHE_TTL) {
      return res.json({
        status: "success",
        provider: "DARZ API",
        owner: "Toji",
        number: num,
        results: cached.d,
        cached: true,
        copyright: "© DARZ API — Made by Toji",
        timestamp: now / 1000 | 0
      });
    }

    // 🎯 TARGET API
    const r = await fetch(
      `https://source-code-api.vercel.app/?num=${num}`,
      {
        headers: {
          "accept": "application/json",
          "user-agent": "Mozilla/5.0"
        }
      }
    );

    const data = JSON.parse(await r.text());
    const src = data.result || [];

    // ⚡ FAST CLEAN (NO EXTRA WORK)
    const results = new Array(src.length);
    for (let i = 0; i < src.length; i++) {
      const x = src[i];
      results[i] = {
        aadhar: x["𝐈𝐃"] || "",
        mobile: x["𝐌𝐨𝐛𝐢𝐥𝐞"] || "",
        name: x["𝐍𝐚𝐦𝐞"] || "",
        father_name: x["𝐅𝐚𝐭𝐡𝐞𝐫'𝐬 𝐍𝐚𝐦𝐞"] || "",
        address: x["𝐀𝐝𝐝𝐫𝐞𝐬𝐬"] ? x["𝐀𝐝𝐝𝐫𝐞𝐬𝐬"].replace(/!/g, ", ") : "",
        alt_mobile: x["𝐀𝐥𝐭𝐞𝐫𝐧𝐚𝐭𝐞 𝐌𝐨𝐛𝐢𝐥𝐞"] || "",
        circle: x["𝐂𝐢𝐫𝐜𝐥𝐞"] || "",
        email: x["𝐄𝐦𝐚𝐢𝐥"] || ""
      };
    }

    cache.set(num, { d: results, t: now });

    return res.json({
      status: "success",
      provider: "DARZ API",
      owner: "Toji",
      number: num,
      results,
      cached: false,
      copyright: "© DARZ API — Made by Toji",
      timestamp: now / 1000 | 0
    });

  } catch {
    return res.status(503).json({ status: "error" });
  }
}
