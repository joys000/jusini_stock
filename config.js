// config.js — 주린이 계산기 전역 설정
// 서버 URL이나 API 엔드포인트가 바뀌면 이 파일만 수정하면 됩니다.

window.JURINI_CONFIG = Object.freeze({
  // 백엔드 서버 (Render)
  RENDER_SERVER: 'https://dividend-server.onrender.com',

  // Cloudflare Workers 프록시
  PROXY: 'https://workerjs.momlego5510.workers.dev/api',
  YF_PROXY: 'https://workerjs.momlego5510.workers.dev/yf',

  // Supabase (포트폴리오 저장 등)
  SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',  // TODO: Supabase 프로젝트 생성 후 실제 URL 입력
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',       // TODO: Supabase anon key 입력

  // Firebase (Auth 전용)
  FIREBASE: {
    apiKey: 'AIzaSyALn9C2PHgMd95J41cNpceCojbp-c5Sfo0',
    authDomain: 'jurinicalc.firebaseapp.com',
    projectId: 'jurinicalc',
    storageBucket: 'jurinicalc.firebasestorage.app',
    messagingSenderId: '935820034253',
    appId: '1:935820034253:web:8ad46e0b4af866664aa984'
  },

  // Google Analytics 4
  GA4_MEASUREMENT_ID: 'G-XXXXXXXXXX', // TODO: 실제 측정 ID로 교체

  // 사이트 메타
  SITE_URL: 'https://joys000.github.io/jusini_stock',
  SITE_NAME: '주린이 계산기'
});

// 레거시 전역 상수 (기존 코드 호환용)
window.RENDER_SERVER_URL = window.JURINI_CONFIG.RENDER_SERVER;
window.PROXY_URL = window.JURINI_CONFIG.PROXY;
window.YF_PROXY_URL = window.JURINI_CONFIG.YF_PROXY;
