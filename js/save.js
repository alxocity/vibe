// Browser storage adapter. The rule does not call this. Storage is the injected backend only.

import { soloStamp } from "./progress.js";

export const SOLO_KEY = "vibe-chamber-solo";
export const DAILY_KEY = "vibe-chamber-daily";

function decimalId(id) {
  return typeof id === "string" && /^(0|[1-9][0-9]*)$/.test(id);
}

function has(list, id) {
  for (let i = 0; i < list.length; i += 1) {
    if (list[i] === id) return true;
  }
  return false;
}

function isBlockList(value, trayIds) {
  if (!Array.isArray(value)) return false;
  for (let i = 0; i < value.length; i += 1) {
    const id = value[i];
    if (typeof id !== "string" || !has(trayIds, id)) return false;
    for (let j = 0; j < i; j += 1) {
      if (value[j] === id) return false;
    }
  }
  return true;
}

function copyPicked(raw, trayIds) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const picked = Object.create(null);
  const keys = Object.keys(raw);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (!decimalId(key) || !isBlockList(raw[key], trayIds)) return null;
    picked[key] = raw[key].slice();
  }
  return picked;
}

function copyIds(value) {
  if (!Array.isArray(value)) return null;
  const out = [];
  for (let i = 0; i < value.length; i += 1) {
    const id = value[i];
    if (!decimalId(id) || has(out, id)) return null;
    out.push(id);
  }
  return out;
}

export function readStored(raw, kind, trayIds, nowMs) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false };
  }
  if (!data || typeof data !== "object" || Array.isArray(data) || data.v !== 1) return { ok: false };
  const picked = copyPicked(data.picked, trayIds);
  if (!picked) return { ok: false };
  if (kind === "solo") {
    const cleared = copyIds(data.cleared);
    if (!cleared || !Number.isSafeInteger(data.updatedAt)) return { ok: false };
    const stamp = soloStamp(data.updatedAt, nowMs);
    if (stamp == null) return { ok: true, expired: true };
    return {
      ok: true,
      clamped: stamp !== data.updatedAt,
      state: { v: 1, updatedAt: stamp, cleared, picked },
    };
  }
  const solved = copyIds(data.solved);
  if (!solved) return { ok: false };
  return { ok: true, state: { v: 1, solved, picked } };
}

function blank(kind, nowMs) {
  if (kind === "solo") return { v: 1, updatedAt: nowMs, cleared: [], picked: Object.create(null) };
  return { v: 1, solved: [], picked: Object.create(null) };
}

export function openSave(backend, kind, nowMs, trayIds) {
  const key = kind === "solo" ? SOLO_KEY : DAILY_KEY;
  let warning = false;
  let persistent = true;
  let state = blank(kind, nowMs());

  function persist() {
    if (!persistent) return;
    try {
      backend.set(key, JSON.stringify(state));
    } catch {
      persistent = false;
      warning = true;
    }
  }

  let raw = null;
  try {
    raw = backend.get(key);
  } catch {
    persistent = false;
    warning = true;
  }

  if (persistent && raw != null) {
    const read = readStored(raw, kind, trayIds, nowMs());
    if (!read.ok) {
      warning = true;
      persistent = false;
      try {
        backend.remove(key);
      } catch {
        persistent = false;
      }
      state = blank(kind, nowMs());
    } else if (read.expired) {
      state = blank(kind, nowMs());
      persist();
    } else if (read.state) {
      state = read.state;
      if (read.clamped) persist();
    }
  }

  function touch() {
    if (kind === "solo") state.updatedAt = nowMs();
    persist();
  }

  return {
    get warning() {
      return warning;
    },
    doneIds() {
      const list = kind === "solo" ? state.cleared : state.solved;
      return list.slice();
    },
    picked(id) {
      const list = state.picked[String(id)];
      return list ? list.slice() : [];
    },
    setPicked(id, ids) {
      const keyId = String(id);
      if (!decimalId(keyId) || !isBlockList(ids, trayIds)) return;
      state.picked[keyId] = ids.slice();
      touch();
    },
    markDone(id) {
      const keyId = String(id);
      if (!decimalId(keyId)) return;
      const list = kind === "solo" ? state.cleared : state.solved;
      if (!has(list, keyId)) list.push(keyId);
      touch();
    },
    clearAll() {
      state = blank(kind, nowMs());
      persist();
    },
  };
}

export function browserBackend(readStorage) {
  let storage = null;
  try {
    storage = readStorage();
  } catch {
    storage = null;
  }
  if (!storage) {
    return {
      get() {
        throw new Error("unavailable");
      },
      set() {
        throw new Error("unavailable");
      },
      remove() {
        throw new Error("unavailable");
      },
    };
  }
  return probeBackend(storage);
}

export function probeBackend(storage) {
  const probe = "vibe-chamber-probe";
  try {
    storage.setItem(probe, "1");
    const value = storage.getItem(probe);
    storage.removeItem(probe);
    if (value !== "1") throw new Error("probe");
  } catch {
    return {
      get() {
        throw new Error("unavailable");
      },
      set() {
        throw new Error("unavailable");
      },
      remove() {
        throw new Error("unavailable");
      },
    };
  }
  return {
    get(key) {
      return storage.getItem(key);
    },
    set(key, value) {
      storage.setItem(key, value);
    },
    remove(key) {
      storage.removeItem(key);
    },
  };
}
