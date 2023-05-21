/**
 * Returns true if the given error object has a property
 * "__isTransitory" with a truthy value.
 * @param err An error.
 */
export function isTransitoryMarkedError(err: Error) {
  // deno-lint-ignore no-explicit-any
  if ((err as any).__isTransitory) {
    return true;
  } else {
    return false;
  }
}
