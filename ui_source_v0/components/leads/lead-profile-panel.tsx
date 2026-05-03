"use client";

import {
  X,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Clock,
  TrendingUp,
  FileText,
  MessageSquare,
  ExternalLink,
  Sparkles,
  Target,
  Repeat,
  Shield,
  AlertTriangle,
  DollarSign,
  Users,
  Zap,
  ChevronRight,
  CheckCircle,
  Building2,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LeadProfilePanelProps {
  leadId: string | null;
  onClose: () => void;
}

// Mock detailed lead data
const leadsData: Record<string, {
  name: string;
  company: string;
  avatar: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  industry: string;
  companySize: string;
  value: number;
  aiScore: number;
  conversionScore: number;
  winProbability: number;
  scamRisk: "low" | "medium" | "high";
  isRepeatClient: boolean;
  projectsCompleted: number;
  totalRevenue: number;
  lastContact: string;
  nextAction: string;
  nextActionTime: string;
  responseRate: number;
  avgResponseTime: string;
  aiInsights: string[];
  timeline: { date: string; action: string; type: "email" | "call" | "proposal" | "meeting" }[];
  tags: string[];
  notes: string;
}> = {
  "1": {
    name: "Sarah Chen",
    company: "TechFlow Inc",
    avatar: "SC",
    email: "sarah@techflow.io",
    phone: "+1 (555) 123-4567",
    website: "techflow.io",
    location: "San Francisco, CA",
    industry: "SaaS",
    companySize: "50-100",
    value: 24500,
    aiScore: 94,
    conversionScore: 91,
    winProbability: 78,
    scamRisk: "low",
    isRepeatClient: true,
    projectsCompleted: 4,
    totalRevenue: 87500,
    lastContact: "2 hours ago",
    nextAction: "Send final proposal",
    nextActionTime: "Today 2:00 PM",
    responseRate: 96,
    avgResponseTime: "1.5h",
    aiInsights: [
      "Decision maker confirmed with budget authority",
      "4th project - loyalty discount may accelerate close",
      "Competitor pricing revealed: $2k below your quote",
      "High urgency: Q2 deadline mentioned",
    ],
    timeline: [
      { date: "Today", action: "Reviewed proposal draft", type: "proposal" },
      { date: "Yesterday", action: "30-min discovery call", type: "call" },
      { date: "2 days ago", action: "Responded to email", type: "email" },
      { date: "4 days ago", action: "Initial inquiry received", type: "email" },
    ],
    tags: ["Enterprise", "Urgent", "Repeat Client", "Decision Maker"],
    notes: "Sarah prefers direct communication. Previous projects completed ahead of schedule. Excellent relationship.",
  },
  "2": {
    name: "Michael Roberts",
    company: "Quantum Labs",
    avatar: "MR",
    email: "m.roberts@quantumlabs.com",
    phone: "+1 (555) 234-5678",
    website: "quantumlabs.com",
    location: "Boston, MA",
    industry: "Biotech",
    companySize: "100-250",
    value: 42000,
    aiScore: 88,
    conversionScore: 82,
    winProbability: 65,
    scamRisk: "low",
    isRepeatClient: false,
    projectsCompleted: 0,
    totalRevenue: 0,
    lastContact: "4 hours ago",
    nextAction: "Complete proposal",
    nextActionTime: "Today 4:00 PM",
    responseRate: 84,
    avgResponseTime: "3h",
    aiInsights: [
      "Technical requirements match your expertise perfectly",
      "Multiple stakeholders involved - expect longer cycle",
      "Budget approved for Q2 spending",
      "Recommend showcasing biotech portfolio",
    ],
    timeline: [
      { date: "Today", action: "Requirements document received", type: "email" },
      { date: "Yesterday", action: "Technical discussion call", type: "call" },
      { date: "3 days ago", action: "Initial meeting scheduled", type: "meeting" },
    ],
    tags: ["Enterprise", "Technical", "New Client", "High Value"],
    notes: "Needs detailed technical specifications. Interested in long-term partnership.",
  },
};

function CircularScore({ score, size = 56 }: { score: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 85) return "stroke-clinq-success";
    if (s >= 70) return "stroke-primary";
    if (s >= 50) return "stroke-clinq-warning";
    return "stroke-destructive";
  };

  const getTextColor = (s: number) => {
    if (s >= 85) return "text-clinq-success";
    if (s >= 70) return "text-primary";
    if (s >= 50) return "text-clinq-warning";
    return "text-destructive";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-700", getColor(score))}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center text-sm font-bold",
          getTextColor(score)
        )}
      >
        {score}
      </span>
    </div>
  );
}

