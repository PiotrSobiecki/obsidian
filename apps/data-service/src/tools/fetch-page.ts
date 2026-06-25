import type { Fetcher } from "@cloudflare/workers-types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const DEFAULT_HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pl-PL,pl;q=0.9,en;q=0.8",
};

const FETCH_TIMEOUT_MS = 15_000;
const BROWSER_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function httpFetch(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: DEFAULT_HEADERS,
      signal: controller.signal,
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timer);
  }
}

function htmlTextLength(html: string): number {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

async function browserFetch(url: string, browser: Fetcher): Promise<string> {
  const session = await withTimeout(
    browser.fetch(url, {
      headers: DEFAULT_HEADERS,
    }),
    BROWSER_TIMEOUT_MS,
    "Browser fetch"
  );
  if (!session.ok) {
    throw new Error(`Browser fetch ${url}: ${session.status}`);
  }
  return session.text();
}

const BROWSER_FIRST_HOSTS = [/goingapp\.pl/i];

export async function fetchPage(
  url: string,
  browser?: Fetcher
): Promise<string> {
  if (browser && BROWSER_FIRST_HOSTS.some((re) => re.test(url))) {
    try {
      const rendered = await browserFetch(url, browser);
      if (htmlTextLength(rendered) >= 200) return rendered;
    } catch (error) {
      console.warn(`[fetch] Browser-first failed for ${url}:`, error);
    }
  }

  let primaryError: unknown;
  let html: string | undefined;

  try {
    html = await httpFetch(url);
  } catch (error) {
    primaryError = error;
  }

  const needsBrowser =
    !html || htmlTextLength(html) < 500;

  if (!needsBrowser && html) {
    return html;
  }

  if (browser) {
    try {
      const rendered = await browserFetch(url, browser);
      if (htmlTextLength(rendered) >= 200) {
        return rendered;
      }
      if (html && htmlTextLength(html) > htmlTextLength(rendered)) {
        return html;
      }
      return rendered;
    } catch (browserError) {
      console.warn(`[fetch] Browser fallback failed for ${url}:`, browserError);
    }
  }

  if (html) return html;
  throw primaryError ?? new Error(`Failed to fetch ${url}`);
}

export function stripHtml(html: string, maxLength = 12000): string {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, maxLength);
}
