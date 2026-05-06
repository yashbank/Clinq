import type { SourceQualityMetrics } from "./source-quality-metrics";

export {
  getSourceQualityMetrics,
  TRACKED_IMPORT_SOURCES,
  type SourceQualityRow,
  type TrackedImportSourceId,
} from "./source-quality-metrics";

export { getSourceQualityMetrics as getSourceIngestStats } from "./source-quality-metrics";

/** @deprecated Prefer `SourceQualityMetrics`. */
export type SourceIngestStats = SourceQualityMetrics;
