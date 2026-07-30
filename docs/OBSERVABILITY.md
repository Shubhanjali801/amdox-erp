# Observability

Amdox ERP ships the three pillars of observability, all viewable in a single Grafana:

| Pillar   | Tool                         | Source                                                        |
|----------|------------------------------|--------------------------------------------------------------|
| Metrics  | **Prometheus** + Grafana     | Backend `/metrics` (prom-client) — request rate, P95 latency |
| Logs     | **Loki** + Promtail          | Every pod's stdout, shipped by a Promtail DaemonSet          |
| Traces   | **Tempo** + OpenTelemetry    | Backend spans (HTTP → Express → Prisma/Postgres → Redis)     |

Metrics live in `k8s/09-monitoring.yaml` (always deployed). Logs + traces live in
`k8s/11-observability.yaml` (opt-in — see RAM note below).

## Traces — OpenTelemetry

`backend/src/telemetry.ts` boots the OpenTelemetry Node SDK with
auto-instrumentation for HTTP, Express, `pg`/Prisma and `ioredis`. It is the
**first import in `index.ts`** so libraries are patched at require time, and it is
a **complete no-op unless `OTEL_TRACES_ENABLED=true`** — dev and local runs pay
zero overhead.

When enabled, spans are exported over OTLP/HTTP to Grafana Tempo. Configuration
(all read from the `amdox-config` ConfigMap):

| Env var                       | Default                | Meaning                          |
|-------------------------------|------------------------|----------------------------------|
| `OTEL_TRACES_ENABLED`         | `false`                | Master switch                    |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://tempo:4318`    | Tempo OTLP/HTTP receiver         |
| `OTEL_SERVICE_NAME`           | `amdox-backend`        | Service name shown in traces     |

To turn tracing on, set `OTEL_TRACES_ENABLED=true` in `k8s/deploy.env` and
redeploy — a single request then produces a trace spanning the HTTP handler, the
Express middleware chain, and each database/Redis call.

## Logs — Loki

A **Promtail** DaemonSet tails `/var/log/pods/**` on the node and pushes each
line to **Loki**, tagged with `namespace`, `app`, `pod`, and `container` labels
(so you can filter to, e.g., `{app="backend"}` in Grafana → Explore → Loki).
The backend already logs to stdout via winston, so nothing changes app-side.

## Deploy & view

```bash
# metrics only (default)                     — already applied by deploy-k3s.sh
kubectl apply -f k8s/09-monitoring.yaml

# add logs + traces (~600Mi extra on the node; scale ml-service to 0 first if tight)
kubectl apply -f k8s/11-observability.yaml

# one Grafana for all three pillars — datasources are auto-provisioned
kubectl -n amdox port-forward svc/grafana 3000:3000
# → http://localhost:3000  (Explore: pick Prometheus / Loki / Tempo)
```

**RAM note:** the node is a single 8 GB t3.large already running Postgres, Redis,
the backend (×2), frontend, and the ML service. Loki + Promtail + Tempo add
~600 Mi of requests; apply `11-observability.yaml` when demoing observability and
scale `ml-service` down (`kubectl -n amdox scale deploy/ml-service --replicas=0`)
if the node is memory-pressured.
