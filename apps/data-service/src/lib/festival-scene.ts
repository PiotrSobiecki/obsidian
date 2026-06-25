const FESTIVAL_URL_PATTERNS = [
  /festiwal/i,
  /festival/i,
  /mysticfestival/i,
  /polandrock/i,
  /metalmania/i,
  /castleparty/i,
  /jarocin/i,
  /ebilet\.pl\/festiwal/i,
  /goingapp\.pl\/festiwal/i,
];

const ROCK_METAL_FESTIVALS = [
  "Mystic Festival",
  "Pol'and'Rock",
  "Metalmania",
  "Castle Party",
  "Jarocin",
  "Full Metal Mountain",
  "Rock Fest",
];

export function isFestivalSourceUrl(url: string): boolean {
  return FESTIVAL_URL_PATTERNS.some((re) => re.test(url));
}

export function isFestivalEvent(title: string, venueName = ""): boolean {
  const text = `${title} ${venueName}`;
  return /\bfestiwal\b|\bfestival\b/i.test(text);
}

export { ROCK_METAL_FESTIVALS };
