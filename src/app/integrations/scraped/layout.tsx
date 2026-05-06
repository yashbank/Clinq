import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staging",
};

export default function ScrapedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
