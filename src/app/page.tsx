"use client";

import { TabShell } from "@/components/TabShell";
import { PropertyTab } from "@/components/PropertyTab";
import { CompsTab } from "@/components/CompsTab";
import { CalculatorTab } from "@/components/CalculatorTab";
import { Toast } from "@/components/Toast";

export default function Home() {
  return (
    <TabShell>
      <PropertyTab />
      <CompsTab />
      <CalculatorTab />
      <Toast />
    </TabShell>
  );
}
