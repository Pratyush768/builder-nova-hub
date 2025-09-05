import type { RequestHandler } from "express";
import type {
  IngestSensorRequest,
  LatestSensorResponse,
  SensorReading,
  ServerEvent,
} from "@shared/api";
import { addSensor, getLatestSensor, computeInsight } from "./data-store";
import { upsertThresholdAlert } from "./alerts";

const clients = new Set<import("express").Response>();
let heartbeat: NodeJS.Timeout | null = null;

function startHeartbeat() {
  if (heartbeat) return;
  heartbeat = setInterval(() => {
    const data = `: hb\n\n`;
    clients.forEach((res) => res.write(data));
  }, 15000);
}

function stopHeartbeatIfIdle() {
  if (clients.size === 0 && heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }
}

export const postIngestSensor: RequestHandler = (req, res) => {
  const body = req.body as IngestSensorRequest;
  if (!body || !body.reading)
    return res.status(400).json({ error: "missing reading" });
  const r: SensorReading = {
    ...body.reading,
    ts: body.reading.ts ?? Date.now(),
    deviceId: body.reading.deviceId || "device-unknown",
  };
  addSensor(r);

  const evt: ServerEvent = { type: "sensor", data: r };
  const payload = `event: sensor\ndata: ${JSON.stringify(evt)}\n\n`;
  clients.forEach((c) => c.write(payload));

  // also push a lightweight insight update
  const insight = computeInsight(30 * 60 * 1000);
  const ievt: ServerEvent = { type: "insight", data: insight };
  const ipayload = `event: insight\ndata: ${JSON.stringify(ievt)}\n\n`;
  clients.forEach((c) => c.write(ipayload));

  // threshold-based alert generation (demo)
  try {
    const sector = r.sector || "Sector A";
    if (r.pm25 > 200 || r.gas > 700) {
      upsertThresholdAlert({
        id: `critical-${sector}`,
        type: r.gas > 700 ? "gas" : "fire",
        severity: "critical",
        verified: false,
        sector,
        message: r.gas > 700 ? "GAS LEAK SUSPECTED" : "FIRE DETECTED",
        lat: r.location?.lat,
        lon: r.location?.lon,
        node_id: r.deviceId,
        evidence: [
          {
            sensor: r.gas > 700 ? "mq2" : "pm2_5",
            value: r.gas > 700 ? r.gas : r.pm25,
            ts: r.ts,
          },
        ],
      });
    }
  } catch {}

  const response: LatestSensorResponse = { reading: r };
  res.status(200).json(response);
};

export const getLatestSensorHandler: RequestHandler = (_req, res) => {
  const reading = getLatestSensor();
  const response: LatestSensorResponse = { reading };
  res.status(200).json(response);
};

export const getSensorStream: RequestHandler = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  res.write(`: connected\n\n`);
  clients.add(res);
  startHeartbeat();

  req.on("close", () => {
    clients.delete(res);
    stopHeartbeatIfIdle();
  });
};
