"use client";

import { useState } from "react";
import { useApp, usePropertyLookup } from "@/context/AppContext";
import { detectInputType } from "@/lib/input-detect";
import { Search, Loader2, AlertCircle, ExternalLink } from "lucide-react";

export function PropertyTab() {
  const { state } = useApp();
  const lookupProperty = usePropertyLookup();
  const [inputValue, setInputValue] = useState("");

  if (state.activeTab !== "property") return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    lookupProperty(inputValue.trim());
  };

  const inputType = inputValue.trim() ? detectInputType(inputValue) : null;

  const isTennessee =
    state.property?.state?.toLowerCase() === "tn" ||
    state.property?.state?.toLowerCase() === "tennessee" ||
    state.property?.address?.toLowerCase().includes(", tn");

  return (
    <div className="space-y-6">
      {/* Smart Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Look up a property
        </label>
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter address, paste a link, or enter parcel number"
            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 pr-12 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:border-blue-400"
            disabled={state.propertyLoading}
          />
          <button
            type="submit"
            disabled={state.propertyLoading || !inputValue.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-neutral-400 hover:text-neutral-600 disabled:opacity-50 dark:hover:text-neutral-200"
          >
            {state.propertyLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </button>
        </div>
        {inputType && inputValue.trim() && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Detected:{" "}
            {inputType === "url"
              ? "Property link"
              : inputType === "parcel"
              ? "Parcel number"
              : "Street address"}
          </p>
        )}
      </form>

      {/* Loading State */}
      {state.propertyLoading && (
        <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Looking up property details...
          </p>
        </div>
      )}

      {/* Error State */}
      {state.propertyError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              {state.propertyError}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              Try pasting a direct Redfin or Zillow link instead.
            </p>
          </div>
        </div>
      )}

      {/* Property Details */}
      {state.property && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Property Details
          </h2>
          <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
            <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-700">
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                {state.property.address}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-neutral-100 dark:bg-neutral-700 sm:grid-cols-3">
              <DetailCell label="Bedrooms" value={state.property.bedrooms} />
              <DetailCell label="Bathrooms" value={state.property.bathrooms} />
              <DetailCell
                label="Sq Ft"
                value={state.property.sqft.toLocaleString()}
              />
              <DetailCell label="Year Built" value={state.property.yearBuilt} />
              <DetailCell label="Home Type" value={state.property.homeType} />
              <DetailCell label="Lot Size" value={state.property.lotSize} />
            </div>
          </div>

          {/* TN Assessment Link */}
          {isTennessee && (
            <a
              href={`https://tnmap.tn.gov/assessment/#/search?address=${encodeURIComponent(
                state.property.address
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ExternalLink className="h-4 w-4" />
              View on TN Assessment Portal
            </a>
          )}

          {/* Comps loading indicator */}
          {state.compsLoading && (
            <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Searching for comparable sales...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailCell({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white px-4 py-3 dark:bg-neutral-800">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-0.5 font-medium text-neutral-900 dark:text-neutral-100">
        {value}
      </p>
    </div>
  );
}
