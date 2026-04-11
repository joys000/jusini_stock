// auth-modal.js — 주린이 계산기 통합 인증 모듈
// Firebase Google OAuth + 자동로그인 + 24시간 만료 + 로그인 팝업 모달

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth, GoogleAuthProvider,
    signInWithCredential, signInWithRedirect, getRedirectResult,
    signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Google OAuth Client ID (OAuth 2.0 Web Client)
const GOOGLE_CLIENT_ID = '935820034253-1u6uuaju2u6pndob9ab910vng5sjcb99.apps.googleusercontent.com';

// GIS(Google Identity Services) 라이브러리 동적 로드
function loadGIS() {
    return new Promise((resolve, reject) => {
        if (window.google?.accounts?.oauth2) { resolve(); return; }
        const s = document.createElement('script');
        s.src = 'https://accounts.google.com/gsi/client';
        s.onload = resolve;
        s.onerror = () => reject(new Error('GIS 로드 실패'));
        document.head.appendChild(s);
    });
}

const firebaseConfig = {
    apiKey: "AIzaSyALn9C2PHgMd95J41cNpceCojbp-c5Sfo0",
    authDomain: "jurinicalc.firebaseapp.com",
    projectId: "jurinicalc",
    storageBucket: "jurinicalc.firebasestorage.app",
    messagingSenderId: "935820034253",
    appId: "1:935820034253:web:8ad46e0b4af866664aa984"
};

let _app, _auth, _provider;

function getFirebase() {
    if (!_auth) {
        _app = initializeApp(firebaseConfig);
        _auth = getAuth(_app);
        _provider = new GoogleAuthProvider();
    }
    return { auth: _auth, provider: _provider };
}

/* ─── 스타일 주입 ──────────────────────────────────────── */
function injectStyles() {
    if (document.getElementById('auth-modal-css')) return;
    const s = document.createElement('style');
    s.id = 'auth-modal-css';
    s.textContent = `
        /* ── 모달 오버레이 ── */
        #auth-modal {
            position: fixed; inset: 0; z-index: 9999;
            display: none;
        }
        #auth-modal.active { display: flex; align-items: center; justify-content: center; }
        .auth-overlay {
            position: absolute; inset: 0;
            background: rgba(0,0,0,0.82);
            backdrop-filter: blur(10px);
            animation: authFadeIn 0.2s ease;
        }
        .auth-box {
            position: relative; z-index: 1;
            background: #111;
            border: 1px solid #222;
            border-radius: 24px;
            padding: 2.5rem 2rem 2rem;
            width: min(400px, 90vw);
            text-align: center;
            animation: authSlideUp 0.25s ease;
            box-shadow: 0 0 80px rgba(255,92,0,0.07), 0 20px 60px rgba(0,0,0,0.5);
        }
        @keyframes authFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes authSlideUp {
            from { opacity:0; transform: translateY(24px); }
            to   { opacity:1; transform: translateY(0); }
        }
        .auth-close {
            position: absolute; top: 1rem; right: 1rem;
            width: 30px; height: 30px; border-radius: 50%;
            background: #1a1a1a; border: 1px solid #2a2a2a;
            color: #666; font-size: 0.9rem;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            transition: all 0.2s; line-height: 1;
        }
        .auth-close:hover { background: #222; color: #fff; border-color: #333; }
        .auth-logo-wrap {
            width: 60px; height: 60px;
            background: transparent;
            border-radius: 16px; margin: 0 auto 1.25rem;
            display: flex; align-items: center; justify-content: center;
        }
        .auth-title { font-size: 1.3rem; font-weight: 800; color: #fff; margin-bottom: 0.4rem; }
        .auth-sub { font-size: 0.85rem; color: #666; margin-bottom: 1.75rem; }
        .auth-google-btn {
            width: 100%; padding: 0.88rem 1.5rem;
            background: #fff; color: #222;
            border: none; border-radius: 14px;
            font-size: 0.92rem; font-weight: 700;
            cursor: pointer; gap: 0.7rem;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s; font-family: 'DM Sans', sans-serif;
        }
        .auth-google-btn:hover {
            background: #f5f5f5;
            transform: translateY(-1px);
            box-shadow: 0 6px 24px rgba(255,255,255,0.12);
        }
        .auth-google-btn:active { transform: translateY(0); }
        .auth-google-btn svg { flex-shrink: 0; }
        .auth-remember {
            display: flex; align-items: center; justify-content: center; gap: 0.55rem;
            margin-top: 1.25rem; cursor: pointer;
            font-size: 0.85rem; color: #888;
        }
        .auth-remember input {
            accent-color: #FF5C00; width: 15px; height: 15px; cursor: pointer;
        }
        .auth-note { font-size: 0.77rem; color: #444; margin-top: 0.55rem; }
        .auth-error {
            background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.25);
            border-radius: 10px; padding: 0.6rem 0.9rem;
            color: #FF6B6B; font-size: 0.82rem; margin-top: 0.85rem; display: none;
        }

        /* ── 네비게이션 로그인 버튼 ── */
        .auth-btn-nav {
            background: transparent;
            border: 1px solid #2a2a2a;
            color: #888;
            padding: 0.44rem 1rem;
            border-radius: 50px;
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'DM Sans', sans-serif;
            display: flex; align-items: center; gap: 0.4rem;
            white-space: nowrap;
        }
        .auth-btn-nav:hover { border-color: #FF5C00; color: #FF5C00; }
        .auth-btn-nav svg { transition: transform 0.2s; }
        .auth-btn-nav:hover svg { transform: scale(1.1); }

        /* ── 유저 칩 (로그인 후) ── */
        .auth-user-chip {
            display: flex; align-items: center; gap: 0.45rem;
            background: #0d0d0d; border: 1px solid #222;
            border-radius: 50px; padding: 0.28rem 0.75rem 0.28rem 0.28rem;
            transition: border-color 0.2s;
        }
        .auth-user-chip:hover { border-color: #333; }
        .auth-avatar {
            width: 24px; height: 24px; border-radius: 50%;
            background: linear-gradient(135deg, #FF5C00, #ff8c42);
            display: flex; align-items: center; justify-content: center;
            font-size: 0.72rem; font-weight: 800; color: #fff;
            flex-shrink: 0; overflow: hidden;
        }
        .auth-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .auth-uname {
            font-size: 0.81rem; font-weight: 700; color: #ccc;
            max-width: 72px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .auth-divider-v { width: 1px; height: 13px; background: #2a2a2a; flex-shrink: 0; }
        .auth-logout-link {
            background: none; border: none;
            color: #555; font-size: 0.76rem;
            cursor: pointer; padding: 0;
            font-family: 'DM Sans', sans-serif;
            transition: color 0.2s; white-space: nowrap;
        }
        .auth-logout-link:hover { color: #FF6B6B; }
    `;
    document.head.appendChild(s);
}

