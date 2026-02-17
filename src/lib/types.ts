export type HomeType =
  | "Single Family"
  | "Attached / Multi-unit"
  | "Manufactured"
  | "Land / Lots";

export interface PropertyDetails {
  address: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt: number;
  homeType: HomeType;
  lotSize: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

export interface CompSale {
  id: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  daysOnMarket: number;
  salesPrice: number;
  pricePerSqft: number;
  dateSold: string; // ISO date string
  daysAgo: number;
  excluded: boolean;
}

export interface CompFilters {
  radiusMiles: number;
  homeType: HomeType;
  bedroomMode: "exact" | "pm1" | "pm2" | "all";
  bathroomMode: "exact" | "pm1" | "pm2" | "all";
  sqftMode: "relative" | "absolute";
  sqftRelativeOffset: number; // in increments of 250
  sqftAbsoluteMin: number;
  sqftAbsoluteMax: number;
  minSalePrice: number | null;
  timePeriodDays: number;
}

export interface AggregateStats {
  medianDom: number;
  averageDom: number;
  medianPrice: number;
  averagePrice: number;
  medianPricePerSqft: number;
  averagePricePerSqft: number;
  count: number;
}

export interface TimeBucket {
  label: string;
  minDays: number;
  maxDays: number;
  comps: CompSale[];
  stats: AggregateStats;
}

export interface CalculatorInputs {
  arv: number;
  arvIsManual: boolean;
  closingCostsSalePct: number;
  agentFeesPct: number;
  desiredProfit: number;
  holdTimeMonths: number;
  loanInterestRate: number;
  pointsPct: number;
  repairCosts: number;
  monthlyHoldingCosts: number;
  closingCostsBuyPct: number;
}

export interface CalculatorResult {
  maxOffer: number;
  breakdown: {
    arv: number;
    closingCostsAtSale: number;
    agentFees: number;
    desiredProfit: number;
    repairCosts: number;
    holdingCosts: number;
    loanInterest: number;
    points: number;
    closingCostsAtBuy: number;
  };
}

export type InputType = "address" | "url" | "parcel";

export type StatMode = "median" | "average";
export type BucketMode = "exclusive" | "cumulative";
export type ActiveTab = "property" | "comps" | "calculator";
