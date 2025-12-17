export interface AppSettings {
  id: string;
  enable_confidence_level: boolean;
  enable_crowd_sun_feedback: boolean;
  enable_seasonal_adjustment: boolean;
  created_at: string;
  updated_at: string;
}

export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type TimeOfDay = 'morning' | 'midday' | 'afternoon';

export interface SunCheck {
  id: string;
  patio_id: string;
  user_id?: string | null;
  visited_at: string;
  was_sunny: boolean;
  time_of_day: TimeOfDay;
  notes?: string | null;
  created_at: string;
  device_fingerprint?: string | null;
}
