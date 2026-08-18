'use client';

import Image from 'next/image';
import SpecularButton from './SpecularButton';

export function CongressionalAppChallengeButton() {
  return (
    <SpecularButton
      size="md"
      radius={12}
      tint="#ffffff"
      tintOpacity={0.1}
      blur={12}
      textColor="#f1f5f9"
      lineColor="#c4b5fd"
      baseColor="#334155"
      intensity={1.1}
      shineSize={12}
      shineFade={36}
      thickness={1.25}
      followMouse
      proximity={280}
      className="cca-dashboard-specular-btn"
      onClick={() =>
        window.open('https://www.congressionalappchallenge.us/25-FL17/', '_blank', 'noopener,noreferrer')
      }
    >
      <span className="inline-flex items-center gap-3">
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
          <Image
            src="/images/CAClogo-dome-only-color.png"
            alt=""
            width={32}
            height={32}
            className="h-auto w-auto object-contain"
            aria-hidden
          />
        </span>
        <span className="whitespace-nowrap font-medium">Winners of Congressional App Challenge</span>
      </span>
    </SpecularButton>
  );
}
