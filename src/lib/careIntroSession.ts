/** sessionStorage: intro has finished in this tab; skip on in-app navigation / remounts. Cleared on sign-out so the next sign-in can show it again. */
export const CCA_CARE_INTRO_SESSION_KEY = "cca-care-intro-completed";

export function shouldSkipCareIntro(): boolean {
  try {
    return sessionStorage.getItem(CCA_CARE_INTRO_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markCareIntroCompleted(): void {
  try {
    sessionStorage.setItem(CCA_CARE_INTRO_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearCareIntroSessionFlag(): void {
  try {
    sessionStorage.removeItem(CCA_CARE_INTRO_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
