/** @returns {typeof chrome} */
export function ext() {
  return globalThis.browser ?? globalThis.chrome;
}

/**
 * Extension storage for content scripts.
 * `storage.session` exists in Chrome/Firefox but is not allowed from content
 * scripts by default ("Access to storage is not allowed from this context").
 */
export function sessionStorage() {
  return ext().storage.local;
}
