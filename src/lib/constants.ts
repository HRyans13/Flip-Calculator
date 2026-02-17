import type { CalculatorInputs, CompFilters } from "./types";

export const DEFAULT_CALCULATOR_INPUTS: Omit<CalculatorInputs, "arv" | "arvIsManual"> = {
  closingCostsSalePct: 2,
  agentFeesPct: 5,
  desiredProfit: 60000,
  holdTimeMonths: 6,
  loanInterestRate: 13,
  pointsPct: 2,
  repairCosts: 85000,
  monthlyHoldingCosts: 125,
  closingCostsBuyPct: 2,
};

export const DEFAULT_COMP_FILTERS: Omit<CompFilters, "homeType"> = {
  radiusMiles: 1,
  bedroomMode: "exact",
  bathroomMode: "exact",
  sqftMode: "relative",
  sqftRelativeOffset: 250,
  sqftAbsoluteMin: 0,
  sqftAbsoluteMax: 10000,
  minSalePrice: null,
  timePeriodDays: 180,
};

export const TIME_PERIODS = [30, 60, 90, 120, 180] as const;

export const HOME_TYPES = [
  "Single Family",
  "Attached / Multi-unit",
  "Manufactured",
  "Land / Lots",
] as const;

export const BEDROOM_MODES = [
  { value: "exact", label: "Exact" },
  { value: "pm1", label: "±1" },
  { value: "pm2", label: "±2" },
  { value: "all", label: "All" },
] as const;

export const BATHROOM_MODES = BEDROOM_MODES;
