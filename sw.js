// sw.js — 주린이 계산기 Service Worker
// 오프라인 지원 및 정적 자원 캐싱

// 캐시 버전: 배포 시 버전 번호와 날짜를 수동으로 올려주세요
// 형식: 'jurini-v{major}.{minor}.{patch}-{YYYYMMDD}'
const CACHE_VERSION = 'jurini-v1.0.1-20260415';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// 설치 시 미리 캐시할 정적 자원
const PRECACHE_URLS = [
  './',
  './index.html',
  './dividend-calculator.html',
  './average-calculator.html',
  './chart-simulator.html',
  './mock-invest.html',
  './stock-dictionary.html',
  './beginner-guide.html',
  './about.html',
  './contact.html',
  './privacy.html',
  './terms.html',
  './logo.svg',
  './manifest.json'
];

// 설치
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// 활성화 — 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// fetch — 네트워크 우선, 실패 시 캐시 (API 제외)
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // GET 요청만 처리
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 외부 API / 광고 / Firebase는 캐시 제외
  const skipCache = [
    'onrender.com',
    'workers.dev',
    'corsproxy.io',
    'finance.yahoo.com',
    'finance.naver.com',
    'googlesyndication.com',
    'doubleclick.net',
    'firebaseio.com',
    'googleapis.com',
    'gstatic.com',
    'supabase.co'
  ].some((host) => url.hostname.includes(host));

  if (skipCache) return; // 네트워크 그대로 진행

  // 정적 자원 — Cache First
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // 성공한 응답만 캐시
          if (response.ok && response.type !== 'opaque') {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match('./index.html')); // 오프라인 폴백
    })
  );
});
