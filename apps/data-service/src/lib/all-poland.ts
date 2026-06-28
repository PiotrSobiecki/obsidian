export const ALL_POLAND_SLUG = "cala-polska";

export const ALL_POLAND_CITY = {
  name: "Cała Polska",
  slug: ALL_POLAND_SLUG,
} as const;

export function isAllPolandSlug(slug: string): boolean {
  return slug === ALL_POLAND_SLUG;
}
