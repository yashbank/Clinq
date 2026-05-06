import type { LeadTier } from "@/lib/ai/lead-intelligence";
import type { LeadInterestStatus } from "@/types/database";

/** Lead row shape consumed by the premium leads table UI. */
export interface Lead {
  id: string;
  name: string;
  projectTitle: string;
  projectUrl: string;
  /** External listing URL when present (https). */
  listingUrl: string | null;
  /** Short list blurb (DB or extractive). */
  shortSummary: string;
  /** Display line for budget; empty when hidden. */
  budgetLine: string;
  budgetKind: "fixed" | "hourly" | "unknown";
  leadTier: LeadTier;
  confidenceScore: number;
  intelligenceFlags: string[];
  company: string;
  email: string;
  phone: string;
  avatar: string;
  value: number;
  aiScore: number;
  conversionScore: number;
  status: "hot" | "warm" | "new" | "cold";
  scamRisk: "low" | "medium" | "high";
  /** 0–100 from lead workflow signals (metadata); UI-only. */
  seriousnessScore: number;
  lastContact: string;
  aiInsight: string;
  bestTimeToBid: string;
  bidUrgency: "now" | "today" | "tomorrow" | "this-week" | "later";
  isRepeatClient: boolean;
  projectsCompleted: number;
  totalRevenue: number;
  responseRate: number;
  avgResponseTime: string;
  industry: string;
  proposalStatus: "none" | "draft" | "sent" | "viewed" | "accepted" | "rejected";
  competitorCount: number;
  winProbability: number;
  /** Canonical lead source from metadata (e.g. freelancer) for compact badges. */
  sourceChannel?: string | null;
  /** ISO timestamp when lead was imported via API, if applicable. */
  importedAt?: string | null;
  /** True when `import_external_id` exists on lead metadata. */
  isImported?: boolean;
  interest_status?: LeadInterestStatus | null;
}
