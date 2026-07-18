'use client';

import { useEffect, useRef } from 'react';
import { BODY_HTML } from './legacy/body-markup';
import { initMissionControl } from './legacy/init-mission-control';

export default function Home() {
  const containerRef = useRef(null);

  useEffect(() => {
    initMissionControl();
  }, []);

  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: BODY_HTML }}
    />
  );
}
