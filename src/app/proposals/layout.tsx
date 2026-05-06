import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proposal Studio",
};

export default function ProposalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
