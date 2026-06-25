type BraveResult = { title: string; url: string; description: string };

const BRAVE_MAX_COUNT = 20; // limit Brave na jedno żądanie
const PAGE_DELAY_MS = 1100; // free tier ~1 req/s

/**
 * Pobiera wyniki Brave Search z paginacją (offset), bo pojedyncze żądanie
 * zwraca maks. 20 wyników. Domyślnie celuje w ~50 wyników na zapytanie.
 */
export async function searchWeb(
  query: string,
  apiKey: string,
  maxResults = 50
): Promise<BraveResult[]> {
  const results: BraveResult[] = [];
  const seen = new Set<string>();
  const pages = Math.min(Math.ceil(maxResults / BRAVE_MAX_COUNT), 10); // offset Brave: 0..9

  for (let offset = 0; offset < pages; offset++) {
    if (offset > 0) {
      await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
    }

    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", String(BRAVE_MAX_COUNT));
    url.searchParams.set("offset", String(offset));

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": apiKey,
      },
    });

    if (!response.ok) {
      console.error(`Brave search failed (offset=${offset}):`, response.status);
      break;
    }

    const data = (await response.json()) as {
      web?: { results?: BraveResult[] };
    };

    const page = data.web?.results ?? [];
    for (const r of page) {
      if (r.url && !seen.has(r.url)) {
        seen.add(r.url);
        results.push(r);
      }
    }

    // Brave nie ma kolejnej strony — przerywamy, żeby nie marnować żądań/limitu
    if (page.length < BRAVE_MAX_COUNT) break;
    if (results.length >= maxResults) break;
  }

  return results.slice(0, maxResults);
}
