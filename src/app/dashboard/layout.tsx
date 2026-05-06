import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
