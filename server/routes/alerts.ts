import type { RequestHandler } from "express";
import type { Alert, AlertsResponse } from "@shared/api";

const alerts: Alert[] = [];
const clients = new Set<import("express").Response>();

export function allAlerts(): Alert[] { return alerts; }

export function createOrUpdateAlert(a: Alert) {
  const idx = alerts.findIndex((x) => x.id === a.id);
  if (idx >= 0) alerts[idx] = a; else alerts.push(a);
  broadcast(a);
}

export function upsertThresholdAlert(partial: Omit<Alert, "id" | "first_ts"> & { id?: string }) {
  const id = partial.id || `${partial.type}-${partial.sector || "global"}`;
  const existing = alerts.find((x) => x.id === id);
  const now = Date.now();
  const next: Alert = {
    id,
    first_ts: existing?.first_ts ?? now,
    verified: existing?.verified ?? false,
    verified_ts: existing?.verified_ts,
    evidence: existing?.evidence ?? [],
    ...partial,
  };
  createOrUpdateAlert(next);
}

export const getAlerts: RequestHandler = (_req, res) => {
  const response: AlertsResponse = { alerts };
  res.status(200).json(response);
};

export const postVerifyAlert: RequestHandler = (req, res) => {
  const { id } = req.body as { id?: string };
  if (!id) return res.status(400).json({ error: "missing id" });
  const idx = alerts.findIndex((x) => x.id === id);
  if (idx < 0) return res.status(404).json({ error: "not found" });
  alerts[idx].verified = true;
  alerts[idx].verified_ts = Date.now();
  broadcast(alerts[idx]);
  res.status(200).json(alerts[idx]);
};

export const postCreateAlert: RequestHandler = (req, res) => {
  const body = req.body as Partial<Alert>;
  if (!body || !body.type || !body.message || !body.severity) return res.status(400).json({ error: "missing fields" });
  const a: Alert = {
    id: body.id || `${body.type}-${Date.now()}`,
    type: body.type,
    severity: body.severity,
    verified: !!body.verified,
    sector: body.sector,
    message: body.message,
    lat: body.lat,
    lon: body.lon,
    node_id: body.node_id,
    first_ts: Date.now(),
    verified_ts: body.verified ? Date.now() : undefined,
    evidence: body.evidence || [],
  };
  createOrUpdateAlert(a);
  res.status(200).json(a);
};

function broadcast(a: Alert) {
  const payload = `event: alert\ndata: ${JSON.stringify({ type: "alert", data: a })}\n\n`;
  clients.forEach((c) => c.write(payload));
}

export const getAlertsStream: RequestHandler = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  clients.add(res);
  req.on("close", () => clients.delete(res));
};
