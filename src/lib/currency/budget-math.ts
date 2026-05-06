/** Pure budget math (no I/O) — shared by server importers and client-side display helpers. */

export function averageBudgetAmount(min: number | null, max: number | null): number | null {
  if (min != null && max != null && Number.isFinite(min) && Number.isFinite(max)) {
    return Math.round(((min + max) / 2) * 100) / 100;
  }
  if (min != null && Number.isFinite(min)) return Math.round(min * 100) / 100;
  if (max != null && Number.isFinite(max)) return Math.round(max * 100) / 100;
  return null;
}