/* ─── 모달 HTML 주입 ──────────────────────────────────── */
function injectModal() {
    if (document.getElementById('auth-modal')) return;
    const el = document.createElement('div');
    el.id = 'auth-modal';
    el.innerHTML = `
        <div class="auth-overlay" id="auth-overlay"></div>
        <div class="auth-box">
            <button class="auth-close" id="auth-close" aria-label="닫기">✕</button>
            <div class="auth-logo-wrap"><img src="logo.svg" alt="logo" style="width:36px;height:36px;border-radius:8px;"></div>
            <h2 class="auth-title">주린이 계산기</h2>
            <p class="auth-sub">Google 계정으로 간편하게 로그인하세요</p>
            <button class="auth-google-btn" id="auth-google-btn">
                <svg width="19" height="19" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 계속하기
            </button>
            <label class="auth-remember">
                <input type="checkbox" id="auth-remember" checked>
                <span>자동 로그인 — 내가 로그아웃할 때까지 유지</span>
            </label>
            <p class="auth-note">미선택 시 24시간 후 자동으로 로그아웃됩니다</p>
            <div class="auth-error" id="auth-error"></div>
        </div>
    `;
    document.body.appendChild(el);

    document.getElementById('auth-close').onclick    = closeModal;
    document.getElementById('auth-overlay').onclick  = closeModal;
    document.getElementById('auth-google-btn').onclick = handleGoogleLogin;
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function openModal()  { document.getElementById('auth-modal')?.classList.add('active'); }
function closeModal() { document.getElementById('auth-modal')?.classList.remove('active'); }

function saveLoginPrefs(remember) {
    localStorage.setItem('jurini_auto_login', remember ? 'true' : 'false');
    if (!remember) {
        localStorage.setItem('jurini_login_time', Date.now().toString());
    } else {
        localStorage.removeItem('jurini_login_time');
    }
}

const GOOGLE_BTN_INNER = `<svg width="19" height="19" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
</svg>Google로 계속하기`;

function showAuthError(errEl, msg, isWarn = false) {
    if (!errEl) return;
    errEl.style.background = isWarn ? 'rgba(255,170,0,0.1)' : 'rgba(255,107,107,0.1)';
    errEl.style.borderColor = isWarn ? 'rgba(255,170,0,0.3)' : 'rgba(255,107,107,0.25)';
    errEl.style.color = isWarn ? '#FFAA00' : '#FF6B6B';
    errEl.style.whiteSpace = 'pre-line';
    errEl.textContent = msg;
    errEl.style.display = 'block';
}

async function handleGoogleLogin() {
    const { auth } = getFirebase();
    const btn   = document.getElementById('auth-google-btn');
    const errEl = document.getElementById('auth-error');
    const remember = document.getElementById('auth-remember')?.checked ?? true;

    if (btn)   { btn.disabled = true; btn.style.opacity = '0.7'; btn.textContent = '처리 중...'; }
    if (errEl) errEl.style.display = 'none';

    try {
        saveLoginPrefs(remember);

        // ── GIS(Google Identity Services) 방식 ──────────────────────
        // Firebase signInWithPopup 대신 GIS로 직접 토큰 받아서 credential 생성
        // → firebaseapp.com relay 없이 인증 → GitHub Pages 크로스오리진 문제 해결
        await loadGIS();

        const accessToken = await new Promise((resolve, reject) => {
            try {
                const client = google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CLIENT_ID,
                    scope: 'openid email profile',
                    callback: (resp) => {
                        if (resp.error) {
                            reject(new Error(resp.error));
                        } else {
                            resolve(resp.access_token);
                        }
                    },
                    error_callback: (e) => reject(new Error(e?.type ?? 'gis_error')),
                });
                client.requestAccessToken({ prompt: 'select_account' });
            } catch (e) {
                reject(e);
            }
        });

        const credential = GoogleAuthProvider.credential(null, accessToken);
        await signInWithCredential(auth, credential);
        closeModal();

    } catch (err) {
        console.error('로그인 실패:', err.code ?? err.message);

        const msgMap = {
            'auth/invalid-credential':
                '인증 정보가 올바르지 않습니다. 다시 시도해주세요.',
            'auth/unauthorized-domain':
                `도메인 미인증 오류\nFirebase Console → Authentication → Authorized Domains\n"${location.hostname}" 추가 필요`,
            'auth/operation-not-allowed':
                'Firebase에서 Google 로그인이 비활성화 상태입니다.',
            'auth/network-request-failed':
                '네트워크 오류입니다. 인터넷 연결을 확인하세요.',
            'auth/too-many-requests':
                '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
            'auth/user-disabled':
                '해당 계정은 비활성화되었습니다.',
            'popup_closed_by_user':
                '로그인 창이 닫혔습니다. 다시 시도해주세요.',
            'access_denied':
                '구글 계정 접근이 거부되었습니다. 다시 시도해주세요.',
        };

        const key = err.code ?? err.message;
        const msg = msgMap[key] ?? `오류: ${key ?? 'unknown'}\n잠시 후 다시 시도해주세요.`;
        showAuthError(errEl, msg);

    } finally {
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerHTML = GOOGLE_BTN_INNER;
        }
    }
}

