// portfolio.js — Supabase 기반 포트폴리오 저장 모듈 (스텁)
//
// 사용 전 준비 사항:
// 1. https://supabase.com 에서 프로젝트 생성
// 2. SQL Editor에서 다음 테이블 생성:
//
//    create table portfolios (
//      id uuid primary key default gen_random_uuid(),
//      user_id text not null,
//      symbol text not null,
//      name text,
//      qty numeric not null,
//      avg_price numeric not null,
//      currency text default 'USD',
//      created_at timestamptz default now(),
//      updated_at timestamptz default now()
//    );
//
//    -- RLS 활성화
//    alter table portfolios enable row level security;
//
//    -- 사용자 자신의 데이터만 읽기/쓰기 (Firebase UID 기반)
//    create policy "users can manage own portfolio"
//      on portfolios for all
//      using (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
//
// 3. config.js의 SUPABASE_URL, SUPABASE_ANON_KEY를 실제 값으로 교체

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = window.JURINI_CONFIG;

if (window.JURINI_CONFIG?.SUPABASE_URL?.includes('YOUR_PROJECT')) {
    console.warn('[portfolio] Supabase 미설정 — config.js에서 실제 URL/KEY를 입력하세요');
}

let _supabase = null;
function getClient() {
  if (!_supabase) {
    if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.includes('YOUR_PROJECT')) {
      console.warn('[portfolio] Supabase 미설정 — config.js를 확인하세요');
      return null;
    }
    _supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }
  return _supabase;
}

/**
 * 사용자의 포트폴리오 전체 조회
 * @param {string} userId - Firebase UID
 */
export async function loadPortfolio(userId) {
  const sb = getClient();
  if (!sb || !userId) return [];
  const { data, error } = await sb
    .from('portfolios')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('[portfolio] load 실패:', error);
    return [];
  }
  return data || [];
}

/**
 * 종목 추가 또는 수량 업데이트
 */
export async function upsertHolding(userId, { symbol, name, qty, avgPrice, currency = 'USD' }) {
  const sb = getClient();
  if (!sb || !userId) return null;
  const { data, error } = await sb
    .from('portfolios')
    .upsert({
      user_id: userId,
      symbol,
      name,
      qty,
      avg_price: avgPrice,
      currency,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,symbol' })
    .select()
    .single();
  if (error) {
    console.error('[portfolio] upsert 실패:', error);
    return null;
  }
  return data;
}

/**
 * 종목 삭제
 */
export async function deleteHolding(userId, symbol) {
  const sb = getClient();
  if (!sb || !userId) return false;
  const { error } = await sb
    .from('portfolios')
    .delete()
    .match({ user_id: userId, symbol });
  if (error) {
    console.error('[portfolio] delete 실패:', error);
    return false;
  }
  return true;
}

// TODO: mock-invest.html에 통합 — 로그인 시 loadPortfolio(),
//       매수/매도 시 upsertHolding(), 전량 매도 시 deleteHolding()
