'use client';

import { useRouter } from 'next/navigation';
import SpecularButton from './SpecularButton';

export function DashboardMessenger() {
  const router = useRouter();

  return (
    <SpecularButton
      size="md"
      radius={12}
      tint="#ffffff"
      tintOpacity={0.1}
      blur={12}
      textColor="#f1f5f9"
      lineColor="#7dd3fc"
      baseColor="#334155"
      intensity={1.1}
      shineSize={12}
      shineFade={36}
      thickness={1.25}
      followMouse
      proximity={280}
      className="cca-dashboard-specular-btn"
      onClick={() => router.push('/messenger')}
    >
      <span className="inline-flex items-center gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/25 to-indigo-500/30 text-lg">
          💬
        </span>
        <span className="whitespace-nowrap font-medium">Messenger</span>
      </span>
    </SpecularButton>
  );
}
