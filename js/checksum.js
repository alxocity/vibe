// Cross-engine checksum. Builds run in canonical table order, not an engine sort.
// FNV-1a 64-bit over one pass bit per build. This file does not score on its own.

import { score } from "./score.js";

const FNV_OFFSET = 14695981039346656037n;
const FNV_PRIME = 1099511628211n;
const MASK64 = 0xffffffffffffffffn;

export function fnvByte(hash, byte) {
  return ((hash ^ BigInt(byte)) * FNV_PRIME) & MASK64;
}

export function hex64(hash) {
  return hash.toString(16).padStart(16, "0");
}

export function eachBuild(trayIds, visit) {
  const n = trayIds.length;
  for (let a = 0; a < n; a += 1) {
    for (let b = a + 1; b < n; b += 1) {
      for (let c = b + 1; c < n; c += 1) {
        for (let d = c + 1; d < n; d += 1) {
          for (let e = d + 1; e < n; e += 1) {
            visit([trayIds[a], trayIds[b], trayIds[c], trayIds[d], trayIds[e]]);
          }
        }
      }
    }
  }
}

function feedAscii(hash, text) {
  let h = hash;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code > 127) throw new TypeError("ascii");
    h = fnvByte(h, code);
  }
  return h;
}

export function catalogChecksum(trayIds, rubrics) {
  let catalog = FNV_OFFSET;
  const rows = [];
  for (let r = 0; r < rubrics.length; r += 1) {
    const rubric = rubrics[r];
    catalog = fnvByte(catalog, 0x1e);
    catalog = feedAscii(catalog, rubric.id);
    catalog = fnvByte(catalog, 0x1f);
    let hash = FNV_OFFSET;
    let passes = 0;
    let builds = 0;
    eachBuild(trayIds, (build) => {
      builds += 1;
      const bit = score(build, rubric, trayIds).status === "pass" ? 1 : 0;
      if (bit === 1) passes += 1;
      hash = fnvByte(hash, bit);
      catalog = fnvByte(catalog, bit);
    });
    rows.push({ id: rubric.id, hex: hex64(hash), passes, builds });
  }
  return { hex: hex64(catalog), rubrics: rows };
}

export { FNV_OFFSET };
