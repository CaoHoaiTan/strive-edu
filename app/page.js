'use client';

import { useEffect, useRef, useState } from 'react';
import { BODY_HTML } from './legacy/body-markup';
import { initMissionControl } from './legacy/init-mission-control';
import { getSupabaseBrowserClient } from '../lib/supabase';

export default function Home() {
  const containerRef = useRef(null);
  const [authState, setAuthState] = useState({ loading: true, session: null, client: null });
  const [email, setEmail] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authCooldown, setAuthCooldown] = useState(0);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setAuthState({ loading: false, session: null, client: null });
      return;
    }

    let alive = true;
    client.auth.getSession().then(({ data }) => {
      if (alive) setAuthState({ loading: false, session: data.session, client });
    });
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      setAuthState({ loading: false, session, client });
      window.__missionControlInited = false;
    });

    return () => {
      alive = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authCooldown <= 0) return undefined;
    const timer = window.setTimeout(() => setAuthCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [authCooldown]);

  useEffect(() => {
    if (authState.loading) return;
    if (authState.client && !authState.session) return;
    initMissionControl({ userId: authState.session?.user?.id || null });
  }, [authState]);

  async function signIn(event) {
    event.preventDefault();
    setAuthMessage('');
    if (authCooldown > 0) return;
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setAuthMessage('Nhập email để đăng nhập.');
      return;
    }
    const { error } = await authState.client.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_SITE_URL || window.location.origin,
      },
    });
    if (error) {
      const isRateLimit = error.status === 429 || /rate limit/i.test(error.message);
      setAuthMessage(
        isRateLimit
          ? 'Bạn vừa yêu cầu email đăng nhập. Chờ khoảng 60 giây rồi thử lại, hoặc kiểm tra inbox/spam.'
          : error.message,
      );
      if (isRateLimit) setAuthCooldown(60);
      return;
    }
    setAuthCooldown(60);
    setAuthMessage('Đã gửi magic link. Kiểm tra email để đăng nhập.');
  }

  if (authState.loading) {
    return <div className="auth-screen">Đang tải...</div>;
  }

  if (authState.client && !authState.session) {
    return (
      <main className="auth-screen">
        <form className="glass auth-panel" onSubmit={signIn}>
          <div className="brand auth-brand">
            <div className="brand-mark">MC</div>
            <div className="brand-text">
              <div className="t1">Mission Control</div>
              <div className="t2">PSPO · PMP TRACKER</div>
            </div>
          </div>
          <h1>Đăng nhập</h1>
          <p>Nhập email để nhận magic link và mở dashboard học tập của bạn.</p>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
          <button className="btn btn-primary" type="submit" disabled={authCooldown > 0}>
            {authCooldown > 0 ? `Gửi lại sau ${authCooldown}s` : 'Gửi magic link'}
          </button>
          {authMessage ? <div className="field-error">{authMessage}</div> : null}
        </form>
      </main>
    );
  }

  return (
    <>
      {authState.client ? (
        <div className="auth-session-bar">
          <span>{authState.session.user.email}</span>
          <button className="btn btn-sm" onClick={() => authState.client.auth.signOut()}>Đăng xuất</button>
        </div>
      ) : null}
      <div
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: BODY_HTML }}
      />
    </>
  );
}
