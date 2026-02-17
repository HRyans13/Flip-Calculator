"use client";

import { useState, useMemo, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { buildTimeBuckets, computeAggregateStats } from "@/lib/stats";
import { BEDROOM_MODES, HOME_TYPES } from "@/lib/constants";
import type { CompSale, CompFilters, BucketMode, StatMode } from "@/lib/types";
import {
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";

type SortKey = keyof Pick<
  CompSale,
  | "address"
  | "bedrooms"
  | "bathrooms"
  | "sqft"
  | "daysOnMarket"
  | "salesPrice"
  | "pricePerSqft"
  | "dateSold"
>;

export function CompsTab() {
  const { state, dispatch } = useApp();
  const [sortKey, setSortKey] = useState<SortKey>("dateSold");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  if (state.activeTab !== "comps") return null;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "dateSold" ? "desc" : "asc");
    }
  };

  const filteredComps = state.comps;
  const activeComps = filteredComps.filter((c) => !c.excluded);
  const overallStats = computeAggregateStats(filteredComps);
  const buckets = buildTimeBuckets(filteredComps, state.bucketMode);

  const sortedComps = useMemo(() => {
    return [...filteredComps].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp =
        typeof aVal === "string"
          ? aVal.localeCompare(bVal as string)
          : (aVal as number) - (bVal as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredComps, sortKey, sortDir]);

  const isLowComps = activeComps.length > 0 && activeComps.length < 3;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <FiltersSection />

      {/* Low comp warning */}
      {isLowComps && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Low confidence — only {activeComps.length} comp
            {activeComps.length === 1 ? "" : "s"} found. Consider expanding
            search radius or filters.
          </p>
        </div>
      )}

      {filteredComps.length === 0 && !state.compsLoading && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-800/50">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {state.property
              ? "No comps found. Try widening search radius or relaxing filters."
              : "Look up a property first to search for comparable sales."}
          </p>
        </div>
      )}

      {filteredComps.length > 0 && (
        <>
          {/* Aggregate Stats + Controls */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Aggregate Stats
              </h2>
              <div className="flex gap-1 rounded-md border border-neutral-200 p-0.5 dark:border-neutral-700">
                <ToggleBtn
                  active={state.statMode === "median"}
                  onClick={() =>
                    dispatch({ type: "SET_STAT_MODE", mode: "median" })
                  }
                >
                  Median
                </ToggleBtn>
                <ToggleBtn
                  active={state.statMode === "average"}
                  onClick={() =>
                    dispatch({ type: "SET_STAT_MODE", mode: "average" })
                  }
                >
                  Average
                </ToggleBtn>
              </div>
              <div className="flex gap-1 rounded-md border border-neutral-200 p-0.5 dark:border-neutral-700">
                <ToggleBtn
                  active={state.bucketMode === "exclusive"}
                  onClick={() =>
                    dispatch({ type: "SET_BUCKET_MODE", mode: "exclusive" })
                  }
                >
                  Exclusive
                </ToggleBtn>
                <ToggleBtn
                  active={state.bucketMode === "cumulative"}
                  onClick={() =>
                    dispatch({ type: "SET_BUCKET_MODE", mode: "cumulative" })
                  }
                >
                  Cumulative
                </ToggleBtn>
              </div>
            </div>

            {/* Overall stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Days on Market"
                value={Math.round(
                  state.statMode === "median"
                    ? overallStats.medianDom
                    : overallStats.averageDom
                )}
              />
              <StatCard
                label="Sales Price"
                value={formatCurrency(
                  state.statMode === "median"
                    ? overallStats.medianPrice
                    : overallStats.averagePrice
                )}
              />
              <StatCard
                label="$/Sq Ft"
                value={formatCurrency(
                  state.statMode === "median"
                    ? overallStats.medianPricePerSqft
                    : overallStats.averagePricePerSqft
                )}
              />
            </div>
          </div>

          {/* Time Period Buckets */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              By Time Period
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="pb-2 pr-4 font-medium text-neutral-500 dark:text-neutral-400">
                      Period
                    </th>
                    <th className="pb-2 pr-4 font-medium text-neutral-500 dark:text-neutral-400">
                      Count
                    </th>
                    <th className="pb-2 pr-4 font-medium text-neutral-500 dark:text-neutral-400">
                      DOM
                    </th>
                    <th className="pb-2 pr-4 font-medium text-neutral-500 dark:text-neutral-400">
                      Price
                    </th>
                    <th className="pb-2 font-medium text-neutral-500 dark:text-neutral-400">
                      $/SqFt
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {buckets.map((b) => (
                    <tr
                      key={b.label}
                      className="border-b border-neutral-100 dark:border-neutral-800"
                    >
                      <td className="py-2 pr-4 text-neutral-900 dark:text-neutral-100">
                        {b.label}
                      </td>
                      <td className="py-2 pr-4 text-neutral-600 dark:text-neutral-300">
                        {b.stats.count}
                      </td>
                      <td className="py-2 pr-4 text-neutral-600 dark:text-neutral-300">
                        {b.stats.count > 0
                          ? Math.round(
                              state.statMode === "median"
                                ? b.stats.medianDom
                                : b.stats.averageDom
                            )
                          : "—"}
                      </td>
                      <td className="py-2 pr-4 text-neutral-600 dark:text-neutral-300">
                        {b.stats.count > 0
                          ? formatCurrency(
                              state.statMode === "median"
                                ? b.stats.medianPrice
                                : b.stats.averagePrice
                            )
                          : "—"}
                      </td>
                      <td className="py-2 text-neutral-600 dark:text-neutral-300">
                        {b.stats.count > 0
                          ? formatCurrency(
                              state.statMode === "median"
                                ? b.stats.medianPricePerSqft
                                : b.stats.averagePricePerSqft
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comp Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Comparable Sales ({activeComps.length} active,{" "}
              {filteredComps.length - activeComps.length} excluded)
            </h3>
            <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
                    <th className="px-3 py-2 font-medium text-neutral-500 dark:text-neutral-400">
                      &nbsp;
                    </th>
                    <SortHeader
                      label="Address"
                      sortKey="address"
                      currentKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Beds"
                      sortKey="bedrooms"
                      currentKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Baths"
                      sortKey="bathrooms"
                      currentKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Sq Ft"
                      sortKey="sqft"
                      currentKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="DOM"
                      sortKey="daysOnMarket"
                      currentKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Price"
                      sortKey="salesPrice"
                      currentKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="$/SqFt"
                      sortKey="pricePerSqft"
                      currentKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Date Sold"
                      sortKey="dateSold"
                      currentKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortedComps.map((comp) => (
                    <tr
                      key={comp.id}
                      className={cn(
                        "border-b border-neutral-100 transition-colors dark:border-neutral-800",
                        comp.excluded && "opacity-40"
                      )}
                    >
                      <td className="px-3 py-2">
                        <button
                          onClick={() =>
                            dispatch({
                              type: "TOGGLE_COMP_EXCLUDED",
                              id: comp.id,
                            })
                          }
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded text-xs transition-colors",
                            comp.excluded
                              ? "bg-neutral-200 text-neutral-500 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-400"
                              : "bg-red-100 text-red-500 hover:bg-red-200 dark:bg-red-950 dark:text-red-400"
                          )}
                          title={
                            comp.excluded
                              ? "Include in ARV calculation"
                              : "Exclude from ARV calculation"
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </td>
                      <td className="px-3 py-2 text-neutral-900 dark:text-neutral-100">
                        {comp.address}
                      </td>
                      <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">
                        {comp.bedrooms}
                      </td>
                      <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">
                        {comp.bathrooms}
                      </td>
                      <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">
                        {comp.sqft.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">
                        {comp.daysOnMarket}
                      </td>
                      <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">
                        {formatCurrency(comp.salesPrice)}
                      </td>
                      <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">
                        {formatCurrency(comp.pricePerSqft)}
                      </td>
                      <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">
                        {new Date(comp.dateSold).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FiltersSection() {
  const { state, dispatch } = useApp();
  const { filters, property } = state;

  const updateFilter = useCallback(
    (updates: Partial<CompFilters>) => {
      dispatch({ type: "UPDATE_FILTERS", filters: updates });
    },
    [dispatch]
  );

  return (
    <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        Comp Filters
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Radius */}
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Search Radius: {filters.radiusMiles} mi
          </label>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={filters.radiusMiles}
            onChange={(e) =>
              updateFilter({ radiusMiles: Number(e.target.value) })
            }
            className="w-full accent-blue-600"
          />
        </div>

        {/* Home Type */}
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Home Type
          </label>
          <select
            value={filters.homeType}
            onChange={(e) =>
              updateFilter({
                homeType: e.target.value as CompFilters["homeType"],
              })
            }
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
          >
            {HOME_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Bedrooms */}
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Bedrooms{" "}
            {property && filters.bedroomMode !== "all"
              ? `(${property.bedrooms}${
                  filters.bedroomMode === "pm1"
                    ? "±1"
                    : filters.bedroomMode === "pm2"
                    ? "±2"
                    : ""
                })`
              : ""}
          </label>
          <div className="flex gap-1 rounded-md border border-neutral-200 p-0.5 dark:border-neutral-700">
            {BEDROOM_MODES.map((m) => (
              <ToggleBtn
                key={m.value}
                active={filters.bedroomMode === m.value}
                onClick={() =>
                  updateFilter({
                    bedroomMode: m.value as CompFilters["bedroomMode"],
                  })
                }
              >
                {m.label}
              </ToggleBtn>
            ))}
          </div>
        </div>

        {/* Bathrooms */}
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Bathrooms{" "}
            {property && filters.bathroomMode !== "all"
              ? `(${property.bathrooms}${
                  filters.bathroomMode === "pm1"
                    ? "±1"
                    : filters.bathroomMode === "pm2"
                    ? "±2"
                    : ""
                })`
              : ""}
          </label>
          <div className="flex gap-1 rounded-md border border-neutral-200 p-0.5 dark:border-neutral-700">
            {BEDROOM_MODES.map((m) => (
              <ToggleBtn
                key={m.value}
                active={filters.bathroomMode === m.value}
                onClick={() =>
                  updateFilter({
                    bathroomMode: m.value as CompFilters["bathroomMode"],
                  })
                }
              >
                {m.label}
              </ToggleBtn>
            ))}
          </div>
        </div>

        {/* Sqft */}
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Square Footage
          </label>
          <div className="space-y-2">
            <div className="flex gap-1 rounded-md border border-neutral-200 p-0.5 dark:border-neutral-700">
              <ToggleBtn
                active={filters.sqftMode === "relative"}
                onClick={() => updateFilter({ sqftMode: "relative" })}
              >
                Relative
              </ToggleBtn>
              <ToggleBtn
                active={filters.sqftMode === "absolute"}
                onClick={() => updateFilter({ sqftMode: "absolute" })}
              >
                Absolute
              </ToggleBtn>
            </div>
            {filters.sqftMode === "relative" ? (
              <select
                value={filters.sqftRelativeOffset}
                onChange={(e) =>
                  updateFilter({
                    sqftRelativeOffset: Number(e.target.value),
                  })
                }
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
              >
                {[250, 500, 750, 1000].map((v) => (
                  <option key={v} value={v}>
                    ±{v} sqft
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.sqftAbsoluteMin || ""}
                  onChange={(e) =>
                    updateFilter({
                      sqftAbsoluteMin: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.sqftAbsoluteMax || ""}
                  onChange={(e) =>
                    updateFilter({
                      sqftAbsoluteMax: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
                />
              </div>
            )}
          </div>
        </div>

        {/* Min Sale Price */}
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Min Sale Price
          </label>
          <input
            type="number"
            placeholder="No minimum"
            value={filters.minSalePrice ?? ""}
            onChange={(e) =>
              updateFilter({
                minSalePrice: e.target.value
                  ? Number(e.target.value)
                  : null,
              })
            }
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
          />
        </div>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  currentKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  dir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const isActive = currentKey === sortKey;
  return (
    <th className="px-3 py-2">
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        {label}
        {isActive ? (
          dir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </button>
    </th>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {value}
      </p>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
          : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
      )}
    >
      {children}
    </button>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
