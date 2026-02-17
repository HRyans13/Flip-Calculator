import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import type { PropertyDetails, HomeType, InputType } from "@/lib/types";

function detectInputType(value: string): InputType {
  if (/^https?:\/\//i.test(value)) return "url";
  if (/^\d{3,}[-.\s]?\d*[-.\s]?\d*$/.test(value)) return "parcel";
  return "address";
}

function normalizeHomeType(raw: string): HomeType {
  const lower = raw.toLowerCase();
  if (
    lower.includes("single") ||
    lower.includes("house") ||
    lower.includes("residential")
  )
    return "Single Family";
  if (
    lower.includes("condo") ||
    lower.includes("town") ||
    lower.includes("duplex") ||
    lower.includes("triplex") ||
    lower.includes("multi") ||
    lower.includes("attached")
  )
    return "Attached / Multi-unit";
  if (lower.includes("manufactured") || lower.includes("mobile"))
    return "Manufactured";
  if (lower.includes("land") || lower.includes("lot")) return "Land / Lots";
  return "Single Family";
}

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

async function scrapeFromUrl(url: string): Promise<PropertyDetails> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Try Zillow parsing
  if (url.includes("zillow.com")) {
    return parseZillow($, url);
  }
  // Try Redfin parsing
  if (url.includes("redfin.com")) {
    return parseRedfin($, url);
  }

  throw new Error("Unsupported URL. Please use a Zillow or Redfin link.");
}

function parseZillow(
  $: cheerio.CheerioAPI,
  url: string
): PropertyDetails {
  // Zillow embeds property data in JSON-LD or script tags
  let data: Record<string, unknown> = {};

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html() || "");
      if (parsed["@type"] === "SingleFamilyResidence" || parsed["@type"] === "Residence") {
        data = parsed;
      }
    } catch {
      // ignore parse errors
    }
  });

  // Also try the __NEXT_DATA__ or preloaded state
  const nextDataScript = $("script#__NEXT_DATA__").html();
  if (nextDataScript) {
    try {
      const nextData = JSON.parse(nextDataScript);
      const pageProps = nextData?.props?.pageProps;
      if (pageProps?.componentProps?.gdpClientCache) {
        const cacheStr = JSON.stringify(pageProps.componentProps.gdpClientCache);
        const parsed = JSON.parse(cacheStr);
        const firstKey = Object.keys(parsed)[0];
        if (firstKey) {
          const prop = parsed[firstKey]?.property;
          if (prop) data = prop;
        }
      }
    } catch {
      // ignore
    }
  }

  // Fallback to meta tags and page content
  const address =
    $('meta[property="og:title"]').attr("content")?.split("|")[0]?.trim() ||
    $("h1").first().text().trim() ||
    "Unknown Address";

  const bedrooms = extractNumber($, [
    '[data-testid="bed-bath-item"]:contains("bd")',
    ".ds-bed-bath-living-area span:first",
  ]) || (data as { bedrooms?: number }).bedrooms || 0;

  const bathrooms = extractNumber($, [
    '[data-testid="bed-bath-item"]:contains("ba")',
    ".ds-bed-bath-living-area span:nth-child(3)",
  ]) || (data as { bathroomsFull?: number }).bathroomsFull || 0;

  const sqft = extractNumber($, [
    '[data-testid="bed-bath-item"]:contains("sqft")',
    ".ds-bed-bath-living-area span:nth-child(5)",
  ]) || (data as { livingArea?: number }).livingArea || 0;

  const yearBuilt = extractNumber($, [
    '.ds-home-fact-list-item:contains("Built") .ds-body',
  ]) || (data as { yearBuilt?: number }).yearBuilt || 0;

  const homeTypeRaw =
    $(".ds-home-fact-list-item:contains('Type') .ds-body").text() ||
    (data as { propertyTypeDimension?: string }).propertyTypeDimension ||
    "Single Family";

  const lotSize =
    $(".ds-home-fact-list-item:contains('Lot') .ds-body").text().trim() ||
    "N/A";

  const state = address.match(/,\s*([A-Z]{2})\s+\d{5}/)?.[1] || "";

  return {
    address,
    bedrooms: typeof bedrooms === "number" ? bedrooms : 0,
    bathrooms: typeof bathrooms === "number" ? bathrooms : 0,
    sqft: typeof sqft === "number" ? sqft : 0,
    yearBuilt: typeof yearBuilt === "number" ? yearBuilt : 0,
    homeType: normalizeHomeType(String(homeTypeRaw)),
    lotSize,
    state,
  };
}

