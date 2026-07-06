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

export const options = {
  // Ramp toward heavy concurrency, then hold (scale down for a laptop run)
  stages: [
    { duration: '1m', target: 200 },    // warm up
    { duration: '2m', target: 1000 },   // ramp
    { duration: '3m', target: 2000 },   // hold at NFR target
    { duration: '1m', target: 0 },      // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],   // NFR: P95 < 300ms
    errors: ['rate<0.01'],              // < 1% errors
  },
}

// Each VU logs in once, then loops read-heavy endpoints (realistic mix)
export default function () {
  // ── login ──
  const loginRes = http.post(`${BASE}/auth/login`, JSON.stringify({ email: EMAIL, password: PASSWORD }), {
    headers: { 'Content-Type': 'application/json' },
  })
  loginTrend.add(loginRes.timings.duration)
  const ok = check(loginRes, { 'login 200': (r) => r.status === 200 })
  errorRate.add(!ok)
  if (!ok) { sleep(1); return }

  const token = loginRes.json('data.accessToken')
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } }

  // ── read-heavy workload (dashboards + lists) ──
  const endpoints = [
    '/dashboards/stats/overview',
    '/supply/vendors',
    '/supply/inventory',
    '/finance/ledger',
    '/hr/employees',
  ]
  for (const ep of endpoints) {
    const res = http.get(`${BASE}${ep}`, authHeaders)
    readTrend.add(res.timings.duration)
    errorRate.add(res.status >= 400)
    check(res, { [`${ep} ok`]: (r) => r.status < 400 })
  }

  sleep(1)
}
