/**
 * OpenTelemetry tracing bootstrap.
 *
 * MUST be imported before any other application module (it is the first import
 * in index.ts) so the auto-instrumentations can patch http / express / pg /
 * ioredis at require time and produce spans automatically.
 *
 * It is a complete no-op unless OTEL_TRACES_ENABLED=true, so local and dev runs
 * are unaffected and pay zero overhead. In the cluster it exports OTLP traces to
 * Grafana Tempo (see k8s/11-observability.yaml).
 *
 * Service name / resource attributes are read from the standard OTEL_* env vars
 * (OTEL_SERVICE_NAME, OTEL_RESOURCE_ATTRIBUTES) by the SDK itself — kept out of
 * code on purpose to stay robust across @opentelemetry/resources major versions.
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

let sdk: NodeSDK | undefined;

if (process.env.OTEL_TRACES_ENABLED === 'true') {
  const base = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://tempo:4318';
  const service = process.env.OTEL_SERVICE_NAME || 'amdox-backend';

  sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({ url: `${base}/v1/traces` }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // fs spans are extremely noisy and drown out the useful HTTP/DB traces.
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  try {
    sdk.start();
    // eslint-disable-next-line no-console
    console.log(`[otel] tracing enabled → ${base} (service=${service})`);
  } catch (err) {
    // Never let telemetry init crash the API.
    // eslint-disable-next-line no-console
    console.error(`[otel] failed to start, continuing without tracing: ${(err as Error).message}`);
  }

  // Flush spans on shutdown so in-flight traces are not lost.
  process.on('SIGTERM', () => {
    void sdk?.shutdown();
  });
}

export { sdk };