/* ─── 세션 만료 체크 ─────────────────────────────────── */
function checkExpiry(user) {
    if (!user) return;
    const autoLogin = localStorage.getItem('jurini_auto_login') === 'true';
    if (autoLogin) return;
    const loginTime = parseInt(localStorage.getItem('jurini_login_time') || '0');
    const EXPIRE_MS = 24 * 60 * 60 * 1000; // 24h
    if (loginTime && Date.now() - loginTime > EXPIRE_MS) {
        const { auth } = getFirebase();
        signOut(auth);
        localStorage.removeItem('jurini_login_time');
        localStorage.removeItem('jurini_auto_login');
    }
}

/* ─── 네비 UI 업데이트 ───────────────────────────────── */
function updateNavUI(user) {
    const loginBtn  = document.getElementById('btn-login');
    const userInfo  = document.getElementById('user-info');

    if (!loginBtn && !userInfo) return;

    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'flex';
            const avatar = userInfo.querySelector('.auth-avatar');
            const uname  = userInfo.querySelector('.auth-uname, #user-name');
            if (avatar) {
                avatar.innerHTML = user.photoURL
                    ? `<img src="${user.photoURL}" alt="avatar">`
                    : (user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U');
            }
            if (uname) {
                const first = user.displayName ? user.displayName.split(' ')[0] : '사용자';
                uname.textContent = first;
            }
        }
    } else {
        if (loginBtn) loginBtn.style.display = '';
        if (userInfo) userInfo.style.display = 'none';
    }
}

/* ─── 로그아웃 핸들러 ────────────────────────────────── */
function handleLogout() {
    const { auth } = getFirebase();
    signOut(auth);
    localStorage.removeItem('jurini_auto_login');
    localStorage.removeItem('jurini_login_time');
}

/* ─── 초기화 (DOMContentLoaded 에서 호출) ─────────────── */
async function initAuth() {
    injectStyles();
    injectModal();

    const { auth } = getFirebase();

    const loginBtn  = document.getElementById('btn-login');
    const logoutBtn = document.getElementById('btn-logout');

    if (loginBtn)  loginBtn.onclick  = openModal;
    if (logoutBtn) logoutBtn.onclick = handleLogout;

    // ── redirect 폴백 결과 처리 (팝업 차단으로 redirect 사용 시) ───
    try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
            console.log('✅ redirect 로그인 성공:', result.user.displayName);
            closeModal();
        }
    } catch (e) {
        const ignoreCodes = ['auth/no-auth-event', 'auth/null-user'];
        if (e.code && !ignoreCodes.includes(e.code)) {
            console.warn('getRedirectResult 오류:', e.code, e.message);
            // redirect 결과 오류는 UI 에러로 표시 (모달이 열려 있을 때만)
            const errEl = document.getElementById('auth-error');
            if (errEl && document.getElementById('auth-modal')?.classList.contains('active')) {
                showAuthError(errEl, `로그인 오류 (${e.code})\n잠시 후 다시 시도해주세요.`);
            }
        }
    }

    onAuthStateChanged(auth, (user) => {
        checkExpiry(user);
        updateNavUI(user);
    });
}

document.addEventListener('DOMContentLoaded', initAuth);

export { openModal, closeModal, handleLogout };
