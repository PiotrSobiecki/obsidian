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



export function isValidTicketUrl(url: string | null | undefined): url is string {

  return Boolean(url && !isDemoTicketUrl(url));

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

      "mysticfestival.pl": "Mystic Festival",

      "polandrockfestival.pl": "Pol'and'Rock",

      "metalmania.com.pl": "Metalmania",

      "castleparty.com": "Castle Party",

    };

    return labels[host] ?? host;

  } catch {

    return "Bilety";

  }

}



export function formatTicketHost(url: string): string {

  try {

    return new URL(url).hostname.replace(/^www\./, "");

  } catch {

    return url;

  }

}

