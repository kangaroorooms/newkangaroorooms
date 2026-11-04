export const PRICING_PAGE_URL = "https://homilivo.com/pricing";

// Query parameter used to pass the city. Set to "" to disable.
export const CITY_QUERY_PARAM = "city";

export function buildPricingUrl(city: string | null): string {
  const url = new URL(PRICING_PAGE_URL);

  if (city && CITY_QUERY_PARAM) {
    url.searchParams.set(CITY_QUERY_PARAM, city);
  }

  return url.toString();
}
