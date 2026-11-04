const PLANS_REPLY_PATTERN = /Homilivo subscription for \*\*(.+?)\*\*/;

export interface PlansReplyInfo {
  isPlansReply: boolean;
  city: string | null;
}

/*
 * Detects the "subscription plans" bot reply and extracts the city.
 * Call it with the finished message text only.
 */
export function parsePlansReply(text: string): PlansReplyInfo {
  const match = PLANS_REPLY_PATTERN.exec(text);

  if (!match) {
    return { isPlansReply: false, city: null };
  }

  const city = match[1].trim();

  // The rest of the intro sentence, e.g. " and **Jaipur**:"
  const afterCity = text
    .slice(match.index + match[0].length)
    .split(/[:\n]/)[0];

  const hasSeveralCities =
    afterCity.includes("**") || /,|&|\band\b/i.test(city);

  return {
    isPlansReply: true,
    city: city && !hasSeveralCities ? city : null,
  };
}
