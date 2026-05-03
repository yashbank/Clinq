"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNavbar } from "@/components/dashboard/top-navbar";
import { FloatingAIOrb } from "@/components/dashboard/floating-ai-orb";

export function PlaceholderWorkspace({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="gradient-mesh flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNavbar title={title} subtitle={description} />
        <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto p-8 text-center">
          <div className="glass-card max-w-md rounded-2xl border border-clinq-glass-border p-8">
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{description}</p>
          </div>
        </main>
      </div>
      <FloatingAIOrb />
    </div>
  );
}
