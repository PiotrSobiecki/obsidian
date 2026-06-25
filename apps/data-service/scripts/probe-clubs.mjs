const urls = [
  "https://b90.pl/",
  "https://alchemia.com.pl/",
  "https://alchemia.com.pl/koncert/",
  "https://ubazyla.pl/wydarzenia/",
  "https://goingapp.pl/miejsce/proxima",
  "https://chmury.net/",
  "https://klubproxima.pl/",
];

for (const u of urls) {
  const r = await fetch(u, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "pl-PL,pl;q=0.9" },
  });
  const h = await r.text();
  const ld = [...h.matchAll(/application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  console.log("\n===", u, r.status, "jsonld blocks:", ld.length);
  for (const m of ld) {
    try {
      const j = JSON.parse(m[1]);
      const t = JSON.stringify(j).slice(0, 200);
      if (/Event|MusicEvent/i.test(t)) console.log(" EVENT:", t);
    } catch {}
  }
  const articles = [...h.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([^<]{4,100})<\/a>/gi)]
    .filter((m) => /202[5-9]|koncert|bilet|ticket/i.test(m[0]))
    .slice(0, 8);
  for (const [, href, label] of articles) {
    console.log(" ", label.trim().replace(/\s+/g, " "), "->", href);
  }
}
