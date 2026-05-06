import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lead Intelligence",
};

export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
