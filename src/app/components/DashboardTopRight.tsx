'use client';

import { CongressionalAppChallengeButton } from './CongressionalAppChallengeButton';
import { DashboardMessenger } from './DashboardMessenger';

export function DashboardTopRight() {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
      <CongressionalAppChallengeButton />
      <DashboardMessenger />
    </div>
  );
}
