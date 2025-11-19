import { TimeRange } from './metrics';

export type AnomalyType = 'productivity_drop' | 'unusual_pattern' | 'quality_issue';

export interface Anomaly {
  id: string;
  developerId: string;
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  detectedAt: Date;
  affectedTimeRange: TimeRange;
  validated: boolean;
}
