"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { calculateMaxOffer } from "@/lib/calculator";
import type { CalculatorInputs } from "@/lib/types";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";

export function CalculatorTab() {
  const { state, dispatch } = useApp();
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  if (state.activeTab !== "calculator") return null;

  const inputs = state.calculatorInputs;
  const result = calculateMaxOffer(inputs);

  const update = (updates: Partial<CalculatorInputs>) => {
    dispatch({ type: "UPDATE_CALCULATOR", inputs: updates });
  };

  const resetArv = () => {
    update({ arvIsManual: false });
    // The context reducer will recalculate ARV from comps on next stat mode change
    // For now, force a stat mode re-dispatch to trigger recalculation
    dispatch({ type: "SET_STAT_MODE", mode: state.statMode });
  };

  return (
    <div className="space-y-6">
      {/* Max Offer Output */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center dark:border-neutral-700 dark:bg-neutral-800">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Maximum Offer
        </p>
        <p className="mt-2 text-4xl font-bold text-neutral-900 dark:text-neutral-100">
          {result.maxOffer > 0
            ? formatCurrency(result.maxOffer)
            : "$—"}
        </p>

        {/* Collapsible Breakdown */}
        <button
          onClick={() => setBreakdownOpen(!breakdownOpen)}
          className="mx-auto mt-4 flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          {breakdownOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          {breakdownOpen ? "Hide" : "Show"} Breakdown
        </button>

        {breakdownOpen && result.maxOffer > 0 && (
          <div className="mt-3 border-t border-neutral-100 pt-3 text-left dark:border-neutral-700">
            <div className="mx-auto max-w-sm space-y-1.5 font-mono text-sm">
              <BreakdownLine
                label="ARV"
                value={result.breakdown.arv}
                isFirst
              />
              <BreakdownLine
                label={`Closing Costs at Sale (${inputs.closingCostsSalePct}%)`}
                value={result.breakdown.closingCostsAtSale}
              />
              <BreakdownLine
                label={`Agent Fees (${inputs.agentFeesPct}%)`}
                value={result.breakdown.agentFees}
              />
              <BreakdownLine
                label="Desired Profit"
                value={result.breakdown.desiredProfit}
              />
              <BreakdownLine
                label="Repair Costs"
                value={result.breakdown.repairCosts}
              />
              <BreakdownLine
                label={`Holding Costs (${inputs.holdTimeMonths} mo)`}
                value={result.breakdown.holdingCosts}
              />
              <BreakdownLine
                label={`Loan Interest (${inputs.loanInterestRate}%)`}
                value={result.breakdown.loanInterest}
              />
              <BreakdownLine
                label={`Points (${inputs.pointsPct}%)`}
                value={result.breakdown.points}
              />
              <BreakdownLine
                label={`Closing Costs at Buy (${inputs.closingCostsBuyPct}%)`}
                value={result.breakdown.closingCostsAtBuy}
              />
              <div className="border-t border-neutral-200 pt-1.5 dark:border-neutral-700">
                <div className="flex justify-between font-semibold text-neutral-900 dark:text-neutral-100">
                  <span>= Max Offer</span>
                  <span>{formatCurrency(result.maxOffer)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calculator Inputs */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Calculator Inputs
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* ARV */}
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2">
              <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Estimated ARV
              </label>
              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400">
                {inputs.arvIsManual ? "manual" : "calculated"}
              </span>
              {inputs.arvIsManual && (
                <button
                  onClick={resetArv}
                  className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              )}
            </div>
            <CurrencyInput
              value={inputs.arv}
              onChange={(v) => update({ arv: v, arvIsManual: true })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Closing Costs at Sale (%)
            </label>
            <PercentInput
              value={inputs.closingCostsSalePct}
              onChange={(v) => update({ closingCostsSalePct: v })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Agent Fees (%)
            </label>
            <PercentInput
              value={inputs.agentFeesPct}
              onChange={(v) => update({ agentFeesPct: v })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Desired Profit
            </label>
            <CurrencyInput
              value={inputs.desiredProfit}
              onChange={(v) => update({ desiredProfit: v })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Hold Time (months)
            </label>
            <NumberInput
              value={inputs.holdTimeMonths}
              onChange={(v) => update({ holdTimeMonths: v })}
              min={1}
              max={36}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Loan Interest Rate (%)
            </label>
            <PercentInput
              value={inputs.loanInterestRate}
              onChange={(v) => update({ loanInterestRate: v })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Points at Purchase (%)
            </label>
            <PercentInput
              value={inputs.pointsPct}
              onChange={(v) => update({ pointsPct: v })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Repair Costs
            </label>
            <CurrencyInput
              value={inputs.repairCosts}
              onChange={(v) => update({ repairCosts: v })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Monthly Holding Costs
            </label>
            <CurrencyInput
              value={inputs.monthlyHoldingCosts}
              onChange={(v) => update({ monthlyHoldingCosts: v })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Closing Costs at Buy (%)
            </label>
            <PercentInput
              value={inputs.closingCostsBuyPct}
              onChange={(v) => update({ closingCostsBuyPct: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrencyInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
        $
      </span>
      <input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-neutral-300 bg-white py-1.5 pl-7 pr-3 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
      />
    </div>
  );
}

function PercentInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        step="0.5"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-neutral-300 bg-white py-1.5 pl-3 pr-7 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
        %
      </span>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={value || ""}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
    />
  );
}

function BreakdownLine({
  label,
  value,
  isFirst,
}: {
  label: string;
  value: number;
  isFirst?: boolean;
}) {
  return (
    <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
      <span>
        {isFirst ? "" : "- "}
        {label}
      </span>
      <span>
        {isFirst ? "" : "- "}
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
