/**
 * Pause execution for a given number of milliseconds.
 *
 * @param delayMs  Duration to wait in milliseconds.
 * @returns A promise that resolves after the delay elapses.
 */
export const sleep = (delayMs: number) => {
  return new Promise<void>((resolve) => setTimeout(resolve, delayMs))
}
