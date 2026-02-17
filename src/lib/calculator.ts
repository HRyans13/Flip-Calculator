import type { CalculatorInputs, CalculatorResult } from "./types";

export function calculateMaxOffer(inputs: CalculatorInputs): CalculatorResult {
  const {
    arv,
    closingCostsSalePct,
    agentFeesPct,
    desiredProfit,
    holdTimeMonths,
    loanInterestRate,
    pointsPct,
    repairCosts,
    monthlyHoldingCosts,
    closingCostsBuyPct,
  } = inputs;

  const salePct = closingCostsSalePct / 100;
  const agentPct = agentFeesPct / 100;
  const interestMonthly = loanInterestRate / 100 / 12;
  const ptsPct = pointsPct / 100;
  const buyPct = closingCostsBuyPct / 100;

  // Fixed costs that don't depend on purchase price
  const closingCostsAtSale = arv * salePct;
  const agentFees = arv * agentPct;
  const holdingCosts = monthlyHoldingCosts * holdTimeMonths;

  const fixedCosts =
    closingCostsAtSale + agentFees + desiredProfit + holdingCosts + repairCosts;

  const net = arv - fixedCosts;

  // Interest and points on repair_costs portion
  const repairFinancingCost =
    (interestMonthly * holdTimeMonths + ptsPct) * repairCosts;

  // Denominator: 1 + closing_buy% + interest_rate_monthly * months + points%
  const denominator = 1 + buyPct + interestMonthly * holdTimeMonths + ptsPct;

  const maxOffer = (net - repairFinancingCost) / denominator;

  // Now compute the actual breakdown using the solved purchase_price
  const totalLoan = maxOffer + repairCosts;
  const loanInterest = totalLoan * interestMonthly * holdTimeMonths;
  const points = totalLoan * ptsPct;
  const closingCostsAtBuy = maxOffer * buyPct;

  return {
    maxOffer,
    breakdown: {
      arv,
      closingCostsAtSale,
      agentFees,
      desiredProfit,
      repairCosts,
      holdingCosts,
      loanInterest,
      points,
      closingCostsAtBuy,
    },
  };
}
