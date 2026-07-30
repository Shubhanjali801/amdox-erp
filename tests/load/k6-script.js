/**
 * Amdox ERP — k6 load test
 * Validates the NFRs: API Latency < 300ms P95, Throughput ~2,000 concurrent users.
 *
 * Run:
 *   BASE_URL=https://<your-domain>/api/v1 EMAIL=admin@amdox.com PASSWORD=*** \
 *     k6 run tests/load/k6-script.js
 *
 * Install k6: https://k6.io/docs/get-started/installation/
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Rate } from 'k6/metrics'

const BASE = __ENV.BASE_URL || 'http://localhost:5000/api/v1'
const EMAIL = __ENV.EMAIL || 'admin@amdox.com'
const PASSWORD = __ENV.PASSWORD || 'ChangeMe1!'

const loginTrend = new Trend('login_duration', true)
const readTrend = new Trend('read_duration', true)
const errorRate = new Rate('errors')

// PEAK_VUS is env-configurable. Default 50 = an honest number a single
// t3.large node can sustain; the 2,000-user NFR target needs the k8s HPA to
// scale backend replicas horizontally (which the architecture supports).
const PEAK = Number(__ENV.PEAK_VUS || 50)

export const options = {
  stages: [
    { duration: '30s', target: Math.ceil(PEAK / 2) },  // warm up
    { duration: '1m',  target: PEAK },                 // ramp
    { duration: '1m',  target: PEAK },                 // hold
    { duration: '20s', target: 0 },                    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],   // NFR: P95 < 300ms
    errors: ['rate<0.05'],              // < 5% errors
  },
}

// setup() runs ONCE before the VUs start: log in a single time and share the
// token with every VU. This mirrors real usage (a user logs in once, then
// browses) and keeps the auth-rate-limiter (10/15min per IP) out of the hot
// loop so the test measures the read path, not repeated logins.
export function setup() {
  const res = http.post(`${BASE}/auth/login`, JSON.stringify({ email: EMAIL, password: PASSWORD }), {
    headers: { 'Content-Type': 'application/json' },
  })
  loginTrend.add(res.timings.duration)
  if (res.status !== 200) {
    throw new Error(`setup login failed: HTTP ${res.status} — ${res.body}`)
  }
  return { token: res.json('data.accessToken') }
}

const ENDPOINTS = [
  '/dashboards/stats/overview',
  '/supply/vendors',
  '/supply/inventory',
  '/finance/ledger',
  '/hr/employees',
]

// Each VU loops the read-heavy endpoint mix using the shared token.
export default function (data) {
  const authHeaders = { headers: { Authorization: `Bearer ${data.token}` } }
  for (const ep of ENDPOINTS) {
    const res = http.get(`${BASE}${ep}`, authHeaders)
    readTrend.add(res.timings.duration)
    errorRate.add(res.status >= 400)
    check(res, { [`${ep} ok`]: (r) => r.status < 400 })
  }
  sleep(1)
}
