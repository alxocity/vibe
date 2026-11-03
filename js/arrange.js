// Placement and closeness. Pass/fail stays in score.js.
// Defaults, pending Alex:
// - Free placement. Stored in tenths of a scene unit (viewBox 200 by 120). No drawn grid.
// - Scale is a percent of 1. Rest is 70, which is the old 0.7 glyph scale. Limits are 40 and 180.
// - Turn is integer degrees. Plus and minus each step 15. Scale plus and minus each step 10.
// - Layer is an integer. Rest is 0. Plus and minus each step 1, and stop at -30 and 30.
//   A higher layer paints later, so it sits above a lower one. Equal layers keep tray order.
// - Color is a palette index. Rest is 0, the ink color. Plus and minus wrap the palette.
// - Transparency is an integer 20 through 100. Rest is 100. Plus and minus step 20.
//   The wash under the strokes uses that alpha. Closeness does not score color or alpha.
// - Closeness is 0 through 100 when puzzle.arrange names poses. It does not change Clear or Miss.
// - Weights: objects 40, position 20, scale 20, turn 20.
// - Position falls off by 80 scene units, scale by 60 points, turn by 45 degrees.
// - Bands: 100 exact, 80 close, 50 near, below that far.

export const SCENE_W = 2000;
export const SCENE_H = 1200;
export const SCALE_MIN = 40;
export const SCALE_MAX = 180;
export const SCALE_STEP = 10;
export const TURN_STEP = 15;
export const LAYER_MIN = -30;
export const LAYER_MAX = 30;
export const LAYER_STEP = 1;
export const REST_LAYER = 0;
export const COLOR_COUNT = 8;
export const REST_COLOR = 0;
export const ALPHA_MIN = 20;
export const ALPHA_MAX = 100;
export const ALPHA_STEP = 20;
export const REST_ALPHA = 100;
export const REST_SCALE = 70;
export const PLACE_ZERO = 800;
export const SCALE_ZERO = 60;
export const TURN_ZERO = 45;

const PALETTE = ["currentColor", "#c23b2e", "#1f5f99", "#2f6b45", "#b86a12", "#6a3d8f", "#c47a4a", "#3d6b6b"];

const WEIGHT_OBJECTS = 40;
const WEIGHT_PLACE = 20;
const WEIGHT_SCALE = 20;
const WEIGHT_TURN = 20;

function clampInt(value, min, max, fallback) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  let v = Math.round(value);
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

export function normTurn(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  let v = Math.round(value) % 360;
  if (v < 0) v += 360;
  return v;
}

export function clampPose(pose) {
  const src = pose || {};
  return {
    x: clampInt(src.x, 0, SCENE_W, 0),
    y: clampInt(src.y, 0, SCENE_H, 0),
    s: clampInt(src.s, SCALE_MIN, SCALE_MAX, REST_SCALE),
    r: normTurn(src.r),
    z: clampInt(src.z, LAYER_MIN, LAYER_MAX, REST_LAYER),
    c: clampInt(src.c, 0, COLOR_COUNT - 1, REST_COLOR),
    a: clampInt(src.a, ALPHA_MIN, ALPHA_MAX, REST_ALPHA),
  };
}

export function pieceColor(index) {
  return PALETTE[clampInt(index, 0, COLOR_COUNT - 1, REST_COLOR)];
}

export function washOpacity(alpha) {
  const a = clampInt(alpha, ALPHA_MIN, ALPHA_MAX, REST_ALPHA);
  if (a >= 100) return "0.55";
  if (a >= 80) return "0.42";
  if (a >= 60) return "0.3";
  if (a >= 40) return "0.2";
  return "0.12";
}

