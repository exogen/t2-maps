import { useState, useSyncExternalStore } from "react";

function subscribeToHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function noopSubscribe() {
  return () => {};
}

function getHashSnapshot() {
  return window.location.hash.slice(1);
}

function getServerSnapshot() {
  return "";
}

/**
 * Read the current URL hash (without the leading #).
 */
export function useLocationHash({
  subscribe = true,
}: { subscribe?: boolean } = {}) {
  const [stateHash, setStateHash] = useState(null);
  const hash = useSyncExternalStore(
    subscribe ? subscribeToHash : noopSubscribe,
    getHashSnapshot,
    getServerSnapshot
  );
  const setHash = (newHash: string) => {
    window.history.replaceState(
      null,
      "",
      location.pathname + location.search + (newHash ? `#${newHash}` : "")
    );
    setStateHash(newHash);
  };

  return [stateHash ?? hash, setHash];
}
