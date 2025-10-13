import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    constant_load: {
      executor: 'constant-arrival-rate',
      rate: 300,          // Target 300 requests per second
      timeUnit: '1s',
      duration: '5m',     // Durasi test 5 menit
      preAllocatedVUs: 200, // Jumlah VU awal dialokasikan
      maxVUs: 500,        // Maks VU jika butuh scaling
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],         // Maks toleransi error 1%
    http_req_duration: ['p(95)<500'],       // 95% request selesai di bawah 500ms
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/records?page=1&limit=100');
 check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
