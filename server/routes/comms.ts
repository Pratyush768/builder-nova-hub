import type { RequestHandler } from "express";
import type { CommAnalysis, CommPost, IngestCommRequest, NLPResult, ServerEvent, InsightsResponse } from "@shared/api";
import { addComm, allComms, allSensors, computeInsight } from "./data-store";

// naive keyword-based NLP
const NEED_KEYWORDS = [
  { kw: ["water", "bottle", "thirst"], label: "Water" },
  { kw: ["mask", "n95", "smoke"], label: "Masks" },
  { kw: ["medic", "injured", "hospital", "ambulance"], label: "Medical" },
  { kw: ["evac", "shelter", "relief"], label: "Evacuation" },
  { kw: ["sandbag", "flood", "pump"], label: "Flood Control" },
  { kw: ["power", "electric", "battery", "light"], label: "Power" },
];

const HAZARDS = ["fire", "smoke", "gas", "leak", "flood", "heatwave", "heat", "storm"];

function simpleNLP(text: string, locationHint?: string): NLPResult {
  const lc = text.toLowerCase();

  const needs = NEED_KEYWORDS.filter((g) => g.kw.some((w) => lc.includes(w))).map((g) => g.label);
  const hazardHits = HAZARDS.filter((h) => lc.includes(h));

  const exLocs: string[] = [];
  if (locationHint) exLocs.push(locationHint);
  // extract capitalized multi-words as pseudo locations
  const cap = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z0-9]+){0,3})\b/g) || [];
  cap.forEach((c) => {
    if (c.length >= 3 && !exLocs.includes(c)) exLocs.push(c);
  });

  let sentiment = 30;
  if (/(urgent|immediately|help!|asap|emergency|danger)/i.test(text)) sentiment += 40;
  if (/(smoke|fire|leak|flood|trapped|collapse)/i.test(text)) sentiment += 20;
  if (/(safe|open|available|ok)/i.test(text)) sentiment -= 10;
  sentiment = Math.max(0, Math.min(100, sentiment));

  const urgency: "low" | "medium" | "high" = sentiment >= 70 ? "high" : sentiment >= 45 ? "medium" : "low";

  const entities = [
    ...exLocs.map((v) => ({ type: "location" as const, value: v })),
    ...needs.map((v) => ({ type: "need" as const, value: v })),
    ...hazardHits.map((v) => ({ type: "hazard" as const, value: v })),
  ];

  return { entities, sentiment, urgency, needs, locations: exLocs };
}

const sseClients = new Set<import("express").Response>();

export const postIngestComm: RequestHandler = (req, res) => {
  const body = req.body as IngestCommRequest;
  if (!body || !body.post || !body.post.text) return res.status(400).json({ error: "missing post.text" });
  const post: CommPost = {
    id: body.post.id || crypto.randomUUID(),
    ts: body.post.ts ?? Date.now(),
    text: body.post.text,
    location: body.post.locationHint,
  };
  const nlp = simpleNLP(post.text, post.location);
  post.need = nlp.needs[0];
  post.urgency = nlp.urgency;
  const analysis: CommAnalysis = { post, nlp };
  addComm(analysis);

  const evt: ServerEvent = { type: "comm", data: analysis };
  const payload = `event: comm\ndata: ${JSON.stringify(evt)}\n\n`;
  sseClients.forEach((c) => c.write(payload));

  res.status(200).json(analysis);
};

export const getCommsStream: RequestHandler = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  res.write(`: connected\n\n`);
  sseClients.add(res);
  req.on("close", () => sseClients.delete(res));
};

export const getInsights: RequestHandler = (_req, res) => {
  const sensors = allSensors().slice(-200);
  const comms = allComms().slice(-200);
  const summary = computeInsight(30 * 60 * 1000);
  const response: InsightsResponse = { sensors, comms, summary };
  res.status(200).json(response);
};