export function cleanPose(pose) {
  if (!pose || typeof pose !== "object" || Array.isArray(pose)) return null;
  if (!Number.isInteger(pose.x) || pose.x < 0 || pose.x > SCENE_W) return null;
  if (!Number.isInteger(pose.y) || pose.y < 0 || pose.y > SCENE_H) return null;
  if (!Number.isInteger(pose.s) || pose.s < SCALE_MIN || pose.s > SCALE_MAX) return null;
  if (!Number.isInteger(pose.r) || pose.r < 0 || pose.r > 359) return null;
  let z = REST_LAYER;
  if (pose.z != null) {
    if (!Number.isInteger(pose.z) || pose.z < LAYER_MIN || pose.z > LAYER_MAX) return null;
    z = pose.z;
  }
  let c = REST_COLOR;
  if (pose.c != null) {
    if (!Number.isInteger(pose.c) || pose.c < 0 || pose.c >= COLOR_COUNT) return null;
    c = pose.c;
  }
  let a = REST_ALPHA;
  if (pose.a != null) {
    if (!Number.isInteger(pose.a) || pose.a < ALPHA_MIN || pose.a > ALPHA_MAX || pose.a % ALPHA_STEP !== 0) return null;
    a = pose.a;
  }
  return { x: pose.x, y: pose.y, s: pose.s, r: pose.r, z, c, a };
}

export function restPose(place) {
  return { x: place[0] * 10 + 112, y: place[1] * 10 + 112, s: REST_SCALE, r: 0, z: REST_LAYER, c: REST_COLOR, a: REST_ALPHA };
}

export function samePose(a, b) {
  return !!a && !!b && a.x === b.x && a.y === b.y && a.s === b.s && a.r === b.r && a.z === b.z && a.c === b.c && a.a === b.a;
}

function tenth(n) {
  const sign = n < 0 ? "-" : "";
  let v = n < 0 ? -n : n;
  const whole = (v / 10) | 0;
  const frac = v % 10;
  if (frac === 0) return sign + String(whole);
  return sign + String(whole) + "." + String(frac);
}

function scaleText(s) {
  const whole = (s / 100) | 0;
  const frac = s % 100;
  if (frac === 0) return String(whole);
  const tens = (frac / 10) | 0;
  const ones = frac % 10;
  if (ones === 0) return String(whole) + "." + String(tens);
  return String(whole) + "." + String(tens) + String(ones);
}

export function poseTransform(pose) {
  const at = clampPose(pose);
  return (
    "translate(" +
    tenth(at.x) +
    " " +
    tenth(at.y) +
    ") rotate(" +
    String(at.r) +
    ") scale(" +
    scaleText(at.s) +
    ") translate(-16 -16)"
  );
}

function carry(origin, fields) {
  return clampPose({
    x: origin.x,
    y: origin.y,
    s: origin.s,
    r: origin.r,
    z: origin.z,
    c: origin.c,
    a: origin.a,
    ...fields,
  });
}

export function panPose(origin, dx, dy) {
  return carry(origin, { x: origin.x + dx, y: origin.y + dy });
}

export function scalePose(origin, startDist, dist) {
  if (!(startDist > 0) || !(dist > 0)) return clampPose(origin);
  return carry(origin, { s: (origin.s * dist) / startDist });
}

export function turnPose(origin, startAngle, angle) {
  return carry(origin, { r: origin.r + (angle - startAngle) });
}

export function bumpScale(pose, dir) {
  const step = dir < 0 ? -SCALE_STEP : SCALE_STEP;
  return carry(pose, { s: pose.s + step });
}

export function bumpTurn(pose, dir) {
  const step = dir < 0 ? -TURN_STEP : TURN_STEP;
  return carry(pose, { r: pose.r + step });
}

export function bumpLayer(pose, dir) {
  const step = dir < 0 ? -LAYER_STEP : LAYER_STEP;
  const base = pose && Number.isInteger(pose.z) ? pose.z : REST_LAYER;
  return carry(pose, { z: base + step });
}

