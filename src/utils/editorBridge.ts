/**
 * A tiny bridge to the live Monaco model.
 *
 * The store already mirrors the editor on every keystroke, but "download what
 * the user is looking at" should not depend on that mirror being in sync. The
 * editor registers a getter here and consumers (currently the download action)
 * read the model directly, falling back to the store when no editor is mounted.
 *
 * This is read-only by design: nothing here can write to the model, so it can
 * never modify the user's source.
 */

type ValueGetter = () => string | undefined;

let currentGetter: ValueGetter | null = null;

/**
 * Registers the active editor's value getter and returns a disposer.
 *
 * The disposer only clears the slot if it still holds *this* getter, so the old
 * editor unmounting after a new one has registered cannot blank it out.
 */
export function registerEditorValueGetter(getter: ValueGetter): () => void {
  currentGetter = getter;
  return () => {
    if (currentGetter === getter) currentGetter = null;
  };
}

/** The editor's current text, or undefined if no editor is mounted yet. */
export function getLiveEditorValue(): string | undefined {
  if (!currentGetter) return undefined;
  try {
    const value = currentGetter();
    return typeof value === 'string' ? value : undefined;
  } catch {
    // A disposed model throws; the caller falls back to the store.
    return undefined;
  }
}
