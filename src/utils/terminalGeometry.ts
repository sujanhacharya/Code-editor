/**
 * Terminal geometry.
 *
 * The old implementation hard-clamped the terminal to 500px in two places
 * (store.setTerminalHeight and App's <ResizablePanel maxSize={500}>), which is
 * why long compiler output was clipped and "maximize" appeared to do nothing.
 *
 * Heights are computed from the live viewport instead of being fixed, so the
 * terminal stays responsive across window sizes.
 */

/** Global app chrome that the terminal must never cover. */
export const HEADER_HEIGHT = 48; // --header-height
export const STATUS_BAR_HEIGHT = 24; // status bar in App.tsx

/** Terminal is unusable below this; keeps tab bar + stdin + a few output rows. */
export const TERMINAL_MIN_HEIGHT = 180;

/** Height of the tab bar only, used for the collapsed state. */
export const TERMINAL_COLLAPSED_HEIGHT = 34;

/** Sensible starting height (spec asks for ~300-350). */
export const TERMINAL_DEFAULT_HEIGHT = 320;

/** Fraction of the workspace the terminal occupies when maximized. */
export const TERMINAL_MAX_FRACTION = 0.8;

/** Keep at least this much Monaco visible so the editor never fully vanishes. */
const MIN_EDITOR_VISIBLE = 48;

/** Vertical space available to editor + terminal (excludes header & status bar). */
export function getWorkspaceHeight(): number {
  const h = typeof window === 'undefined' ? 900 : window.innerHeight;
  return Math.max(240, h - HEADER_HEIGHT - STATUS_BAR_HEIGHT);
}

/**
 * Largest height a user may drag the terminal to. Bounded so Monaco keeps a
 * visible strip and the header/status bar are never covered.
 */
export function getTerminalMaxHeight(): number {
  const workspace = getWorkspaceHeight();
  return Math.max(
    TERMINAL_MIN_HEIGHT,
    Math.min(workspace - MIN_EDITOR_VISIBLE, Math.round(workspace * 0.9))
  );
}

/** Height used by the maximize / full-terminal state (80% of workspace). */
export function getTerminalMaximizedHeight(): number {
  const workspace = getWorkspaceHeight();
  return Math.max(
    TERMINAL_MIN_HEIGHT,
    Math.min(getTerminalMaxHeight(), Math.round(workspace * TERMINAL_MAX_FRACTION))
  );
}

/** Clamp any requested height into the currently legal range. */
export function clampTerminalHeight(h: number): number {
  if (!Number.isFinite(h)) return TERMINAL_DEFAULT_HEIGHT;
  return Math.min(getTerminalMaxHeight(), Math.max(TERMINAL_MIN_HEIGHT, Math.round(h)));
}
