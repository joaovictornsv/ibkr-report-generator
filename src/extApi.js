/** @returns {typeof chrome} */
export function ext() {
  return globalThis.browser ?? globalThis.chrome;
}

/** Session storage (Firefox 115+, Chrome 102+). Falls back to local. */
export function sessionStorage() {
  const storage = ext().storage;
  return storage.session ?? storage.local;
}
