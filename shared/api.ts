/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/** Example response type for /api/demo */
export interface DemoResponse {
  message: string;
}

/* Sensor data types */
export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface SensorReading {
  deviceId: string;
  ts: number; // epoch ms
  pm25: number; // µg/m³
  pm10: number; // µg/m³
  gas: number; // ppm (MQ-2 proxy)
  temp: number; // °C
  humidity: number; // %
  location?: GeoPoint;
  sector?: string; // human-readable area label
}

export interface IngestSensorRequest {
  reading: SensorReading;
}

export interface LatestSensorResponse {
  reading: SensorReading | null;
}

/* Communication/NLP types */
export interface CommPost {
  id: string;
  ts: number; // epoch ms
  text: string;
  location?: string;
  tags?: string[];
  need?: string;
  urgency?: "low" | "medium" | "high";
}

export interface IngestCommRequest {
  post: {
    id?: string;
    ts?: number;
    text: string;
    locationHint?: string;
  };
}

export type EntityType = "location" | "need" | "hazard" | "other";
export interface Entity {
  type: EntityType;
  value: string;
}

export interface NLPResult {
  entities: Entity[];
  sentiment: number; // 0-100 urgency-like score
  urgency: "low" | "medium" | "high";
  needs: string[];
  locations: string[];
}

export interface CommAnalysis {
  post: CommPost;
  nlp: NLPResult;
}

/* Insights */
export interface CorrelationInsight {
  sector?: string;
  windowMs: number;
  pm25Avg: number;
  highUrgencyCount: number;
  correlation: number; // 0..1 rough correlation estimate
  anomalies: string[];
}

export interface InsightsResponse {
  sensors: SensorReading[];
  comms: CommAnalysis[];
  summary: CorrelationInsight;
}

/* Alerts */
export type AlertSeverity = "info" | "warning" | "critical";
export interface Alert {
  id: string;
  type: "fire" | "flood" | "gas" | "quake" | string;
  severity: AlertSeverity;
  verified: boolean;
  sector?: string;
  message: string;
  lat?: number;
  lon?: number;
  node_id?: string;
  first_ts: number;
  verified_ts?: number;
  evidence?: Array<{
    sensor?: string;
    value?: number | string;
    ts?: number;
    text?: string;
  }>;
}
export interface AlertsResponse {
  alerts: Alert[];
}

/* Server Sent Events */
export type ServerEvent =
  | { type: "sensor"; data: SensorReading }
  | { type: "insight"; data: CorrelationInsight }
  | { type: "comm"; data: CommAnalysis }
  | { type: "alert"; data: Alert };
