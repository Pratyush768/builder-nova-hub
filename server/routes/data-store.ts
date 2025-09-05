import type { CommAnalysis, CorrelationInsight, NLPResult, SensorReading } from "@shared/api";

const SENSOR_BUFFER_LIMIT = 1000;
const COMM_BUFFER_LIMIT = 1000;

const sensors: SensorReading[] = [];
const comms: CommAnalysis[] = [];

export function addSensor(reading: SensorReading) {
  sensors.push(reading);
  if (sensors.length > SENSOR_BUFFER_LIMIT) sensors.shift();
}

export function getLatestSensor(): SensorReading | null {
  return sensors.length ? sensors[sensors.length - 1] : null;
}

export function getSensorsWindow(windowMs: number): SensorReading[] {
  const cutoff = Date.now() - windowMs;
  return sensors.filter((s) => s.ts >= cutoff);
}

export function addComm(analysis: CommAnalysis) {
  comms.push(analysis);
  if (comms.length > COMM_BUFFER_LIMIT) comms.shift();
}

export function getCommsWindow(windowMs: number): CommAnalysis[] {
  const cutoff = Date.now() - windowMs;
  return comms.filter((c) => c.post.ts >= cutoff);
}

export function computeInsight(windowMs: number, sector?: string): CorrelationInsight {
  const s = getSensorsWindow(windowMs).filter((r) => (sector ? r.sector === sector : true));
  const c = getCommsWindow(windowMs).filter((x) => (sector ? x.post.location === sector : true));

  const pm25Avg = s.length ? s.reduce((a, b) => a + b.pm25, 0) / s.length : 0;
  const highUrgencyCount = c.filter((x) => x.nlp.urgency === "high").length;

  // very rough correlation: normalize features and compute min ratio
  const pmScaled = Math.min(1, pm25Avg / 150);
  const commScaled = Math.min(1, highUrgencyCount / 10);
  const correlation = Math.min(pmScaled, commScaled);

  const anomalies: string[] = [];
  if (pmScaled > 0.7 && commScaled < 0.2) anomalies.push("Sensor spike without matching reports");
  if (pmScaled < 0.2 && commScaled > 0.7) anomalies.push("High urgency reports without sensor confirmation");

  return { sector, windowMs, pm25Avg, highUrgencyCount, correlation, anomalies };
}

export function allSensors(): SensorReading[] { return sensors; }
export function allComms(): CommAnalysis[] { return comms; }
