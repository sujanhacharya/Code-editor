/**
 * Transient, non-blocking notifications.
 *
 * Implemented as a window event rather than store state so a toast can never
 * end up in persisted storage and cannot trigger a re-render of the editor
 * tree. This matches the existing 'run-cpp' / 'goto-position' event pattern.
 */

export interface ToastPayload {
  /** Unique per toast so a repeat of the same message still re-animates. */
  id: number;
  message: string;
}

const TOAST_EVENT = 'codelab-toast';

let counter = 0;

export function showToast(message: string): void {
  if (typeof window === 'undefined') return;
  counter += 1;
  window.dispatchEvent(
    new CustomEvent<ToastPayload>(TOAST_EVENT, {
      detail: { id: counter, message },
    })
  );
}

export function subscribeToToasts(listener: (toast: ToastPayload) => void): () => void {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<ToastPayload>).detail;
    if (detail && typeof detail.message === 'string') listener(detail);
  };
  window.addEventListener(TOAST_EVENT, handler);
  return () => window.removeEventListener(TOAST_EVENT, handler);
}
