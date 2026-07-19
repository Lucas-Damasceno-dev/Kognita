/**
 * Helper utility function for Haptic Feedback on interactive items and buttons.
 * Uses navigator.vibrate when available.
 */
export function triggerHaptic(pattern: number | number[] = [15, 30]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore gracefully if not allowed or unsupported
    }
  }
}
