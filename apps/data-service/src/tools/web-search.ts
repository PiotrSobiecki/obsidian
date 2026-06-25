export async function searchWeb(
  query: string,
  apiKey: string
): Promise<Array<{ title: string; url: string; description: string }>> {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "10");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!response.ok) {
    console.error("Brave search failed:", response.status);
    return [];
  }

  const data = (await response.json()) as {
    web?: { results?: Array<{ title: string; url: string; description: string }> };
  };

  return data.web?.results ?? [];
}