export function LeadProfilePanel({ leadId, onClose }: LeadProfilePanelProps) {
  if (!leadId) return null;

  const lead = leadsData[leadId];

  if (!lead) {
    return (
      <aside className="w-96 shrink-0 border-l border-clinq-glass-border bg-sidebar/80 backdrop-blur-xl">
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">Lead not found</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-[420px] shrink-0 flex-col border-l border-clinq-glass-border bg-sidebar/80 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-clinq-glass-border p-4">
        <h3 className="font-semibold text-foreground">Lead Profile</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile Header */}
        <div className="border-b border-clinq-glass-border p-5">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-semibold text-foreground",
                  lead.isRepeatClient
                    ? "from-clinq-success/30 to-primary/30"
                    : "from-primary/30 to-accent/30"
                )}
              >
                {lead.avatar}
              </div>
              {lead.isRepeatClient && (
                <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-clinq-success shadow-lg shadow-clinq-success/30">
                  <Repeat className="h-3.5 w-3.5 text-background" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-semibold text-foreground">{lead.name}</h4>
                {lead.scamRisk === "low" && (
                  <Shield className="h-4 w-4 text-clinq-success" />
                )}
                {lead.scamRisk === "high" && (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{lead.company}</p>
              {lead.isRepeatClient && (
                <p className="mt-1 text-xs text-clinq-success">
                  {lead.projectsCompleted} projects · ${(lead.totalRevenue / 1000).toFixed(0)}k lifetime
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 gap-2 border border-clinq-glass-border"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 gap-2 border border-clinq-glass-border"
            >
              <Phone className="h-4 w-4" />
              Call
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <FileText className="h-4 w-4" />
              Proposal
            </Button>
          </div>
        </div>

        {/* Scores Grid */}
        <div className="grid grid-cols-3 gap-4 border-b border-clinq-glass-border p-5">
          <div className="flex flex-col items-center">
            <CircularScore score={lead.aiScore} />
            <span className="mt-2 text-xs text-muted-foreground">AI Score</span>
          </div>
          <div className="flex flex-col items-center">
            <CircularScore score={lead.conversionScore} />
            <span className="mt-2 text-xs text-muted-foreground">Conversion</span>
          </div>
          <div className="flex flex-col items-center">
            <CircularScore score={lead.winProbability} />
            <span className="mt-2 text-xs text-muted-foreground">Win %</span>
          </div>
        </div>

        {/* Deal Value */}
        <div className="border-b border-clinq-glass-border p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-clinq-success" />
              <span className="text-sm text-muted-foreground">Deal Value</span>
            </div>
            <span className="text-2xl font-bold text-foreground">
              ${(lead.value / 1000).toFixed(0)}k
            </span>
          </div>
        </div>

        {/* Next Action */}
        <div className="border-b border-clinq-glass-border p-5">
          <div className="rounded-xl bg-primary/10 p-4">
            <div className="flex items-center gap-2 text-primary">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Next Action</span>
            </div>
            <p className="mt-2 font-semibold text-foreground">{lead.nextAction}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {lead.nextActionTime}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="border-b border-clinq-glass-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">AI Insights</span>
          </div>
          <div className="space-y-2">
            {lead.aiInsights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-clinq-glass/50 p-3">
                <Target className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {insight}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-b border-clinq-glass-border p-5">
          <span className="text-sm font-medium text-foreground">Contact Info</span>
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{lead.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{lead.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a
                href={`https://${lead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {lead.website}
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{lead.location}</span>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="border-b border-clinq-glass-border p-5">
          <span className="text-sm font-medium text-foreground">Company</span>
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{lead.industry}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{lead.companySize} employees</span>
            </div>
          </div>
        </div>

        {/* Response Metrics */}
        <div className="border-b border-clinq-glass-border p-5">
          <span className="text-sm font-medium text-foreground">Response Metrics</span>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-clinq-glass/50 p-3 text-center">
              <div className="text-lg font-bold text-clinq-success">{lead.responseRate}%</div>
              <div className="text-xs text-muted-foreground">Response Rate</div>
            </div>
            <div className="rounded-lg bg-clinq-glass/50 p-3 text-center">
              <div className="text-lg font-bold text-foreground">{lead.avgResponseTime}</div>
              <div className="text-xs text-muted-foreground">Avg Response</div>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="border-b border-clinq-glass-border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Activity</span>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-primary">
              View all
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-3">
            {lead.timeline.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    item.type === "email" && "bg-primary/20",
                    item.type === "call" && "bg-clinq-success/20",
                    item.type === "proposal" && "bg-accent/20",
                    item.type === "meeting" && "bg-clinq-warning/20"
                  )}
                >
                  {item.type === "email" && <Mail className="h-3.5 w-3.5 text-primary" />}
                  {item.type === "call" && <Phone className="h-3.5 w-3.5 text-clinq-success" />}
                  {item.type === "proposal" && <FileText className="h-3.5 w-3.5 text-accent" />}
                  {item.type === "meeting" && <Calendar className="h-3.5 w-3.5 text-clinq-warning" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="border-b border-clinq-glass-border p-5">
          <span className="text-sm font-medium text-foreground">Tags</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {lead.tags.map((tag, i) => (
              <span
                key={i}
                className="rounded-full bg-clinq-glass px-2.5 py-1 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="p-5">
          <span className="text-sm font-medium text-foreground">Notes</span>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {lead.notes}
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-clinq-glass-border p-4">
        <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Sparkles className="h-4 w-4" />
          Generate AI Proposal
        </Button>
      </div>
    </aside>
  );
}
