// Streak from solved echo ids, the injected day, and the live queue.
// Date.UTC checks a fairness date. It does not read the clock.

const SOLO_TTL_MS = 86400000;

export function soloStamp(updatedAt, nowMs) {
  if (!Number.isSafeInteger(updatedAt) || !Number.isSafeInteger(nowMs)) return null;
  const stamp = updatedAt > nowMs ? nowMs : updatedAt;
  if (nowMs - stamp >= SOLO_TTL_MS) return null;
  return stamp;
}

export function soloKept(updatedAt, nowMs) {
  return soloStamp(updatedAt, nowMs) != null;
}

function checkedName(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function checkedDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const utc = Date.UTC(year, month - 1, day);
  const back = new Date(utc);
  return back.getUTCFullYear() === year && back.getUTCMonth() + 1 === month && back.getUTCDate() === day;
}

export function echoChecked(row) {
  const fairness = row && row.fairness;
  if (!fairness || typeof fairness !== "object") return false;
  return checkedName(fairness.name) && checkedDate(fairness.date);
}

export function liveEchoIds(items, withdrawn) {
  const ids = [];
  const dropped = withdrawn || [];
  for (let i = 0; i < items.length; i += 1) {
    const row = items[i];
    const id = String(row.id);
    if (droppedHas(dropped, id) || !echoChecked(row)) continue;
    ids.push(id);
  }
  return ids;
}

function droppedHas(dropped, id) {
  for (let i = 0; i < dropped.length; i += 1) {
    if (String(dropped[i]) === id) return true;
  }
  return false;
}

export function echoGateStatus(row, pageId, todayId, withdrawn) {
  const id = String(pageId);
  if (!row || String(row.id) !== id || droppedHas(withdrawn || [], id) || !echoChecked(row)) return "no-puzzle";
  if (String(todayId) !== id) return "not-today";
  return null;
}

export function practiceEcho(items, todayId, withdrawn) {
  const today = String(todayId);
  let best = null;
  let bestId = null;
  let sawToday = false;
  const dropped = withdrawn || [];
  for (let i = 0; i < items.length; i += 1) {
    const row = items[i];
    const idText = String(row.id);
    if (idText === today) {
      sawToday = true;
      if (droppedHas(dropped, idText)) return null;
      if (echoChecked(row)) return null;
      continue;
    }
    if (!echoChecked(row) || droppedHas(dropped, idText)) continue;
    const id = BigInt(row.id);
    if (id < 0n || id >= BigInt(today)) continue;
    if (bestId == null || id > bestId) {
      best = row;
      bestId = id;
    }
  }
  if (!sawToday && droppedHas(dropped, today)) return null;
  return best;
}

function cmpDecimal(a, b) {
  const aa = BigInt(a);
  const bb = BigInt(b);
  if (aa < bb) return -1;
  if (aa > bb) return 1;
  return 0;
}

export function visibleStreak(solvedIds, todayId, liveIds) {
  const solved = new Set(solvedIds);
  const live = liveIds.slice().sort(cmpDecimal);
  const today = BigInt(todayId);
  let running = 0;
  for (let i = 0; i < live.length; i += 1) {
    const id = live[i];
    const n = BigInt(id);
    if (n > today) break;
    if (n === today) {
      if (solved.has(id)) return running + 1;
      return running > 0 ? running : null;
    }
    if (solved.has(id)) running += 1;
    else running = 0;
  }
  return running > 0 ? running : null;
}

export function shareLine(id, lines) {
  return lines.sharePrefix + String(id) + lines.shareSuffix;
}

export const PUBLISH_BUFFER_DAYS = 1;

function wholeId(value) {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isInteger(value)) return BigInt(value);
  throw new TypeError("id");
}

export function publishEchoes(items, todayId, bufferDays) {
  const buffer = wholeId(bufferDays);
  if (buffer < 0n || buffer > 1n) throw new TypeError("buffer");
  const limit = wholeId(todayId) + buffer;
  const kept = [];
  for (let i = 0; i < items.length; i += 1) {
    const row = items[i];
    if (!echoChecked(row)) continue;
    const id = wholeId(row.id);
    if (id < 0n || id > limit) continue;
    kept.push(row);
  }
  return kept;
}

export { SOLO_TTL_MS };