export function bumpColor(pose, dir) {
  const step = dir < 0 ? -1 : 1;
  let c = (pose && Number.isInteger(pose.c) ? pose.c : REST_COLOR) + step;
  c %= COLOR_COUNT;
  if (c < 0) c += COLOR_COUNT;
  return carry(pose, { c });
}

export function bumpAlpha(pose, dir) {
  const step = dir < 0 ? -ALPHA_STEP : ALPHA_STEP;
  const base = pose && Number.isInteger(pose.a) ? pose.a : REST_ALPHA;
  return carry(pose, { a: base + step });
}

export function span(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function degrees(cx, cy, px, py) {
  return (Math.atan2(py - cy, px - cx) * 180) / Math.PI;
}

function hasId(list, id) {
  if (!list) return false;
  for (let i = 0; i < list.length; i += 1) {
    if (list[i] === id) return true;
  }
  return false;
}

function falloff(delta, zero) {
  if (delta <= 0) return 1000;
  if (delta >= zero) return 0;
  return 1000 - Math.round((delta * 1000) / zero);
}

export function nearBand(value) {
  if (value >= 100) return "exact";
  if (value >= 80) return "close";
  if (value >= 50) return "near";
  return "far";
}

export function closeness(build, poses, expected, trayIds, places) {
  if (expected == null || typeof expected !== "object" || Array.isArray(expected)) return null;
  if (!Array.isArray(trayIds) || !places) return null;
  const ids = [];
  const keys = Object.keys(expected);
  for (let i = 0; i < keys.length; i += 1) {
    const id = keys[i];
    if (!hasId(trayIds, id) || !places[id]) continue;
    if (!cleanPose(expected[id])) continue;
    ids.push(id);
  }
  if (ids.length === 0) return null;
  let matched = 0;
  let placeSum = 0;
  let scaleSum = 0;
  let turnSum = 0;
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    if (!hasId(build, id)) continue;
    matched += 1;
    const want = cleanPose(expected[id]);
    const stored = poses && Object.hasOwn(poses, id) ? cleanPose(poses[id]) : null;
    const have = stored || restPose(places[id]);
    const dx = have.x - want.x;
    const dy = have.y - want.y;
    placeSum += falloff(Math.round(Math.sqrt(dx * dx + dy * dy)), PLACE_ZERO);
    scaleSum += falloff(Math.abs(have.s - want.s), SCALE_ZERO);
    let turn = Math.abs(have.r - want.r) % 360;
    if (turn > 180) turn = 360 - turn;
    turnSum += falloff(turn, TURN_ZERO);
  }
  const n = ids.length;
  const value =
    Math.round((matched / n) * WEIGHT_OBJECTS) +
    Math.round((placeSum / n) * WEIGHT_PLACE / 1000) +
    Math.round((scaleSum / n) * WEIGHT_SCALE / 1000) +
    Math.round((turnSum / n) * WEIGHT_TURN / 1000);
  const capped = value > 100 ? 100 : value;
  return { value: capped, band: nearBand(capped) };
}

const SAMPLE_WEIGHT = { position: 40, size: 25, turn: 20, layer: 15 };

function checked(list, name) {
  if (!list) return false;
  for (let i = 0; i < list.length; i += 1) {
    if (list[i] === name) return true;
  }
  return false;
}

function normPose(pose) {
  return {
    x: pose.x / SCENE_W,
    y: pose.y / SCENE_H,
    s: pose.s / REST_SCALE,
    r: pose.r,
    z: pose.z,
  };
}

function angleDiff(a, b, symmetry) {
  const period = symmetry > 0 && symmetry < 360 ? symmetry : 360;
  let d = Math.abs(a - b) % period;
  if (d > period / 2) d = period - d;
  return d;
}

function halfExtent(mult) {
  const scene = 16 * mult * (REST_SCALE / 100);
  return { x: scene / (SCENE_W / 10), y: scene / (SCENE_H / 10) };
}

