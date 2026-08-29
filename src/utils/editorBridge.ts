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

interface Registration {
  /** Which file the registered editor is showing. */
  fileId: string;
  getter: ValueGetter;
}

let current: Registration | null = null;

/**
 * Registers the active editor's value getter and returns a disposer.
 *
 * The disposer only clears the slot if it still holds *this* registration, so
 * the old editor unmounting after a new one has registered cannot blank it out.
 */
export function registerEditorValueGetter(
  fileId: string,
  getter: ValueGetter
): () => void {
  const registration: Registration = { fileId, getter };
  current = registration;
  return () => {
    if (current === registration) current = null;
  };
}

/**
 * The editor's current text for `fileId`, or undefined if no editor is mounted
 * for that file yet.
 *
 * The id is checked rather than assumed: during a file switch there is a commit
 * where the previous editor is registered but the store has already moved on,
 * and handing back that text would pair one file's content with another file's
 * name. Returning undefined instead makes the caller fall back to the store
 * copy, which is correct for the file being asked about.
 */
export function getLiveEditorValue(fileId: string): string | undefined {
  if (!current || current.fileId !== fileId) return undefined;
  try {
    const value = current.getter();
    return typeof value === 'string' ? value : undefined;
  } catch {
    // A disposed model throws; the caller falls back to the store.
    return undefined;
  }
}
