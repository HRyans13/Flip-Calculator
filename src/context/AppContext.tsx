"use client";

import React, { createContext, useContext, useReducer, useCallback } from "react";
import type {
  PropertyDetails,
  CompSale,
  CompFilters,
  CalculatorInputs,
  ActiveTab,
  StatMode,
  BucketMode,
  HomeType,
} from "@/lib/types";
import { DEFAULT_CALCULATOR_INPUTS, DEFAULT_COMP_FILTERS } from "@/lib/constants";
import { computeArv } from "@/lib/stats";

interface AppState {
  activeTab: ActiveTab;
  property: PropertyDetails | null;
  propertyLoading: boolean;
  propertyError: string | null;
  comps: CompSale[];
  compsLoading: boolean;
  compsError: string | null;
  filters: CompFilters;
  calculatorInputs: CalculatorInputs;
  statMode: StatMode;
  bucketMode: BucketMode;
  toast: { message: string; action?: () => void } | null;
}

type Action =
  | { type: "SET_TAB"; tab: ActiveTab }
  | { type: "SET_PROPERTY_LOADING" }
  | { type: "SET_PROPERTY"; property: PropertyDetails }
  | { type: "SET_PROPERTY_ERROR"; error: string }
  | { type: "SET_COMPS_LOADING" }
  | { type: "SET_COMPS"; comps: CompSale[] }
  | { type: "SET_COMPS_ERROR"; error: string }
  | { type: "TOGGLE_COMP_EXCLUDED"; id: string }
  | { type: "UPDATE_FILTERS"; filters: Partial<CompFilters> }
  | { type: "UPDATE_CALCULATOR"; inputs: Partial<CalculatorInputs> }
  | { type: "SET_STAT_MODE"; mode: StatMode }
  | { type: "SET_BUCKET_MODE"; mode: BucketMode }
  | { type: "SET_TOAST"; toast: AppState["toast"] }
  | { type: "CLEAR_TOAST" };

const initialState: AppState = {
  activeTab: "property",
  property: null,
  propertyLoading: false,
  propertyError: null,
  comps: [],
  compsLoading: false,
  compsError: null,
  filters: {
    ...DEFAULT_COMP_FILTERS,
    homeType: "Single Family" as HomeType,
  },
  calculatorInputs: {
    ...DEFAULT_CALCULATOR_INPUTS,
    arv: 0,
    arvIsManual: false,
  },
  statMode: "median",
  bucketMode: "exclusive",
  toast: null,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, activeTab: action.tab };
    case "SET_PROPERTY_LOADING":
      return { ...state, propertyLoading: true, propertyError: null };
    case "SET_PROPERTY": {
      const newFilters = {
        ...state.filters,
        homeType: action.property.homeType,
      };
      return {
        ...state,
        property: action.property,
        propertyLoading: false,
        propertyError: null,
        filters: newFilters,
      };
    }
    case "SET_PROPERTY_ERROR":
      return {
        ...state,
        propertyLoading: false,
        propertyError: action.error,
      };
    case "SET_COMPS_LOADING":
      return { ...state, compsLoading: true, compsError: null };
    case "SET_COMPS": {
      const newState = {
        ...state,
        comps: action.comps,
        compsLoading: false,
        compsError: null,
      };
      // Auto-update ARV if not manually set
      if (!state.calculatorInputs.arvIsManual && state.property) {
        const arv = computeArv(
          action.comps,
          state.property.sqft,
          state.statMode
        );
        newState.calculatorInputs = {
          ...state.calculatorInputs,
          arv,
        };
      }
      return newState;
    }
    case "SET_COMPS_ERROR":
      return { ...state, compsLoading: false, compsError: action.error };
    case "TOGGLE_COMP_EXCLUDED": {
      const comps = state.comps.map((c) =>
        c.id === action.id ? { ...c, excluded: !c.excluded } : c
      );
      const newState = { ...state, comps };
      if (!state.calculatorInputs.arvIsManual && state.property) {
        const arv = computeArv(comps, state.property.sqft, state.statMode);
        newState.calculatorInputs = {
          ...state.calculatorInputs,
          arv,
        };
      }
      return newState;
    }
    case "UPDATE_FILTERS":
      return {
        ...state,
        filters: { ...state.filters, ...action.filters },
      };
    case "UPDATE_CALCULATOR":
      return {
        ...state,
        calculatorInputs: {
          ...state.calculatorInputs,
          ...action.inputs,
        },
      };
    case "SET_STAT_MODE": {
      const newState = { ...state, statMode: action.mode };
      if (!state.calculatorInputs.arvIsManual && state.property) {
        const arv = computeArv(state.comps, state.property.sqft, action.mode);
        newState.calculatorInputs = {
          ...state.calculatorInputs,
          arv,
        };
      }
      return newState;
    }
    case "SET_BUCKET_MODE":
      return { ...state, bucketMode: action.mode };
    case "SET_TOAST":
      return { ...state, toast: action.toast };
    case "CLEAR_TOAST":
      return { ...state, toast: null };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function usePropertyLookup() {
  const { dispatch } = useApp();

  return useCallback(
    async (input: string) => {
      dispatch({ type: "SET_PROPERTY_LOADING" });
      try {
        const res = await fetch("/api/scrape/property", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to look up property");
        dispatch({ type: "SET_PROPERTY", property: data.property });

        // Automatically fetch comps
        dispatch({ type: "SET_COMPS_LOADING" });
        const compsRes = await fetch("/api/scrape/comps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: data.property.address,
            latitude: data.property.latitude,
            longitude: data.property.longitude,
            filters: {
              ...DEFAULT_COMP_FILTERS,
              homeType: data.property.homeType,
            },
            subjectSqft: data.property.sqft,
            subjectBeds: data.property.bedrooms,
            subjectBaths: data.property.bathrooms,
          }),
        });
        const compsData = await compsRes.json();
        if (!compsRes.ok)
          throw new Error(compsData.error || "Failed to fetch comps");
        dispatch({ type: "SET_COMPS", comps: compsData.comps });
        dispatch({
          type: "SET_TOAST",
          toast: {
            message: `${compsData.comps.length} comps found — View Results`,
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        dispatch({ type: "SET_PROPERTY_ERROR", error: msg });
      }
    },
    [dispatch]
  );
}
