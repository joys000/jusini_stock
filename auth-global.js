// auth-global.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 🚨 민주의 Firebase 설정값을 여기에 딱 한 번만 정의한다!
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "jurinicalc.firebaseapp.com",
    projectId: "jurinicalc",
    storageBucket: "jurinicalc.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 모든 페이지에서 공통으로 실행될 로그인/로그아웃 로직
export function initGlobalAuth() {
    const loginBtn = document.getElementById('btn-login');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const logoutBtn = document.getElementById('btn-logout');

    if (loginBtn) loginBtn.onclick = () => signInWithPopup(auth, provider);
    if (logoutBtn) logoutBtn.onclick = () => signOut(auth);

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // 로그인 상태일 때
            if (loginBtn) loginBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex';
            if (userName) userName.innerText = user.displayName;
            console.log("✅ 유저 로그인됨:", user.displayName);
        } else {
            // 로그아웃 상태일 때
            if (loginBtn) loginBtn.style.display = 'block';
            if (userInfo) userInfo.style.display = 'none';
            console.log("⚠️ 유저 로그아웃됨");
        }
    });
}

// 페이지 로드 시 즉시 실행
document.addEventListener('DOMContentLoaded', initGlobalAuth);