function boxesOverlap(a, b) {
  const ha = halfExtent(a.s);
  const hb = halfExtent(b.s);
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx < ha.x + hb.x && dy < ha.y + hb.y;
}

function orderMatches(haveA, haveB, wantA, wantB) {
  if (wantA === wantB) return true;
  if (haveA === haveB) return false;
  return haveA - haveB > 0 === wantA - wantB > 0;
}

export function sampleScore(build, poses, arrange, places) {
  if (!arrange || arrange.sample !== true || !Array.isArray(arrange.pieces) || arrange.pieces.length === 0) return null;
  if (!Array.isArray(build) || !places) return null;
  const checks = arrange.checks;
  if (!Array.isArray(checks) || checks.length === 0) return null;
  let weight = 0;
  if (checked(checks, "position")) weight += SAMPLE_WEIGHT.position;
  if (checked(checks, "size")) weight += SAMPLE_WEIGHT.size;
  if (checked(checks, "turn")) weight += SAMPLE_WEIGHT.turn;
  if (checked(checks, "layer")) weight += SAMPLE_WEIGHT.layer;
  if (weight === 0) return null;
  const expected = [];
  const wantIds = [];
  for (let i = 0; i < arrange.pieces.length; i += 1) {
    const piece = arrange.pieces[i];
    if (!piece || typeof piece.id !== "string" || !places[piece.id]) return null;
    if (typeof piece.x !== "number" || typeof piece.y !== "number") return null;
    wantIds.push(piece.id);
    const stored = poses && Object.hasOwn(poses, piece.id) ? cleanPose(poses[piece.id]) : null;
    const have = hasId(build, piece.id) ? normPose(stored || restPose(places[piece.id])) : null;
    expected.push({
      id: piece.id,
      want: {
        x: piece.x,
        y: piece.y,
        s: typeof piece.size === "number" ? piece.size : 1,
        r: typeof piece.turn === "number" ? piece.turn : 0,
        z: typeof piece.z === "number" ? piece.z : 0,
      },
      symmetry: typeof piece.symmetry === "number" ? piece.symmetry : 0,
      have,
    });
  }
  let total = 0;
  for (let i = 0; i < expected.length; i += 1) {
    const row = expected[i];
    if (!row.have) continue;
    let part = 0;
    if (checked(checks, "position")) {
      const dx = row.have.x - row.want.x;
      const dy = row.have.y - row.want.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const score = 1 - dist / 0.25;
      part += SAMPLE_WEIGHT.position * (score > 0 ? score : 0);
    }
    if (checked(checks, "size")) {
      const delta = Math.abs(row.have.s - row.want.s);
      const score = 1 - delta / 0.5;
      part += SAMPLE_WEIGHT.size * (score > 0 ? score : 0);
    }
    if (checked(checks, "turn")) {
      const delta = angleDiff(row.have.r, row.want.r, row.symmetry);
      const score = 1 - delta / 45;
      part += SAMPLE_WEIGHT.turn * (score > 0 ? score : 0);
    }
    if (checked(checks, "layer")) {
      // Pieces that do not overlap still get full layer credit. Order is only
      // scored where the boxes actually stack.
      let ok = true;
      for (let j = 0; j < expected.length; j += 1) {
        if (j === i || !expected[j].have) continue;
        if (!boxesOverlap(row.have, expected[j].have)) continue;
        if (!orderMatches(row.have.z, expected[j].have.z, row.want.z, expected[j].want.z)) ok = false;
      }
      if (ok) part += SAMPLE_WEIGHT.layer;
    }
    total += part / weight;
  }
  const avg = total / expected.length;
  let extras = 0;
  for (let i = 0; i < build.length; i += 1) {
    if (!hasId(wantIds, build[i])) extras += 1;
  }
  let value = Math.round(avg * 100 - extras * 10);
  if (value < 0) value = 0;
  if (value > 100) value = 100;
  return { value, band: "percent" };
}
