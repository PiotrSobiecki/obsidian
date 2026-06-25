/** Znane polskie portale biletowe — preferowane przy ekstrakcji linków. */
export const KNOWN_TICKET_HOSTS = [
  "ebilet.pl",
  "eventim.pl",
  "goingapp.pl",
  "ticketmaster.pl",
  "biletomat.pl",
  "universe.com",
  "fans.live",
  "goingapp.com",
  "livenation.pl",
  "empikbilety.pl",
  "tickets.ua",
] as const;

/** Placeholder demo links — nie pokazuj użytkownikowi. */
export function isDemoTicketUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return (
      /\/example\/?$/i.test(parsed.pathname) ||
      parsed.hostname === "example.com" ||
      parsed.pathname.includes("/example/")
    );
  } catch {
    return url.includes("example");
  }
}

export function resolveTicketUrl(
  url: string | null | undefined,
  baseUrl?: string
): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();
  if (trimmed.startsWith("//")) {
    return resolveTicketUrl(`https:${trimmed}`, baseUrl);
  }

  try {
    const resolved = baseUrl ? new URL(trimmed, baseUrl) : new URL(trimmed);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      return null;
    }
    return resolved.href;
  } catch {
    return null;
  }
}

export function isKnownTicketHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return KNOWN_TICKET_HOSTS.some(
      (known) => host === known || host.endsWith(`.${known}`)
    );
  } catch {
    return false;
  }
}

export function looksLikeTicketUrl(url: string): boolean {
  if (isKnownTicketHost(url)) return true;
  try {
    const { pathname, search } = new URL(url);
    return /bilet|ticket|kup|buy|event/i.test(`${pathname}${search}`);
  } catch {
    return false;
  }
}

export function sanitizeTicketUrl(
  url: string | null | undefined,
  baseUrl?: string
): string | null {
  const resolved = resolveTicketUrl(url, baseUrl);
  if (!resolved || isDemoTicketUrl(resolved)) return null;
  return resolved;
}

export function ticketProviderLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const labels: Record<string, string> = {
      "ebilet.pl": "eBilet",
      "eventim.pl": "Eventim",
      "goingapp.pl": "Going",
      "ticketmaster.pl": "Ticketmaster",
      "biletomat.pl": "Biletomat",
      "empikbilety.pl": "Empik Bilety",
      "livenation.pl": "Live Nation",
      "fans.live": "Fans.live",
      "universe.com": "Universe",
    };
    return labels[host] ?? host;
  } catch {
    return "Bilety";
  }
}
