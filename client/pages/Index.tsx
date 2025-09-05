import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Map from "@/components/dashboard/Map";
import { TrendChart, type TrendPoint } from "@/components/dashboard/TinyCharts";
import { cn } from "@/lib/utils";

interface SensorState {
  pm25: number;
  pm10: number;
  gas: number;
  temp: number;
  humidity: number;
}

interface Post {
  id: string;
  text: string;
  location: string;
  sentiment: "low" | "medium" | "high";
  need: string;
}

interface AlertState { id: string; message: string; severity: "info" | "warning" | "critical"; verified: boolean; sector?: string }

function statColor(value: number, warn: number, danger: number) {
  if (value >= danger) return "text-destructive";
  if (value >= warn) return "text-accent";
  return "text-foreground";
}

type LiveStatus = "idle" | "connecting" | "open" | "error";

export default function Index() {
  const [running, setRunning] = useState(true);
  const [live, setLive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("idle");
  const [sensors, setSensors] = useState<SensorState>({
    pm25: 22,
    pm10: 30,
    gas: 120,
    temp: 31,
    humidity: 58,
  });
  const [trendPM, setTrendPM] = useState<TrendPoint[]>([]);
  const [trendSent, setTrendSent] = useState<TrendPoint[]>([]);
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "p1",
      text: "Heavy smoke near Sector X, visibility low.",
      location: "Sector X",
      sentiment: "high",
      need: "Masks & water",
    },
    {
      id: "p2",
      text: "Flooded street around Maple Ave, cars stuck.",
      location: "Maple Ave",
      sentiment: "medium",
      need: "Tow & sandbags",
    },
    {
      id: "p3",
      text: "Elderly require help in Block 12",
      location: "Block 12",
      sentiment: "medium",
      need: "Medical aid",
    },
  ]);

  const [hotspots, setHotspots] = useState(
    Array.from({ length: 6 }).map((_, i) => ({
      id: String(i),
      x: 10 + i * 14,
      y: 20 + (i % 2) * 12,
      severity: Math.random(),
      label: `S${i + 1}`,
    })),
  );
  const [alerts, setAlerts] = useState<AlertState[]>([]);
  const [filter, setFilter] = useState<"all" | "normal" | "elevated" | "critical">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const now = new Date();
    const initTrend = Array.from({ length: 20 }).map((_, i) => {
      const t = new Date(now.getTime() - (19 - i) * 60000);
      return {
        t: `${t.getHours()}:${String(t.getMinutes()).padStart(2, "0")}`,
        value: 15 + Math.random() * 30,
      };
    });
    setTrendPM(initTrend);
    setTrendSent(
      initTrend.map((d) => ({ ...d, value: 40 + Math.random() * 50 })),
    );
  }, []);

  useEffect(() => {
    if (!running || live) return;
    const interval = setInterval(() => {
      setSensors((s) => {
        const ns = {
          pm25: Math.max(
            5,
            Math.min(320, s.pm25 + (Math.random() - 0.45) * 12),
          ),
          pm10: Math.max(
            8,
            Math.min(380, s.pm10 + (Math.random() - 0.45) * 14),
          ),
          gas: Math.max(80, Math.min(900, s.gas + (Math.random() - 0.5) * 30)),
          temp: Math.max(
            18,
            Math.min(46, s.temp + (Math.random() - 0.5) * 0.7),
          ),
          humidity: Math.max(
            25,
            Math.min(95, s.humidity + (Math.random() - 0.5) * 1.5),
          ),
        };
        return ns;
      });
      setTrendPM((d) => {
        const t = new Date();
        const np = {
          t: `${t.getHours()}:${String(t.getMinutes()).padStart(2, "0")}`,
          value: 10 + Math.random() * 40 + sensors.pm25 * 0.1,
        };
        return [...d.slice(-19), np];
      });
      setTrendSent((d) => {
        const t = new Date();
        const val = 30 + Math.random() * 60 + (sensors.pm25 > 120 ? 10 : 0);
        const np = {
          t: `${t.getHours()}:${String(t.getMinutes()).padStart(2, "0")}`,
          value: Math.min(100, val),
        };
        return [...d.slice(-19), np];
      });
      setHotspots((h) =>
        h.map((p) => {
          const sev = Math.min(
            1,
            Math.max(0, p.severity + (Math.random() - 0.5) * 0.25),
          );
          return { ...p, severity: sev };
        }),
      );
      setPosts((p) => {
        if (Math.random() > 0.7) {
          const samples: Post[] = [
            {
              id: crypto.randomUUID(),
              text: "Strong burning smell reported near Riverbend.",
              location: "Riverbend",
              sentiment: "high",
              need: "Evac support",
            },
            {
              id: crypto.randomUUID(),
              text: "Cooling center open at Community Hall.",
              location: "Community Hall",
              sentiment: "low",
              need: "Share info",
            },
            {
              id: crypto.randomUUID(),
              text: "Power outage in Hillcrest blocks 4-6.",
              location: "Hillcrest",
              sentiment: "medium",
              need: "Batteries & lights",
            },
          ];
          return [
            samples[Math.floor(Math.random() * samples.length)],
            ...p,
          ].slice(0, 6);
        }
        return p;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [running, sensors.pm25, live]);

  const uiAlerts = useMemo(() => {
    const out: {
      id: string;
      level: "info" | "warn" | "critical";
      text: string;
    }[] = [];
    if (sensors.pm25 > 150)
      out.push({
        id: "a1",
        level: "critical",
        text: `Dangerous PM2.5 spike detected (${sensors.pm25.toFixed(0)} µg/m³)`,
      });
    else if (sensors.pm25 > 80)
      out.push({
        id: "a2",
        level: "warn",
        text: `Elevated PM2.5 levels (${sensors.pm25.toFixed(0)} µg/m³)`,
      });
    if (sensors.gas > 600)
      out.push({
        id: "a3",
        level: "critical",
        text: "Possible gas leak or heavy smoke detected",
      });
    if (sensors.temp > 40)
      out.push({
        id: "a4",
        level: "warn",
        text: "Extreme heat risk for vulnerable groups",
      });
    if (out.length === 0)
      out.push({
        id: "a0",
        level: "info",
        text: "All systems nominal across monitored sectors",
      });
    return out;
  }, [sensors]);

  // Alerts: initial fetch + SSE updates
  useEffect(() => {
    let sse: EventSource | null = null;
    fetch('/api/alerts').then(r=>r.json()).then((d:{alerts: AlertState[]})=>setAlerts(d.alerts||[])).catch(()=>{});
    sse = new EventSource('/api/alerts/stream');
    sse.addEventListener('alert', (e) => {
      try{
        const evt = JSON.parse((e as MessageEvent).data) as { data: AlertState };
        setAlerts((arr)=>{
          const idx = arr.findIndex(a=>a.id===evt.data.id);
          if(idx>=0){ const n=[...arr]; n[idx]=evt.data; return n; }
          return [evt.data, ...arr].slice(0,20);
        });
      }catch{}
    });
    return ()=>{ sse?.close(); };
  }, []);

  // Live feed via SSE (sensors + comms)
  useEffect(() => {
    if (!live) return;
    setRunning(false);
    setLiveStatus("connecting");

    let sseSensors: EventSource | null = null;
    let sseComms: EventSource | null = null;

    function addPMTrend(pm: number) {
      setTrendPM((d) => {
        const t = new Date();
        const np = {
          t: `${t.getHours()}:${String(t.getMinutes()).padStart(2, "0")}`,
          value: Math.max(0, pm),
        };
        return [...d.slice(-19), np];
      });
      setTrendSent((d) => {
        const t = new Date();
        const np = {
          t: `${t.getHours()}:${String(t.getMinutes()).padStart(2, "0")}`,
          value: Math.min(100, 30 + pm / 2),
        };
        return [...d.slice(-19), np];
      });
      setHotspots((h) =>
        h.map((p, i) => ({
          ...p,
          severity: Math.min(1, Math.max(0, pm / 200 + (i % 3) * 0.1)),
        })),
      );
    }

    sseSensors = new EventSource("/api/sensors/stream");
    sseSensors.onopen = () => setLiveStatus("open");
    sseSensors.onerror = () => setLiveStatus("error");
    sseSensors.addEventListener("sensor", (e) => {
      try {
        const evt = JSON.parse((e as MessageEvent).data);
        const reading = evt.data as {
          pm25: number;
          pm10: number;
          gas: number;
          temp: number;
          humidity: number;
        };
        setSensors({
          pm25: reading.pm25,
          pm10: reading.pm10,
          gas: reading.gas,
          temp: reading.temp,
          humidity: reading.humidity,
        });
        addPMTrend(reading.pm25);
      } catch {}
    });

    sseComms = new EventSource("/api/comms/stream");
    sseComms.onopen = () => setLiveStatus("open");
    sseComms.onerror = () => setLiveStatus("error");
    sseComms.addEventListener("comm", (e) => {
      try {
        const evt = JSON.parse((e as MessageEvent).data);
        const a = evt.data as {
          post: {
            id: string;
            text: string;
            location?: string;
            urgency?: "low" | "medium" | "high";
            need?: string;
          };
        };
        setPosts((p) =>
          [
            {
              id: a.post.id,
              text: a.post.text,
              location: a.post.location || "Unknown",
              sentiment: a.post.urgency || "low",
              need: a.post.need || "",
            },
            ...p,
          ].slice(0, 6),
        );
      } catch {}
    });

    return () => {
      sseSensors?.close();
      sseComms?.close();
      setLiveStatus("idle");
    };
  }, [live]);

  return (
    <main>
      {/* Live verified alert banner from API */}
      {alerts.length > 0 && alerts.some((a) => a.verified && a.severity === "critical") && (
        <div className="sticky top-0 z-40">
          <div className="bg-destructive text-destructive-foreground">
            <div className="container flex items-center justify-between gap-4 py-2 text-sm font-semibold">
              <div>
                {alerts.find((a) => a.verified && a.severity === "critical")?.message || "VERIFIED ALERT"}
              </div>
              <div className="opacity-90">HLDMS</div>
            </div>
          </div>
        </div>
      )}

      <section
        id="overview"
        className="relative border-b bg-gradient-to-b from-background via-background to-secondary"
      >
        <div className="container relative py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-soft">
                <span className="h-2 w-2 rounded-full bg-primary" /> Live demo
                with simulated streams
              </div>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                LifeLine360 — Hyper‑Local Disaster Intelligence
              </h1>
              <p className="mt-4 text-muted-foreground md:text-lg">
                Street‑level sensors + community reports → verified alerts that save lives.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3" id="demo">
                <Button onClick={() => setRunning((r) => !r)} disabled={live}>
                  {running ? "Pause Simulation" : "Resume Simulation"}
                </Button>
                <Button
                  variant={live ? "default" : "secondary"}
                  onClick={() => setLive((v) => !v)}
                >
                  {live ? "Using Live Feed" : "Use Live Feed"}
                </Button>
                {live && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                      liveStatus === "open" &&
                        "border-green-500/40 text-green-600 dark:text-green-400",
                      liveStatus === "connecting" &&
                        "border-yellow-500/40 text-yellow-600 dark:text-yellow-400",
                      liveStatus === "error" &&
                        "border-destructive/40 text-destructive",
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        liveStatus === "open" && "bg-green-500 animate-pulse",
                        liveStatus === "connecting" &&
                          "bg-yellow-500 animate-pulse",
                        liveStatus === "error" && "bg-destructive",
                      )}
                    />
                    {liveStatus === "open"
                      ? "Connected"
                      : liveStatus === "connecting"
                        ? "Connecting…"
                        : liveStatus === "error"
                          ? "Error"
                          : "Idle"}
                  </span>
                )}
                <a href="#dashboard" className="inline-flex">
                  <Button variant="secondary">Jump to Dashboard</Button>
                </a>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border bg-card p-3 shadow-soft">
                  <div className="text-xs text-muted-foreground">
                    Correlation
                  </div>
                  <div className="font-semibold">Sensor × NLP</div>
                </div>
                <div className="rounded-lg border bg-card p-3 shadow-soft">
                  <div className="text-xs text-muted-foreground">Coverage</div>
                  <div className="font-semibold">6 sectors</div>
                </div>
                <div className="rounded-lg border bg-card p-3 shadow-soft">
                  <div className="text-xs text-muted-foreground">Latency</div>
                  <div className="font-semibold">~2s updates</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-10 -z-10 bg-glow" />
              <Map hotspots={hotspots} />
            </div>
          </div>
        </div>
      </section>

      <section id="dashboard" className="relative py-12 md:py-20">
        <div className="container">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Live Incident Dashboard
              </h2>
              <p className="text-muted-foreground">
                Correlating social signals with ground‑truth sensors for
                hyper‑local decisions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border bg-card p-4 shadow-soft">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">Hotspot Map</h3>
                  <div className="text-xs text-muted-foreground">
                    Severity heat halos indicate risk
                  </div>
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                  <select value={filter} onChange={(e)=>setFilter(e.target.value as any)} className="rounded-md border bg-background px-2 py-1">
                    <option value="all">All</option>
                    <option value="normal">Normal</option>
                    <option value="elevated">Elevated</option>
                    <option value="critical">Critical</option>
                  </select>
                  <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search sector..." className="rounded-md border bg-background px-2 py-1" />
                </div>
                <Map hotspots={hotspots.filter(h=>{
                  const matches = h.label.toLowerCase().includes(search.toLowerCase());
                  const sev = h.severity;
                  const sevOk = filter==='all' || (filter==='normal' && sev<0.33) || (filter==='elevated' && sev>=0.33 && sev<0.66) || (filter==='critical' && sev>=0.66);
                  return matches && sevOk;
                })} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border bg-card p-4 shadow-soft">
                  <h3 className="mb-2 font-semibold">
                    Particulate Trend (PM2.5)
                  </h3>
                  <TrendChart
                    data={trendPM}
                    color="#06b6d4"
                    label="µg/m³ over time"
                  />
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-soft">
                  <h3 className="mb-2 font-semibold">Urgency Sentiment</h3>
                  <TrendChart
                    data={trendSent}
                    color="#a78bfa"
                    label="Relative urgency from communications"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border bg-card p-4 shadow-soft">
                <h3 className="mb-3 font-semibold">Local Sensor Readings</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border bg-background p-3">
                    <div className="text-muted-foreground">PM2.5</div>
                    <div
                      className={cn(
                        "mt-1 text-xl font-bold",
                        statColor(sensors.pm25, 80, 150),
                      )}
                    >
                      {sensors.pm25.toFixed(0)} µg/m³
                    </div>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <div className="text-muted-foreground">PM10</div>
                    <div
                      className={cn(
                        "mt-1 text-xl font-bold",
                        statColor(sensors.pm10, 120, 200),
                      )}
                    >
                      {sensors.pm10.toFixed(0)} µg/m³
                    </div>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <div className="text-muted-foreground">
                      Gas/Smoke (MQ‑2)
                    </div>
                    <div
                      className={cn(
                        "mt-1 text-xl font-bold",
                        statColor(sensors.gas, 400, 650),
                      )}
                    >
                      {sensors.gas.toFixed(0)} ppm
                    </div>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <div className="text-muted-foreground">Temperature</div>
                    <div
                      className={cn(
                        "mt-1 text-xl font-bold",
                        statColor(sensors.temp, 36, 40),
                      )}
                    >
                      {sensors.temp.toFixed(1)} °C
                    </div>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <div className="text-muted-foreground">Humidity</div>
                    <div className="mt-1 text-xl font-bold">
                      {sensors.humidity.toFixed(0)} %
                    </div>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <div className="text-muted-foreground">Correlation</div>
                    <div className="mt-1 text-sm">
                      {sensors.pm25 > 120
                        ? "Reports of smoke match PM2.5 spike"
                        : "No anomaly vs comms"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4 shadow-soft">
                <h3 className="mb-3 font-semibold">Communication Insights</h3>
                <ul className="space-y-3">
                  {posts.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-lg border bg-background p-3 hover:bg-secondary/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm">{p.text}</div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-xs",
                            p.sentiment === "high"
                              ? "bg-destructive/10 text-destructive"
                              : p.sentiment === "medium"
                                ? "bg-accent/10 text-accent"
                                : "bg-primary/10 text-primary",
                          )}
                        >
                          {p.sentiment}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-secondary px-2 py-0.5">
                          {p.location}
                        </span>
                        <span className="rounded-full bg-secondary px-2 py-0.5">
                          {p.need}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border bg-card p-4 shadow-soft">
                <h3 className="mb-3 font-semibold">Alerts</h3>
                <ul
                  className="space-y-2 text-sm"
                  role="status"
                  aria-live="polite"
                >
                  {uiAlerts.map((a) => (
                    <li
                      key={a.id}
                      className={cn(
                        "rounded-lg border p-3",
                        a.level === "critical"
                          ? "border-destructive/50 bg-destructive/5"
                          : a.level === "warn"
                            ? "border-accent/50 bg-accent/5"
                            : "bg-background",
                      )}
                    >
                      {a.text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border bg-card p-4 shadow-soft">
                <h3 className="mb-3 font-semibold">Alerts (Live)</h3>
                <ul className="space-y-2 text-sm">
                  {alerts.length === 0 && (
                    <li className="rounded-lg border bg-background p-3 text-muted-foreground">No alerts</li>
                  )}
                  {alerts.map((a) => (
                    <li key={a.id} className="rounded-lg border bg-background p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <div className="font-medium">{a.message}</div>
                          <div className="text-xs text-muted-foreground">{a.sector || "Unknown sector"} · {a.severity}{a.verified ? " · Verified" : ""}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("rounded-full px-2 py-0.5 text-xs",
                            a.severity === "critical" ? "bg-destructive/10 text-destructive" : a.severity === "warning" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary")}>{a.severity}</span>
                          {!a.verified && (
                            <button onClick={async()=>{
                              try {
                                await fetch('/api/alerts/verify', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: a.id }) });
                              } catch {}
                            }} className="rounded-md border px-2 py-1 text-xs hover:bg-secondary">Verify</button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sensors" className="border-t bg-secondary py-12 md:py-16">
        <div className="container">
          <h2 className="text-2xl font-bold">Hardware & Software Synergy</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            A compact Raspberry Pi / ESP32 node collects PM2.5/PM10, gas/smoke
            (MQ‑2), and temperature/humidity data over Wi‑Fi. NLP extracts
            locations, damage types, and aid needs from communications;
            analytics correlate both streams and generate timely alerts.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-4 shadow-soft">
              <div className="text-xs text-muted-foreground">Sensors</div>
              <div className="mt-1 font-semibold">
                PM2.5/PM10, MQ‑2, Temp/Humidity
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-soft">
              <div className="text-xs text-muted-foreground">AI/NLP</div>
              <div className="mt-1 font-semibold">
                Entities, sentiment, emerging topics
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-soft">
              <div className="text-xs text-muted-foreground">Map & Alerts</div>
              <div className="mt-1 font-semibold">
                Hotspots, correlations, discrepancies
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="py-12 md:py-16">
        <div className="container">
          <h2 className="text-2xl font-bold">Why it matters</h2>
          <div className="mt-2 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-4 shadow-soft">
              <div className="text-xs text-muted-foreground">
                Life‑Saving Potential
              </div>
              <div className="mt-1 font-semibold">
                Faster, more accurate response
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-soft">
              <div className="text-xs text-muted-foreground">
                Hyper‑Localized
              </div>
              <div className="mt-1 font-semibold">
                Street‑level, verifiable context
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-soft">
              <div className="text-xs text-muted-foreground">
                Compelling Demo
              </div>
              <div className="mt-1 font-semibold">
                Real‑time, interactive dashboard
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
