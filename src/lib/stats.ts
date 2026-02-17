import type {
  AggregateStats,
  BucketMode,
  CompSale,
  TimeBucket,
} from "./types";
import { TIME_PERIODS } from "./constants";

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function computeAggregateStats(comps: CompSale[]): AggregateStats {
  const active = comps.filter((c) => !c.excluded);
  const doms = active.map((c) => c.daysOnMarket);
  const prices = active.map((c) => c.salesPrice);
  const ppsf = active.map((c) => c.pricePerSqft);

  return {
    medianDom: median(doms),
    averageDom: average(doms),
    medianPrice: median(prices),
    averagePrice: average(prices),
    medianPricePerSqft: median(ppsf),
    averagePricePerSqft: average(ppsf),
    count: active.length,
  };
}

export function buildTimeBuckets(
  comps: CompSale[],
  mode: BucketMode
): TimeBucket[] {
  const buckets: TimeBucket[] = [];
  let prevMax = 0;

  for (const period of TIME_PERIODS) {
    const minDays = mode === "exclusive" ? prevMax : 0;
    const maxDays = period;

    const bucketComps = comps.filter(
      (c) => c.daysAgo > minDays && c.daysAgo <= maxDays
    );

    const label =
      mode === "exclusive"
        ? `${minDays === 0 ? 0 : minDays + 1}–${maxDays} days`
        : `0–${maxDays} days`;

    buckets.push({
      label,
      minDays,
      maxDays,
      comps: bucketComps,
      stats: computeAggregateStats(bucketComps),
    });

    prevMax = period;
  }

  return buckets;
}

export function computeArv(
  comps: CompSale[],
  subjectSqft: number,
  mode: "median" | "average"
): number {
  const active = comps.filter((c) => !c.excluded);
  if (active.length === 0 || subjectSqft === 0) return 0;
  const ppsfs = active.map((c) => c.pricePerSqft);
  const ppsf = mode === "median" ? median(ppsfs) : average(ppsfs);
  return ppsf * subjectSqft;
}
