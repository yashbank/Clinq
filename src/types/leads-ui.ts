import type { LeadTier } from "@/lib/ai/lead-intelligence";

/** Lead row shape consumed by the premium leads table UI. */
export interface Lead {
  id: string;
  name: string;
  projectTitle: string;
  projectUrl: string;
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
}
