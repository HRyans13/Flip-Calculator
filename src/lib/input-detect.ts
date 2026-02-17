import type { InputType } from "./types";

export function detectInputType(value: string): InputType {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return "url";
  if (/^\d{3,}[-.\s]?\d*[-.\s]?\d*$/.test(trimmed)) return "parcel";
  return "address";
}