function parseRedfin(
  $: cheerio.CheerioAPI,
  url: string
): PropertyDetails {
  const address =
    $("title").text().split("|")[0]?.trim() ||
    $("h1").first().text().trim() ||
    "Unknown Address";

  // Redfin key details area
  const statsText = $(".HomeMainStats, .home-main-stats-variant").text();

  const bedrooms =
    extractNumber($, [".stat-block:contains('Beds') .stat-value", "span.beds"]) ||
    parseInt(statsText.match(/(\d+)\s*[Bb]ed/)?.[1] || "0");

  const bathrooms =
    extractNumber($, [".stat-block:contains('Bath') .stat-value", "span.baths"]) ||
    parseFloat(statsText.match(/([\d.]+)\s*[Bb]ath/)?.[1] || "0");

  const sqft =
    extractNumber($, [
      ".stat-block:contains('Sq Ft') .stat-value",
      "span.sqft",
    ]) || parseInt(statsText.replace(/,/g, "").match(/([\d,]+)\s*[Ss]q/)?.[1] || "0");

  const yearBuilt = extractNumber($, [
    ".keyDetail:contains('Built') .content",
    'td:contains("Year Built") + td',
  ]) || 0;

  const homeTypeRaw =
    $(".keyDetail:contains('Style') .content").text() ||
    $(".keyDetail:contains('Type') .content").text() ||
    "Single Family";

  const lotSize =
    $(".keyDetail:contains('Lot Size') .content").text().trim() || "N/A";

  const state = address.match(/,\s*([A-Z]{2})\s+\d{5}/)?.[1] || "";

  return {
    address,
    bedrooms,
    bathrooms,
    sqft,
    yearBuilt,
    homeType: normalizeHomeType(homeTypeRaw),
    lotSize,
    state,
  };
}

async function searchByAddress(address: string): Promise<PropertyDetails> {
  // Use Redfin's search endpoint to find the property
  const searchUrl = `https://www.redfin.com/stingray/do/location-autocomplete?location=${encodeURIComponent(
    address
  )}&v=2`;

  const searchRes = await fetch(searchUrl, { headers: HEADERS });
  if (!searchRes.ok)
    throw new Error("Could not search for address. Try pasting a direct Redfin link.");

  const text = await searchRes.text();
  // Redfin returns "{}&&{...}" format
  const jsonStr = text.replace(/^{}&&/, "");
  const searchData = JSON.parse(jsonStr);

  const exactMatch =
    searchData?.payload?.exactMatch ||
    searchData?.payload?.sections?.[0]?.rows?.[0];

  if (!exactMatch?.url) {
    throw new Error(
      "Property not found. Check the address spelling or try pasting a direct Redfin link."
    );
  }

  const propertyUrl = `https://www.redfin.com${exactMatch.url}`;
  return scrapeFromUrl(propertyUrl);
}

function extractNumber(
  $: cheerio.CheerioAPI,
  selectors: string[]
): number {
  for (const sel of selectors) {
    const text = $(sel).first().text().replace(/[^0-9.]/g, "");
    const num = parseFloat(text);
    if (!isNaN(num)) return num;
  }
  return 0;
}

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();
    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "Input is required" },
        { status: 400 }
      );
    }

    const inputType = detectInputType(input.trim());
    let property: PropertyDetails;

    switch (inputType) {
      case "url":
        property = await scrapeFromUrl(input.trim());
        break;
      case "parcel":
        // For parcel numbers, we can't directly look them up via scraping
        // Direct the user to use the TN assessment portal
        return NextResponse.json(
          {
            error:
              "Parcel number lookup requires the TN Assessment Portal. Please enter a street address or paste a property link instead.",
          },
          { status: 400 }
        );
      case "address":
      default:
        property = await searchByAddress(input.trim());
        break;
    }

    return NextResponse.json({ property });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
