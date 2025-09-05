import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  postIngestSensor,
  getLatestSensorHandler,
  getSensorStream,
} from "./routes/sensors";
import { postIngestComm, getCommsStream, getInsights } from "./routes/comms";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Sensor API
  app.post("/api/sensors/ingest", postIngestSensor);
  app.get("/api/sensors/latest", getLatestSensorHandler);
  app.get("/api/sensors/stream", getSensorStream);

  // Communications API
  app.post("/api/comms/ingest", postIngestComm);
  app.get("/api/comms/stream", getCommsStream);

  // Insights API
  app.get("/api/insights", getInsights);

  // Alerts API
  app.get("/api/alerts", require("./routes/alerts").getAlerts);
  app.get("/api/alerts/stream", require("./routes/alerts").getAlertsStream);
  app.post("/api/alerts/verify", require("./routes/alerts").postVerifyAlert);
  app.post("/api/alerts/create", require("./routes/alerts").postCreateAlert);

  return app;
}
