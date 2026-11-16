export interface CircuitDraft {
  source: string;
  optimization: boolean;
}

export const DRAFT_KEY = "logic-lab-draft";

export function loadDraft(): CircuitDraft | null {
  try {
    const stored = window.localStorage.getItem(DRAFT_KEY);
    if (stored === null) return null;
    const draft: unknown = JSON.parse(stored);
    if (
      draft === null ||
      typeof draft !== "object" ||
      Array.isArray(draft) ||
      !("source" in draft) ||
      typeof draft.source !== "string" ||
      !("optimization" in draft) ||
      typeof draft.optimization !== "boolean"
    )
      return null;
    return { source: draft.source, optimization: draft.optimization };
  } catch {
    return null;
  }
}

export function saveDraft(draft: CircuitDraft): boolean {
  try {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ source: draft.source, optimization: draft.optimization }),
    );
    return true;
  } catch {
    return false;
  }
}
