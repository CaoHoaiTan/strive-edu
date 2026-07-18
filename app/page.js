'use client';

import { useEffect, useRef, useState } from 'react';
import { BODY_HTML } from './legacy/body-markup';
import { initMissionControl } from './legacy/init-mission-control';

const FORCED_USER_EMAIL = 'nguyenthithuhuong4869@gmail.com';

export default function Home() {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    initMissionControl({ userId: FORCED_USER_EMAIL });
  }, [ready]);

  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: BODY_HTML }}
    />
  );
}
