"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { PipelineHeader } from "@/components/pipeline/pipeline-header";
import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { AIRecommendationsPanel } from "@/components/pipeline/ai-recommendations-panel";
import { ActivityTimeline } from "@/components/pipeline/activity-timeline";
import { ClientDetailPanel } from "@/components/pipeline/client-detail-panel";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";

export default function PipelinePage() {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background gradient-mesh">
      <Sidebar />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <PipelineHeader
            onToggleAI={() => setShowAIPanel(!showAIPanel)}
            onToggleTimeline={() => setShowTimeline(!showTimeline)}
            showAIPanel={showAIPanel}
            showTimeline={showTimeline}
          />

          <div className="flex flex-1 overflow-hidden">
            {/* Kanban Board */}
            <div className="flex-1 overflow-hidden">
              <KanbanBoard
                onSelectClient={setSelectedClient}
                selectedClient={selectedClient}
              />
            </div>

            {/* Activity Timeline */}
            {showTimeline && (
              <aside className="w-80 shrink-0 overflow-y-auto border-l border-clinq-glass-border bg-sidebar/30 backdrop-blur-xl">
                <ActivityTimeline />
              </aside>
            )}
          </div>
        </main>

        {/* AI Recommendations Panel */}
        {showAIPanel && (
          <aside className="w-80 shrink-0 overflow-y-auto border-l border-clinq-glass-border bg-sidebar/50 backdrop-blur-xl">
            <AIRecommendationsPanel />
          </aside>
        )}
      </div>

      {/* Client Detail Panel */}
      {selectedClient && (
        <ClientDetailPanel
          clientId={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}

      <FloatingAIOrb />
    </div>
  );
}
